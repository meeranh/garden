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
	const width = 640;
	const height = 340;

	const titles = [
		'LTE Frame Structure',
		'1 Radio Frame = 10 ms',
		'1 Subframe = 1 ms (×10 per frame)',
		'1 Slot = 0.5 ms (×2 per subframe)',
		'1 Slot = 7 OFDM Symbols'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.row-frame').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.row-subframes').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);
		svgEl.select('.row-slots').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.row-symbols').transition().duration(400).attr('opacity', step >= 4 ? 1 : 0);

		// Highlight current level
		svgEl.select('.frame-box').transition().duration(300)
			.attr('stroke-width', step === 1 ? 3 : 1.5);
		svgEl.select('.sf-highlight').transition().duration(300)
			.attr('opacity', step === 2 ? 1 : 0);
		svgEl.select('.slot-highlight').transition().duration(300)
			.attr('opacity', step === 3 ? 1 : 0);
		svgEl.select('.sym-highlight').transition().duration(300)
			.attr('opacity', step === 4 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2200);
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
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text(titles[0]);

		const leftMargin = 90;
		const barWidth = 480;
		const barHeight = 50;
		const rowGap = 70;

		// ===== Row 1: Radio Frame =====
		const row1Y = 50;
		const rowFrame = svgEl.append('g').attr('class', 'row-frame').attr('opacity', 0);

		rowFrame.append('text')
			.attr('x', leftMargin - 10).attr('y', row1Y + barHeight / 2 + 5)
			.attr('text-anchor', 'end').attr('fill', '#83a598')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Frame');

		rowFrame.append('rect')
			.attr('class', 'frame-box')
			.attr('x', leftMargin).attr('y', row1Y)
			.attr('width', barWidth).attr('height', barHeight)
			.attr('fill', '#83a598').attr('fill-opacity', 0.3)
			.attr('stroke', '#83a598').attr('stroke-width', 2)
			.attr('rx', 4);

		rowFrame.append('text')
			.attr('x', leftMargin + barWidth / 2).attr('y', row1Y + barHeight / 2 + 5)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text('Radio Frame = 10 ms');

		// ===== Row 2: Subframes (show 4 + ellipsis) =====
		const row2Y = row1Y + rowGap;
		const numSfShown = 4;
		const sfWidth = barWidth / (numSfShown + 1); // Extra space for ellipsis
		const rowSubframes = svgEl.append('g').attr('class', 'row-subframes').attr('opacity', 0);

		rowSubframes.append('text')
			.attr('x', leftMargin - 10).attr('y', row2Y + barHeight / 2 + 5)
			.attr('text-anchor', 'end').attr('fill', '#fabd2f')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Subframes');

		// Connector line from frame to subframes
		rowSubframes.append('line')
			.attr('x1', leftMargin + sfWidth / 2).attr('y1', row1Y + barHeight)
			.attr('x2', leftMargin + sfWidth / 2).attr('y2', row2Y)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('stroke-dasharray', '3,2');

		// Draw first 3 subframes
		for (let i = 0; i < 3; i++) {
			const x = leftMargin + i * sfWidth;
			rowSubframes.append('rect')
				.attr('x', x + 2).attr('y', row2Y)
				.attr('width', sfWidth - 4).attr('height', barHeight)
				.attr('fill', '#fabd2f').attr('fill-opacity', 0.25)
				.attr('stroke', '#fabd2f').attr('stroke-width', 1.5)
				.attr('rx', 3);
			rowSubframes.append('text')
				.attr('x', x + sfWidth / 2).attr('y', row2Y + barHeight / 2 + 5)
				.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(`SF${i}`);
		}

		// Ellipsis
		rowSubframes.append('text')
			.attr('x', leftMargin + 3 * sfWidth + sfWidth / 2).attr('y', row2Y + barHeight / 2 + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '16px')
			.text('···');

		// Last subframe (SF9)
		const lastSfX = leftMargin + 4 * sfWidth;
		rowSubframes.append('rect')
			.attr('x', lastSfX + 2).attr('y', row2Y)
			.attr('width', sfWidth - 4).attr('height', barHeight)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.25)
			.attr('stroke', '#fabd2f').attr('stroke-width', 1.5)
			.attr('rx', 3);
		rowSubframes.append('text')
			.attr('x', lastSfX + sfWidth / 2).attr('y', row2Y + barHeight / 2 + 5)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('SF9');

		// SF0 highlight
		rowSubframes.append('rect')
			.attr('class', 'sf-highlight')
			.attr('x', leftMargin).attr('y', row2Y - 3)
			.attr('width', sfWidth).attr('height', barHeight + 6)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 4)
			.attr('opacity', 0);

		rowSubframes.append('text')
			.attr('x', leftMargin + barWidth + 15).attr('y', row2Y + barHeight / 2 + 5)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('×10');

		// ===== Row 3: Slots (for SF0) =====
		const row3Y = row2Y + rowGap;
		const slotWidth = sfWidth / 2;
		const rowSlots = svgEl.append('g').attr('class', 'row-slots').attr('opacity', 0);

		rowSlots.append('text')
			.attr('x', leftMargin - 10).attr('y', row3Y + barHeight / 2 + 5)
			.attr('text-anchor', 'end').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Slots');

		// Connector line
		rowSlots.append('line')
			.attr('x1', leftMargin + sfWidth / 2).attr('y1', row2Y + barHeight)
			.attr('x2', leftMargin + sfWidth / 2).attr('y2', row3Y)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('stroke-dasharray', '3,2');

		for (let i = 0; i < 2; i++) {
			const x = leftMargin + i * slotWidth;
			rowSlots.append('rect')
				.attr('x', x + 2).attr('y', row3Y)
				.attr('width', slotWidth - 4).attr('height', barHeight)
				.attr('fill', '#8ec07c').attr('fill-opacity', 0.25)
				.attr('stroke', '#8ec07c').attr('stroke-width', 1.5)
				.attr('rx', 3);
			rowSlots.append('text')
				.attr('x', x + slotWidth / 2).attr('y', row3Y + barHeight / 2 + 5)
				.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(`Slot ${i}`);
		}

		// Slot 0 highlight
		rowSlots.append('rect')
			.attr('class', 'slot-highlight')
			.attr('x', leftMargin).attr('y', row3Y - 3)
			.attr('width', slotWidth).attr('height', barHeight + 6)
			.attr('fill', 'none')
			.attr('stroke', '#fe8019').attr('stroke-width', 2)
			.attr('rx', 4)
			.attr('opacity', 0);

		rowSlots.append('text')
			.attr('x', leftMargin + sfWidth + 20).attr('y', row3Y + barHeight / 2 + 5)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('← 0.5 ms each (×2 per SF)');

		// ===== Row 4: Symbols (for Slot 0) - show 4 + ellipsis =====
		const row4Y = row3Y + rowGap;
		const symWidth = slotWidth / 2.5; // Bigger symbols, not proportional
		const rowSymbols = svgEl.append('g').attr('class', 'row-symbols').attr('opacity', 0);

		rowSymbols.append('text')
			.attr('x', leftMargin - 10).attr('y', row4Y + barHeight / 2 + 5)
			.attr('text-anchor', 'end').attr('fill', '#fe8019')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Symbols');

		// Connector line
		rowSymbols.append('line')
			.attr('x1', leftMargin + slotWidth / 2).attr('y1', row3Y + barHeight)
			.attr('x2', leftMargin + slotWidth / 2).attr('y2', row4Y)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('stroke-dasharray', '3,2');

		// Draw first 3 symbols
		for (let i = 0; i < 3; i++) {
			const x = leftMargin + i * symWidth;
			rowSymbols.append('rect')
				.attr('x', x + 2).attr('y', row4Y)
				.attr('width', symWidth - 4).attr('height', barHeight)
				.attr('fill', '#fe8019').attr('fill-opacity', 0.25)
				.attr('stroke', '#fe8019').attr('stroke-width', 1.5)
				.attr('rx', 3);
			rowSymbols.append('text')
				.attr('x', x + symWidth / 2).attr('y', row4Y + barHeight / 2 + 5)
				.attr('text-anchor', 'middle').attr('fill', '#fe8019')
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(i);
		}

		// Ellipsis
		rowSymbols.append('text')
			.attr('x', leftMargin + 3 * symWidth + symWidth / 2).attr('y', row4Y + barHeight / 2 + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '14px')
			.text('··');

		// Last symbol (6)
		const lastSymX = leftMargin + 4 * symWidth;
		rowSymbols.append('rect')
			.attr('x', lastSymX + 2).attr('y', row4Y)
			.attr('width', symWidth - 4).attr('height', barHeight)
			.attr('fill', '#fe8019').attr('fill-opacity', 0.25)
			.attr('stroke', '#fe8019').attr('stroke-width', 1.5)
			.attr('rx', 3);
		rowSymbols.append('text')
			.attr('x', lastSymX + symWidth / 2).attr('y', row4Y + barHeight / 2 + 5)
			.attr('text-anchor', 'middle').attr('fill', '#fe8019')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('6');

		// Symbol highlight box
		rowSymbols.append('rect')
			.attr('class', 'sym-highlight')
			.attr('x', leftMargin).attr('y', row4Y - 3)
			.attr('width', 5 * symWidth).attr('height', barHeight + 6)
			.attr('fill', 'none')
			.attr('stroke', '#fb4934').attr('stroke-width', 2)
			.attr('rx', 4)
			.attr('opacity', 0);

		rowSymbols.append('text')
			.attr('x', leftMargin + 5 * symWidth + 20).attr('y', row4Y + barHeight / 2 + 5)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('← ×7 per slot');

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
