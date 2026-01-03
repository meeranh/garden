<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let animationTimeout: ReturnType<typeof setTimeout> | null = null;
	let isPlaying = $state(false);
	let currentStep = $state(0);

	const width = 400;
	const height = 480;
	const centerX = width / 2;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	let colors: Record<string, string>;

	// Layout - better spacing
	const rowHeight = 115;
	const startY = 55;
	const circleR = 22;

	// Elements
	let row1: d3.Selection<SVGGElement, unknown, null, undefined>;
	let row2: d3.Selection<SVGGElement, unknown, null, undefined>;
	let row3: d3.Selection<SVGGElement, unknown, null, undefined>;
	let arrow1: d3.Selection<SVGGElement, unknown, null, undefined>;
	let arrow2: d3.Selection<SVGGElement, unknown, null, undefined>;
	let resultGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

	function createRow(
		group: d3.Selection<SVGGElement, unknown, null, undefined>,
		y: number,
		a: number,
		b: number,
		remainder: number,
		highlight: boolean,
		isDone: boolean
	) {
		group.selectAll('*').remove();

		const startX = 30;

		// First number in circle
		group.append('circle')
			.attr('cx', startX)
			.attr('cy', y)
			.attr('r', circleR)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		group.append('text')
			.attr('x', startX)
			.attr('y', y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '18px')
			.text(a);

		// ÷ symbol
		group.append('text')
			.attr('x', startX + 50)
			.attr('y', y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '20px')
			.text('÷');

		// Second number in circle
		group.append('circle')
			.attr('cx', startX + 100)
			.attr('cy', y)
			.attr('r', circleR)
			.attr('fill', colors.bgCard)
			.attr('stroke', isDone ? colors.yellow : colors.fg)
			.attr('stroke-width', isDone ? 3 : 2);
		group.append('text')
			.attr('x', startX + 100)
			.attr('y', y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', isDone ? colors.yellow : colors.fg)
			.attr('font-size', '18px')
			.attr('font-weight', isDone ? 'bold' : 'normal')
			.text(b);

		// Arrow and "remainder"
		group.append('text')
			.attr('x', startX + 160)
			.attr('y', y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '16px')
			.text('→');

		group.append('text')
			.attr('x', startX + 230)
			.attr('y', y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '14px')
			.text('remainder');

		// Remainder in circle
		const remColor = highlight ? colors.accent : (isDone ? colors.yellow : colors.fg);
		group.append('circle')
			.attr('cx', startX + 320)
			.attr('cy', y)
			.attr('r', circleR)
			.attr('fill', colors.bgCard)
			.attr('stroke', remColor)
			.attr('stroke-width', highlight || isDone ? 3 : 2);
		group.append('text')
			.attr('x', startX + 320)
			.attr('y', y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', remColor)
			.attr('font-size', '18px')
			.attr('font-weight', highlight || isDone ? 'bold' : 'normal')
			.text(remainder);

		if (isDone) {
			group.append('text')
				.attr('x', startX + 360)
				.attr('y', y)
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.attr('fill', colors.yellow)
				.attr('font-size', '18px')
				.text('✓');
		}
	}

	function createArrow(
		group: d3.Selection<SVGGElement, unknown, null, undefined>,
		y1: number,
		y2: number
	) {
		group.selectAll('*').remove();

		const startX = 30;
		const remX = startX + 320;
		const divX = startX + 100;
		const col1X = startX;

		const gapFromCircle = 10;
		const midY = (y1 + y2) / 2;

		// Curved arrow from remainder down to next row's divisor
		group.append('path')
			.attr('d', `M ${remX} ${y1 + circleR + gapFromCircle}
						C ${remX + 30} ${midY}, ${divX + 50} ${midY}, ${divX} ${y2 - circleR - gapFromCircle}`)
			.attr('fill', 'none')
			.attr('stroke', colors.accent)
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrowhead)');

		// Dashed arrow from divisor to next dividend
		group.append('path')
			.attr('d', `M ${divX} ${y1 + circleR + gapFromCircle}
						C ${divX - 30} ${midY}, ${col1X - 20} ${midY}, ${col1X} ${y2 - circleR - gapFromCircle}`)
			.attr('fill', 'none')
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '5,5');
	}

	function runStep(step: number) {
		const duration = 400;

		if (step === 0) {
			// Show first row: 48 ÷ 18 → remainder 12
			createRow(row1, startY, 48, 18, 12, false, false);
			row1.transition().duration(duration).attr('opacity', 1);
			row2.attr('opacity', 0);
			row3.attr('opacity', 0);
			arrow1.attr('opacity', 0);
			arrow2.attr('opacity', 0);
			resultGroup.attr('opacity', 0);
		} else if (step === 1) {
			// Highlight remainder, show arrow to next
			createRow(row1, startY, 48, 18, 12, true, false);
			createArrow(arrow1, startY, startY + rowHeight);
			arrow1.transition().duration(duration).attr('opacity', 1);

			// Show second row
			createRow(row2, startY + rowHeight, 18, 12, 6, false, false);
			row2.transition().duration(duration).delay(200).attr('opacity', 1);
		} else if (step === 2) {
			// Highlight second remainder
			createRow(row1, startY, 48, 18, 12, false, false);
			createRow(row2, startY + rowHeight, 18, 12, 6, true, false);
			createArrow(arrow2, startY + rowHeight, startY + rowHeight * 2);
			arrow2.transition().duration(duration).attr('opacity', 1);

			// Show third row
			createRow(row3, startY + rowHeight * 2, 12, 6, 0, false, false);
			row3.transition().duration(duration).delay(200).attr('opacity', 1);
		} else if (step === 3) {
			// Remainder is 0 - done! Highlight the divisor (6)
			createRow(row2, startY + rowHeight, 18, 12, 6, false, false);
			createRow(row3, startY + rowHeight * 2, 12, 6, 0, false, true);
		} else if (step === 4) {
			// Show final result
			resultGroup.transition().duration(duration).attr('opacity', 1);
		}
	}

	function animate() {
		if (!isPlaying) return;
		runStep(currentStep);
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
		runStep(0);
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
			runStep(currentStep);
		}
	}

	function prev() {
		if (currentStep > 0) {
			currentStep--;
			row1.attr('opacity', 0);
			row2.attr('opacity', 0);
			row3.attr('opacity', 0);
			arrow1.attr('opacity', 0);
			arrow2.attr('opacity', 0);
			resultGroup.attr('opacity', 0);
			for (let i = 0; i <= currentStep; i++) {
				runStep(i);
			}
		}
	}

	function skip() {
		if (animationTimeout) clearTimeout(animationTimeout);
		isPlaying = false;
		currentStep = maxStep;
		createRow(row1, startY, 48, 18, 12, false, false);
		row1.attr('opacity', 1);
		createArrow(arrow1, startY, startY + rowHeight);
		arrow1.attr('opacity', 1);
		createRow(row2, startY + rowHeight, 18, 12, 6, false, false);
		row2.attr('opacity', 1);
		createArrow(arrow2, startY + rowHeight, startY + rowHeight * 2);
		arrow2.attr('opacity', 1);
		createRow(row3, startY + rowHeight * 2, 12, 6, 0, false, true);
		row3.attr('opacity', 1);
		resultGroup.attr('opacity', 1);
	}

	function replay() { play(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	onMount(() => {
		const styles = getComputedStyle(document.documentElement);
		colors = {
			bg: styles.getPropertyValue('--color-bg').trim() || '#1d2021',
			bgCard: styles.getPropertyValue('--color-bg-card').trim() || '#282828',
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

		// Arrow marker
		svgEl.append('defs')
			.append('marker')
			.attr('id', 'arrowhead')
			.attr('markerWidth', 10)
			.attr('markerHeight', 7)
			.attr('refX', 5)
			.attr('refY', 3.5)
			.attr('orient', 'auto')
			.append('polygon')
			.attr('points', '0 0, 10 3.5, 0 7')
			.attr('fill', colors.accent);

		// Create groups in order
		row1 = svgEl.append('g').attr('opacity', 0);
		arrow1 = svgEl.append('g').attr('opacity', 0);
		row2 = svgEl.append('g').attr('opacity', 0);
		arrow2 = svgEl.append('g').attr('opacity', 0);
		row3 = svgEl.append('g').attr('opacity', 0);

		// Result
		resultGroup = svgEl.append('g').attr('opacity', 0);
		resultGroup.append('rect')
			.attr('x', centerX - 70)
			.attr('y', height - 55)
			.attr('width', 140)
			.attr('height', 44)
			.attr('rx', 8)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 2);
		resultGroup.append('text')
			.attr('x', centerX)
			.attr('y', height - 33)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '22px')
			.attr('font-weight', 'bold')
			.text('GCD = 6');

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
