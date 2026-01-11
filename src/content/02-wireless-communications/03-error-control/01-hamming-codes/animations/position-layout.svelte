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
	const width = 500;
	const height = 100;

	const positions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
	const checkPositions = [1, 2, 4, 8];
	const boxSize = 28;
	const startX = 15;
	const boxY = 35;
	const gap = 4;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		positions.forEach((pos) => {
			const isCheck = checkPositions.includes(pos);

			let fillColor = colors.fgMuted;
			let opacity = 0.3;

			if (step >= 1 && isCheck) {
				fillColor = '#fabd2f';
				opacity = 1;
			}
			if (step >= 2 && !isCheck) {
				fillColor = '#83a598';
				opacity = 1;
			}

			svgEl.select(`.box-${pos}`)
				.transition().duration(300)
				.attr('fill', fillColor)
				.attr('opacity', opacity);

			svgEl.select(`.label-${pos}`)
				.transition().duration(300)
				.attr('opacity', step >= 1 ? 1 : 0);
		});

		svgEl.select('.legend-group').attr('opacity', step >= 2 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1200);
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

		const posGroup = svgEl.append('g').attr('class', 'positions-group');

		positions.forEach((pos, i) => {
			const x = startX + i * (boxSize + gap);
			const isCheck = checkPositions.includes(pos);

			// Box
			posGroup.append('rect')
				.attr('class', `box-${pos}`)
				.attr('x', x).attr('y', boxY)
				.attr('width', boxSize).attr('height', boxSize)
				.attr('fill', colors.fgMuted).attr('rx', 3)
				.attr('opacity', 0.3);

			// Position number
			posGroup.append('text')
				.attr('x', x + boxSize / 2).attr('y', boxY - 6)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px').attr('font-family', 'monospace')
				.text(pos);

			// C or D label
			posGroup.append('text')
				.attr('class', `label-${pos}`)
				.attr('x', x + boxSize / 2).attr('y', boxY + boxSize / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', colors.bg)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text(isCheck ? 'C' : 'D');
		});

		// Legend
		const legendGroup = svgEl.append('g').attr('class', 'legend-group').attr('opacity', 0);

		legendGroup.append('rect')
			.attr('x', 120).attr('y', height - 20)
			.attr('width', 12).attr('height', 12)
			.attr('fill', '#fabd2f').attr('rx', 2);
		legendGroup.append('text')
			.attr('x', 138).attr('y', height - 10)
			.attr('fill', colors.fg).attr('font-size', '10px')
			.text('Check (1,2,4,8)');

		legendGroup.append('rect')
			.attr('x', 260).attr('y', height - 20)
			.attr('width', 12).attr('height', 12)
			.attr('fill', '#83a598').attr('rx', 2);
		legendGroup.append('text')
			.attr('x', 278).attr('y', height - 10)
			.attr('fill', colors.fg).attr('font-size', '10px')
			.text('Data (everything else)');

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
