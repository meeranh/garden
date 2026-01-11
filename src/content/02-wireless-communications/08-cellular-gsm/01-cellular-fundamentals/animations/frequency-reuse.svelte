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
	const width = 650;
	const height = 320;

	const titles = [
		'7 cells, each needs a different frequency',
		'Assign frequencies 1-7 to the cluster',
		'This forms one complete cluster',
		'Repeat the pattern across the area',
		'Same frequencies reused in distant cells!',
	];

	// 7-cell cluster layout (hexagonal approximation with circles)
	const clusterCells = [
		{ x: 0, y: 0, freq: 1 },      // Center
		{ x: 50, y: -30, freq: 2 },   // Top right
		{ x: 50, y: 30, freq: 3 },    // Bottom right
		{ x: 0, y: 55, freq: 4 },     // Bottom
		{ x: -50, y: 30, freq: 5 },   // Bottom left
		{ x: -50, y: -30, freq: 6 },  // Top left
		{ x: 0, y: -55, freq: 7 },    // Top
	];

	const freqColors: Record<number, string> = {
		1: '#fb4934',
		2: '#8ec07c',
		3: '#83a598',
		4: '#fabd2f',
		5: '#d3869b',
		6: '#fe8019',
		7: '#b8bb26',
	};

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Step 0: Show empty cells
		svgEl.selectAll('.cluster-1 .cell-circle')
			.transition().duration(400)
			.attr('fill-opacity', 0.1)
			.attr('stroke-opacity', 0.3);

		svgEl.selectAll('.cluster-1 .freq-label')
			.transition().duration(400)
			.attr('opacity', 0);

		// Step 1+: Show frequencies in first cluster
		if (step >= 1) {
			svgEl.selectAll('.cluster-1 .cell-circle')
				.transition().duration(400)
				.attr('fill-opacity', 0.25)
				.attr('stroke-opacity', 1);

			svgEl.selectAll('.cluster-1 .freq-label')
				.transition().duration(400)
				.attr('opacity', 1);
		}

		// Step 2: Highlight cluster boundary
		svgEl.select('.cluster-1-boundary')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 0.6 : 0);

		// Step 3+: Show second cluster
		svgEl.select('.cluster-2')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// Step 4: Highlight reuse
		svgEl.select('.reuse-highlight')
			.transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		// Legend
		svgEl.select('.legend-group')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2500);
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

	function drawCluster(g: d3.Selection<SVGGElement, unknown, null, undefined>, cx: number, cy: number, showLabels: boolean) {
		clusterCells.forEach((cell) => {
			const x = cx + cell.x;
			const y = cy + cell.y;
			const color = freqColors[cell.freq];

			g.append('circle')
				.attr('class', 'cell-circle')
				.attr('cx', x).attr('cy', y)
				.attr('r', 22)
				.attr('fill', color).attr('fill-opacity', 0.25)
				.attr('stroke', color).attr('stroke-width', 2);

			if (showLabels) {
				g.append('text')
					.attr('class', 'freq-label')
					.attr('x', x).attr('y', y + 5)
					.attr('text-anchor', 'middle').attr('fill', '#fff')
					.attr('font-size', '14px').attr('font-weight', 'bold')
					.text(cell.freq);
			}
		});
	}

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
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// First cluster
		const cluster1 = svgEl.append('g').attr('class', 'cluster-1');
		const c1x = 140, c1y = 170;
		drawCluster(cluster1, c1x, c1y, true);

		// Cluster 1 boundary
		svgEl.append('circle')
			.attr('class', 'cluster-1-boundary')
			.attr('cx', c1x).attr('cy', c1y)
			.attr('r', 85)
			.attr('fill', 'none')
			.attr('stroke', colors.fg).attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4')
			.attr('opacity', 0);

		// Second cluster (to the right)
		const cluster2 = svgEl.append('g').attr('class', 'cluster-2').attr('opacity', 0);
		const c2x = 510, c2y = 170;
		drawCluster(cluster2, c2x, c2y, true);

		// Cluster 2 boundary
		cluster2.append('circle')
			.attr('cx', c2x).attr('cy', c2y)
			.attr('r', 85)
			.attr('fill', 'none')
			.attr('stroke', colors.fg).attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4')
			.attr('opacity', 0.6);

		// Reuse highlight
		const reuseG = svgEl.append('g').attr('class', 'reuse-highlight').attr('opacity', 0);

		// Highlight freq 1 in both clusters
		reuseG.append('circle')
			.attr('cx', c1x).attr('cy', c1y)
			.attr('r', 26)
			.attr('fill', 'none')
			.attr('stroke', '#fff').attr('stroke-width', 3);

		reuseG.append('circle')
			.attr('cx', c2x).attr('cy', c2y)
			.attr('r', 26)
			.attr('fill', 'none')
			.attr('stroke', '#fff').attr('stroke-width', 3);

		// Arrow showing reuse
		reuseG.append('line')
			.attr('x1', c1x + 30).attr('y1', c1y)
			.attr('x2', c2x - 30).attr('y2', c2y)
			.attr('stroke', '#fff').attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,2');

		reuseG.append('text')
			.attr('x', (c1x + c2x) / 2).attr('y', c1y - 20)
			.attr('text-anchor', 'middle').attr('fill', '#fff')
			.attr('font-size', '10px')
			.text('Same frequency, far apart');

		reuseG.append('text')
			.attr('x', (c1x + c2x) / 2).attr('y', c1y + 18)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(several kilometers)');

		// Legend (centered)
		const legendG = svgEl.append('g').attr('class', 'legend-group').attr('opacity', 0);
		const legendY = height - 25;
		const legendStartX = width / 2 - 130;

		legendG.append('text')
			.attr('x', legendStartX).attr('y', legendY)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Frequencies:');

		[1, 2, 3, 4, 5, 6, 7].forEach((f, i) => {
			legendG.append('rect')
				.attr('x', legendStartX + 65 + i * 28).attr('y', legendY - 10)
				.attr('width', 20).attr('height', 14)
				.attr('fill', freqColors[f]).attr('fill-opacity', 0.5)
				.attr('rx', 2);

			legendG.append('text')
				.attr('x', legendStartX + 75 + i * 28).attr('y', legendY)
				.attr('text-anchor', 'middle').attr('fill', '#fff')
				.attr('font-size', '10px')
				.text(f);
		});

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
