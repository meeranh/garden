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
	const width = 550;
	const height = 300;

	const titles = [
		'Phone needs to send AND receive simultaneously',
		'Uplink: Phone → Tower (890-915 MHz)',
		'Downlink: Tower → Phone (935-960 MHz)',
		'FDD: Two frequencies, full duplex communication',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Uplink
		svgEl.select('.uplink-group')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// Downlink
		svgEl.select('.downlink-group')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Gap label
		svgEl.select('.gap-label')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// Summary
		svgEl.select('.summary-group')
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
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		const phoneX = 80, towerX = 470;
		const centerY = 150;

		// Phone icon
		svgEl.append('rect')
			.attr('x', phoneX - 20).attr('y', centerY - 35)
			.attr('width', 40).attr('height', 70)
			.attr('fill', colors.fgMuted).attr('fill-opacity', 0.3)
			.attr('stroke', colors.fg).attr('stroke-width', 2)
			.attr('rx', 6);

		svgEl.append('rect')
			.attr('x', phoneX - 14).attr('y', centerY - 25)
			.attr('width', 28).attr('height', 40)
			.attr('fill', '#83a598').attr('fill-opacity', 0.5);

		svgEl.append('text')
			.attr('x', phoneX).attr('y', centerY + 55)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('Phone');

		// Tower icon
		svgEl.append('rect')
			.attr('x', towerX - 4).attr('y', centerY - 50)
			.attr('width', 8).attr('height', 60)
			.attr('fill', colors.fg);

		svgEl.append('rect')
			.attr('x', towerX - 15).attr('y', centerY + 10)
			.attr('width', 30).attr('height', 8)
			.attr('fill', colors.fg);

		svgEl.append('line')
			.attr('x1', towerX - 12).attr('y1', centerY - 20)
			.attr('x2', towerX + 12).attr('y2', centerY - 20)
			.attr('stroke', colors.fg).attr('stroke-width', 2);

		svgEl.append('line')
			.attr('x1', towerX - 8).attr('y1', centerY - 35)
			.attr('x2', towerX + 8).attr('y2', centerY - 35)
			.attr('stroke', colors.fg).attr('stroke-width', 2);

		svgEl.append('line')
			.attr('x1', towerX).attr('y1', centerY - 60)
			.attr('x2', towerX).attr('y2', centerY - 50)
			.attr('stroke', colors.fg).attr('stroke-width', 3);

		svgEl.append('text')
			.attr('x', towerX).attr('y', centerY + 55)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('Tower');

		// ========== Uplink (Phone → Tower) ==========
		const uplinkG = svgEl.append('g').attr('class', 'uplink-group').attr('opacity', 0);

		// Arrow
		uplinkG.append('line')
			.attr('x1', phoneX + 30).attr('y1', centerY - 20)
			.attr('x2', towerX - 25).attr('y2', centerY - 20)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3)
			.attr('marker-end', 'url(#arrowUp)');

		// Label
		uplinkG.append('rect')
			.attr('x', width / 2 - 60).attr('y', centerY - 50)
			.attr('width', 120).attr('height', 22)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.2)
			.attr('stroke', '#8ec07c').attr('stroke-width', 1)
			.attr('rx', 4);

		uplinkG.append('text')
			.attr('x', width / 2).attr('y', centerY - 35)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('UPLINK (890-915)');

		// ========== Downlink (Tower → Phone) ==========
		const downlinkG = svgEl.append('g').attr('class', 'downlink-group').attr('opacity', 0);

		// Arrow
		downlinkG.append('line')
			.attr('x1', towerX - 25).attr('y1', centerY + 20)
			.attr('x2', phoneX + 30).attr('y2', centerY + 20)
			.attr('stroke', '#fb4934').attr('stroke-width', 3)
			.attr('marker-end', 'url(#arrowDown)');

		// Label
		downlinkG.append('rect')
			.attr('x', width / 2 - 65).attr('y', centerY + 28)
			.attr('width', 130).attr('height', 22)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.2)
			.attr('stroke', '#fb4934').attr('stroke-width', 1)
			.attr('rx', 4);

		downlinkG.append('text')
			.attr('x', width / 2).attr('y', centerY + 43)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('DOWNLINK (935-960)');

		// Gap label
		svgEl.append('text')
			.attr('class', 'gap-label')
			.attr('x', width / 2).attr('y', centerY)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('45 MHz gap');

		// Summary
		const summaryG = svgEl.append('g').attr('class', 'summary-group').attr('opacity', 0);

		summaryG.append('rect')
			.attr('x', width / 2 - 120).attr('y', height - 55)
			.attr('width', 240).attr('height', 35)
			.attr('fill', colors.bg)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('rx', 4);

		summaryG.append('text')
			.attr('x', width / 2).attr('y', height - 35)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('Different frequencies = no interference');

		// Arrow markers
		const defs = svgEl.append('defs');

		defs.append('marker')
			.attr('id', 'arrowUp')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5).attr('refY', 5)
			.attr('markerWidth', 4).attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', '#8ec07c');

		defs.append('marker')
			.attr('id', 'arrowDown')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5).attr('refY', 5)
			.attr('markerWidth', 4).attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', '#fb4934');

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
