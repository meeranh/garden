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
	const height = 260;

	const titles = [
		'You have 7 MHz of spectrum',
		'Divide into 200 kHz carriers...',
		'Each piece is one carrier',
		'7 MHz ÷ 0.2 MHz = 35 carriers',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Show divider lines
		svgEl.selectAll('.divider-line')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// Show carrier labels
		svgEl.select('.carrier-labels')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Show formula
		svgEl.select('.formula-group')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);
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

		// Title
		svgEl.append('text')
			.attr('class', 'title-text')
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text(titles[0]);

		const barX = 40;
		const barY = 60;
		const barWidth = 500;
		const barHeight = 60;
		const numCarriers = 10; // Show 10 for visual clarity (represents 35)
		const carrierWidth = barWidth / numCarriers;

		// Spectrum bar
		svgEl.append('rect')
			.attr('x', barX).attr('y', barY)
			.attr('width', barWidth).attr('height', barHeight)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.3)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 4);

		// "7 MHz" label
		svgEl.append('text')
			.attr('x', barX + barWidth / 2).attr('y', barY + barHeight / 2 + 5)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('7 MHz spectrum');

		// Divider lines
		for (let i = 1; i < numCarriers; i++) {
			const x = barX + i * carrierWidth;
			svgEl.append('line')
				.attr('class', 'divider-line')
				.attr('x1', x).attr('y1', barY)
				.attr('x2', x).attr('y2', barY + barHeight)
				.attr('stroke', colors.fg).attr('stroke-width', 1)
				.attr('opacity', 0);
		}

		// Carrier labels group
		const labelsG = svgEl.append('g').attr('class', 'carrier-labels').attr('opacity', 0);

		// Show first few and last carrier labels
		const labelPositions = [0, 1, 2, 7, 8, 9];
		labelPositions.forEach((i) => {
			const x = barX + i * carrierWidth + carrierWidth / 2;
			const label = i < 3 ? `C${i + 1}` : `C${i + 26}`;
			labelsG.append('text')
				.attr('x', x).attr('y', barY + barHeight + 20)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '10px')
				.text(label);
		});

		// Dots in the middle
		labelsG.append('text')
			.attr('x', barX + 5 * carrierWidth).attr('y', barY + barHeight + 20)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '12px')
			.text('...');

		// Width indicator for one carrier
		const indicatorX = barX;
		const indicatorY = barY + barHeight + 35;

		labelsG.append('line')
			.attr('x1', indicatorX).attr('y1', indicatorY)
			.attr('x2', indicatorX + carrierWidth).attr('y2', indicatorY)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);

		labelsG.append('line')
			.attr('x1', indicatorX).attr('y1', indicatorY - 4)
			.attr('x2', indicatorX).attr('y2', indicatorY + 4)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);

		labelsG.append('line')
			.attr('x1', indicatorX + carrierWidth).attr('y1', indicatorY - 4)
			.attr('x2', indicatorX + carrierWidth).attr('y2', indicatorY + 4)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);

		labelsG.append('text')
			.attr('x', indicatorX + carrierWidth / 2).attr('y', indicatorY + 15)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('200 kHz');

		// Formula group
		const formulaG = svgEl.append('g').attr('class', 'formula-group').attr('opacity', 0);

		formulaG.append('rect')
			.attr('x', width / 2 - 120).attr('y', height - 55)
			.attr('width', 240).attr('height', 35)
			.attr('fill', colors.bg)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 4);

		formulaG.append('text')
			.attr('x', width / 2).attr('y', height - 32)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('35 carriers total');

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
