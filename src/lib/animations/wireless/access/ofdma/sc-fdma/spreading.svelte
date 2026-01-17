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
	const width = 420;
	const height = 200;

	const numSubcarriers = 6;
	const barWidth = 40;
	const barHeight = 45;
	const startX = 70;
	const gap = 8;
	const ofdmaY = 50;
	const scfdmaY = 125;

	const symbolColors = ['#83a598', '#fabd2f', '#d3869b', '#8ec07c', '#fe8019', '#b8bb26'];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.ofdma-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.scfdma-group')
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

		// ===== OFDMA =====
		const ofdmaGroup = svgEl.append('g').attr('class', 'ofdma-group').attr('opacity', 0);

		ofdmaGroup.append('text')
			.attr('x', 10)
			.attr('y', ofdmaY + barHeight / 2 + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('OFDMA:');

		// Each symbol on its own subcarrier
		for (let i = 0; i < numSubcarriers; i++) {
			const x = startX + i * (barWidth + gap);

			ofdmaGroup.append('rect')
				.attr('x', x)
				.attr('y', ofdmaY)
				.attr('width', barWidth)
				.attr('height', barHeight)
				.attr('fill', symbolColors[i])
				.attr('rx', 4);

			ofdmaGroup.append('text')
				.attr('x', x + barWidth / 2)
				.attr('y', ofdmaY + barHeight / 2 + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '11px')
				.attr('font-weight', 'bold')
				.text(`S${i + 1}`);

			ofdmaGroup.append('text')
				.attr('x', x + barWidth / 2)
				.attr('y', ofdmaY - 8)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`f${i + 1}`);
		}

		ofdmaGroup.append('text')
			.attr('x', width - 20)
			.attr('y', ofdmaY + barHeight / 2 + 4)
			.attr('text-anchor', 'end')
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('Can spike');

		// ===== SC-FDMA =====
		const scfdmaGroup = svgEl.append('g').attr('class', 'scfdma-group').attr('opacity', 0);

		scfdmaGroup.append('text')
			.attr('x', 10)
			.attr('y', scfdmaY + barHeight / 2 + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('SC-FDMA:');

		// Each subcarrier has ALL symbols spread across it (gradient effect)
		for (let i = 0; i < numSubcarriers; i++) {
			const x = startX + i * (barWidth + gap);

			// Draw stripes for each symbol
			const stripeHeight = barHeight / numSubcarriers;
			for (let j = 0; j < numSubcarriers; j++) {
				scfdmaGroup.append('rect')
					.attr('x', x)
					.attr('y', scfdmaY + j * stripeHeight)
					.attr('width', barWidth)
					.attr('height', stripeHeight)
					.attr('fill', symbolColors[j])
					.attr('opacity', 0.8);
			}

			// Border
			scfdmaGroup.append('rect')
				.attr('x', x)
				.attr('y', scfdmaY)
				.attr('width', barWidth)
				.attr('height', barHeight)
				.attr('fill', 'none')
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 1)
				.attr('rx', 4);

			scfdmaGroup.append('text')
				.attr('x', x + barWidth / 2)
				.attr('y', scfdmaY + barHeight + 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`f${i + 1}`);
		}

		scfdmaGroup.append('text')
			.attr('x', width - 20)
			.attr('y', scfdmaY + barHeight / 2 + 4)
			.attr('text-anchor', 'end')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Smooth');

		// Arrow between them
		scfdmaGroup.append('text')
			.attr('x', width / 2)
			.attr('y', (ofdmaY + barHeight + scfdmaY) / 2 + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Spread symbols across all subcarriers ↓');

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
