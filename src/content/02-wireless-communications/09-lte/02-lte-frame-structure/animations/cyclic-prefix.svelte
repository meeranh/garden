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
	const height = 280;

	const titles = [
		'Cyclic Prefix: Normal vs Extended',
		'Normal CP: Short guard, more data (7 symbols)',
		'Extended CP: Long guard, less data (6 symbols)',
		'Choose based on cell size and environment'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.normal-cp').transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0.3);
		svgEl.select('.normal-highlight').transition().duration(400)
			.attr('opacity', step === 1 ? 1 : 0);

		svgEl.select('.extended-cp').transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0.3);
		svgEl.select('.extended-highlight').transition().duration(400)
			.attr('opacity', step === 2 ? 1 : 0);

		svgEl.select('.comparison').transition().duration(400)
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
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text(titles[0]);

		const startX = 50;
		const slotWidth = 520;
		const symHeight = 45;

		// ===== Normal CP (7 symbols) =====
		const normalY = 60;
		const normalCP = svgEl.append('g').attr('class', 'normal-cp').attr('opacity', 0.3);

		normalCP.append('text')
			.attr('x', startX).attr('y', normalY - 8)
			.attr('fill', '#8ec07c').attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Normal CP (1 slot = 0.5 ms)');

		const normalSymWidth = slotWidth / 7;
		const cpNormalWidth = 12; // Short CP

		for (let i = 0; i < 7; i++) {
			const x = startX + i * normalSymWidth;
			// CP portion
			normalCP.append('rect')
				.attr('x', x).attr('y', normalY)
				.attr('width', cpNormalWidth).attr('height', symHeight)
				.attr('fill', '#fb4934').attr('fill-opacity', 0.5)
				.attr('stroke', '#fb4934').attr('stroke-width', 1);
			// Symbol portion
			normalCP.append('rect')
				.attr('x', x + cpNormalWidth).attr('y', normalY)
				.attr('width', normalSymWidth - cpNormalWidth - 2).attr('height', symHeight)
				.attr('fill', '#8ec07c').attr('fill-opacity', 0.3)
				.attr('stroke', '#8ec07c').attr('stroke-width', 1);
			// Label
			normalCP.append('text')
				.attr('x', x + normalSymWidth / 2).attr('y', normalY + symHeight + 15)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '8px')
				.text(`Sym${i}`);
		}

		const normalHighlight = svgEl.append('g').attr('class', 'normal-highlight').attr('opacity', 0);
		normalHighlight.append('text')
			.attr('x', startX + slotWidth + 10).attr('y', normalY + 25)
			.attr('fill', '#8ec07c').attr('font-size', '10px')
			.text('7 symbols');
		normalHighlight.append('text')
			.attr('x', startX + slotWidth + 10).attr('y', normalY + 40)
			.attr('fill', '#fb4934').attr('font-size', '9px')
			.text('~5 μs CP');

		// ===== Extended CP (6 symbols) =====
		const extY = 150;
		const extCP = svgEl.append('g').attr('class', 'extended-cp').attr('opacity', 0.3);

		extCP.append('text')
			.attr('x', startX).attr('y', extY - 8)
			.attr('fill', '#fabd2f').attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Extended CP (1 slot = 0.5 ms)');

		const extSymWidth = slotWidth / 6;
		const cpExtWidth = 25; // Longer CP

		for (let i = 0; i < 6; i++) {
			const x = startX + i * extSymWidth;
			// CP portion (longer)
			extCP.append('rect')
				.attr('x', x).attr('y', extY)
				.attr('width', cpExtWidth).attr('height', symHeight)
				.attr('fill', '#fb4934').attr('fill-opacity', 0.5)
				.attr('stroke', '#fb4934').attr('stroke-width', 1);
			// Symbol portion
			extCP.append('rect')
				.attr('x', x + cpExtWidth).attr('y', extY)
				.attr('width', extSymWidth - cpExtWidth - 2).attr('height', symHeight)
				.attr('fill', '#fabd2f').attr('fill-opacity', 0.3)
				.attr('stroke', '#fabd2f').attr('stroke-width', 1);
			// Label
			extCP.append('text')
				.attr('x', x + extSymWidth / 2).attr('y', extY + symHeight + 15)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '8px')
				.text(`Sym${i}`);
		}

		const extHighlight = svgEl.append('g').attr('class', 'extended-highlight').attr('opacity', 0);
		extHighlight.append('text')
			.attr('x', startX + slotWidth + 10).attr('y', extY + 25)
			.attr('fill', '#fabd2f').attr('font-size', '10px')
			.text('6 symbols');
		extHighlight.append('text')
			.attr('x', startX + slotWidth + 10).attr('y', extY + 40)
			.attr('fill', '#fb4934').attr('font-size', '9px')
			.text('~17 μs CP');

		// Legend for CP
		const legend = svgEl.append('g').attr('transform', `translate(${startX}, ${extY + 70})`);
		legend.append('rect')
			.attr('x', 0).attr('y', 0).attr('width', 15).attr('height', 12)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.5);
		legend.append('text')
			.attr('x', 20).attr('y', 10).attr('fill', colors.fgMuted).attr('font-size', '9px')
			.text('= Cyclic Prefix (guard time)');
		legend.append('rect')
			.attr('x', 170).attr('y', 0).attr('width', 15).attr('height', 12)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.3)
			.attr('stroke', '#8ec07c');
		legend.append('text')
			.attr('x', 190).attr('y', 10).attr('fill', colors.fgMuted).attr('font-size', '9px')
			.text('= Useful data');

		// Comparison summary
		const comparison = svgEl.append('g').attr('class', 'comparison').attr('opacity', 0);
		comparison.append('rect')
			.attr('x', width / 2 - 170).attr('y', height - 45)
			.attr('width', 340).attr('height', 38)
			.attr('fill', colors.bg)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('rx', 4);
		comparison.append('text')
			.attr('x', width / 2).attr('y', height - 28)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Normal CP: Small cells, urban → More throughput');
		comparison.append('text')
			.attr('x', width / 2).attr('y', height - 13)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.text('Extended CP: Large cells, multipath → Better reliability');

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
