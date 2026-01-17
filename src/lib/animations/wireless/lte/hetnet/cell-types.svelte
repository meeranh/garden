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
	const width = 650;
	const height = 300;

	const titles = [
		'Cell Types in HetNets',
		'Macro Cell: Wide coverage (kilometers)',
		'Micro Cell: Urban streets (100s of meters)',
		'Pico Cell: Buildings (tens of meters)',
		'Femto Cell: Single room'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.macro-cell').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0.2);
		svgEl.select('.macro-highlight').transition().duration(400).attr('opacity', step === 1 ? 1 : 0);

		svgEl.select('.micro-cell').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0.2);
		svgEl.select('.micro-highlight').transition().duration(400).attr('opacity', step === 2 ? 1 : 0);

		svgEl.select('.pico-cell').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0.2);
		svgEl.select('.pico-highlight').transition().duration(400).attr('opacity', step === 3 ? 1 : 0);

		svgEl.select('.femto-cell').transition().duration(400).attr('opacity', step >= 4 ? 1 : 0.2);
		svgEl.select('.femto-highlight').transition().duration(400).attr('opacity', step === 4 ? 1 : 0);
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

	function drawTower(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, scale: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y}) scale(${scale})`);
		t.append('path').attr('d', 'M0,-50 L-8,0 L8,0 Z').attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
		t.append('line').attr('x1', -5).attr('y1', -12).attr('x2', 5).attr('y2', -12).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', -4).attr('y1', -25).attr('x2', 4).attr('y2', -25).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', -2).attr('y1', -38).attr('x2', 2).attr('y2', -38).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', 0).attr('y1', -50).attr('x2', 0).attr('y2', -60).attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -62).attr('r', 3).attr('fill', color);
	}

	function drawSmallCell(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('rect').attr('x', -8).attr('y', -20).attr('width', 16).attr('height', 20).attr('fill', color).attr('fill-opacity', 0.3).attr('stroke', color).attr('stroke-width', 2).attr('rx', 2);
		t.append('line').attr('x1', 0).attr('y1', -20).attr('x2', 0).attr('y2', -30).attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -32).attr('r', 3).attr('fill', color);
	}

	function drawHomeRouter(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('rect').attr('x', -12).attr('y', -8).attr('width', 24).attr('height', 12).attr('fill', color).attr('fill-opacity', 0.3).attr('stroke', color).attr('stroke-width', 2).attr('rx', 2);
		t.append('line').attr('x1', -5).attr('y1', -8).attr('x2', -5).attr('y2', -18).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', 5).attr('y1', -8).attr('x2', 5).attr('y2', -15).attr('stroke', color).attr('stroke-width', 1.5);
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

		const baseY = 220;

		// Ground line
		svgEl.append('line')
			.attr('x1', 20).attr('y1', baseY)
			.attr('x2', width - 20).attr('y2', baseY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4');

		// ===== MACRO CELL =====
		const macroX = 100;
		const macroCell = svgEl.append('g').attr('class', 'macro-cell').attr('opacity', 0.2);

		// Coverage circle (large)
		macroCell.append('circle')
			.attr('cx', macroX).attr('cy', baseY - 60)
			.attr('r', 100)
			.attr('fill', '#8ec07c')
			.attr('fill-opacity', 0.15)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4');

		drawTower(macroCell, macroX, baseY, 1, '#8ec07c');

		macroCell.append('text')
			.attr('x', macroX).attr('y', 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Macro');

		macroCell.append('text')
			.attr('x', macroX).attr('y', 53)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Kilometers');

		svgEl.append('circle')
			.attr('class', 'macro-highlight')
			.attr('cx', macroX).attr('cy', baseY - 60)
			.attr('r', 105)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// ===== MICRO CELL =====
		const microX = 270;
		const microCell = svgEl.append('g').attr('class', 'micro-cell').attr('opacity', 0.2);

		microCell.append('circle')
			.attr('cx', microX).attr('cy', baseY - 40)
			.attr('r', 60)
			.attr('fill', '#83a598')
			.attr('fill-opacity', 0.15)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4');

		drawTower(microCell, microX, baseY, 0.7, '#83a598');

		microCell.append('text')
			.attr('x', microX).attr('y', 95)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Micro');

		microCell.append('text')
			.attr('x', microX).attr('y', 108)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('100s of meters');

		svgEl.append('circle')
			.attr('class', 'micro-highlight')
			.attr('cx', microX).attr('cy', baseY - 40)
			.attr('r', 65)
			.attr('fill', 'none')
			.attr('stroke', '#83a598')
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// ===== PICO CELL =====
		const picoX = 420;
		const picoCell = svgEl.append('g').attr('class', 'pico-cell').attr('opacity', 0.2);

		picoCell.append('circle')
			.attr('cx', picoX).attr('cy', baseY - 25)
			.attr('r', 40)
			.attr('fill', '#fabd2f')
			.attr('fill-opacity', 0.15)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4');

		drawSmallCell(picoCell, picoX, baseY, '#fabd2f');

		picoCell.append('text')
			.attr('x', picoX).attr('y', 130)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Pico');

		picoCell.append('text')
			.attr('x', picoX).attr('y', 143)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('10s of meters');

		svgEl.append('circle')
			.attr('class', 'pico-highlight')
			.attr('cx', picoX).attr('cy', baseY - 25)
			.attr('r', 45)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// ===== FEMTO CELL =====
		const femtoX = 555;
		const femtoCell = svgEl.append('g').attr('class', 'femto-cell').attr('opacity', 0.2);

		femtoCell.append('circle')
			.attr('cx', femtoX).attr('cy', baseY - 15)
			.attr('r', 25)
			.attr('fill', '#d3869b')
			.attr('fill-opacity', 0.15)
			.attr('stroke', '#d3869b')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4');

		drawHomeRouter(femtoCell, femtoX, baseY - 5, '#d3869b');

		femtoCell.append('text')
			.attr('x', femtoX).attr('y', 155)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Femto');

		femtoCell.append('text')
			.attr('x', femtoX).attr('y', 168)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('One room');

		svgEl.append('circle')
			.attr('class', 'femto-highlight')
			.attr('cx', femtoX).attr('cy', baseY - 15)
			.attr('r', 30)
			.attr('fill', 'none')
			.attr('stroke', '#d3869b')
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// Size comparison label
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('← Larger coverage                    More capacity →');

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
