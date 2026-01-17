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
	const width = 500;
	const height = 320;
	const gridCx = 280;
	const gridCy = 160;
	const gridSpacing = 30;

	// Amplitude levels for 16-QAM: -3, -1, +1, +3
	const levels = [-3, -1, 1, 3];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show grid, explain setup
		// Step 1: Highlight I amplitude selection (column)
		// Step 2: Highlight Q amplitude selection (row)
		// Step 3: Show the intersection point
		// Step 4: Show another example

		// I bar highlighting
		svgEl.select('.i-bar')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// I column highlight on grid
		svgEl.select('.i-column')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 && step < 3 ? 0.3 : 0);

		// Q bar highlighting
		svgEl.select('.q-bar')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Q row highlight on grid
		svgEl.select('.q-row')
			.transition()
			.duration(400)
			.attr('opacity', step === 2 ? 0.3 : 0);

		// Result point
		svgEl.select('.result-point')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0)
			.attr('r', step >= 3 ? 10 : 0);

		// Second example
		svgEl.select('.example2-i-bar')
			.transition()
			.duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		svgEl.select('.example2-q-bar')
			.transition()
			.duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		svgEl.select('.result-point-2')
			.transition()
			.duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		// Messages
		const messages = [
			'Two waves: I (horizontal) and Q (vertical)',
			'Set I amplitude to +1 (selects column)',
			'Set Q amplitude to +3 (selects row)',
			'The intersection is our symbol!',
			'Different amplitudes = different symbol'
		];
		svgEl.select('.message').text(messages[step]);
	}

	async function runAnimation() {
		if (!isPlaying) return;

		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1800);
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
			.text('How QAM Places Symbols');

		// === LEFT SIDE: Amplitude bars ===
		const barX = 50;
		const barWidth = 60;

		// I amplitude bar
		svgEl.append('text')
			.attr('x', barX + barWidth / 2)
			.attr('y', 60)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('I amplitude');

		// I bar background
		svgEl.append('rect')
			.attr('x', barX)
			.attr('y', 75)
			.attr('width', barWidth)
			.attr('height', 80)
			.attr('fill', colors.border)
			.attr('opacity', 0.3)
			.attr('rx', 4);

		// I bar level markers
		levels.forEach((level, i) => {
			const y = 75 + (3 - i) * 20 + 10;
			svgEl.append('text')
				.attr('x', barX - 8)
				.attr('y', y + 4)
				.attr('text-anchor', 'end')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(level > 0 ? `+${level}` : level);
		});

		// I bar indicator (shows +1)
		const iSelectedIndex = 2; // +1
		svgEl.append('rect')
			.attr('class', 'i-bar')
			.attr('x', barX + 5)
			.attr('y', 75 + (3 - iSelectedIndex) * 20 + 3)
			.attr('width', barWidth - 10)
			.attr('height', 14)
			.attr('fill', colors.accent)
			.attr('rx', 3)
			.attr('opacity', 0);

		// Q amplitude bar
		svgEl.append('text')
			.attr('x', barX + barWidth / 2)
			.attr('y', 180)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Q amplitude');

		// Q bar background
		svgEl.append('rect')
			.attr('x', barX)
			.attr('y', 195)
			.attr('width', barWidth)
			.attr('height', 80)
			.attr('fill', colors.border)
			.attr('opacity', 0.3)
			.attr('rx', 4);

		// Q bar level markers
		levels.forEach((level, i) => {
			const y = 195 + (3 - i) * 20 + 10;
			svgEl.append('text')
				.attr('x', barX - 8)
				.attr('y', y + 4)
				.attr('text-anchor', 'end')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(level > 0 ? `+${level}` : level);
		});

		// Q bar indicator (shows +3)
		const qSelectedIndex = 3; // +3
		svgEl.append('rect')
			.attr('class', 'q-bar')
			.attr('x', barX + 5)
			.attr('y', 195 + (3 - qSelectedIndex) * 20 + 3)
			.attr('width', barWidth - 10)
			.attr('height', 14)
			.attr('fill', colors.yellow)
			.attr('rx', 3)
			.attr('opacity', 0);

		// Second example bars (shown in step 4)
		// I = -3, Q = -1
		svgEl.append('rect')
			.attr('class', 'example2-i-bar')
			.attr('x', barX + 5)
			.attr('y', 75 + (3 - 0) * 20 + 3) // -3 is index 0
			.attr('width', barWidth - 10)
			.attr('height', 14)
			.attr('fill', '#fb4934')
			.attr('rx', 3)
			.attr('opacity', 0);

		svgEl.append('rect')
			.attr('class', 'example2-q-bar')
			.attr('x', barX + 5)
			.attr('y', 195 + (3 - 1) * 20 + 3) // -1 is index 1
			.attr('width', barWidth - 10)
			.attr('height', 14)
			.attr('fill', '#fb4934')
			.attr('rx', 3)
			.attr('opacity', 0);

		// === RIGHT SIDE: Constellation grid ===

		// Axes
		svgEl.append('line')
			.attr('x1', gridCx - gridSpacing * 2.2)
			.attr('x2', gridCx + gridSpacing * 2.2)
			.attr('y1', gridCy)
			.attr('y2', gridCy)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		svgEl.append('line')
			.attr('x1', gridCx)
			.attr('x2', gridCx)
			.attr('y1', gridCy - gridSpacing * 2.2)
			.attr('y2', gridCy + gridSpacing * 2.2)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		// Axis labels
		svgEl.append('text')
			.attr('x', gridCx + gridSpacing * 2.2 + 12)
			.attr('y', gridCy + 4)
			.attr('fill', colors.accent)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('I');

		svgEl.append('text')
			.attr('x', gridCx + 5)
			.attr('y', gridCy - gridSpacing * 2.2 - 8)
			.attr('fill', colors.yellow)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Q');

		// Grid points
		for (let row = 0; row < 4; row++) {
			for (let col = 0; col < 4; col++) {
				const x = gridCx + (col - 1.5) * gridSpacing;
				const y = gridCy - (row - 1.5) * gridSpacing; // flip Y so +Q is up

				svgEl.append('circle')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 5)
					.attr('fill', colors.fgMuted)
					.attr('opacity', 0.5);
			}
		}

		// I column highlight (for I = +1, which is col index 2)
		const selectedCol = 2;
		svgEl.append('rect')
			.attr('class', 'i-column')
			.attr('x', gridCx + (selectedCol - 1.5) * gridSpacing - 12)
			.attr('y', gridCy - gridSpacing * 2)
			.attr('width', 24)
			.attr('height', gridSpacing * 4)
			.attr('fill', colors.accent)
			.attr('rx', 4)
			.attr('opacity', 0);

		// Q row highlight (for Q = +3, which is row index 3)
		const selectedRow = 3;
		svgEl.append('rect')
			.attr('class', 'q-row')
			.attr('x', gridCx - gridSpacing * 2)
			.attr('y', gridCy - (selectedRow - 1.5) * gridSpacing - 12)
			.attr('width', gridSpacing * 4)
			.attr('height', 24)
			.attr('fill', colors.yellow)
			.attr('rx', 4)
			.attr('opacity', 0);

		// Result point (I=+1, Q=+3)
		const resultX = gridCx + (selectedCol - 1.5) * gridSpacing;
		const resultY = gridCy - (selectedRow - 1.5) * gridSpacing;
		svgEl.append('circle')
			.attr('class', 'result-point')
			.attr('cx', resultX)
			.attr('cy', resultY)
			.attr('r', 0)
			.attr('fill', colors.accent)
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// Second example result point (I=-3, Q=-1)
		const result2X = gridCx + (0 - 1.5) * gridSpacing; // col 0 = -3
		const result2Y = gridCy - (1 - 1.5) * gridSpacing; // row 1 = -1
		svgEl.append('circle')
			.attr('class', 'result-point-2')
			.attr('cx', result2X)
			.attr('cy', result2Y)
			.attr('r', 8)
			.attr('fill', '#fb4934')
			.attr('opacity', 0);

		// Amplitude labels on grid
		levels.forEach((level, i) => {
			// I axis labels (bottom)
			svgEl.append('text')
				.attr('x', gridCx + (i - 1.5) * gridSpacing)
				.attr('y', gridCy + gridSpacing * 2.2 + 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(level > 0 ? `+${level}` : level);

			// Q axis labels (left)
			svgEl.append('text')
				.attr('x', gridCx - gridSpacing * 2.2 - 10)
				.attr('y', gridCy - (i - 1.5) * gridSpacing + 4)
				.attr('text-anchor', 'end')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(level > 0 ? `+${level}` : level);
		});

		// Arrow from bars to grid
		svgEl.append('path')
			.attr('d', `M ${barX + barWidth + 15} ${gridCy} L ${gridCx - gridSpacing * 2.5 - 10} ${gridCy}`)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4')
			.attr('marker-end', 'url(#arrow)');

		// Arrow marker
		svgEl.append('defs')
			.append('marker')
			.attr('id', 'arrow')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 9)
			.attr('refY', 5)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', colors.border);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Two waves: I (horizontal) and Q (vertical)');

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
