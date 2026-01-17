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
	const width = 420;
	const height = 150;

	const numSubcarriers = 12;
	const barWidth = 25;
	const barHeight = 50;
	const startX = 45;
	const barY = 55;
	const gap = 3;

	// User colors
	const userColors = ['#83a598', '#fabd2f', '#d3869b', '#8ec07c'];
	const userNames = ['User A', 'User B', 'User C', 'User D'];

	// Allocation: which user gets which subcarriers
	const allocation = [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 3];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show all bars as gray (unallocated)
		// Step 1: Show OFDM - all bars same color (one user)
		// Step 2: Show OFDMA - bars colored by user

		svgEl.selectAll('.subcarrier-bar').each(function(_, i) {
			const bar = d3.select(this);
			let fill = '#504945'; // gray

			if (step === 1) {
				fill = '#83a598'; // all same color (one user)
			} else if (step === 2) {
				fill = userColors[allocation[i]];
			}

			bar.transition().duration(400).attr('fill', fill);
		});

		svgEl.select('.ofdm-label')
			.transition()
			.duration(400)
			.attr('opacity', step === 1 ? 1 : 0);

		svgEl.select('.ofdma-label')
			.transition()
			.duration(400)
			.attr('opacity', step === 2 ? 1 : 0);

		svgEl.select('.legend-group')
			.transition()
			.duration(400)
			.attr('opacity', step === 2 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1800);
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

		// Frequency axis
		svgEl.append('text')
			.attr('x', 10)
			.attr('y', barY + barHeight / 2 + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Freq');

		// Subcarrier bars
		for (let i = 0; i < numSubcarriers; i++) {
			const x = startX + i * (barWidth + gap);

			svgEl.append('rect')
				.attr('class', 'subcarrier-bar')
				.attr('x', x)
				.attr('y', barY)
				.attr('width', barWidth)
				.attr('height', barHeight)
				.attr('fill', '#504945')
				.attr('rx', 3);

			svgEl.append('text')
				.attr('x', x + barWidth / 2)
				.attr('y', barY + barHeight + 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`f${i + 1}`);
		}

		// OFDM label
		svgEl.append('text')
			.attr('class', 'ofdm-label')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('OFDM: One user gets ALL subcarriers');

		// OFDMA label
		svgEl.append('text')
			.attr('class', 'ofdma-label')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('OFDMA: Multiple users share subcarriers');

		// Legend
		const legendGroup = svgEl.append('g')
			.attr('class', 'legend-group')
			.attr('opacity', 0);

		const legendY = height - 15;
		const legendStartX = 80;
		const legendSpacing = 85;

		for (let i = 0; i < 4; i++) {
			legendGroup.append('rect')
				.attr('x', legendStartX + i * legendSpacing)
				.attr('y', legendY - 8)
				.attr('width', 12)
				.attr('height', 12)
				.attr('fill', userColors[i])
				.attr('rx', 2);

			legendGroup.append('text')
				.attr('x', legendStartX + i * legendSpacing + 16)
				.attr('y', legendY + 2)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(userNames[i]);
		}

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
