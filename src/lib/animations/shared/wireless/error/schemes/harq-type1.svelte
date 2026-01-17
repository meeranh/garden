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
	const width = 420;
	const height = 170;

	const tx1Y = 45;
	const tx2Y = 85;
	const combineY = 130;
	const startX = 90;
	const boxWidth = 240;
	const boxHeight = 28;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.tx1-group').attr('opacity', step >= 0 ? 1 : 0);
		svgEl.select('.tx2-group').attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.combine-arrows').attr('opacity', step >= 2 ? 1 : 0);
		svgEl.select('.result-group').attr('opacity', step >= 3 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1400);
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

		// First transmission
		const tx1Group = svgEl.append('g').attr('class', 'tx1-group').attr('opacity', 0);

		tx1Group.append('text')
			.attr('x', 15).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('TX 1:');

		// Data blocks with some "errors" (red sections)
		tx1Group.append('rect')
			.attr('x', startX).attr('y', tx1Y)
			.attr('width', boxWidth).attr('height', boxHeight)
			.attr('fill', '#83a598').attr('rx', 4);

		// Error sections
		tx1Group.append('rect')
			.attr('x', startX + 50).attr('y', tx1Y)
			.attr('width', 30).attr('height', boxHeight)
			.attr('fill', '#fb4934').attr('rx', 0);
		tx1Group.append('rect')
			.attr('x', startX + 150).attr('y', tx1Y)
			.attr('width', 25).attr('height', boxHeight)
			.attr('fill', '#fb4934').attr('rx', 0);

		tx1Group.append('text')
			.attr('x', startX + boxWidth / 2).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('DATA (with errors)');

		tx1Group.append('text')
			.attr('x', startX + boxWidth + 15).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('fill', '#fb4934').attr('font-size', '10px')
			.text('✗');

		// Second transmission (same data)
		const tx2Group = svgEl.append('g').attr('class', 'tx2-group').attr('opacity', 0);

		tx2Group.append('text')
			.attr('x', 15).attr('y', tx2Y + boxHeight / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('TX 2:');

		tx2Group.append('rect')
			.attr('x', startX).attr('y', tx2Y)
			.attr('width', boxWidth).attr('height', boxHeight)
			.attr('fill', '#83a598').attr('rx', 4);

		// Different error sections (errors are random)
		tx2Group.append('rect')
			.attr('x', startX + 100).attr('y', tx2Y)
			.attr('width', 20).attr('height', boxHeight)
			.attr('fill', '#fb4934').attr('rx', 0);
		tx2Group.append('rect')
			.attr('x', startX + 200).attr('y', tx2Y)
			.attr('width', 30).attr('height', boxHeight)
			.attr('fill', '#fb4934').attr('rx', 0);

		tx2Group.append('text')
			.attr('x', startX + boxWidth / 2).attr('y', tx2Y + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('SAME DATA (different errors)');

		tx2Group.append('text')
			.attr('x', startX + boxWidth + 15).attr('y', tx2Y + boxHeight / 2 + 4)
			.attr('fill', '#fb4934').attr('font-size', '10px')
			.text('✗');

		// Combine arrows
		const combineArrows = svgEl.append('g').attr('class', 'combine-arrows').attr('opacity', 0);

		combineArrows.append('line')
			.attr('x1', startX + boxWidth / 2 - 30).attr('x2', startX + boxWidth / 2 - 30)
			.attr('y1', tx2Y + boxHeight + 5).attr('y2', combineY - 5)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		combineArrows.append('line')
			.attr('x1', startX + boxWidth / 2 + 30).attr('x2', startX + boxWidth / 2 + 30)
			.attr('y1', tx2Y + boxHeight + 5).attr('y2', combineY - 5)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		combineArrows.append('text')
			.attr('x', startX + boxWidth / 2).attr('y', tx2Y + boxHeight + 18)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Combine (average)');

		// Result
		const resultGroup = svgEl.append('g').attr('class', 'result-group').attr('opacity', 0);

		resultGroup.append('text')
			.attr('x', 15).attr('y', combineY + boxHeight / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('Result:');

		resultGroup.append('rect')
			.attr('x', startX).attr('y', combineY)
			.attr('width', boxWidth).attr('height', boxHeight)
			.attr('fill', '#8ec07c').attr('rx', 4);

		resultGroup.append('text')
			.attr('x', startX + boxWidth / 2).attr('y', combineY + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('DATA (errors cancelled out)');

		resultGroup.append('text')
			.attr('x', startX + boxWidth + 15).attr('y', combineY + boxHeight / 2 + 4)
			.attr('fill', '#8ec07c').attr('font-size', '10px')
			.text('✓');

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
