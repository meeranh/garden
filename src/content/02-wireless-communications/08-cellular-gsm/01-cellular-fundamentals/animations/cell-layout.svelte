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
	const width = 520;
	const height = 300;

	const titles = [
		'One tower trying to cover everything',
		'Problems: too many users, high power needed',
		'Solution: divide into cells',
		'Each cell handles its own users',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Single tower view
		svgEl.select('.single-tower-group')
			.transition().duration(400)
			.attr('opacity', step <= 1 ? 1 : 0);

		// Problems
		svgEl.select('.problems-group')
			.transition().duration(400)
			.attr('opacity', step === 1 ? 1 : 0);

		// Cellular view
		svgEl.select('.cellular-group')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Users in cells
		svgEl.select('.users-group')
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

		// ========== Single Tower View ==========
		const singleG = svgEl.append('g').attr('class', 'single-tower-group');

		// Large coverage circle
		singleG.append('circle')
			.attr('cx', width / 2).attr('cy', 160)
			.attr('r', 100)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.1)
			.attr('stroke', '#fb4934').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3');

		// Tower
		singleG.append('rect')
			.attr('x', width / 2 - 8).attr('y', 140)
			.attr('width', 16).attr('height', 40)
			.attr('fill', '#fb4934');

		singleG.append('polygon')
			.attr('points', `${width/2},120 ${width/2-15},145 ${width/2+15},145`)
			.attr('fill', '#fb4934');

		singleG.append('text')
			.attr('x', width / 2).attr('y', 195)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Single tower');

		// Problems group
		const probG = svgEl.append('g').attr('class', 'problems-group').attr('opacity', 0);

		probG.append('text')
			.attr('x', 100).attr('y', 100)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.text('High power');

		probG.append('text')
			.attr('x', 420).attr('y', 100)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.text('Congestion');

		probG.append('text')
			.attr('x', width / 2).attr('y', 235)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.text('Limited capacity');

		// ========== Cellular View ==========
		const cellG = svgEl.append('g').attr('class', 'cellular-group').attr('opacity', 0);

		const cellPositions = [
			{ x: 180, y: 120 }, { x: 260, y: 120 }, { x: 340, y: 120 },
			{ x: 220, y: 180 }, { x: 300, y: 180 },
			{ x: 260, y: 240 },
		];

		const cellColors = ['#fb4934', '#8ec07c', '#83a598', '#fabd2f', '#d3869b', '#fe8019'];

		cellPositions.forEach((pos, i) => {
			// Cell coverage
			cellG.append('circle')
				.attr('cx', pos.x).attr('cy', pos.y)
				.attr('r', 35)
				.attr('fill', cellColors[i]).attr('fill-opacity', 0.15)
				.attr('stroke', cellColors[i]).attr('stroke-width', 1.5);

			// Small tower
			cellG.append('rect')
				.attr('x', pos.x - 3).attr('y', pos.y - 8)
				.attr('width', 6).attr('height', 16)
				.attr('fill', cellColors[i]);
		});

		// Users group
		const usersG = svgEl.append('g').attr('class', 'users-group').attr('opacity', 0);

		const userPositions = [
			{ x: 165, y: 105, cell: 0 }, { x: 195, y: 130, cell: 0 },
			{ x: 245, y: 110, cell: 1 }, { x: 275, y: 130, cell: 1 },
			{ x: 325, y: 110, cell: 2 }, { x: 355, y: 125, cell: 2 },
			{ x: 205, y: 170, cell: 3 }, { x: 235, y: 190, cell: 3 },
			{ x: 285, y: 170, cell: 4 }, { x: 315, y: 190, cell: 4 },
			{ x: 245, y: 235, cell: 5 }, { x: 275, y: 250, cell: 5 },
		];

		userPositions.forEach((pos) => {
			usersG.append('circle')
				.attr('cx', pos.x).attr('cy', pos.y)
				.attr('r', 5)
				.attr('fill', colors.fg).attr('fill-opacity', 0.7);
		});

		usersG.append('text')
			.attr('x', width / 2).attr('y', height - 10)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Each cell serves its local users');

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
