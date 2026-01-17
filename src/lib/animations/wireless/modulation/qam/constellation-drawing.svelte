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

	const maxStep = 6;
	const width = 500;
	const height = 320;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show empty axes
		// Step 1: Draw I axis with labels
		// Step 2: Draw Q axis with labels
		// Step 3: Show 4x4 grid lines
		// Step 4: Place 16-QAM points
		// Step 5: Show 64-QAM hint
		// Step 6: Complete

		svgEl.select('.i-axis-labels')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.q-axis-labels')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.selectAll('.grid-line')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 0.4 : 0);

		svgEl.selectAll('.qam-point')
			.transition()
			.duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		svgEl.select('.info-64qam')
			.transition()
			.duration(400)
			.attr('opacity', step >= 5 ? 1 : 0);

		const messages = [
			'Step 1: Draw I and Q axes',
			'Step 2: Mark I axis levels: -3, -1, +1, +3',
			'Step 3: Mark Q axis levels: -3, -1, +1, +3',
			'Step 4: Draw grid lines at each level',
			'Step 5: Place a point at each intersection (16 points)',
			'For 64-QAM: use 8 levels (-7 to +7, odd numbers)',
			'Done! 16-QAM = 4×4 grid, 64-QAM = 8×8 grid'
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

		const cx = 200;
		const cy = 160;
		const spacing = 35;
		const levels = [-3, -1, 1, 3];

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('Drawing 16-QAM Constellation');

		// Main axes (always visible)
		svgEl.append('line')
			.attr('x1', cx - spacing * 2.5)
			.attr('x2', cx + spacing * 2.5)
			.attr('y1', cy)
			.attr('y2', cy)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);

		svgEl.append('line')
			.attr('x1', cx)
			.attr('x2', cx)
			.attr('y1', cy - spacing * 2.5)
			.attr('y2', cy + spacing * 2.5)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);

		// Axis labels
		svgEl.append('text')
			.attr('x', cx + spacing * 2.5 + 15)
			.attr('y', cy + 5)
			.attr('fill', colors.accent)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('I');

		svgEl.append('text')
			.attr('x', cx + 5)
			.attr('y', cy - spacing * 2.5 - 8)
			.attr('fill', colors.yellow)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Q');

		// I axis level labels
		const iLabels = svgEl.append('g').attr('class', 'i-axis-labels').attr('opacity', 0);
		levels.forEach((level, i) => {
			const x = cx + (i - 1.5) * spacing;
			iLabels.append('text')
				.attr('x', x)
				.attr('y', cy + spacing * 2.5 + 18)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent)
				.attr('font-size', '11px')
				.text(level > 0 ? `+${level}` : level);

			iLabels.append('line')
				.attr('x1', x)
				.attr('x2', x)
				.attr('y1', cy - 5)
				.attr('y2', cy + 5)
				.attr('stroke', colors.accent)
				.attr('stroke-width', 2);
		});

		// Q axis level labels
		const qLabels = svgEl.append('g').attr('class', 'q-axis-labels').attr('opacity', 0);
		levels.forEach((level, i) => {
			const y = cy - (i - 1.5) * spacing;
			qLabels.append('text')
				.attr('x', cx - spacing * 2.5 - 12)
				.attr('y', y + 4)
				.attr('text-anchor', 'end')
				.attr('fill', colors.yellow)
				.attr('font-size', '11px')
				.text(level > 0 ? `+${level}` : level);

			qLabels.append('line')
				.attr('x1', cx - 5)
				.attr('x2', cx + 5)
				.attr('y1', y)
				.attr('y2', y)
				.attr('stroke', colors.yellow)
				.attr('stroke-width', 2);
		});

		// Grid lines
		levels.forEach((level, i) => {
			const pos = (i - 1.5) * spacing;

			// Vertical grid line
			svgEl.append('line')
				.attr('class', 'grid-line')
				.attr('x1', cx + pos)
				.attr('x2', cx + pos)
				.attr('y1', cy - spacing * 2)
				.attr('y2', cy + spacing * 2)
				.attr('stroke', colors.border)
				.attr('stroke-width', 1)
				.attr('stroke-dasharray', '3,3')
				.attr('opacity', 0);

			// Horizontal grid line
			svgEl.append('line')
				.attr('class', 'grid-line')
				.attr('x1', cx - spacing * 2)
				.attr('x2', cx + spacing * 2)
				.attr('y1', cy - pos)
				.attr('y2', cy - pos)
				.attr('stroke', colors.border)
				.attr('stroke-width', 1)
				.attr('stroke-dasharray', '3,3')
				.attr('opacity', 0);
		});

		// 16-QAM points
		for (let row = 0; row < 4; row++) {
			for (let col = 0; col < 4; col++) {
				const x = cx + (col - 1.5) * spacing;
				const y = cy - (row - 1.5) * spacing;

				svgEl.append('circle')
					.attr('class', 'qam-point')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 8)
					.attr('fill', colors.accent)
					.attr('opacity', 0);
			}
		}

		// 64-QAM info box
		const infoBox = svgEl.append('g').attr('class', 'info-64qam').attr('opacity', 0);

		infoBox.append('rect')
			.attr('x', 330)
			.attr('y', 70)
			.attr('width', 155)
			.attr('height', 100)
			.attr('fill', colors.border)
			.attr('rx', 6)
			.attr('opacity', 0.3);

		infoBox.append('text')
			.attr('x', 407)
			.attr('y', 95)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('64-QAM');

		infoBox.append('text')
			.attr('x', 407)
			.attr('y', 115)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('8×8 grid = 64 points');

		infoBox.append('text')
			.attr('x', 407)
			.attr('y', 135)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Levels: -7,-5,-3,-1,');

		infoBox.append('text')
			.attr('x', 407)
			.attr('y', 150)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('+1,+3,+5,+7');

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Step 1: Draw I and Q axes');

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
