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
	const width = 500;
	const height = 140;

	const positions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

	// Which positions each check bit covers
	const p1Covers = [1, 3, 5, 7, 9, 11, 13, 15];
	const p2Covers = [2, 3, 6, 7, 10, 11, 14, 15];
	const p4Covers = [4, 5, 6, 7, 12, 13, 14, 15];
	const p8Covers = [8, 9, 10, 11, 12, 13, 14, 15];

	const boxSize = 28;
	const startX = 15;
	const boxY = 50;
	const gap = 4;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show all positions
		// Step 1: Highlight P1 coverage
		// Step 2: Highlight P2 coverage
		// Step 3: Highlight P4 coverage
		// Step 4: Highlight P8 coverage

		const activeCovers = step === 1 ? p1Covers : step === 2 ? p2Covers : step === 3 ? p4Covers : step === 4 ? p8Covers : [];

		svgEl.select('.title-text')
			.text(
				step === 0 ? 'Each check bit covers specific positions' :
				step === 1 ? 'P1 covers: 1, 3, 5, 7, 9, 11, 13, 15' :
				step === 2 ? 'P2 covers: 2, 3, 6, 7, 10, 11, 14, 15' :
				step === 3 ? 'P4 covers: 4, 5, 6, 7, 12, 13, 14, 15' :
				'P8 covers: 8, 9, 10, 11, 12, 13, 14, 15'
			);

		positions.forEach((pos) => {
			const isHighlighted = activeCovers.includes(pos);

			svgEl.select(`.box-${pos}`)
				.transition().duration(300)
				.attr('fill', isHighlighted ? '#fabd2f' : colors.fgMuted)
				.attr('opacity', isHighlighted ? 1 : 0.3);

			svgEl.select(`.num-${pos}`)
				.transition().duration(300)
				.attr('fill', isHighlighted ? colors.bg : colors.fgMuted);
		});
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1500);
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
			.text('Each check bit covers specific positions');

		positions.forEach((pos, i) => {
			const x = startX + i * (boxSize + gap);

			// Box
			svgEl.append('rect')
				.attr('class', `box-${pos}`)
				.attr('x', x).attr('y', boxY)
				.attr('width', boxSize).attr('height', boxSize)
				.attr('fill', colors.fgMuted).attr('rx', 3)
				.attr('opacity', 0.3);

			// Position number inside
			svgEl.append('text')
				.attr('class', `num-${pos}`)
				.attr('x', x + boxSize / 2).attr('y', boxY + boxSize / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(pos);
		});

		// Bottom hint
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 15)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Count the 1s in highlighted positions to calculate each check bit');

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
