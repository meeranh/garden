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

	const maxStep = 2;
	const width = 620;
	const height = 280;

	const titles = [
		'Two Types of HetNets',
		'Intra-technology: Same tech, different sizes',
		'Inter-technology: Different techs together'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.intra-section').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0.3);
		svgEl.select('.intra-highlight').transition().duration(400).attr('opacity', step === 1 ? 1 : 0);

		svgEl.select('.inter-section').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0.3);
		svgEl.select('.inter-highlight').transition().duration(400).attr('opacity', step === 2 ? 1 : 0);
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

	function drawTower(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, scale: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y}) scale(${scale})`);
		t.append('path').attr('d', 'M0,-50 L-8,0 L8,0 Z').attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
		t.append('line').attr('x1', -5).attr('y1', -12).attr('x2', 5).attr('y2', -12).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', -4).attr('y1', -25).attr('x2', 4).attr('y2', -25).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', 0).attr('y1', -50).attr('x2', 0).attr('y2', -60).attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -62).attr('r', 3).attr('fill', color);
	}

	function drawSmallCell(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('rect').attr('x', -6).attr('y', -15).attr('width', 12).attr('height', 15).attr('fill', color).attr('fill-opacity', 0.3).attr('stroke', color).attr('stroke-width', 1.5).attr('rx', 2);
		t.append('line').attr('x1', 0).attr('y1', -15).attr('x2', 0).attr('y2', -22).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('circle').attr('cx', 0).attr('cy', -24).attr('r', 2).attr('fill', color);
	}

	function drawWifiRouter(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('rect').attr('x', -10).attr('y', -6).attr('width', 20).attr('height', 10).attr('fill', color).attr('fill-opacity', 0.3).attr('stroke', color).attr('stroke-width', 1.5).attr('rx', 2);
		// WiFi waves
		t.append('path').attr('d', 'M-6,-10 Q0,-18 6,-10').attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5);
		t.append('path').attr('d', 'M-4,-12 Q0,-17 4,-12').attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5);
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
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text(titles[0]);

		const boxWidth = 260;
		const leftX = 40;
		const rightX = 320;
		const topY = 50;
		const baseY = 180;

		// ===== INTRA-TECHNOLOGY (Left) =====
		const intraSection = svgEl.append('g').attr('class', 'intra-section').attr('opacity', 0.3);

		intraSection.append('text')
			.attr('x', leftX + boxWidth / 2).attr('y', topY)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('INTRA-TECHNOLOGY');

		// All same color (LTE)
		intraSection.append('rect')
			.attr('x', leftX).attr('y', topY + 10)
			.attr('width', boxWidth).attr('height', 160)
			.attr('fill', '#8ec07c')
			.attr('fill-opacity', 0.05)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);

		// LTE label
		intraSection.append('text')
			.attr('x', leftX + boxWidth / 2).attr('y', topY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('All LTE');

		// Big tower
		drawTower(intraSection, leftX + 70, baseY, 0.8, '#8ec07c');
		intraSection.append('text')
			.attr('x', leftX + 70).attr('y', baseY + 15)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('LTE Macro');

		// Small cells (same color)
		drawSmallCell(intraSection, leftX + 150, baseY - 10, '#8ec07c');
		intraSection.append('text')
			.attr('x', leftX + 150).attr('y', baseY + 15)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('LTE Pico');

		drawSmallCell(intraSection, leftX + 210, baseY - 10, '#8ec07c');
		intraSection.append('text')
			.attr('x', leftX + 210).attr('y', baseY + 15)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('LTE Pico');

		intraSection.append('text')
			.attr('x', leftX + boxWidth / 2).attr('y', topY + 195)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Same technology, different sizes');

		// Highlight
		svgEl.append('rect')
			.attr('class', 'intra-highlight')
			.attr('x', leftX - 5).attr('y', topY + 5)
			.attr('width', boxWidth + 10).attr('height', 185)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 3)
			.attr('rx', 10)
			.attr('opacity', 0);

		// ===== INTER-TECHNOLOGY (Right) =====
		const interSection = svgEl.append('g').attr('class', 'inter-section').attr('opacity', 0.3);

		interSection.append('text')
			.attr('x', rightX + boxWidth / 2).attr('y', topY)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('INTER-TECHNOLOGY');

		// Mixed box
		interSection.append('rect')
			.attr('x', rightX).attr('y', topY + 10)
			.attr('width', boxWidth).attr('height', 160)
			.attr('fill', colors.fgMuted)
			.attr('fill-opacity', 0.05)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);

		interSection.append('text')
			.attr('x', rightX + boxWidth / 2).attr('y', topY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Mixed Technologies');

		// LTE tower (green)
		drawTower(interSection, rightX + 70, baseY, 0.8, '#8ec07c');
		interSection.append('text')
			.attr('x', rightX + 70).attr('y', baseY + 15)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('LTE');

		// WiFi routers (different color - blue)
		drawWifiRouter(interSection, rightX + 150, baseY - 15, '#83a598');
		interSection.append('text')
			.attr('x', rightX + 150).attr('y', baseY + 15)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '9px')
			.text('WiFi');

		drawWifiRouter(interSection, rightX + 210, baseY - 15, '#83a598');
		interSection.append('text')
			.attr('x', rightX + 210).attr('y', baseY + 15)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '9px')
			.text('WiFi');

		interSection.append('text')
			.attr('x', rightX + boxWidth / 2).attr('y', topY + 195)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Different technologies together');

		// Highlight
		svgEl.append('rect')
			.attr('class', 'inter-highlight')
			.attr('x', rightX - 5).attr('y', topY + 5)
			.attr('width', boxWidth + 10).attr('height', 205)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 3)
			.attr('rx', 10)
			.attr('opacity', 0);

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
