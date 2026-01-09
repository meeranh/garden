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

	const maxStep = 4;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => {
			timeouts.push(setTimeout(r, ms));
		});
	}
	function clearTimeouts() {
		timeouts.forEach(clearTimeout);
		timeouts = [];
	}

	function drawAntenna(
		group: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		color: string
	) {
		// Antenna pole
		group
			.append('line')
			.attr('x1', x)
			.attr('y1', y)
			.attr('x2', x)
			.attr('y2', y - 50)
			.attr('stroke', color)
			.attr('stroke-width', 3);
		// Antenna top elements
		group
			.append('line')
			.attr('x1', x - 15)
			.attr('y1', y - 40)
			.attr('x2', x)
			.attr('y2', y - 55)
			.attr('stroke', color)
			.attr('stroke-width', 3);
		group
			.append('line')
			.attr('x1', x + 15)
			.attr('y1', y - 40)
			.attr('x2', x)
			.attr('y2', y - 55)
			.attr('stroke', color)
			.attr('stroke-width', 3);
		// Base
		group
			.append('rect')
			.attr('x', x - 12)
			.attr('y', y)
			.attr('width', 24)
			.attr('height', 8)
			.attr('fill', color)
			.attr('rx', 2);
	}

	function drawSignalBars(
		group: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		strength: number,
		goodColor: string,
		badColor: string
	) {
		const barWidth = 8;
		const barGap = 4;
		const maxHeight = 40;

		for (let i = 0; i < 4; i++) {
			const barHeight = ((i + 1) / 4) * maxHeight;
			const isActive = (i + 1) / 4 <= strength;
			group
				.append('rect')
				.attr('class', `bar-${i}`)
				.attr('x', x + i * (barWidth + barGap))
				.attr('y', y - barHeight)
				.attr('width', barWidth)
				.attr('height', barHeight)
				.attr('fill', isActive ? goodColor : badColor)
				.attr('rx', 2)
				.attr('opacity', isActive ? 1 : 0.3);
		}
	}

	function updateSignalBars(
		group: d3.Selection<SVGGElement, unknown, null, undefined>,
		strength: number,
		goodColor: string,
		badColor: string,
		errorColor: string
	) {
		for (let i = 0; i < 4; i++) {
			const isActive = (i + 1) / 4 <= strength;
			// If weak signal (strength <= 0.25), show first bar as red
			const isWeak = strength <= 0.25;
			const barColor = isActive ? (isWeak ? errorColor : goodColor) : badColor;
			group
				.select(`.bar-${i}`)
				.transition()
				.duration(400)
				.attr('fill', barColor)
				.attr('opacity', isActive ? 1 : 0.3);
		}
	}

	function applyStep(step: number) {
		currentStep = step;

		const antenna1Strength = step === 1 || step === 2 ? 1 : 0.25;
		const antenna2Strength = step === 3 || step === 4 ? 1 : 0.25;

		updateSignalBars(svgEl.select('.signal1') as any, antenna1Strength, colors.accent, colors.border, '#fb4934');
		updateSignalBars(svgEl.select('.signal2') as any, antenna2Strength, colors.accent, colors.border, '#fb4934');

		// Update selected indicator
		svgEl
			.select('.selected1')
			.transition()
			.duration(300)
			.attr('opacity', step === 1 || step === 2 ? 1 : 0);
		svgEl
			.select('.selected2')
			.transition()
			.duration(300)
			.attr('opacity', step === 3 || step === 4 ? 1 : 0);

		// Update status text
		const statusText =
			step === 0
				? 'Two antennas, spaced apart'
				: step === 1 || step === 2
					? 'Antenna 1 has strong signal'
					: 'Antenna 2 has strong signal';

		svgEl.select('.status').text(statusText);
	}

	async function runAnimation() {
		if (!isPlaying) return;

		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1500);
			if (!isPlaying) return;
		}
		isPlaying = false;
	}

	function play() {
		if (!isPlaying) {
			isPlaying = true;
			runAnimation();
		}
	}
	function pause() {
		isPlaying = false;
		clearTimeouts();
	}
	function next() {
		pause();
		if (currentStep < maxStep) applyStep(currentStep + 1);
	}
	function prev() {
		pause();
		if (currentStep > 0) applyStep(currentStep - 1);
	}
	function skip() {
		pause();
		applyStep(maxStep);
	}
	function replay() {
		pause();
		currentStep = 0;
		applyStep(0);
		isPlaying = true;
		runAnimation();
	}
	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

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

		svgEl = d3.select(svg).attr('viewBox', '0 0 500 280');

		// Title
		svgEl
			.append('text')
			.attr('x', 250)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('Spatial Diversity: Independent Fading');

		// Antenna 1
		const ant1Group = svgEl.append('g');
		drawAntenna(ant1Group, 150, 180, colors.fg);

		svgEl
			.append('text')
			.attr('x', 150)
			.attr('y', 210)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '12px')
			.text('Antenna 1');

		// Signal bars for antenna 1
		const signal1 = svgEl.append('g').attr('class', 'signal1');
		drawSignalBars(signal1, 115, 100, 0.25, colors.accent, colors.border);

		// Selected indicator for antenna 1
		svgEl
			.append('text')
			.attr('class', 'selected1')
			.attr('x', 150)
			.attr('y', 50)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('SELECTED')
			.attr('opacity', 0);

		// Antenna 2
		const ant2Group = svgEl.append('g');
		drawAntenna(ant2Group, 350, 180, colors.fg);

		svgEl
			.append('text')
			.attr('x', 350)
			.attr('y', 210)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '12px')
			.text('Antenna 2');

		// Signal bars for antenna 2
		const signal2 = svgEl.append('g').attr('class', 'signal2');
		drawSignalBars(signal2, 315, 100, 0.25, colors.accent, colors.border);

		// Selected indicator for antenna 2
		svgEl
			.append('text')
			.attr('class', 'selected2')
			.attr('x', 350)
			.attr('y', 50)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('SELECTED')
			.attr('opacity', 0);

		// Distance indicator
		svgEl
			.append('line')
			.attr('x1', 175)
			.attr('x2', 325)
			.attr('y1', 235)
			.attr('y2', 235)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,2');

		svgEl
			.append('text')
			.attr('x', 250)
			.attr('y', 250)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('λ/2 or more apart');

		// Status text
		svgEl
			.append('text')
			.attr('class', 'status')
			.attr('x', 250)
			.attr('y', 270)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Two antennas, spaced apart');

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
