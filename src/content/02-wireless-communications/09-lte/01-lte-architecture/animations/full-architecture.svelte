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
		'Complete LTE Architecture',
		'Data Plane: UE → eNodeB → S-GW → P-GW → Internet',
		'Control Plane: MME manages everything',
		'The complete picture'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.data-path')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.control-path')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.legend')
			.transition().duration(400)
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
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		const dataY = 160;
		const controlY = 70;

		// ===== Control Plane Nodes =====
		// MME
		svgEl.append('rect')
			.attr('x', 200).attr('y', controlY - 20)
			.attr('width', 70).attr('height', 40)
			.attr('fill', '#d3869b').attr('fill-opacity', 0.3)
			.attr('stroke', '#d3869b').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 235).attr('y', controlY + 5)
			.attr('text-anchor', 'middle').attr('fill', '#d3869b')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('MME');

		// HSS
		svgEl.append('rect')
			.attr('x', 350).attr('y', controlY - 20)
			.attr('width', 70).attr('height', 40)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.3)
			.attr('stroke', '#fb4934').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 385).attr('y', controlY + 5)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('HSS');

		// ===== Data Plane Nodes =====
		// UE
		svgEl.append('rect')
			.attr('x', 30).attr('y', dataY - 20)
			.attr('width', 50).attr('height', 40)
			.attr('fill', '#83a598').attr('fill-opacity', 0.3)
			.attr('stroke', '#83a598').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 55).attr('y', dataY + 5)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('UE');

		// eNodeB
		svgEl.append('rect')
			.attr('x', 120).attr('y', dataY - 20)
			.attr('width', 70).attr('height', 40)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.3)
			.attr('stroke', '#8ec07c').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 155).attr('y', dataY + 5)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('eNodeB');

		// S-GW
		svgEl.append('rect')
			.attr('x', 250).attr('y', dataY - 20)
			.attr('width', 70).attr('height', 40)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.3)
			.attr('stroke', '#fabd2f').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 285).attr('y', dataY + 5)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('S-GW');

		// P-GW
		svgEl.append('rect')
			.attr('x', 380).attr('y', dataY - 20)
			.attr('width', 70).attr('height', 40)
			.attr('fill', '#fe8019').attr('fill-opacity', 0.3)
			.attr('stroke', '#fe8019').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 415).attr('y', dataY + 5)
			.attr('text-anchor', 'middle').attr('fill', '#fe8019')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('P-GW');

		// Internet
		svgEl.append('ellipse')
			.attr('cx', 540).attr('cy', dataY)
			.attr('rx', 45).attr('ry', 25)
			.attr('fill', colors.fgMuted).attr('fill-opacity', 0.1)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);
		svgEl.append('text')
			.attr('x', 540).attr('y', dataY + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Internet');

		// ===== Data Path =====
		const dataPath = svgEl.append('g').attr('class', 'data-path').attr('opacity', 0);

		// Data path line
		dataPath.append('line')
			.attr('x1', 80).attr('y1', dataY)
			.attr('x2', 120).attr('y2', dataY)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3);
		dataPath.append('line')
			.attr('x1', 190).attr('y1', dataY)
			.attr('x2', 250).attr('y2', dataY)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3);
		dataPath.append('line')
			.attr('x1', 320).attr('y1', dataY)
			.attr('x2', 380).attr('y2', dataY)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3);
		dataPath.append('line')
			.attr('x1', 450).attr('y1', dataY)
			.attr('x2', 495).attr('y2', dataY)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3)
			.attr('marker-end', 'url(#arrowData)');

		dataPath.append('text')
			.attr('x', width / 2).attr('y', dataY + 35)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('Data Plane');

		// ===== Control Path =====
		const controlPath = svgEl.append('g').attr('class', 'control-path').attr('opacity', 0);

		// MME to HSS
		controlPath.append('line')
			.attr('x1', 270).attr('y1', controlY)
			.attr('x2', 350).attr('y2', controlY)
			.attr('stroke', '#d3869b').attr('stroke-width', 2);

		// MME to eNodeB
		controlPath.append('line')
			.attr('x1', 200).attr('y1', controlY + 10)
			.attr('x2', 175).attr('y2', dataY - 20)
			.attr('stroke', '#d3869b').attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,2');

		// MME to S-GW
		controlPath.append('line')
			.attr('x1', 250).attr('y1', controlY + 20)
			.attr('x2', 270).attr('y2', dataY - 20)
			.attr('stroke', '#d3869b').attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,2');

		controlPath.append('text')
			.attr('x', 310).attr('y', controlY - 30)
			.attr('text-anchor', 'middle').attr('fill', '#d3869b')
			.attr('font-size', '9px')
			.text('Control Plane');

		// ===== Legend =====
		const legend = svgEl.append('g').attr('class', 'legend').attr('opacity', 0);

		legend.append('rect')
			.attr('x', 20).attr('y', height - 55)
			.attr('width', 180).attr('height', 45)
			.attr('fill', colors.bg)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('rx', 4);

		legend.append('line')
			.attr('x1', 30).attr('y1', height - 40)
			.attr('x2', 60).attr('y2', height - 40)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3);
		legend.append('text')
			.attr('x', 70).attr('y', height - 36)
			.attr('fill', colors.fg).attr('font-size', '9px')
			.text('Data path');

		legend.append('line')
			.attr('x1', 30).attr('y1', height - 22)
			.attr('x2', 60).attr('y2', height - 22)
			.attr('stroke', '#d3869b').attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,2');
		legend.append('text')
			.attr('x', 70).attr('y', height - 18)
			.attr('fill', colors.fg).attr('font-size', '9px')
			.text('Control path');

		// Arrow markers
		const defs = svgEl.append('defs');
		defs.append('marker')
			.attr('id', 'arrowData')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5).attr('refY', 5)
			.attr('markerWidth', 4).attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', '#8ec07c');

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
