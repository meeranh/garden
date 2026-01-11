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
	const width = 580;
	const height = 300;

	const titles = [
		'35 carriers to distribute',
		'7-cell cluster (frequency reuse)',
		'Divide carriers among cells',
		'Each cell gets 5 carriers',
	];

	const cellColors = ['#fb4934', '#8ec07c', '#83a598', '#fabd2f', '#d3869b', '#fe8019', '#b8bb26'];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Show cells
		svgEl.select('.cells-group')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// Show distribution arrows
		svgEl.select('.arrows-group')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Recolor carriers to match cells
		if (step >= 2) {
			svgEl.selectAll('.carrier-box').each(function(_, i) {
				const cellIndex = i % 7;
				d3.select(this)
					.transition().duration(400)
					.attr('fill', cellColors[cellIndex])
					.attr('fill-opacity', 0.5)
					.attr('stroke', cellColors[cellIndex]);
			});
		} else {
			svgEl.selectAll('.carrier-box')
				.transition().duration(400)
				.attr('fill', '#8ec07c')
				.attr('fill-opacity', 0.3)
				.attr('stroke', '#8ec07c');
		}

		// Show result
		svgEl.select('.result-group')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// Highlight one cell
		svgEl.select('.highlight-cell')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);
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
			fgMuted: s.getPropertyValue('--color-fg-muted').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('class', 'title-text')
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Carriers at top (show 14 to represent 35, in 2 rows of 7)
		const carrierStartX = 100;
		const carrierY = 50;
		const carrierW = 45;
		const carrierH = 28;
		const carrierGap = 8;

		// First row of 7
		for (let i = 0; i < 7; i++) {
			const x = carrierStartX + i * (carrierW + carrierGap);
			svgEl.append('rect')
				.attr('class', 'carrier-box')
				.attr('x', x).attr('y', carrierY)
				.attr('width', carrierW).attr('height', carrierH)
				.attr('fill', '#8ec07c').attr('fill-opacity', 0.3)
				.attr('stroke', '#8ec07c').attr('stroke-width', 1)
				.attr('rx', 3);
		}

		// Second row of 7
		for (let i = 0; i < 7; i++) {
			const x = carrierStartX + i * (carrierW + carrierGap);
			svgEl.append('rect')
				.attr('class', 'carrier-box')
				.attr('x', x).attr('y', carrierY + carrierH + 5)
				.attr('width', carrierW).attr('height', carrierH)
				.attr('fill', '#8ec07c').attr('fill-opacity', 0.3)
				.attr('stroke', '#8ec07c').attr('stroke-width', 1)
				.attr('rx', 3);
		}

		// "..." and "×5 sets" label
		svgEl.append('text')
			.attr('x', width - 50).attr('y', carrierY + carrierH)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('×5');

		// Cells group
		const cellsG = svgEl.append('g').attr('class', 'cells-group').attr('opacity', 0);
		const cellY = 180;
		const cellRadius = 28;
		const cellSpacing = 70;
		const cellStartX = 75;

		for (let i = 0; i < 7; i++) {
			const x = cellStartX + i * cellSpacing;

			cellsG.append('circle')
				.attr('cx', x).attr('cy', cellY)
				.attr('r', cellRadius)
				.attr('fill', cellColors[i]).attr('fill-opacity', 0.25)
				.attr('stroke', cellColors[i]).attr('stroke-width', 2);

			cellsG.append('text')
				.attr('x', x).attr('y', cellY + 5)
				.attr('text-anchor', 'middle').attr('fill', cellColors[i])
				.attr('font-size', '12px').attr('font-weight', 'bold')
				.text(`Cell ${i + 1}`);
		}

		// Cluster label
		cellsG.append('text')
			.attr('x', width / 2).attr('y', cellY + cellRadius + 20)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('7-cell cluster');

		// Arrows group
		const arrowsG = svgEl.append('g').attr('class', 'arrows-group').attr('opacity', 0);

		for (let i = 0; i < 7; i++) {
			const fromX = carrierStartX + i * (carrierW + carrierGap) + carrierW / 2;
			const fromY = carrierY + 2 * carrierH + 10;
			const toX = cellStartX + i * cellSpacing;
			const toY = cellY - cellRadius - 5;

			arrowsG.append('line')
				.attr('x1', fromX).attr('y1', fromY)
				.attr('x2', toX).attr('y2', toY)
				.attr('stroke', cellColors[i]).attr('stroke-width', 1.5)
				.attr('stroke-dasharray', '4,2')
				.attr('marker-end', `url(#arrow-${i})`);
		}

		// Arrow markers
		const defs = svgEl.append('defs');
		cellColors.forEach((color, i) => {
			defs.append('marker')
				.attr('id', `arrow-${i}`)
				.attr('viewBox', '0 0 10 10')
				.attr('refX', 5).attr('refY', 5)
				.attr('markerWidth', 4).attr('markerHeight', 4)
				.attr('orient', 'auto-start-reverse')
				.append('path')
				.attr('d', 'M 0 0 L 10 5 L 0 10 z')
				.attr('fill', color);
		});

		// Highlight one cell
		svgEl.append('circle')
			.attr('class', 'highlight-cell')
			.attr('cx', cellStartX).attr('cy', cellY)
			.attr('r', cellRadius + 5)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f').attr('stroke-width', 3)
			.attr('opacity', 0);

		// Result group
		const resultG = svgEl.append('g').attr('class', 'result-group').attr('opacity', 0);

		resultG.append('rect')
			.attr('x', width / 2 - 100).attr('y', height - 45)
			.attr('width', 200).attr('height', 32)
			.attr('fill', colors.bg)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('rx', 4);

		resultG.append('text')
			.attr('x', width / 2).attr('y', height - 24)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('35 ÷ 7 = 5 carriers/cell');

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
