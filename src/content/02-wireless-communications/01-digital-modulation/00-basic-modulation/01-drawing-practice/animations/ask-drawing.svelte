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

	const bits = [0, 1, 0, 0, 1, 0, 1, 1];
	const maxStep = bits.length;
	const width = 500;
	const height = 250;
	const startX = 50;
	const bitWidth = 50;
	const waveY = 150;
	const amplitude = 35;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Show bits and waveforms progressively
		for (let i = 0; i < bits.length; i++) {
			const isVisible = i < step;

			svgEl.select(`.wave-${i}`)
				.transition()
				.duration(300)
				.attr('opacity', isVisible ? 1 : 0);

			svgEl.select(`.bit-highlight-${i}`)
				.transition()
				.duration(200)
				.attr('opacity', i === step - 1 ? 1 : 0);
		}

		const msg = step === 0
			? 'Draw ASK: high amplitude for 1, low for 0'
			: step <= bits.length
				? `Bit ${step}: ${bits[step - 1]} → ${bits[step - 1] === 1 ? 'HIGH amplitude' : 'LOW amplitude'}`
				: 'Complete ASK waveform';
		svgEl.select('.message').text(msg);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(800);
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
			.text('Drawing ASK Waveform');

		// Bit sequence display
		bits.forEach((bit, i) => {
			// Bit box
			svgEl.append('rect')
				.attr('x', startX + i * bitWidth + 5)
				.attr('y', 45)
				.attr('width', bitWidth - 10)
				.attr('height', 25)
				.attr('fill', colors.border)
				.attr('opacity', 0.3)
				.attr('rx', 3);

			// Bit value
			svgEl.append('text')
				.attr('x', startX + i * bitWidth + bitWidth / 2)
				.attr('y', 63)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '14px')
				.attr('font-weight', 'bold')
				.text(bit);

			// Highlight box for current bit
			svgEl.append('rect')
				.attr('class', `bit-highlight-${i}`)
				.attr('x', startX + i * bitWidth + 3)
				.attr('y', 43)
				.attr('width', bitWidth - 6)
				.attr('height', 29)
				.attr('fill', 'none')
				.attr('stroke', colors.yellow)
				.attr('stroke-width', 2)
				.attr('rx', 4)
				.attr('opacity', 0);
		});

		// Zero line
		svgEl.append('line')
			.attr('x1', startX)
			.attr('x2', startX + bits.length * bitWidth)
			.attr('y1', waveY)
			.attr('y2', waveY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4');

		// Vertical grid lines
		for (let i = 0; i <= bits.length; i++) {
			svgEl.append('line')
				.attr('x1', startX + i * bitWidth)
				.attr('x2', startX + i * bitWidth)
				.attr('y1', waveY - amplitude - 15)
				.attr('y2', waveY + amplitude + 15)
				.attr('stroke', colors.border)
				.attr('stroke-width', 1)
				.attr('opacity', 0.3);
		}

		// Create wave segments for each bit
		bits.forEach((bit, i) => {
			const x = startX + i * bitWidth;
			const amp = bit === 1 ? amplitude : amplitude * 0.2;

			// Generate sine wave path for this bit
			let pathD = '';
			const points = 30;
			for (let p = 0; p <= points; p++) {
				const px = x + (p / points) * bitWidth;
				const py = waveY - Math.sin((p / points) * Math.PI * 4) * amp;
				pathD += (p === 0 ? 'M' : 'L') + ` ${px} ${py}`;
			}

			svgEl.append('path')
				.attr('class', `wave-${i}`)
				.attr('d', pathD)
				.attr('fill', 'none')
				.attr('stroke', bit === 1 ? colors.accent : colors.fgMuted)
				.attr('stroke-width', 2.5)
				.attr('opacity', 0);
		});

		// Labels
		svgEl.append('text')
			.attr('x', startX - 10)
			.attr('y', waveY - amplitude)
			.attr('text-anchor', 'end')
			.attr('fill', colors.accent)
			.attr('font-size', '9px')
			.text('HIGH');

		svgEl.append('text')
			.attr('x', startX - 10)
			.attr('y', waveY + 5)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('LOW');

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Draw ASK: high amplitude for 1, low for 0');

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
