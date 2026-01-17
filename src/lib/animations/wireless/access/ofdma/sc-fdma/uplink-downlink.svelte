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

	const maxStep = 1;
	const width = 380;
	const height = 150;

	const towerX = 80;
	const phoneX = 300;
	const centerY = 75;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.base-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.downlink-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.uplink-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);
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

		// Arrow markers
		const defs = svgEl.append('defs');

		defs.append('marker')
			.attr('id', 'downArrow')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 5)
			.attr('markerHeight', 5)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', '#83a598');

		defs.append('marker')
			.attr('id', 'upArrow')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 5)
			.attr('markerHeight', 5)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', '#fabd2f');

		// Base group (tower and phone)
		const baseGroup = svgEl.append('g').attr('class', 'base-group').attr('opacity', 0);

		// Tower
		baseGroup.append('rect')
			.attr('x', towerX - 8)
			.attr('y', centerY - 35)
			.attr('width', 16)
			.attr('height', 50)
			.attr('fill', colors.fgMuted)
			.attr('rx', 2);

		// Tower antenna
		baseGroup.append('line')
			.attr('x1', towerX)
			.attr('x2', towerX)
			.attr('y1', centerY - 35)
			.attr('y2', centerY - 50)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 3);

		baseGroup.append('line')
			.attr('x1', towerX - 12)
			.attr('x2', towerX + 12)
			.attr('y1', centerY - 45)
			.attr('y2', centerY - 45)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2);

		baseGroup.append('text')
			.attr('x', towerX)
			.attr('y', centerY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Tower');

		baseGroup.append('text')
			.attr('x', towerX)
			.attr('y', centerY + 42)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(has power)');

		// Phone
		baseGroup.append('rect')
			.attr('x', phoneX - 12)
			.attr('y', centerY - 20)
			.attr('width', 24)
			.attr('height', 40)
			.attr('fill', colors.fgMuted)
			.attr('rx', 4);

		baseGroup.append('circle')
			.attr('cx', phoneX)
			.attr('cy', centerY + 12)
			.attr('r', 4)
			.attr('fill', colors.bg);

		baseGroup.append('text')
			.attr('x', phoneX)
			.attr('y', centerY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Phone');

		baseGroup.append('text')
			.attr('x', phoneX)
			.attr('y', centerY + 47)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(battery)');

		// Downlink arrow (OFDMA)
		const downlinkGroup = svgEl.append('g').attr('class', 'downlink-group').attr('opacity', 0);

		downlinkGroup.append('line')
			.attr('x1', towerX + 25)
			.attr('x2', phoneX - 25)
			.attr('y1', centerY - 15)
			.attr('y2', centerY - 15)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 3)
			.attr('marker-end', 'url(#downArrow)');

		downlinkGroup.append('text')
			.attr('x', (towerX + phoneX) / 2)
			.attr('y', centerY - 25)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Downlink: OFDMA');

		// Uplink arrow (SC-FDMA)
		const uplinkGroup = svgEl.append('g').attr('class', 'uplink-group').attr('opacity', 0);

		uplinkGroup.append('line')
			.attr('x1', phoneX - 25)
			.attr('x2', towerX + 25)
			.attr('y1', centerY + 10)
			.attr('y2', centerY + 10)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 3)
			.attr('marker-end', 'url(#upArrow)');

		uplinkGroup.append('text')
			.attr('x', (towerX + phoneX) / 2)
			.attr('y', centerY + 25)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Uplink: SC-FDMA');

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
