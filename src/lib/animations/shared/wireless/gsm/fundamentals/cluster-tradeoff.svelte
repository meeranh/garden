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
		'Cluster size trade-off',
		'Small cluster (3): More capacity, more interference',
		'Large cluster (7): Less capacity, less interference',
		'Choose smallest cluster with acceptable quality',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Highlight small cluster
		svgEl.select('.small-cluster')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0.3);

		svgEl.select('.small-stats')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// Highlight large cluster
		svgEl.select('.large-cluster')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0.3);

		svgEl.select('.large-stats')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Summary
		svgEl.select('.summary-group')
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

		// Divider
		svgEl.append('line')
			.attr('x1', width / 2).attr('y1', 45)
			.attr('x2', width / 2).attr('y2', 220)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4').attr('opacity', 0.4);

		// ========== LEFT: Small Cluster (3-cell) ==========
		const smallG = svgEl.append('g').attr('class', 'small-cluster').attr('opacity', 0.3);
		const smallX = 130, smallY = 130;

		svgEl.append('text')
			.attr('x', smallX).attr('y', 55)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('3-Cell Cluster');

		const small3Colors = ['#fb4934', '#8ec07c', '#83a598'];
		const small3Pos = [
			{ x: smallX - 30, y: smallY - 20 },
			{ x: smallX + 30, y: smallY - 20 },
			{ x: smallX, y: smallY + 25 },
		];

		small3Pos.forEach((pos, i) => {
			smallG.append('circle')
				.attr('cx', pos.x).attr('cy', pos.y)
				.attr('r', 25)
				.attr('fill', small3Colors[i]).attr('fill-opacity', 0.25)
				.attr('stroke', small3Colors[i]).attr('stroke-width', 2);

			smallG.append('text')
				.attr('x', pos.x).attr('y', pos.y + 5)
				.attr('text-anchor', 'middle').attr('fill', '#fff')
				.attr('font-size', '14px').attr('font-weight', 'bold')
				.text(i + 1);
		});

		// Small cluster stats
		const smallStats = svgEl.append('g').attr('class', 'small-stats').attr('opacity', 0);

		smallStats.append('text')
			.attr('x', smallX).attr('y', 195)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('High capacity');

		smallStats.append('text')
			.attr('x', smallX).attr('y', 210)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('High interference');

		// ========== RIGHT: Large Cluster (7-cell) ==========
		const largeG = svgEl.append('g').attr('class', 'large-cluster').attr('opacity', 0.3);
		const largeX = 390, largeY = 125;

		svgEl.append('text')
			.attr('x', largeX).attr('y', 55)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('7-Cell Cluster');

		const large7Colors = ['#fb4934', '#8ec07c', '#83a598', '#fabd2f', '#d3869b', '#fe8019', '#b8bb26'];
		const large7Pos = [
			{ x: largeX, y: largeY },
			{ x: largeX + 32, y: largeY - 18 },
			{ x: largeX + 32, y: largeY + 18 },
			{ x: largeX, y: largeY + 35 },
			{ x: largeX - 32, y: largeY + 18 },
			{ x: largeX - 32, y: largeY - 18 },
			{ x: largeX, y: largeY - 35 },
		];

		large7Pos.forEach((pos, i) => {
			largeG.append('circle')
				.attr('cx', pos.x).attr('cy', pos.y)
				.attr('r', 16)
				.attr('fill', large7Colors[i]).attr('fill-opacity', 0.25)
				.attr('stroke', large7Colors[i]).attr('stroke-width', 1.5);

			largeG.append('text')
				.attr('x', pos.x).attr('y', pos.y + 4)
				.attr('text-anchor', 'middle').attr('fill', '#fff')
				.attr('font-size', '10px').attr('font-weight', 'bold')
				.text(i + 1);
		});

		// Large cluster stats
		const largeStats = svgEl.append('g').attr('class', 'large-stats').attr('opacity', 0);

		largeStats.append('text')
			.attr('x', largeX).attr('y', 195)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('Lower capacity');

		largeStats.append('text')
			.attr('x', largeX).attr('y', 210)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Low interference');

		// Summary
		const summaryG = svgEl.append('g').attr('class', 'summary-group').attr('opacity', 0);

		summaryG.append('rect')
			.attr('x', 60).attr('y', 235)
			.attr('width', 400).attr('height', 45)
			.attr('fill', colors.bg).attr('fill-opacity', 0.9)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('rx', 6);

		summaryG.append('text')
			.attr('x', width / 2).attr('y', 255)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Goal: Smallest cluster with acceptable SIR');

		summaryG.append('text')
			.attr('x', width / 2).attr('y', 272)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Maximize capacity while maintaining call quality');

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
