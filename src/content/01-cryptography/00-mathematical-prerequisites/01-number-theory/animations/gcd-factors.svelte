<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let animationTimeout: ReturnType<typeof setTimeout> | null = null;
	let isPlaying = $state(false);
	let currentStep = $state(0);

	const width = 500;
	const height = 300;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	let colors: Record<string, string>;

	// Circle positions
	const mainR = 24;
	const smallR = 20;
	const row1Y = 60;
	const row2Y = 130;
	const resultY = 230;

	// Elements
	let num12Circle: d3.Selection<SVGCircleElement, unknown, null, undefined>;
	let num12Text: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let num18Circle: d3.Selection<SVGCircleElement, unknown, null, undefined>;
	let num18Text: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let equals1: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let equals2: d3.Selection<SVGTextElement, unknown, null, undefined>;

	// Prime factor circles for 12: 2, 2, 3
	let primes12: d3.Selection<SVGGElement, unknown, null, undefined>[] = [];
	// Prime factor circles for 18: 2, 3, 3
	let primes18: d3.Selection<SVGGElement, unknown, null, undefined>[] = [];

	// Result elements
	let resultGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	let commonPrime1: d3.Selection<SVGGElement, unknown, null, undefined>;
	let commonPrime2: d3.Selection<SVGGElement, unknown, null, undefined>;
	let timesSign: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let equalsSign: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let resultCircle: d3.Selection<SVGGElement, unknown, null, undefined>;

	const primeStartX = 200;
	const primeGap = 55;

	function runStep(step: number) {
		const duration = 400;

		if (step === 0) {
			// Show just the main numbers
			num12Circle.transition().duration(duration).attr('opacity', 1);
			num12Text.transition().duration(duration).attr('opacity', 1);
			num18Circle.transition().duration(duration).attr('opacity', 1);
			num18Text.transition().duration(duration).attr('opacity', 1);
			equals1.transition().duration(duration).attr('opacity', 0);
			equals2.transition().duration(duration).attr('opacity', 0);
			primes12.forEach(p => p.transition().duration(duration).attr('opacity', 0));
			primes18.forEach(p => p.transition().duration(duration).attr('opacity', 0));
			resultGroup.transition().duration(duration).attr('opacity', 0);
		} else if (step === 1) {
			// Show prime factors for 12
			equals1.transition().duration(duration).attr('opacity', 1);
			primes12.forEach((p, i) => {
				p.transition().duration(duration).delay(i * 150).attr('opacity', 1);
			});
		} else if (step === 2) {
			// Show prime factors for 18
			equals2.transition().duration(duration).attr('opacity', 1);
			primes18.forEach((p, i) => {
				p.transition().duration(duration).delay(i * 150).attr('opacity', 1);
			});
		} else if (step === 3) {
			// Highlight common factors (first 2 and first 3 from each row)
			// 12 = 2, 2, 3 -> highlight index 0 (2) and index 2 (3)
			// 18 = 2, 3, 3 -> highlight index 0 (2) and index 1 (3)
			primes12[0].select('circle').transition().duration(duration)
				.attr('stroke', colors.accent).attr('stroke-width', 3);
			primes12[0].select('text').transition().duration(duration)
				.attr('fill', colors.accent);
			primes12[2].select('circle').transition().duration(duration)
				.attr('stroke', colors.accent).attr('stroke-width', 3);
			primes12[2].select('text').transition().duration(duration)
				.attr('fill', colors.accent);

			primes18[0].select('circle').transition().duration(duration)
				.attr('stroke', colors.accent).attr('stroke-width', 3);
			primes18[0].select('text').transition().duration(duration)
				.attr('fill', colors.accent);
			primes18[1].select('circle').transition().duration(duration)
				.attr('stroke', colors.accent).attr('stroke-width', 3);
			primes18[1].select('text').transition().duration(duration)
				.attr('fill', colors.accent);

			// Dim the non-common ones
			primes12[1].select('circle').transition().duration(duration)
				.attr('stroke', colors.border).attr('opacity', 0.4);
			primes12[1].select('text').transition().duration(duration)
				.attr('fill', colors.fgMuted).attr('opacity', 0.4);
			primes18[2].select('circle').transition().duration(duration)
				.attr('stroke', colors.border).attr('opacity', 0.4);
			primes18[2].select('text').transition().duration(duration)
				.attr('fill', colors.fgMuted).attr('opacity', 0.4);
		} else if (step === 4) {
			// Show result: 2 × 3 = 6
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
			}, 1200);
		} else {
			isPlaying = false;
		}
	}

	function play() {
		if (isPlaying) return;
		if (animationTimeout) clearTimeout(animationTimeout);
		isPlaying = true;
		currentStep = 0;
		// Reset all
		resetAnimation();
		runStep(0);
		animationTimeout = setTimeout(() => {
			currentStep++;
			animate();
		}, 1200);
	}

	function resetAnimation() {
		primes12.forEach(p => {
			p.select('circle').attr('stroke', colors.border).attr('stroke-width', 2).attr('opacity', 1);
			p.select('text').attr('fill', colors.fg).attr('opacity', 1);
		});
		primes18.forEach(p => {
			p.select('circle').attr('stroke', colors.border).attr('stroke-width', 2).attr('opacity', 1);
			p.select('text').attr('fill', colors.fg).attr('opacity', 1);
		});
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
			if (currentStep === 0) resetAnimation();
			runStep(currentStep);
		}
	}

	function skip() {
		if (animationTimeout) clearTimeout(animationTimeout);
		isPlaying = false;
		currentStep = maxStep;
		// Show all steps
		num12Circle.attr('opacity', 1);
		num12Text.attr('opacity', 1);
		num18Circle.attr('opacity', 1);
		num18Text.attr('opacity', 1);
		equals1.attr('opacity', 1);
		equals2.attr('opacity', 1);
		primes12.forEach(p => p.attr('opacity', 1));
		primes18.forEach(p => p.attr('opacity', 1));
		runStep(3); // highlight common
		runStep(4); // show result
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

		// Main number circles - Row 1: 12
		num12Circle = svgEl.append('circle')
			.attr('cx', 60)
			.attr('cy', row1Y)
			.attr('r', mainR)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 2)
			.attr('opacity', 0);

		num12Text = svgEl.append('text')
			.attr('x', 60)
			.attr('y', row1Y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '20px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('12');

		// Equals sign for row 1
		equals1 = svgEl.append('text')
			.attr('x', 120)
			.attr('y', row1Y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '24px')
			.attr('opacity', 0)
			.text('=');

		// Prime factors for 12: 2, 2, 3
		const primes12Data = [2, 2, 3];
		primes12Data.forEach((val, i) => {
			const g = svgEl.append('g').attr('opacity', 0);
			g.append('circle')
				.attr('cx', primeStartX + i * primeGap)
				.attr('cy', row1Y)
				.attr('r', smallR)
				.attr('fill', colors.bgCard)
				.attr('stroke', colors.border)
				.attr('stroke-width', 2);
			g.append('text')
				.attr('x', primeStartX + i * primeGap)
				.attr('y', row1Y)
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '18px')
				.text(val);

			// Add × between circles (except after last)
			if (i < primes12Data.length - 1) {
				g.append('text')
					.attr('x', primeStartX + i * primeGap + primeGap / 2)
					.attr('y', row1Y)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'middle')
					.attr('fill', colors.fgMuted)
					.attr('font-size', '16px')
					.text('×');
			}
			primes12.push(g);
		});

		// Row 2: 18
		num18Circle = svgEl.append('circle')
			.attr('cx', 60)
			.attr('cy', row2Y)
			.attr('r', mainR)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 2)
			.attr('opacity', 0);

		num18Text = svgEl.append('text')
			.attr('x', 60)
			.attr('y', row2Y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '20px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('18');

		// Equals sign for row 2
		equals2 = svgEl.append('text')
			.attr('x', 120)
			.attr('y', row2Y)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '24px')
			.attr('opacity', 0)
			.text('=');

		// Prime factors for 18: 2, 3, 3
		const primes18Data = [2, 3, 3];
		primes18Data.forEach((val, i) => {
			const g = svgEl.append('g').attr('opacity', 0);
			g.append('circle')
				.attr('cx', primeStartX + i * primeGap)
				.attr('cy', row2Y)
				.attr('r', smallR)
				.attr('fill', colors.bgCard)
				.attr('stroke', colors.border)
				.attr('stroke-width', 2);
			g.append('text')
				.attr('x', primeStartX + i * primeGap)
				.attr('y', row2Y)
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '18px')
				.text(val);

			if (i < primes18Data.length - 1) {
				g.append('text')
					.attr('x', primeStartX + i * primeGap + primeGap / 2)
					.attr('y', row2Y)
					.attr('text-anchor', 'middle')
					.attr('dominant-baseline', 'middle')
					.attr('fill', colors.fgMuted)
					.attr('font-size', '16px')
					.text('×');
			}
			primes18.push(g);
		});

		// Result group: common factors brought down
		resultGroup = svgEl.append('g').attr('opacity', 0);

		// "Common:" label
		resultGroup.append('text')
			.attr('x', 60)
			.attr('y', resultY)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '16px')
			.text('GCD');

		// Arrow down
		resultGroup.append('text')
			.attr('x', 110)
			.attr('y', resultY)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '20px')
			.text('=');

		// Circle with 2
		const resultX = 160;
		resultGroup.append('circle')
			.attr('cx', resultX)
			.attr('cy', resultY)
			.attr('r', smallR)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.accent)
			.attr('stroke-width', 2);
		resultGroup.append('text')
			.attr('x', resultX)
			.attr('y', resultY)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.accent)
			.attr('font-size', '18px')
			.text('2');

		// × sign
		resultGroup.append('text')
			.attr('x', resultX + 40)
			.attr('y', resultY)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '18px')
			.text('×');

		// Circle with 3
		resultGroup.append('circle')
			.attr('cx', resultX + 80)
			.attr('cy', resultY)
			.attr('r', smallR)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.accent)
			.attr('stroke-width', 2);
		resultGroup.append('text')
			.attr('x', resultX + 80)
			.attr('y', resultY)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.accent)
			.attr('font-size', '18px')
			.text('3');

		// = sign
		resultGroup.append('text')
			.attr('x', resultX + 130)
			.attr('y', resultY)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '20px')
			.text('=');

		// Final result circle with 6
		resultGroup.append('circle')
			.attr('cx', resultX + 180)
			.attr('cy', resultY)
			.attr('r', mainR)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 3);
		resultGroup.append('text')
			.attr('x', resultX + 180)
			.attr('y', resultY)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '22px')
			.attr('font-weight', 'bold')
			.text('6');

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
