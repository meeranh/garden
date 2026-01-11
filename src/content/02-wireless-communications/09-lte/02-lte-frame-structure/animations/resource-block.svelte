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
	const width = 620;
	const height = 360;

	const titles = [
		'Resource Block: The 2D Allocation Unit',
		'Time axis: 7 OFDM symbols (1 slot)',
		'Frequency axis: 12 subcarriers (180 kHz)',
		'Resource Element: 1 subcarrier × 1 symbol',
		'Resource Block = 12 × 7 = 84 Resource Elements'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.time-axis').transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0.3);
		svgEl.select('.time-label').transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.freq-axis').transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0.3);
		svgEl.select('.freq-label').transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.re-highlight').transition().duration(400)
			.attr('opacity', step === 3 ? 1 : 0);

		svgEl.select('.rb-highlight').transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);
		svgEl.select('.summary').transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);
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
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text(titles[0]);

		const gridX = 120;
		const gridY = 55;
		const cellW = 55;
		const cellH = 22;
		const cols = 7; // symbols
		const rows = 12; // subcarriers

		// Draw grid
		const grid = svgEl.append('g').attr('class', 'grid');

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				grid.append('rect')
					.attr('x', gridX + c * cellW)
					.attr('y', gridY + r * cellH)
					.attr('width', cellW - 1)
					.attr('height', cellH - 1)
					.attr('fill', '#8ec07c').attr('fill-opacity', 0.15)
					.attr('stroke', '#8ec07c').attr('stroke-width', 0.5);
			}
		}

		// Time axis highlighting
		const timeAxis = svgEl.append('g').attr('class', 'time-axis').attr('opacity', 0.3);
		for (let c = 0; c < cols; c++) {
			timeAxis.append('text')
				.attr('x', gridX + c * cellW + cellW / 2)
				.attr('y', gridY + rows * cellH + 18)
				.attr('text-anchor', 'middle')
				.attr('fill', '#fabd2f')
				.attr('font-size', '9px')
				.text(`Sym${c}`);
		}

		const timeLabel = svgEl.append('g').attr('class', 'time-label').attr('opacity', 0);
		timeLabel.append('text')
			.attr('x', gridX + (cols * cellW) / 2)
			.attr('y', gridY + rows * cellH + 38)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Time → 7 symbols = 0.5 ms (1 slot)');

		// Frequency axis highlighting
		const freqAxis = svgEl.append('g').attr('class', 'freq-axis').attr('opacity', 0.3);
		for (let r = 0; r < rows; r++) {
			freqAxis.append('text')
				.attr('x', gridX - 8)
				.attr('y', gridY + r * cellH + cellH / 2 + 3)
				.attr('text-anchor', 'end')
				.attr('fill', '#83a598')
				.attr('font-size', '8px')
				.text(`SC${r}`);
		}

		const freqLabel = svgEl.append('g').attr('class', 'freq-label').attr('opacity', 0);
		freqLabel.append('text')
			.attr('x', 20)
			.attr('y', gridY + (rows * cellH) / 2)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('transform', `rotate(-90, 20, ${gridY + (rows * cellH) / 2})`)
			.text('Frequency → 12 subcarriers = 180 kHz');

		// Resource Element highlight (single cell)
		const reHighlight = svgEl.append('g').attr('class', 're-highlight').attr('opacity', 0);
		const reX = gridX + 3 * cellW;
		const reY = gridY + 5 * cellH;
		reHighlight.append('rect')
			.attr('x', reX).attr('y', reY)
			.attr('width', cellW - 1).attr('height', cellH - 1)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.6)
			.attr('stroke', '#fb4934').attr('stroke-width', 2);
		reHighlight.append('text')
			.attr('x', reX + cellW + 10).attr('y', reY + cellH / 2 + 4)
			.attr('fill', '#fb4934')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('← Resource Element (RE)');
		reHighlight.append('text')
			.attr('x', reX + cellW + 15).attr('y', reY + cellH / 2 + 18)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Smallest unit: 1 subcarrier × 1 symbol');

		// Resource Block highlight (full grid)
		const rbHighlight = svgEl.append('g').attr('class', 'rb-highlight').attr('opacity', 0);
		rbHighlight.append('rect')
			.attr('x', gridX - 3).attr('y', gridY - 3)
			.attr('width', cols * cellW + 5).attr('height', rows * cellH + 5)
			.attr('fill', 'none')
			.attr('stroke', '#fe8019').attr('stroke-width', 3)
			.attr('rx', 4);
		rbHighlight.append('text')
			.attr('x', gridX + cols * cellW + 15).attr('y', gridY + 20)
			.attr('fill', '#fe8019')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Resource Block');

		// Summary text next to Resource Block label
		const summary = svgEl.append('g').attr('class', 'summary').attr('opacity', 0);
		summary.append('text')
			.attr('x', gridX + cols * cellW + 15).attr('y', gridY + 45)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('= 84 REs');
		summary.append('text')
			.attr('x', gridX + cols * cellW + 15).attr('y', gridY + 60)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('180 kHz × 0.5 ms');

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
