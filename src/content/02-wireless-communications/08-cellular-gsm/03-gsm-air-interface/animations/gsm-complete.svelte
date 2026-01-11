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
	const width = 600;
	const height = 340;

	const titles = [
		'GSM combines FDD + FDMA + TDMA',
		'FDD: Separate uplink and downlink bands',
		'FDMA: Each band divided into 125 carriers',
		'TDMA: Each carrier shared by 8 users',
		'Result: Efficient spectrum sharing!',
	];

	const slotColors = ['#fb4934', '#8ec07c', '#83a598', '#fabd2f', '#d3869b', '#fe8019', '#b8bb26', '#458588'];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.bands-group')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.carriers-group')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.tdma-group')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		svgEl.select('.summary-group')
			.transition().duration(400)
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

	// Helper to draw expansion bracket (trapezoid shape)
	function drawExpansionBracket(
		group: d3.Selection<SVGGElement, unknown, null, undefined>,
		fromX: number, fromY: number, fromWidth: number,
		toX: number, toY: number, toWidth: number,
		color: string
	) {
		// Draw trapezoid showing expansion
		const path = `
			M ${fromX} ${fromY}
			L ${fromX + fromWidth} ${fromY}
			L ${toX + toWidth} ${toY}
			L ${toX} ${toY}
			Z
		`;
		group.append('path')
			.attr('d', path)
			.attr('fill', color)
			.attr('fill-opacity', 0.15)
			.attr('stroke', color)
			.attr('stroke-width', 1)
			.attr('stroke-opacity', 0.4);
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
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// ========== FDD Bands ==========
		const bandsG = svgEl.append('g').attr('class', 'bands-group').attr('opacity', 0);
		const bandY = 45;
		const bandH = 30;
		const bandW = 180;
		const bandGap = 50;
		const uplinkX = (width - 2 * bandW - bandGap) / 2;
		const downlinkX = uplinkX + bandW + bandGap;

		// Uplink band
		bandsG.append('rect')
			.attr('x', uplinkX).attr('y', bandY)
			.attr('width', bandW).attr('height', bandH)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.25)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 4);

		bandsG.append('text')
			.attr('x', uplinkX + bandW / 2).attr('y', bandY + bandH / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('UPLINK (890-915 MHz)');

		// Downlink band
		bandsG.append('rect')
			.attr('x', downlinkX).attr('y', bandY)
			.attr('width', bandW).attr('height', bandH)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.25)
			.attr('stroke', '#fb4934').attr('stroke-width', 2)
			.attr('rx', 4);

		bandsG.append('text')
			.attr('x', downlinkX + bandW / 2).attr('y', bandY + bandH / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('DOWNLINK (935-960 MHz)');

		// FDD label in gap
		bandsG.append('text')
			.attr('x', width / 2).attr('y', bandY + bandH / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('FDD');

		// ========== FDMA Carriers ==========
		const carriersG = svgEl.append('g').attr('class', 'carriers-group').attr('opacity', 0);
		const carrierY = bandY + bandH + 45;
		const carrierW = 28;
		const carrierH = 24;
		const carrierGap = 5;
		const numCarriers = 5;
		const carriersWidth = numCarriers * carrierW + (numCarriers - 1) * carrierGap + 20; // +20 for "..."

		// Uplink expansion bracket
		const upCarriersX = uplinkX + (bandW - carriersWidth) / 2;
		drawExpansionBracket(
			carriersG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>,
			uplinkX + 20, bandY + bandH,
			bandW - 40,
			upCarriersX, carrierY,
			carriersWidth,
			'#8ec07c'
		);

		// Uplink carriers
		for (let i = 0; i < numCarriers; i++) {
			const x = upCarriersX + i * (carrierW + carrierGap);
			carriersG.append('rect')
				.attr('x', x).attr('y', carrierY)
				.attr('width', carrierW).attr('height', carrierH)
				.attr('fill', '#8ec07c').attr('fill-opacity', 0.35)
				.attr('stroke', '#8ec07c').attr('stroke-width', 1)
				.attr('rx', 2);
			carriersG.append('text')
				.attr('x', x + carrierW / 2).attr('y', carrierY + carrierH / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '9px')
				.text(`C${i + 1}`);
		}
		carriersG.append('text')
			.attr('x', upCarriersX + numCarriers * (carrierW + carrierGap) + 8)
			.attr('y', carrierY + carrierH / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('...');

		// Downlink expansion bracket
		const downCarriersX = downlinkX + (bandW - carriersWidth) / 2;
		drawExpansionBracket(
			carriersG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>,
			downlinkX + 20, bandY + bandH,
			bandW - 40,
			downCarriersX, carrierY,
			carriersWidth,
			'#fb4934'
		);

		// Downlink carriers
		for (let i = 0; i < numCarriers; i++) {
			const x = downCarriersX + i * (carrierW + carrierGap);
			carriersG.append('rect')
				.attr('x', x).attr('y', carrierY)
				.attr('width', carrierW).attr('height', carrierH)
				.attr('fill', '#fb4934').attr('fill-opacity', 0.35)
				.attr('stroke', '#fb4934').attr('stroke-width', 1)
				.attr('rx', 2);
			carriersG.append('text')
				.attr('x', x + carrierW / 2).attr('y', carrierY + carrierH / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '9px')
				.text(`C${i + 1}`);
		}
		carriersG.append('text')
			.attr('x', downCarriersX + numCarriers * (carrierW + carrierGap) + 8)
			.attr('y', carrierY + carrierH / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('...');

		// FDMA label
		carriersG.append('text')
			.attr('x', width / 2).attr('y', carrierY - 18)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('FDMA: 125 carriers × 200 kHz each');

		// ========== TDMA Slots ==========
		const tdmaG = svgEl.append('g').attr('class', 'tdma-group').attr('opacity', 0);
		const slotY = carrierY + carrierH + 55;
		const slotW = 55;
		const slotH = 32;
		const slotGap = 4;
		const totalSlotWidth = 8 * slotW + 7 * slotGap;
		const slotStartX = (width - totalSlotWidth) / 2;

		// Highlight C1 as the source
		tdmaG.append('rect')
			.attr('x', upCarriersX - 2).attr('y', carrierY - 2)
			.attr('width', carrierW + 4).attr('height', carrierH + 4)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('rx', 3);

		// Expansion bracket from C1 to all slots
		drawExpansionBracket(
			tdmaG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>,
			upCarriersX, carrierY + carrierH,
			carrierW,
			slotStartX, slotY,
			totalSlotWidth,
			'#fabd2f'
		);

		// TDMA label
		tdmaG.append('text')
			.attr('x', width / 2).attr('y', slotY - 12)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('TDMA: 8 time slots per carrier');

		// 8 slots
		for (let i = 0; i < 8; i++) {
			const x = slotStartX + i * (slotW + slotGap);
			tdmaG.append('rect')
				.attr('x', x).attr('y', slotY)
				.attr('width', slotW).attr('height', slotH)
				.attr('fill', slotColors[i]).attr('fill-opacity', 0.5)
				.attr('stroke', slotColors[i]).attr('stroke-width', 1)
				.attr('rx', 3);

			const userLabel = String.fromCharCode(65 + i);
			tdmaG.append('text')
				.attr('x', x + slotW / 2).attr('y', slotY + slotH / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', '#fff')
				.attr('font-size', '9px').attr('font-weight', 'bold')
				.text(`User ${userLabel}`);
		}

		// Frame duration
		tdmaG.append('text')
			.attr('x', width / 2).attr('y', slotY + slotH + 14)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('One frame = 4.615 ms');

		// ========== Summary ==========
		const summaryG = svgEl.append('g').attr('class', 'summary-group').attr('opacity', 0);

		summaryG.append('rect')
			.attr('x', width / 2 - 155).attr('y', height - 42)
			.attr('width', 310).attr('height', 30)
			.attr('fill', colors.bg)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 4);

		summaryG.append('text')
			.attr('x', width / 2).attr('y', height - 22)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('125 carriers × 8 users = 1000 users per band!');

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
