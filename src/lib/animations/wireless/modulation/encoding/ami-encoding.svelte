<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let timeouts: ReturnType<typeof setTimeout>[] = [];
	let colors: Record<string, string>;

	const maxStep = 3;
	const width = 500;
	const height = 300;

	const bits = [1, 0, 1, 1, 0, 1, 0, 1];
	const bitWidth = 50;
	const startX = 50;
	const plusY = 90;
	const zeroY = 150;
	const minusY = 210;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show the bits and the rule
		// Step 1: Draw the AMI signal
		// Step 2: Highlight alternation of 1s
		// Step 3: Show benefits

		svgEl.select('.ami-signal')
			.transition()
			.duration(600)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.selectAll('.one-marker')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.selectAll('.benefits-text')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		const messages = [
			'Rule: 0 = zero volts, 1 = alternates +V / -V',
			'AMI uses three voltage levels',
			'Each 1 alternates polarity: +V, -V, +V, -V...',
			'No DC component + built-in error detection!'
		];
		svgEl.select('.message').text(messages[step]);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2000);
			if (!isPlaying) return;
		}
		isPlaying = false;
	}

	function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
	function pause() { isPlaying = false; clearTimeouts(); }
	function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
	function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
	function skip() { pause(); applyStep(maxStep); }
	function replay() { pause(); currentStep = 0; applyStep(0); isPlaying = true; runAnimation(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			accent: s.getPropertyValue('--color-accent').trim(),
			yellow: s.getPropertyValue('--color-math').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('AMI: Alternate Mark Inversion');

		// Bit labels
		bits.forEach((bit, i) => {
			svgEl.append('text')
				.attr('x', startX + i * bitWidth + bitWidth / 2)
				.attr('y', 55)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '14px')
				.attr('font-weight', 'bold')
				.text(bit);
		});

		// Voltage labels
		svgEl.append('text')
			.attr('x', startX - 10)
			.attr('y', plusY + 5)
			.attr('text-anchor', 'end')
			.attr('fill', colors.yellow)
			.attr('font-size', '10px')
			.text('+V');

		svgEl.append('text')
			.attr('x', startX - 10)
			.attr('y', zeroY + 5)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('0');

		svgEl.append('text')
			.attr('x', startX - 10)
			.attr('y', minusY + 5)
			.attr('text-anchor', 'end')
			.attr('fill', colors.accent)
			.attr('font-size', '10px')
			.text('-V');

		// Zero line
		svgEl.append('line')
			.attr('x1', startX)
			.attr('x2', startX + bits.length * bitWidth)
			.attr('y1', zeroY)
			.attr('y2', zeroY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		// Vertical grid lines
		for (let i = 0; i <= bits.length; i++) {
			svgEl.append('line')
				.attr('x1', startX + i * bitWidth)
				.attr('x2', startX + i * bitWidth)
				.attr('y1', plusY - 10)
				.attr('y2', minusY + 10)
				.attr('stroke', colors.border)
				.attr('stroke-width', 1)
				.attr('opacity', 0.3);
		}

		// AMI Signal
		// 0 = zero voltage
		// 1 = alternates between +V and -V
		let polarity = 1; // Start with +V for first 1
		const amiLevels: number[] = [];

		bits.forEach((bit) => {
			if (bit === 0) {
				amiLevels.push(0);
			} else {
				amiLevels.push(polarity);
				polarity *= -1; // Alternate
			}
		});

		// Build path
		let pathD = '';
		amiLevels.forEach((level, i) => {
			const x = startX + i * bitWidth;
			const endX = x + bitWidth;
			let y: number;

			if (level === 1) y = plusY;
			else if (level === -1) y = minusY;
			else y = zeroY;

			if (i === 0) {
				pathD = `M ${x} ${zeroY} L ${x} ${y}`;
			} else {
				pathD += ` L ${x} ${y}`;
			}
			pathD += ` L ${endX} ${y}`;

			// Return to zero after each bit
			if (i < amiLevels.length - 1) {
				pathD += ` L ${endX} ${zeroY}`;
			}
		});

		svgEl.append('path')
			.attr('class', 'ami-signal')
			.attr('d', pathD)
			.attr('fill', 'none')
			.attr('stroke', colors.accent)
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// Markers for 1s showing alternation
		let oneIndex = 0;
		bits.forEach((bit, i) => {
			if (bit === 1) {
				const x = startX + i * bitWidth + bitWidth / 2;
				const y = oneIndex % 2 === 0 ? plusY - 20 : minusY + 25;
				const label = oneIndex % 2 === 0 ? '+V' : '-V';
				const color = oneIndex % 2 === 0 ? colors.yellow : colors.accent;

				svgEl.append('text')
					.attr('class', 'one-marker')
					.attr('x', x)
					.attr('y', y)
					.attr('text-anchor', 'middle')
					.attr('fill', color)
					.attr('font-size', '10px')
					.attr('font-weight', 'bold')
					.text(label)
					.attr('opacity', 0);

				oneIndex++;
			}
		});

		// Benefits text (below signal)
		svgEl.append('text')
			.attr('class', 'benefits-text')
			.attr('x', 250)
			.attr('y', 255)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('No DC offset (+V and -V cancel)')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'benefits-text')
			.attr('x', 250)
			.attr('y', 270)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Two +V in a row = error!')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Rule: 0 = zero volts, 1 = alternates +V / -V');

		applyStep(0);
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
	.diagram {
		display: block;
		margin: 0 auto;
		background: #1d2021;
		border-radius: 0.5rem;
	}
</style>
