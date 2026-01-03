<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let animationTimeout: ReturnType<typeof setTimeout> | null = null;
	let isPlaying = $state(false);
	let currentStep = $state(0);

	const width = 420;
	const height = 240;
	const centerX = width / 2;

	// Table layout
	const cellWidth = 42;
	const cellHeight = 40;
	const labelColWidth = 110;
	const tableLeft = (width - labelColWidth - 6 * cellWidth) / 2;
	const tableTop = 55;

	// The multipliers and their results (3 × n mod 7)
	const data = [
		{ n: 1, result: 3 },
		{ n: 2, result: 6 },
		{ n: 3, result: 2 },
		{ n: 4, result: 5 },
		{ n: 5, result: 1 },
		{ n: 6, result: 4 },
	];

	const phases = [
		{ revealUpTo: -1, found: false },
		{ revealUpTo: 0, found: false },
		{ revealUpTo: 1, found: false },
		{ revealUpTo: 2, found: false },
		{ revealUpTo: 3, found: false },
		{ revealUpTo: 4, found: true },
		{ revealUpTo: 4, found: true },
	];

	const totalSteps = phases.length;
	const maxStep = totalSteps - 1;

	let colors: Record<string, string>;

	let titleText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let calcText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let resultCells: d3.Selection<SVGTextElement, unknown, null, undefined>[] = [];
	let cellBgs: d3.Selection<SVGRectElement, unknown, null, undefined>[] = [];

	function runPhase(phaseIndex: number) {
		const phase = phases[phaseIndex];

		if (phaseIndex === 0) {
			titleText.text('Finding inverse of 3 mod 7').attr('fill', colors.yellow);
			calcText.text('Looking for result = 1').attr('fill', colors.fgMuted);
		} else if (phaseIndex === maxStep) {
			titleText.text('Found: 3⁻¹ ≡ 5 (mod 7)').attr('fill', colors.accent);
			calcText.text('When n = 5, result = 1 ✓').attr('fill', colors.accent);
		} else if (phase.found) {
			titleText.text('Found it!').attr('fill', colors.accent);
			calcText.text('3 × 5 = 15 → 15 mod 7 = 1').attr('fill', colors.accent);
		} else {
			const d = data[phase.revealUpTo];
			const product = 3 * d.n;
			titleText.text(`Try n = ${d.n}`).attr('fill', colors.yellow);
			calcText.text(`3 × ${d.n} = ${product} → ${product} mod 7 = ${d.result}`).attr('fill', colors.fgMuted);
		}

		data.forEach((d, i) => {
			const bg = cellBgs[i];
			const text = resultCells[i];

			if (i <= phase.revealUpTo) {
				text.attr('opacity', 1);

				if (d.result === 1 && phase.found) {
					bg.attr('fill', colors.accent).attr('opacity', 0.3);
					text.attr('fill', colors.accent).attr('opacity', 1);
				} else if (i === phase.revealUpTo && !phase.found) {
					bg.attr('fill', colors.yellow).attr('opacity', 0.2);
					text.attr('fill', colors.fg).attr('opacity', 1);
				} else {
					bg.attr('opacity', 0);
					text.attr('fill', colors.fgMuted).attr('opacity', 1);
				}
			} else {
				text.attr('opacity', 0);
				bg.attr('opacity', 0);
			}
		});
	}

	function animate() {
		if (!isPlaying) return;
		runPhase(currentStep);
		if (currentStep < maxStep && isPlaying) {
			animationTimeout = setTimeout(() => {
				if (!isPlaying) return;
				currentStep++;
				animate();
			}, 1400);
		} else {
			isPlaying = false;
		}
	}

	function play() {
		if (isPlaying) return;
		if (animationTimeout) clearTimeout(animationTimeout);
		isPlaying = true;
		currentStep = 0;
		runPhase(0);
		animationTimeout = setTimeout(() => {
			currentStep++;
			animate();
		}, 1400);
	}

	function pause() {
		isPlaying = false;
		if (animationTimeout) {
			clearTimeout(animationTimeout);
			animationTimeout = null;
		}
	}

	function next() {
		if (currentStep < maxStep) {
			currentStep++;
			runPhase(currentStep);
		}
	}

	function prev() {
		if (currentStep > 0) {
			currentStep--;
			runPhase(currentStep);
		}
	}

	function skip() {
		if (animationTimeout) clearTimeout(animationTimeout);
		isPlaying = false;
		currentStep = maxStep;
		runPhase(maxStep);
	}

	function replay() { play(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	onMount(() => {
		const styles = getComputedStyle(document.documentElement);
		colors = {
			bg: styles.getPropertyValue('--color-bg').trim() || '#1d2021',
			fg: styles.getPropertyValue('--color-fg').trim() || '#fbf1c7',
			fgMuted: styles.getPropertyValue('--color-fg-muted').trim() || '#d5c4a1',
			yellow: styles.getPropertyValue('--color-math').trim() || '#fabd2f',
			accent: styles.getPropertyValue('--color-accent').trim() || '#8ec07c',
			border: styles.getPropertyValue('--color-border').trim() || '#3c3836'
		};

		const svgEl = d3.select(svg)
			.attr('width', width)
			.attr('height', height)
			.attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		titleText = svgEl.append('text')
			.attr('x', centerX)
			.attr('y', 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '18px')
			.attr('font-weight', 'bold')
			.text('Finding inverse of 3 mod 7');

		const tableWidth = labelColWidth + 6 * cellWidth;
		const tableHeight = 2 * cellHeight;

		// Table outer border
		svgEl.append('rect')
			.attr('x', tableLeft)
			.attr('y', tableTop)
			.attr('width', tableWidth)
			.attr('height', tableHeight)
			.attr('fill', 'none')
			.attr('stroke', colors.border)
			.attr('stroke-width', 1.5)
			.attr('rx', 4);

		// Vertical line after label column
		svgEl.append('line')
			.attr('x1', tableLeft + labelColWidth)
			.attr('y1', tableTop)
			.attr('x2', tableLeft + labelColWidth)
			.attr('y2', tableTop + tableHeight)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		// Horizontal line between rows
		svgEl.append('line')
			.attr('x1', tableLeft)
			.attr('y1', tableTop + cellHeight)
			.attr('x2', tableLeft + tableWidth)
			.attr('y2', tableTop + cellHeight)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		// Row 1 label: "n"
		svgEl.append('text')
			.attr('x', tableLeft + labelColWidth / 2)
			.attr('y', tableTop + cellHeight / 2)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '16px')
			.text('n');

		// Row 2 label
		svgEl.append('text')
			.attr('x', tableLeft + labelColWidth / 2)
			.attr('y', tableTop + cellHeight + cellHeight / 2)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '15px')
			.text('3×n mod 7');

		// Create cells
		data.forEach((d, i) => {
			const x = tableLeft + labelColWidth + i * cellWidth;

			// N value (row 1)
			svgEl.append('text')
				.attr('x', x + cellWidth / 2)
				.attr('y', tableTop + cellHeight / 2)
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '18px')
				.text(d.n);

			// Result cell background (row 2)
			const bg = svgEl.append('rect')
				.attr('x', x + 3)
				.attr('y', tableTop + cellHeight + 3)
				.attr('width', cellWidth - 6)
				.attr('height', cellHeight - 6)
				.attr('rx', 3)
				.attr('fill', colors.yellow)
				.attr('opacity', 0);
			cellBgs.push(bg);

			// Result value (row 2)
			const text = svgEl.append('text')
				.attr('x', x + cellWidth / 2)
				.attr('y', tableTop + cellHeight + cellHeight / 2)
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '18px')
				.attr('opacity', 0)
				.text(d.result);
			resultCells.push(text);
		});

		// Calculation text
		calcText = svgEl.append('text')
			.attr('x', centerX)
			.attr('y', height - 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '15px')
			.text('Looking for result = 1');

		if (register) {
			register({ play, pause, next, prev, skip, replay, getState });
		}
	});

	onDestroy(() => {
		if (animationTimeout) clearTimeout(animationTimeout);
	});
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
	.diagram {
		display: block;
		margin: 0 auto;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
</style>
