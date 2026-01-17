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

	const tx1Y = 40;
	const tx2Y = 90;
	const resultY = 145;
	const startX = 90;
	const dataWidth = 90;
	const parityWidth = 90;
	const boxHeight = 28;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.tx1-group').attr('opacity', step >= 0 ? 1 : 0);
		svgEl.select('.tx2-group').attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.option-group').attr('opacity', step >= 2 ? 1 : 0);
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

		// First transmission: Data + Full Parity (self-decodable)
		const tx1Group = svgEl.append('g').attr('class', 'tx1-group').attr('opacity', 0);

		tx1Group.append('text')
			.attr('x', 15).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('TX 1:');

		// Data
		tx1Group.append('rect')
			.attr('x', startX).attr('y', tx1Y)
			.attr('width', dataWidth).attr('height', boxHeight)
			.attr('fill', '#83a598').attr('rx', 4);
		tx1Group.append('text')
			.attr('x', startX + dataWidth / 2).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('DATA');

		// Full Parity
		tx1Group.append('rect')
			.attr('x', startX + dataWidth + 5).attr('y', tx1Y)
			.attr('width', parityWidth).attr('height', boxHeight)
			.attr('fill', '#fabd2f').attr('rx', 4);
		tx1Group.append('text')
			.attr('x', startX + dataWidth + 5 + parityWidth / 2).attr('y', tx1Y + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Full Parity');

		// Self-decodable indicator
		tx1Group.append('rect')
			.attr('x', startX + dataWidth + parityWidth + 20).attr('y', tx1Y + 2)
			.attr('width', 75).attr('height', boxHeight - 4)
			.attr('fill', 'none').attr('stroke', '#8ec07c')
			.attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2').attr('rx', 3);
		tx1Group.append('text')
			.attr('x', startX + dataWidth + parityWidth + 57).attr('y', tx1Y + boxHeight / 2 + 3)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '8px')
			.text('Can decode');
		tx1Group.append('text')
			.attr('x', startX + dataWidth + parityWidth + 57).attr('y', tx1Y + boxHeight / 2 + 12)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '8px')
			.text('alone!');

		// Second transmission: Also self-decodable
		const tx2Group = svgEl.append('g').attr('class', 'tx2-group').attr('opacity', 0);

		tx2Group.append('text')
			.attr('x', 15).attr('y', tx2Y + boxHeight / 2 + 4)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('TX 2:');

		// Data
		tx2Group.append('rect')
			.attr('x', startX).attr('y', tx2Y)
			.attr('width', dataWidth).attr('height', boxHeight)
			.attr('fill', '#83a598').attr('rx', 4);
		tx2Group.append('text')
			.attr('x', startX + dataWidth / 2).attr('y', tx2Y + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('DATA');

		// Different Full Parity
		tx2Group.append('rect')
			.attr('x', startX + dataWidth + 5).attr('y', tx2Y)
			.attr('width', parityWidth).attr('height', boxHeight)
			.attr('fill', '#d3869b').attr('rx', 4);
		tx2Group.append('text')
			.attr('x', startX + dataWidth + 5 + parityWidth / 2).attr('y', tx2Y + boxHeight / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Full Parity');

		// Self-decodable indicator
		tx2Group.append('rect')
			.attr('x', startX + dataWidth + parityWidth + 20).attr('y', tx2Y + 2)
			.attr('width', 75).attr('height', boxHeight - 4)
			.attr('fill', 'none').attr('stroke', '#8ec07c')
			.attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2').attr('rx', 3);
		tx2Group.append('text')
			.attr('x', startX + dataWidth + parityWidth + 57).attr('y', tx2Y + boxHeight / 2 + 3)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '8px')
			.text('Can decode');
		tx2Group.append('text')
			.attr('x', startX + dataWidth + parityWidth + 57).attr('y', tx2Y + boxHeight / 2 + 12)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '8px')
			.text('alone!');

		// Option indicators
		const optionGroup = svgEl.append('g').attr('class', 'option-group').attr('opacity', 0);

		optionGroup.append('text')
			.attr('x', width / 2).attr('y', tx2Y + boxHeight + 18)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Either TX can decode alone, OR combine for better odds');

		// Result
		const resultGroup = svgEl.append('g').attr('class', 'result-group').attr('opacity', 0);

		resultGroup.append('text')
			.attr('x', width / 2).attr('y', resultY + 10)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('More overhead, but simpler receiver logic');

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
