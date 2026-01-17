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
	const width = 520;
	const height = 320;

	// OLSR (left side)
	const olsrX = 40, olsrY = 55, olsrW = 140, olsrH = 195;

	// Modular pieces (right side)
	const modX = 300, modW = 170;
	const nhdpY = 55, nhdpH = 95;
	const coreH = 95;
	const gap = 30; // Gap between pieces when separated
	const coreY_start = nhdpY + nhdpH + gap;
	const coreY_connected = nhdpY + nhdpH + 8;

	const titles = [
		'OLSR: One monolithic protocol',
		'OLSRv2: Split into two modules',
		'NHDP handles neighbor discovery',
		'OLSRv2 Core handles routing',
		'The modules connect together',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// OLSR
		svgEl.select('.olsr-group')
			.transition().duration(400)
			.attr('opacity', step === 0 ? 1 : 0.2);

		// Arrow
		svgEl.select('.arrow-text')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 0.6 : 0);

		// Modules visibility
		const show = step >= 1;
		svgEl.select('.nhdp-group')
			.transition().duration(400)
			.attr('opacity', show ? 1 : 0);
		svgEl.select('.core-group')
			.transition().duration(400)
			.attr('opacity', show ? 1 : 0);

		// Highlighting
		svgEl.select('.nhdp-rect')
			.transition().duration(400)
			.attr('stroke-width', step === 2 ? 3 : 2)
			.attr('fill-opacity', step === 2 ? 0.3 : 0.15);
		svgEl.select('.core-rect')
			.transition().duration(400)
			.attr('stroke-width', step === 3 ? 3 : 2)
			.attr('fill-opacity', step === 3 ? 0.3 : 0.15);

		// Connect animation
		const coreY = step >= 4 ? coreY_connected : coreY_start;
		svgEl.select('.core-rect')
			.transition().duration(500).ease(d3.easeCubicOut)
			.attr('y', coreY);
		svgEl.select('.core-title')
			.transition().duration(500).ease(d3.easeCubicOut)
			.attr('y', coreY + 25);
		svgEl.selectAll('.core-item').each(function(d, i) {
			d3.select(this)
				.transition().duration(500).ease(d3.easeCubicOut)
				.attr('y', coreY + 48 + i * 17);
		});

		// Connector tab
		svgEl.select('.connector-tab')
			.transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0)
			.attr('y', nhdpY + nhdpH - 2);
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
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// ========== LEFT: OLSR ==========
		const olsrG = svgEl.append('g').attr('class', 'olsr-group');

		olsrG.append('rect')
			.attr('x', olsrX).attr('y', olsrY)
			.attr('width', olsrW).attr('height', olsrH)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.15)
			.attr('stroke', '#fb4934').attr('stroke-width', 2)
			.attr('rx', 6);

		olsrG.append('text')
			.attr('x', olsrX + olsrW / 2).attr('y', olsrY + 25)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('OLSR');

		['HELLO', 'Neighbors', 'MPR Select', 'TC Messages', 'Routing'].forEach((txt, i) => {
			olsrG.append('text')
				.attr('x', olsrX + olsrW / 2).attr('y', olsrY + 55 + i * 26)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(txt);
		});

		olsrG.append('text')
			.attr('x', olsrX + olsrW / 2).attr('y', olsrY + olsrH + 18)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('All in one block');

		// Arrow
		svgEl.append('text')
			.attr('class', 'arrow-text')
			.attr('x', 220).attr('y', height / 2)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '24px')
			.attr('opacity', 0)
			.text('→');

		// ========== RIGHT: NHDP ==========
		const nhdpG = svgEl.append('g').attr('class', 'nhdp-group').attr('opacity', 0);

		nhdpG.append('rect')
			.attr('class', 'nhdp-rect')
			.attr('x', modX).attr('y', nhdpY)
			.attr('width', modW).attr('height', nhdpH)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.15)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 6);

		nhdpG.append('text')
			.attr('x', modX + modW / 2).attr('y', nhdpY + 25)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text('NHDP');

		['HELLO Messages', 'Neighbor Discovery', 'MPR Selection'].forEach((txt, i) => {
			nhdpG.append('text')
				.attr('x', modX + modW / 2).attr('y', nhdpY + 48 + i * 17)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(txt);
		});

		// Small tab connector (shows they plug together)
		nhdpG.append('rect')
			.attr('class', 'connector-tab')
			.attr('x', modX + modW / 2 - 15).attr('y', nhdpY + nhdpH - 2)
			.attr('width', 30).attr('height', 12)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.4)
			.attr('stroke', '#fabd2f').attr('stroke-width', 1)
			.attr('rx', 3)
			.attr('opacity', 0);

		// ========== RIGHT: Core ==========
		const coreG = svgEl.append('g').attr('class', 'core-group').attr('opacity', 0);

		coreG.append('rect')
			.attr('class', 'core-rect')
			.attr('x', modX).attr('y', coreY_start)
			.attr('width', modW).attr('height', coreH)
			.attr('fill', '#83a598').attr('fill-opacity', 0.15)
			.attr('stroke', '#83a598').attr('stroke-width', 2)
			.attr('rx', 6);

		coreG.append('text')
			.attr('class', 'core-title')
			.attr('x', modX + modW / 2).attr('y', coreY_start + 25)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text('OLSRv2 Core');

		['TC Messages', 'Topology Map', 'Route Calculation'].forEach((txt, i) => {
			coreG.append('text')
				.attr('class', 'core-item')
				.attr('x', modX + modW / 2).attr('y', coreY_start + 48 + i * 17)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(txt);
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
