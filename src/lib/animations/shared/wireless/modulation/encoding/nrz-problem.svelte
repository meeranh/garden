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
	const height = 280;

	const bits = [1, 0, 1, 1, 1, 1, 1, 0];
	const bitWidth = 50;
	const startX = 50;
	const highY = 100;
	const lowY = 180;
	const midY = 140;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show the bits
		// Step 1: Draw the NRZ signal
		// Step 2: Highlight the problem area (long run of 1s)
		// Step 3: Show the question - how many 1s?

		svgEl.select('.nrz-signal')
			.transition()
			.duration(500)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.problem-highlight')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 0.3 : 0);

		svgEl.select('.problem-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.question')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		const messages = [
			'Bits to transmit: 1 0 1 1 1 1 1 0',
			'NRZ: High voltage = 1, Low voltage = 0',
			'Problem: Long run of 1s = flat line',
			'Receiver has no way to count the bits!'
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
			.text('NRZ-L: The Simplest Encoding');

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
			.attr('x', startX - 15)
			.attr('y', highY + 5)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('High');

		svgEl.append('text')
			.attr('x', startX - 15)
			.attr('y', lowY + 5)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Low');

		// Time axis
		svgEl.append('line')
			.attr('x1', startX)
			.attr('x2', startX + bits.length * bitWidth)
			.attr('y1', midY)
			.attr('y2', midY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4');

		// Vertical grid lines
		for (let i = 0; i <= bits.length; i++) {
			svgEl.append('line')
				.attr('x1', startX + i * bitWidth)
				.attr('x2', startX + i * bitWidth)
				.attr('y1', highY - 20)
				.attr('y2', lowY + 20)
				.attr('stroke', colors.border)
				.attr('stroke-width', 1)
				.attr('opacity', 0.3);
		}

		// NRZ Signal path
		let pathD = `M ${startX} ${bits[0] === 1 ? highY : lowY}`;
		bits.forEach((bit, i) => {
			const y = bit === 1 ? highY : lowY;
			const x = startX + i * bitWidth;
			if (i > 0) {
				const prevY = bits[i - 1] === 1 ? highY : lowY;
				if (y !== prevY) {
					pathD += ` L ${x} ${prevY} L ${x} ${y}`;
				}
			}
			pathD += ` L ${x + bitWidth} ${y}`;
		});

		svgEl.append('path')
			.attr('class', 'nrz-signal')
			.attr('d', pathD)
			.attr('fill', 'none')
			.attr('stroke', colors.accent)
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// Problem highlight (the run of 1s: bits 2-6)
		svgEl.append('rect')
			.attr('class', 'problem-highlight')
			.attr('x', startX + 2 * bitWidth)
			.attr('y', highY - 25)
			.attr('width', 5 * bitWidth)
			.attr('height', 55)
			.attr('fill', '#fb4934')
			.attr('rx', 4)
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'problem-label')
			.attr('x', startX + 4.5 * bitWidth)
			.attr('y', highY - 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('No transitions!')
			.attr('opacity', 0);

		// Question mark
		svgEl.append('text')
			.attr('class', 'question')
			.attr('x', startX + 4.5 * bitWidth)
			.attr('y', lowY + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('Is this 5 ones? 6 ones? 100 ones?')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Bits to transmit: 1 0 1 1 1 1 1 0');

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
