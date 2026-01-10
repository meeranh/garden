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
	const width = 400;
	const height = 160;

	const numSubcarriers = 8;
	const barWidth = 35;
	const maxBarHeight = 45;
	const startX = 55;
	const barY = 90;
	const gap = 5;

	// Channel quality for each user (0-1, higher = better)
	const userAQuality = [0.9, 0.85, 0.7, 0.5, 0.3, 0.25, 0.2, 0.15];
	const userBQuality = [0.2, 0.25, 0.35, 0.5, 0.7, 0.85, 0.9, 0.95];

	const userAColor = '#83a598';
	const userBColor = '#fabd2f';

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.userA-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.userB-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.allocation-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Highlight best allocation at step 2
		if (step >= 2) {
			svgEl.selectAll('.userA-bar').each(function(_, i) {
				d3.select(this)
					.transition()
					.duration(400)
					.attr('opacity', i < 4 ? 1 : 0.2);
			});
			svgEl.selectAll('.userB-bar').each(function(_, i) {
				d3.select(this)
					.transition()
					.duration(400)
					.attr('opacity', i >= 4 ? 1 : 0.2);
			});
		} else {
			svgEl.selectAll('.userA-bar, .userB-bar')
				.transition()
				.duration(400)
				.attr('opacity', 1);
		}
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

		// Labels
		svgEl.append('text')
			.attr('x', 10)
			.attr('y', 20)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Signal');

		svgEl.append('text')
			.attr('x', 10)
			.attr('y', 32)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('quality');

		// Frequency labels
		for (let i = 0; i < numSubcarriers; i++) {
			const x = startX + i * (barWidth + gap);
			svgEl.append('text')
				.attr('x', x + barWidth / 2)
				.attr('y', barY + 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`f${i + 1}`);
		}

		// User A bars (channel quality)
		const userAGroup = svgEl.append('g').attr('class', 'userA-group').attr('opacity', 0);

		for (let i = 0; i < numSubcarriers; i++) {
			const x = startX + i * (barWidth + gap);
			const h = userAQuality[i] * maxBarHeight;

			userAGroup.append('rect')
				.attr('class', 'userA-bar')
				.attr('x', x)
				.attr('y', barY - h)
				.attr('width', barWidth / 2 - 1)
				.attr('height', h)
				.attr('fill', userAColor)
				.attr('rx', 2);
		}

		// User A legend
		userAGroup.append('rect')
			.attr('x', startX)
			.attr('y', barY + 25)
			.attr('width', 10)
			.attr('height', 10)
			.attr('fill', userAColor)
			.attr('rx', 2);

		userAGroup.append('text')
			.attr('x', startX + 14)
			.attr('y', barY + 34)
			.attr('fill', userAColor)
			.attr('font-size', '10px')
			.text('User A');

		// User B bars
		const userBGroup = svgEl.append('g').attr('class', 'userB-group').attr('opacity', 0);

		for (let i = 0; i < numSubcarriers; i++) {
			const x = startX + i * (barWidth + gap) + barWidth / 2;
			const h = userBQuality[i] * maxBarHeight;

			userBGroup.append('rect')
				.attr('class', 'userB-bar')
				.attr('x', x)
				.attr('y', barY - h)
				.attr('width', barWidth / 2 - 1)
				.attr('height', h)
				.attr('fill', userBColor)
				.attr('rx', 2);
		}

		// User B legend
		userBGroup.append('rect')
			.attr('x', startX + 80)
			.attr('y', barY + 25)
			.attr('width', 10)
			.attr('height', 10)
			.attr('fill', userBColor)
			.attr('rx', 2);

		userBGroup.append('text')
			.attr('x', startX + 94)
			.attr('y', barY + 34)
			.attr('fill', userBColor)
			.attr('font-size', '10px')
			.text('User B');

		// Allocation brackets
		const allocGroup = svgEl.append('g').attr('class', 'allocation-group').attr('opacity', 0);

		// Bracket for User A (f1-f4)
		const aStartX = startX;
		const aEndX = startX + 4 * (barWidth + gap) - gap;
		allocGroup.append('path')
			.attr('d', `M ${aStartX} ${barY + 48} L ${aStartX} ${barY + 53} L ${aEndX} ${barY + 53} L ${aEndX} ${barY + 48}`)
			.attr('fill', 'none')
			.attr('stroke', userAColor)
			.attr('stroke-width', 2);

		allocGroup.append('text')
			.attr('x', (aStartX + aEndX) / 2)
			.attr('y', barY + 66)
			.attr('text-anchor', 'middle')
			.attr('fill', userAColor)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('→ User A');

		// Bracket for User B (f5-f8)
		const bStartX = startX + 4 * (barWidth + gap);
		const bEndX = startX + 8 * (barWidth + gap) - gap;
		allocGroup.append('path')
			.attr('d', `M ${bStartX} ${barY + 48} L ${bStartX} ${barY + 53} L ${bEndX} ${barY + 53} L ${bEndX} ${barY + 48}`)
			.attr('fill', 'none')
			.attr('stroke', userBColor)
			.attr('stroke-width', 2);

		allocGroup.append('text')
			.attr('x', (bStartX + bEndX) / 2)
			.attr('y', barY + 66)
			.attr('text-anchor', 'middle')
			.attr('fill', userBColor)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('→ User B');

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
