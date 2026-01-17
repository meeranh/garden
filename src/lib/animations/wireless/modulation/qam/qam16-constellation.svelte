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

	const maxStep = 4; // Show row by row
	const width = 500;
	const height = 300;
	const centerX = 200;
	const centerY = 160;
	const gridSize = 4;
	const spacing = 35;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => {
			timeouts.push(setTimeout(r, ms));
		});
	}
	function clearTimeouts() {
		timeouts.forEach(clearTimeout);
		timeouts = [];
	}

	function applyStep(step: number) {
		currentStep = step;

		// Show rows progressively
		for (let row = 0; row < gridSize; row++) {
			const isActive = row < step;
			svgEl.selectAll(`.row-${row}`)
				.transition()
				.duration(400)
				.attr('opacity', isActive ? 1 : 0.15);
		}

		// Update counter
		const symbolsShown = step * gridSize;
		svgEl.select('.counter').text(`${symbolsShown} symbols shown`);

		if (step === maxStep) {
			svgEl.select('.counter').text('16 symbols = 4 bits per symbol');
		}
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

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('16-QAM: 4×4 Grid');

		// Axes
		svgEl.append('line')
			.attr('x1', centerX - spacing * 2.5)
			.attr('x2', centerX + spacing * 2.5)
			.attr('y1', centerY)
			.attr('y2', centerY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		svgEl.append('line')
			.attr('x1', centerX)
			.attr('x2', centerX)
			.attr('y1', centerY - spacing * 2.5)
			.attr('y2', centerY + spacing * 2.5)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		// Axis labels
		svgEl.append('text')
			.attr('x', centerX + spacing * 2.5 + 15)
			.attr('y', centerY + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('I');

		svgEl.append('text')
			.attr('x', centerX - 4)
			.attr('y', centerY - spacing * 2.5 - 10)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Q');

		// Gray code mapping for 16-QAM
		const grayCode = ['00', '01', '11', '10'];

		// Draw 4x4 grid
		for (let row = 0; row < gridSize; row++) {
			for (let col = 0; col < gridSize; col++) {
				const x = centerX + (col - 1.5) * spacing;
				const y = centerY + (row - 1.5) * spacing;
				const bits = grayCode[row] + grayCode[col];

				// Symbol point
				svgEl.append('circle')
					.attr('class', `row-${row}`)
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 12)
					.attr('fill', colors.accent)
					.attr('opacity', 0.15);

				// Bit label
				svgEl.append('text')
					.attr('class', `row-${row}`)
					.attr('x', x)
					.attr('y', y + 4)
					.attr('text-anchor', 'middle')
					.attr('fill', colors.bg)
					.attr('font-size', '8px')
					.attr('font-weight', 'bold')
					.text(bits)
					.attr('opacity', 0.15);
			}
		}

		// Info panel
		svgEl.append('rect')
			.attr('x', 320)
			.attr('y', 70)
			.attr('width', 170)
			.attr('height', 120)
			.attr('fill', colors.border)
			.attr('rx', 6)
			.attr('opacity', 0.3);

		svgEl.append('text')
			.attr('x', 405)
			.attr('y', 100)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('16-QAM');

		svgEl.append('text')
			.attr('x', 405)
			.attr('y', 125)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('4 × 4 = 16 symbols');

		svgEl.append('text')
			.attr('x', 405)
			.attr('y', 150)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('4 bits/symbol');

		// Counter
		svgEl.append('text')
			.attr('class', 'counter')
			.attr('x', 405)
			.attr('y', 175)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('0 symbols shown');

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Each position has unique I and Q values');

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
