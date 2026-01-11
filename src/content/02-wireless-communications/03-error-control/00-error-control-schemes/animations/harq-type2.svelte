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
	const height = 180;

	const tx1Y = 45;
	const tx2Y = 90;
	const resultY = 140;
	const startX = 90;
	const dataWidth = 120;
	const parityWidth = 80;
	const boxHeight = 28;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.tx1-group').attr('opacity', step >= 0 ? 1 : 0);
		svgEl.select('.tx2-group').attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.combine-group').attr('opacity', step >= 2 ? 1 : 0);
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

		// First transmission: Data + Parity A
		const tx1Group = svgEl.append('g').attr('class', 'tx1-group').attr('opacity', 0);

		tx1Group.append('text')
			.attr('x', 15).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('TX 1:');

		// Data block
		tx1Group.append('rect')
			.attr('x', startX).attr('y', tx1Y)
			.attr('width', dataWidth).attr('height', boxHeight)
			.attr('fill', '#83a598').attr('rx', 4);
		tx1Group.append('text')
			.attr('x', startX + dataWidth / 2).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('DATA');

		// Parity A
		tx1Group.append('rect')
			.attr('x', startX + dataWidth + 5).attr('y', tx1Y)
			.attr('width', parityWidth).attr('height', boxHeight)
			.attr('fill', '#fabd2f').attr('rx', 4);
		tx1Group.append('text')
			.attr('x', startX + dataWidth + 5 + parityWidth / 2).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Parity A');

		tx1Group.append('text')
			.attr('x', startX + dataWidth + parityWidth + 25).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('fill', '#fb4934').attr('font-size', '10px')
			.text('✗ Failed');

		// Second transmission: Different parity (B)
		const tx2Group = svgEl.append('g').attr('class', 'tx2-group').attr('opacity', 0);

		tx2Group.append('text')
			.attr('x', 15).attr('y', tx2Y + boxHeight / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('TX 2:');

		// Parity B (different!)
		tx2Group.append('rect')
			.attr('x', startX + dataWidth + 5).attr('y', tx2Y)
			.attr('width', parityWidth).attr('height', boxHeight)
			.attr('fill', '#d3869b').attr('rx', 4);
		tx2Group.append('text')
			.attr('x', startX + dataWidth + 5 + parityWidth / 2).attr('y', tx2Y + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Parity B');

		tx2Group.append('text')
			.attr('x', startX + 40).attr('y', tx2Y + boxHeight / 2 + 4)
			.attr('fill', '#d3869b').attr('font-size', '9px')
			.text('(NEW info!)');

		// Combine indicator
		const combineGroup = svgEl.append('g').attr('class', 'combine-group').attr('opacity', 0);

		combineGroup.append('line')
			.attr('x1', startX + dataWidth + parityWidth / 2 + 5).attr('x2', startX + dataWidth + parityWidth / 2 + 5)
			.attr('y1', tx2Y + boxHeight + 3).attr('y2', resultY - 3)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);

		combineGroup.append('text')
			.attr('x', startX + dataWidth + parityWidth + 40).attr('y', (tx2Y + boxHeight + resultY) / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '9px')
			.text('Combine');

		// Result: More redundancy
		const resultGroup = svgEl.append('g').attr('class', 'result-group').attr('opacity', 0);

		resultGroup.append('text')
			.attr('x', 15).attr('y', resultY + boxHeight / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('Total:');

		// Data
		resultGroup.append('rect')
			.attr('x', startX).attr('y', resultY)
			.attr('width', dataWidth).attr('height', boxHeight)
			.attr('fill', '#83a598').attr('rx', 4);
		resultGroup.append('text')
			.attr('x', startX + dataWidth / 2).attr('y', resultY + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('DATA');

		// Parity A
		resultGroup.append('rect')
			.attr('x', startX + dataWidth + 5).attr('y', resultY)
			.attr('width', parityWidth / 2 - 2).attr('height', boxHeight)
			.attr('fill', '#fabd2f').attr('rx', 2);
		resultGroup.append('text')
			.attr('x', startX + dataWidth + 5 + parityWidth / 4).attr('y', resultY + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '8px').attr('font-weight', 'bold')
			.text('A');

		// Parity B
		resultGroup.append('rect')
			.attr('x', startX + dataWidth + parityWidth / 2 + 7).attr('y', resultY)
			.attr('width', parityWidth / 2 - 2).attr('height', boxHeight)
			.attr('fill', '#d3869b').attr('rx', 2);
		resultGroup.append('text')
			.attr('x', startX + dataWidth + parityWidth / 2 + 7 + parityWidth / 4).attr('y', resultY + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '8px').attr('font-weight', 'bold')
			.text('B');

		resultGroup.append('text')
			.attr('x', startX + dataWidth + parityWidth + 25).attr('y', resultY + boxHeight / 2 + 4)
			.attr('fill', '#8ec07c').attr('font-size', '10px')
			.text('✓ Decode!');

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
