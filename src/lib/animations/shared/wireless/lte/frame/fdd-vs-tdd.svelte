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
	const width = 620;
	const height = 300;

	const titles = [
		'FDD vs TDD: Two ways to duplex',
		'FDD: Separate frequencies for UL/DL (Type 1)',
		'TDD: Same frequency, time-shared (Type 2)',
		'FDD is more common in LTE deployments'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.fdd-section').transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0.3);
		svgEl.select('.fdd-highlight').transition().duration(400)
			.attr('opacity', step === 1 ? 1 : 0);

		svgEl.select('.tdd-section').transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0.3);
		svgEl.select('.tdd-highlight').transition().duration(400)
			.attr('opacity', step === 2 ? 1 : 0);

		svgEl.select('.summary').transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);
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

		// Axes labels
		svgEl.append('text')
			.attr('x', 25).attr('y', 150)
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90, 25, 150)')
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('Frequency');

		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 5)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('Time');

		const boxX = 80;
		const boxWidth = 230;
		const bandHeight = 35;

		// ===== FDD Section (Left) =====
		const fddX = boxX;
		const fddY = 50;
		const fdd = svgEl.append('g').attr('class', 'fdd-section').attr('opacity', 0.3);

		fdd.append('text')
			.attr('x', fddX + boxWidth / 2).attr('y', fddY)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('FDD (Type 1)');

		// Downlink band (higher frequency)
		fdd.append('rect')
			.attr('x', fddX).attr('y', fddY + 15)
			.attr('width', boxWidth).attr('height', bandHeight)
			.attr('fill', '#83a598').attr('fill-opacity', 0.4)
			.attr('stroke', '#83a598').attr('stroke-width', 2);
		fdd.append('text')
			.attr('x', fddX + boxWidth / 2).attr('y', fddY + 15 + bandHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Downlink (f₁)');

		// Guard band
		fdd.append('rect')
			.attr('x', fddX).attr('y', fddY + 15 + bandHeight)
			.attr('width', boxWidth).attr('height', 15)
			.attr('fill', colors.fgMuted).attr('fill-opacity', 0.1);
		fdd.append('text')
			.attr('x', fddX + boxWidth / 2).attr('y', fddY + 15 + bandHeight + 11)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '8px')
			.text('Guard Band');

		// Uplink band (lower frequency)
		fdd.append('rect')
			.attr('x', fddX).attr('y', fddY + 30 + bandHeight + 15)
			.attr('width', boxWidth).attr('height', bandHeight)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.4)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2);
		fdd.append('text')
			.attr('x', fddX + boxWidth / 2).attr('y', fddY + 30 + bandHeight + 15 + bandHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Uplink (f₂)');

		// Simultaneous indicator
		fdd.append('text')
			.attr('x', fddX + boxWidth / 2).attr('y', fddY + 170)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Both directions simultaneously');

		const fddHighlight = svgEl.append('g').attr('class', 'fdd-highlight').attr('opacity', 0);
		fddHighlight.append('rect')
			.attr('x', fddX - 5).attr('y', fddY + 10)
			.attr('width', boxWidth + 10).attr('height', 145)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 6);

		// ===== TDD Section (Right) =====
		const tddX = boxX + boxWidth + 60;
		const tddY = 50;
		const tdd = svgEl.append('g').attr('class', 'tdd-section').attr('opacity', 0.3);

		tdd.append('text')
			.attr('x', tddX + boxWidth / 2).attr('y', tddY)
			.attr('text-anchor', 'middle').attr('fill', '#fe8019')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('TDD (Type 2)');

		// Single band with time slots
		const slotWidth = boxWidth / 10;
		const tddBandY = fddY + 15 + bandHeight / 2 + 7; // Align with middle

		for (let i = 0; i < 10; i++) {
			const isDL = i < 4 || i === 5 || i === 6; // Example: D D D D S U U U D D pattern
			const isSpecial = i === 4;
			let fillColor = isDL ? '#83a598' : '#fabd2f';
			let label = isDL ? 'D' : 'U';
			if (isSpecial) {
				fillColor = '#d3869b';
				label = 'S';
			}

			tdd.append('rect')
				.attr('x', tddX + i * slotWidth).attr('y', tddBandY)
				.attr('width', slotWidth - 2).attr('height', bandHeight + 20)
				.attr('fill', fillColor).attr('fill-opacity', 0.4)
				.attr('stroke', fillColor).attr('stroke-width', 1);
			tdd.append('text')
				.attr('x', tddX + i * slotWidth + slotWidth / 2 - 1).attr('y', tddBandY + bandHeight / 2 + 14)
				.attr('text-anchor', 'middle').attr('fill', fillColor)
				.attr('font-size', '9px').attr('font-weight', 'bold')
				.text(label);
		}

		// Legend for TDD
		const legendY = tddY + 130;
		tdd.append('rect')
			.attr('x', tddX).attr('y', legendY).attr('width', 12).attr('height', 12)
			.attr('fill', '#83a598').attr('fill-opacity', 0.4);
		tdd.append('text')
			.attr('x', tddX + 16).attr('y', legendY + 10).attr('fill', colors.fgMuted).attr('font-size', '8px')
			.text('D=DL');

		tdd.append('rect')
			.attr('x', tddX + 55).attr('y', legendY).attr('width', 12).attr('height', 12)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.4);
		tdd.append('text')
			.attr('x', tddX + 71).attr('y', legendY + 10).attr('fill', colors.fgMuted).attr('font-size', '8px')
			.text('U=UL');

		tdd.append('rect')
			.attr('x', tddX + 110).attr('y', legendY).attr('width', 12).attr('height', 12)
			.attr('fill', '#d3869b').attr('fill-opacity', 0.4);
		tdd.append('text')
			.attr('x', tddX + 126).attr('y', legendY + 10).attr('fill', colors.fgMuted).attr('font-size', '8px')
			.text('S=Special');

		tdd.append('text')
			.attr('x', tddX + boxWidth / 2).attr('y', tddY + 170)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Same frequency, takes turns');

		const tddHighlight = svgEl.append('g').attr('class', 'tdd-highlight').attr('opacity', 0);
		tddHighlight.append('rect')
			.attr('x', tddX - 5).attr('y', tddY + 10)
			.attr('width', boxWidth + 10).attr('height', 145)
			.attr('fill', 'none')
			.attr('stroke', '#fe8019').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 6);

		// Summary
		const summary = svgEl.append('g').attr('class', 'summary').attr('opacity', 0);
		summary.append('rect')
			.attr('x', width / 2 - 160).attr('y', height - 55)
			.attr('width', 320).attr('height', 38)
			.attr('fill', colors.bg)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('rx', 4);
		summary.append('text')
			.attr('x', width / 2).attr('y', height - 38)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('FDD: Paired spectrum, constant bandwidth each way');
		summary.append('text')
			.attr('x', width / 2).attr('y', height - 23)
			.attr('text-anchor', 'middle').attr('fill', '#fe8019')
			.attr('font-size', '10px')
			.text('TDD: Unpaired spectrum, flexible UL/DL ratio');

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
