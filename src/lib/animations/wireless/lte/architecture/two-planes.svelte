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
	const width = 580;
	const height = 280;

	const titles = [
		'LTE separates traffic into two planes',
		'Data Plane: Your actual content',
		'Control Plane: Network management',
		'Both planes work together'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.data-plane')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0.2);

		svgEl.select('.data-packets')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.control-plane')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0.2);

		svgEl.select('.control-signals')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.summary-group')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);
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
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		const planeY = 70;
		const planeH = 70;
		const planeW = 450;
		const planeX = (width - planeW) / 2;

		// Data Plane
		const dataPlane = svgEl.append('g').attr('class', 'data-plane').attr('opacity', 0.2);

		dataPlane.append('rect')
			.attr('x', planeX).attr('y', planeY)
			.attr('width', planeW).attr('height', planeH)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.2)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 6);

		dataPlane.append('text')
			.attr('x', planeX + 15).attr('y', planeY + 25)
			.attr('fill', '#8ec07c')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('DATA PLANE');

		dataPlane.append('text')
			.attr('x', planeX + 15).attr('y', planeY + 45)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Videos, web pages, files, apps...');

		// Data packets animation
		const dataPackets = svgEl.append('g').attr('class', 'data-packets').attr('opacity', 0);
		const packetColors = ['#fb4934', '#fabd2f', '#8ec07c', '#83a598'];
		for (let i = 0; i < 4; i++) {
			dataPackets.append('rect')
				.attr('x', planeX + 250 + i * 45).attr('y', planeY + 20)
				.attr('width', 35).attr('height', 30)
				.attr('fill', packetColors[i]).attr('fill-opacity', 0.6)
				.attr('stroke', packetColors[i]).attr('stroke-width', 1)
				.attr('rx', 3);
			dataPackets.append('text')
				.attr('x', planeX + 267 + i * 45).attr('y', planeY + 40)
				.attr('text-anchor', 'middle').attr('fill', '#fff')
				.attr('font-size', '8px')
				.text(['VIDEO', 'WEB', 'FILE', 'APP'][i]);
		}

		// Control Plane
		const controlY = planeY + planeH + 20;
		const controlPlane = svgEl.append('g').attr('class', 'control-plane').attr('opacity', 0.2);

		controlPlane.append('rect')
			.attr('x', planeX).attr('y', controlY)
			.attr('width', planeW).attr('height', planeH)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.2)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('rx', 6);

		controlPlane.append('text')
			.attr('x', planeX + 15).attr('y', controlY + 25)
			.attr('fill', '#fabd2f')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('CONTROL PLANE');

		controlPlane.append('text')
			.attr('x', planeX + 15).attr('y', controlY + 45)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Authentication, mobility, sessions...');

		// Control signals
		const controlSignals = svgEl.append('g').attr('class', 'control-signals').attr('opacity', 0);
		const signalLabels = ['AUTH', 'MOVE', 'SETUP', 'KEY'];
		for (let i = 0; i < 4; i++) {
			controlSignals.append('rect')
				.attr('x', planeX + 250 + i * 45).attr('y', controlY + 20)
				.attr('width', 35).attr('height', 30)
				.attr('fill', '#fabd2f').attr('fill-opacity', 0.4)
				.attr('stroke', '#fabd2f').attr('stroke-width', 1)
				.attr('rx', 3);
			controlSignals.append('text')
				.attr('x', planeX + 267 + i * 45).attr('y', controlY + 40)
				.attr('text-anchor', 'middle').attr('fill', '#fff')
				.attr('font-size', '8px')
				.text(signalLabels[i]);
		}

		// Summary
		const summaryG = svgEl.append('g').attr('class', 'summary-group').attr('opacity', 0);

		summaryG.append('rect')
			.attr('x', width / 2 - 140).attr('y', height - 45)
			.attr('width', 280).attr('height', 32)
			.attr('fill', colors.bg)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('rx', 4);

		summaryG.append('text')
			.attr('x', width / 2).attr('y', height - 24)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('Separation allows independent scaling & optimization');

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
