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

	const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
	const boxSize = 28;
	const startX = 95;
	const originalY = 40;
	const resultY = 105;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.original-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.copy-arrow')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.result-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);
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
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			accent: s.getPropertyValue('--color-accent').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Original symbol group
		const originalGroup = svgEl.append('g').attr('class', 'original-group').attr('opacity', 0);

		originalGroup.append('text')
			.attr('x', 15)
			.attr('y', originalY + boxSize / 2 + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Original:');

		// Draw original symbol boxes
		letters.forEach((letter, i) => {
			const x = startX + i * boxSize;
			const isEnd = i >= 6;

			originalGroup.append('rect')
				.attr('x', x)
				.attr('y', originalY)
				.attr('width', boxSize - 2)
				.attr('height', boxSize)
				.attr('fill', isEnd ? '#fabd2f' : '#83a598')
				.attr('rx', 3);

			originalGroup.append('text')
				.attr('x', x + boxSize / 2 - 1)
				.attr('y', originalY + boxSize / 2 + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '12px')
				.attr('font-weight', 'bold')
				.text(letter);
		});

		// Bracket above G, H with "copy this" label
		const bracketStartX = startX + 6 * boxSize;
		const bracketEndX = startX + 8 * boxSize - 2;

		originalGroup.append('path')
			.attr('d', `M ${bracketStartX} ${originalY - 5} L ${bracketStartX} ${originalY - 12} L ${bracketEndX} ${originalY - 12} L ${bracketEndX} ${originalY - 5}`)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);

		originalGroup.append('text')
			.attr('x', (bracketStartX + bracketEndX) / 2)
			.attr('y', originalY - 18)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('Copy this');

		// Copy arrow - curved line from G,H down to the CP position
		const copyArrow = svgEl.append('g').attr('class', 'copy-arrow').attr('opacity', 0);

		const arrowStartX = (bracketStartX + bracketEndX) / 2;
		const arrowEndX = startX - boxSize;

		copyArrow.append('path')
			.attr('d', `M ${arrowStartX} ${originalY + boxSize + 5}
			            Q ${arrowStartX} ${originalY + boxSize + 25},
			              ${(arrowStartX + arrowEndX) / 2} ${originalY + boxSize + 25}
			            Q ${arrowEndX} ${originalY + boxSize + 25},
			              ${arrowEndX} ${resultY - 5}`)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#copyArrowHead)');

		// Arrow marker
		svgEl.append('defs').append('marker')
			.attr('id', 'copyArrowHead')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', '#fabd2f');

		// Result group
		const resultGroup = svgEl.append('g').attr('class', 'result-group').attr('opacity', 0);

		// CP prefix (G, H copy) - positioned before the main symbol
		const cpX = startX - 2 * boxSize - 5;
		['G', 'H'].forEach((letter, i) => {
			const x = cpX + i * boxSize;

			resultGroup.append('rect')
				.attr('x', x)
				.attr('y', resultY)
				.attr('width', boxSize - 2)
				.attr('height', boxSize)
				.attr('fill', '#fabd2f')
				.attr('rx', 3);

			resultGroup.append('text')
				.attr('x', x + boxSize / 2 - 1)
				.attr('y', resultY + boxSize / 2 + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '12px')
				.attr('font-weight', 'bold')
				.text(letter);
		});

		// CP bracket below
		resultGroup.append('path')
			.attr('d', `M ${cpX} ${resultY + boxSize + 5} L ${cpX} ${resultY + boxSize + 10} L ${cpX + 2 * boxSize - 2} ${resultY + boxSize + 10} L ${cpX + 2 * boxSize - 2} ${resultY + boxSize + 5}`)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 1.5);

		resultGroup.append('text')
			.attr('x', cpX + boxSize - 1)
			.attr('y', resultY + boxSize + 22)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.attr('font-weight', 'bold')
			.text('Cyclic Prefix');

		// Divider line
		resultGroup.append('line')
			.attr('x1', startX - 4)
			.attr('x2', startX - 4)
			.attr('y1', resultY - 2)
			.attr('y2', resultY + boxSize + 2)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '3,3');

		// Original symbol in result row
		letters.forEach((letter, i) => {
			const x = startX + i * boxSize;
			const isEnd = i >= 6;

			resultGroup.append('rect')
				.attr('x', x)
				.attr('y', resultY)
				.attr('width', boxSize - 2)
				.attr('height', boxSize)
				.attr('fill', isEnd ? '#fabd2f' : '#83a598')
				.attr('rx', 3);

			resultGroup.append('text')
				.attr('x', x + boxSize / 2 - 1)
				.attr('y', resultY + boxSize / 2 + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '12px')
				.attr('font-weight', 'bold')
				.text(letter);
		});

		// Original symbol bracket below
		resultGroup.append('path')
			.attr('d', `M ${startX} ${resultY + boxSize + 5} L ${startX} ${resultY + boxSize + 10} L ${startX + 8 * boxSize - 2} ${resultY + boxSize + 10} L ${startX + 8 * boxSize - 2} ${resultY + boxSize + 5}`)
			.attr('fill', 'none')
			.attr('stroke', '#83a598')
			.attr('stroke-width', 1.5);

		resultGroup.append('text')
			.attr('x', startX + 4 * boxSize - 1)
			.attr('y', resultY + boxSize + 22)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '9px')
			.text('Original Symbol');

		applyStep(0);
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => {
		clearTimeouts();
	});
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
