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

	const maxStep = 2;
	const width = 500;
	const height = 300;
	const centerX = 200;
	const centerY = 155;
	const gridSize = 8;
	const spacing = 18;

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

		// Step 0: Show empty grid outline
		// Step 1: Fill in all points
		// Step 2: Highlight density

		svgEl.selectAll('.symbol')
			.transition()
			.duration(600)
			.attr('opacity', step >= 1 ? 1 : 0.1);

		svgEl.select('.density-note')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		const messages = [
			'8×8 grid layout',
			'64 symbols filling the space',
			'More symbols = closer together'
		];
		svgEl.select('.message').text(messages[step]);
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

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('64-QAM: 8×8 Grid');

		// Axes
		const axisLen = spacing * 4.5;
		svgEl.append('line')
			.attr('x1', centerX - axisLen)
			.attr('x2', centerX + axisLen)
			.attr('y1', centerY)
			.attr('y2', centerY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		svgEl.append('line')
			.attr('x1', centerX)
			.attr('x2', centerX)
			.attr('y1', centerY - axisLen)
			.attr('y2', centerY + axisLen)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		// Draw 8x8 grid
		for (let row = 0; row < gridSize; row++) {
			for (let col = 0; col < gridSize; col++) {
				const x = centerX + (col - 3.5) * spacing;
				const y = centerY + (row - 3.5) * spacing;

				svgEl.append('circle')
					.attr('class', 'symbol')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 5)
					.attr('fill', colors.accent)
					.attr('opacity', 0.1);
			}
		}

		// Info panel
		svgEl.append('rect')
			.attr('x', 340)
			.attr('y', 60)
			.attr('width', 140)
			.attr('height', 130)
			.attr('fill', colors.border)
			.attr('rx', 6)
			.attr('opacity', 0.3);

		svgEl.append('text')
			.attr('x', 410)
			.attr('y', 90)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('64-QAM');

		svgEl.append('text')
			.attr('x', 410)
			.attr('y', 115)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('8 × 8 = 64 symbols');

		svgEl.append('text')
			.attr('x', 410)
			.attr('y', 140)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('6 bits/symbol');

		svgEl.append('text')
			.attr('class', 'density-note')
			.attr('x', 410)
			.attr('y', 170)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('Points are closer!')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('8×8 grid layout');

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
