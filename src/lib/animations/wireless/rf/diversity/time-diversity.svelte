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

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => {
			timeouts.push(setTimeout(r, ms));
		});
	}
	function clearTimeouts() {
		timeouts.forEach(clearTimeout);
		timeouts = [];
	}

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show layout
		// Step 1: First attempt fails
		// Step 2: Wait/countdown (nothing else moves)
		// Step 3: Retry succeeds

		// Row 1 elements (first attempt)
		if (step === 1) {
			// Animate packet1 only on step 1
			svgEl.select('.packet1')
				.attr('opacity', 1)
				.attr('x', 130)
				.transition()
				.duration(600)
				.attr('x', 310)
				.on('end', () => {
					if (currentStep >= 1) {
						svgEl.select('.fail-x').attr('opacity', 1);
						svgEl.select('.fail-text').attr('opacity', 1);
					}
				});
		} else if (step > 1) {
			// Keep packet1 in final position with failure shown
			svgEl.select('.packet1').attr('opacity', 1).attr('x', 310);
			svgEl.select('.fail-x').attr('opacity', 1);
			svgEl.select('.fail-text').attr('opacity', 1);
		} else {
			// Step 0: hide everything
			svgEl.select('.packet1').attr('opacity', 0).attr('x', 130);
			svgEl.select('.fail-x').attr('opacity', 0);
			svgEl.select('.fail-text').attr('opacity', 0);
		}

		// Wait indicator - only show during step 2
		if (step === 2) {
			svgEl.select('.wait-group').attr('opacity', 1);
			svgEl.select('.countdown-text').text('30ms');
			// Animate countdown
			const countdownValues = [20, 10, 0];
			countdownValues.forEach((ms, i) => {
				const t = setTimeout(() => {
					if (currentStep === 2) {
						svgEl.select('.countdown-text').text(`${ms}ms`);
					}
				}, (i + 1) * 350);
				timeouts.push(t);
			});
		} else if (step < 2) {
			svgEl.select('.wait-group').attr('opacity', 0);
			svgEl.select('.countdown-text').text('30ms');
		} else if (step >= 3) {
			svgEl.select('.wait-group').attr('opacity', 0);
		}

		// Row 2 elements (retry) - only at step 3
		if (step >= 3) {
			svgEl.select('.packet2')
				.attr('opacity', 1)
				.attr('x', 130)
				.transition()
				.duration(600)
				.attr('x', 310)
				.on('end', () => {
					if (currentStep >= 3) {
						svgEl.select('.success-check').attr('opacity', 1);
						svgEl.select('.success-text').attr('opacity', 1);
					}
				});
		} else {
			svgEl.select('.packet2').attr('opacity', 0).attr('x', 130);
			svgEl.select('.success-check').attr('opacity', 0);
			svgEl.select('.success-text').attr('opacity', 0);
		}

		// Row visibility
		// Row 1: bright during steps 0-2, dim at step 3
		svgEl.select('.row1-boxes')
			.transition()
			.duration(300)
			.attr('opacity', step <= 2 ? 1 : 0.4);

		// Row 2: dim during steps 0-1, bright at steps 2-3
		svgEl.select('.row2-boxes')
			.transition()
			.duration(300)
			.attr('opacity', step >= 2 ? 1 : 0.4);
	}

	async function runAnimation() {
		if (!isPlaying) return;

		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			// Step 0: brief pause, Step 1: packet animation, Step 2: full countdown, Step 3: packet animation
			const waitTime = i === 0 ? 800 : i === 2 ? 1600 : 1400;
			await sleep(waitTime);
			if (!isPlaying) return;
		}
		isPlaying = false;
	}

	function play() {
		if (!isPlaying) {
			isPlaying = true;
			runAnimation();
		}
	}
	function pause() {
		isPlaying = false;
		clearTimeouts();
	}
	function next() {
		pause();
		if (currentStep < maxStep) applyStep(currentStep + 1);
	}
	function prev() {
		pause();
		if (currentStep > 0) applyStep(currentStep - 1);
	}
	function skip() {
		pause();
		applyStep(maxStep);
	}
	function replay() {
		pause();
		currentStep = 0;
		// Reset all elements
		svgEl.select('.packet1').attr('opacity', 0).attr('x', 130);
		svgEl.select('.packet2').attr('opacity', 0).attr('x', 130);
		svgEl.select('.fail-x').attr('opacity', 0);
		svgEl.select('.fail-text').attr('opacity', 0);
		svgEl.select('.success-check').attr('opacity', 0);
		svgEl.select('.success-text').attr('opacity', 0);
		svgEl.select('.wait-group').attr('opacity', 0);
		svgEl.select('.countdown-text').text('30ms');
		svgEl.select('.row1-boxes').attr('opacity', 1);
		svgEl.select('.row2-boxes').attr('opacity', 0.4);

		isPlaying = true;
		runAnimation();
	}
	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

	function drawTxRxPair(
		group: d3.Selection<SVGGElement, unknown, null, undefined>,
		y: number,
		label: string
	) {
		// TX box
		group
			.append('rect')
			.attr('x', 70)
			.attr('y', y)
			.attr('width', 50)
			.attr('height', 35)
			.attr('fill', colors.border)
			.attr('rx', 4);
		group
			.append('text')
			.attr('x', 95)
			.attr('y', y + 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('TX');

		// Arrow line
		group
			.append('line')
			.attr('x1', 130)
			.attr('x2', 310)
			.attr('y1', y + 17)
			.attr('y2', y + 17)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,3');

		// RX box
		group
			.append('rect')
			.attr('x', 320)
			.attr('y', y)
			.attr('width', 50)
			.attr('height', 35)
			.attr('fill', colors.border)
			.attr('rx', 4);
		group
			.append('text')
			.attr('x', 345)
			.attr('y', y + 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('RX');

		// Label on left
		group
			.append('text')
			.attr('x', 40)
			.attr('y', y + 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text(label);
	}

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			accent: s.getPropertyValue('--color-accent').trim(),
			yellow: s.getPropertyValue('--color-math').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', '0 0 500 280');

		// Title
		svgEl
			.append('text')
			.attr('x', 250)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('Time Diversity: Retransmission');

		// Row 1: First attempt (y = 60)
		const row1 = svgEl.append('g').attr('class', 'row1-boxes');
		drawTxRxPair(row1, 55, 't₁');

		// Packet 1 (moving element)
		svgEl
			.append('rect')
			.attr('class', 'packet1')
			.attr('x', 130)
			.attr('y', 62)
			.attr('width', 28)
			.attr('height', 20)
			.attr('fill', colors.yellow)
			.attr('rx', 3)
			.attr('opacity', 0);

		// Failure indicator
		svgEl
			.append('text')
			.attr('class', 'fail-x')
			.attr('x', 390)
			.attr('y', 80)
			.attr('fill', '#fb4934')
			.attr('font-size', '26px')
			.attr('font-weight', 'bold')
			.text('✗')
			.attr('opacity', 0);

		svgEl
			.append('text')
			.attr('class', 'fail-text')
			.attr('x', 430)
			.attr('y', 78)
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.text('Failed')
			.attr('opacity', 0);

		// Wait indicator (middle)
		const waitGroup = svgEl.append('g').attr('class', 'wait-group').attr('opacity', 0);

		waitGroup
			.append('text')
			.attr('x', 220)
			.attr('y', 130)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '12px')
			.text('wait');

		waitGroup
			.append('text')
			.attr('class', 'countdown-text')
			.attr('x', 280)
			.attr('y', 130)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('30ms');

		// Row 2: Retry (y = 160)
		const row2 = svgEl.append('g').attr('class', 'row2-boxes').attr('opacity', 0.4);
		drawTxRxPair(row2, 160, 't₂');

		// Packet 2 (moving element)
		svgEl
			.append('rect')
			.attr('class', 'packet2')
			.attr('x', 130)
			.attr('y', 167)
			.attr('width', 28)
			.attr('height', 20)
			.attr('fill', colors.accent)
			.attr('rx', 3)
			.attr('opacity', 0);

		// Success indicator
		svgEl
			.append('text')
			.attr('class', 'success-check')
			.attr('x', 390)
			.attr('y', 185)
			.attr('fill', colors.accent)
			.attr('font-size', '26px')
			.attr('font-weight', 'bold')
			.text('✓')
			.attr('opacity', 0);

		svgEl
			.append('text')
			.attr('class', 'success-text')
			.attr('x', 430)
			.attr('y', 183)
			.attr('fill', colors.accent)
			.attr('font-size', '11px')
			.text('Success!')
			.attr('opacity', 0);

		// Bottom note
		svgEl
			.append('text')
			.attr('x', 250)
			.attr('y', 235)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Same data, different time → different channel conditions');

		// Key insight
		svgEl
			.append('text')
			.attr('x', 250)
			.attr('y', 260)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('If at first you don\'t succeed, try again later');

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
