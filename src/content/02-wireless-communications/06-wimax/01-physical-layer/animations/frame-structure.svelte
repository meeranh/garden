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

	const maxStep = 5;
	const width = 520;
	const height = 300;

	// Grid dimensions
	const gridX = 80;
	const gridY = 55;
	const gridW = 400;
	const gridH = 180;
	const cols = 20; // time slots
	const rows = 8;  // subchannels
	const cellW = gridW / cols;
	const cellH = gridH / rows;

	const titles = [
		'WiMAX Frame: 2D grid of Time x Frequency',
		'Preamble: First symbol for synchronization',
		'FCH + DL-MAP: Tells users where their data is',
		'DL Bursts: Downlink data for different users',
		'UL-MAP + Uplink Bursts: Users transmit back',
		'Complete frame: DL subframe + UL subframe'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Preamble (first column)
		svgEl.select('.preamble')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// FCH + DL-MAP
		svgEl.select('.fch-dlmap')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// DL Bursts
		svgEl.selectAll('.dl-burst')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// UL-MAP + UL Bursts
		svgEl.select('.ul-section')
			.transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		// Labels
		svgEl.select('.dl-label')
			.transition().duration(300)
			.attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.ul-label')
			.transition().duration(300)
			.attr('opacity', step >= 4 ? 1 : 0);

		// Divider line
		svgEl.select('.divider')
			.transition().duration(300)
			.attr('opacity', step >= 4 ? 1 : 0);
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
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Axis labels
		svgEl.append('text')
			.attr('x', gridX + gridW / 2).attr('y', gridY + gridH + 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Time (OFDM symbols) →');

		svgEl.append('text')
			.attr('transform', `rotate(-90, ${gridX - 25}, ${gridY + gridH / 2})`)
			.attr('x', gridX - 25).attr('y', gridY + gridH / 2)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Frequency (subchannels) →');

		// Grid outline
		svgEl.append('rect')
			.attr('x', gridX).attr('y', gridY)
			.attr('width', gridW).attr('height', gridH)
			.attr('fill', 'transparent')
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1);

		// Grid lines (subtle)
		for (let i = 1; i < cols; i++) {
			svgEl.append('line')
				.attr('x1', gridX + i * cellW).attr('y1', gridY)
				.attr('x2', gridX + i * cellW).attr('y2', gridY + gridH)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 0.3)
				.attr('opacity', 0.5);
		}
		for (let i = 1; i < rows; i++) {
			svgEl.append('line')
				.attr('x1', gridX).attr('y1', gridY + i * cellH)
				.attr('x2', gridX + gridW).attr('y2', gridY + i * cellH)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 0.3)
				.attr('opacity', 0.5);
		}

		// === PREAMBLE (first column, all rows) ===
		svgEl.append('rect')
			.attr('class', 'preamble')
			.attr('x', gridX + 1).attr('y', gridY + 1)
			.attr('width', cellW - 2).attr('height', gridH - 2)
			.attr('fill', '#b16286')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'preamble')
			.attr('x', gridX + cellW / 2).attr('y', gridY + gridH / 2)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '8px')
			.attr('transform', `rotate(-90, ${gridX + cellW / 2}, ${gridY + gridH / 2})`)
			.attr('opacity', 0)
			.text('PREAMBLE');

		// === FCH + DL-MAP (columns 2-3, top portion) ===
		const fchGroup = svgEl.append('g').attr('class', 'fch-dlmap').attr('opacity', 0);

		fchGroup.append('rect')
			.attr('x', gridX + cellW + 1).attr('y', gridY + 1)
			.attr('width', cellW * 2 - 2).attr('height', cellH * 2 - 2)
			.attr('fill', '#fabd2f');

		fchGroup.append('text')
			.attr('x', gridX + cellW * 2).attr('y', gridY + cellH)
			.attr('text-anchor', 'middle').attr('fill', '#1d2021')
			.attr('font-size', '8px').attr('font-weight', 'bold')
			.text('FCH');

		fchGroup.append('rect')
			.attr('x', gridX + cellW + 1).attr('y', gridY + cellH * 2 + 1)
			.attr('width', cellW * 2 - 2).attr('height', cellH * 2 - 2)
			.attr('fill', '#d79921');

		fchGroup.append('text')
			.attr('x', gridX + cellW * 2).attr('y', gridY + cellH * 3)
			.attr('text-anchor', 'middle').attr('fill', '#1d2021')
			.attr('font-size', '7px').attr('font-weight', 'bold')
			.text('DL-MAP');

		// === DL BURSTS (columns 4-12) ===
		const dlBursts = [
			{ x: 3, y: 0, w: 4, h: 3, color: '#458588', label: 'User 1' },
			{ x: 3, y: 3, w: 3, h: 3, color: '#689d6a', label: 'User 2' },
			{ x: 3, y: 6, w: 5, h: 2, color: '#83a598', label: 'User 3' },
			{ x: 7, y: 0, w: 3, h: 4, color: '#98971a', label: 'User 4' },
			{ x: 6, y: 4, w: 4, h: 2, color: '#b8bb26', label: 'User 5' },
		];

		dlBursts.forEach((burst, idx) => {
			const g = svgEl.append('g').attr('class', 'dl-burst').attr('opacity', 0);

			g.append('rect')
				.attr('x', gridX + burst.x * cellW + 1)
				.attr('y', gridY + burst.y * cellH + 1)
				.attr('width', burst.w * cellW - 2)
				.attr('height', burst.h * cellH - 2)
				.attr('fill', burst.color)
				.attr('rx', 2);

			g.append('text')
				.attr('x', gridX + (burst.x + burst.w / 2) * cellW)
				.attr('y', gridY + (burst.y + burst.h / 2) * cellH + 3)
				.attr('text-anchor', 'middle').attr('fill', '#1d2021')
				.attr('font-size', '7px').attr('font-weight', 'bold')
				.text(burst.label);
		});

		// === Divider line between DL and UL ===
		svgEl.append('line')
			.attr('class', 'divider')
			.attr('x1', gridX + 11 * cellW).attr('y1', gridY)
			.attr('x2', gridX + 11 * cellW).attr('y2', gridY + gridH)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,2')
			.attr('opacity', 0);

		// === UL Section (columns 11-20) ===
		const ulGroup = svgEl.append('g').attr('class', 'ul-section').attr('opacity', 0);

		// UL-MAP
		ulGroup.append('rect')
			.attr('x', gridX + 11 * cellW + 1).attr('y', gridY + 1)
			.attr('width', cellW * 2 - 2).attr('height', cellH * 2 - 2)
			.attr('fill', '#d65d0e');

		ulGroup.append('text')
			.attr('x', gridX + 12 * cellW).attr('y', gridY + cellH)
			.attr('text-anchor', 'middle').attr('fill', '#1d2021')
			.attr('font-size', '7px').attr('font-weight', 'bold')
			.text('UL-MAP');

		// UL Bursts
		const ulBursts = [
			{ x: 13, y: 0, w: 3, h: 4, color: '#cc241d', label: 'UL 1' },
			{ x: 13, y: 4, w: 4, h: 4, color: '#fb4934', label: 'UL 2' },
			{ x: 16, y: 0, w: 3, h: 3, color: '#9d0006', label: 'UL 3' },
			{ x: 11, y: 2, w: 2, h: 6, color: '#d65d0e', label: 'UL 4' },
		];

		ulBursts.forEach((burst) => {
			ulGroup.append('rect')
				.attr('x', gridX + burst.x * cellW + 1)
				.attr('y', gridY + burst.y * cellH + 1)
				.attr('width', burst.w * cellW - 2)
				.attr('height', burst.h * cellH - 2)
				.attr('fill', burst.color)
				.attr('rx', 2);

			ulGroup.append('text')
				.attr('x', gridX + (burst.x + burst.w / 2) * cellW)
				.attr('y', gridY + (burst.y + burst.h / 2) * cellH + 3)
				.attr('text-anchor', 'middle').attr('fill', '#1d2021')
				.attr('font-size', '7px').attr('font-weight', 'bold')
				.text(burst.label);
		});

		// === Labels ===
		svgEl.append('text')
			.attr('class', 'dl-label')
			.attr('x', gridX + 5 * cellW).attr('y', gridY - 8)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('Downlink Subframe');

		svgEl.append('text')
			.attr('class', 'ul-label')
			.attr('x', gridX + 15 * cellW).attr('y', gridY - 8)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('Uplink Subframe');

		// Legend
		const legendY = height - 25;
		const legendItems = [
			{ color: '#b16286', label: 'Preamble' },
			{ color: '#fabd2f', label: 'Control' },
			{ color: '#458588', label: 'DL Data' },
			{ color: '#fb4934', label: 'UL Data' },
		];

		legendItems.forEach((item, i) => {
			svgEl.append('rect')
				.attr('x', gridX + i * 100).attr('y', legendY)
				.attr('width', 12).attr('height', 12)
				.attr('fill', item.color)
				.attr('rx', 2);

			svgEl.append('text')
				.attr('x', gridX + i * 100 + 16).attr('y', legendY + 10)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(item.label);
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
