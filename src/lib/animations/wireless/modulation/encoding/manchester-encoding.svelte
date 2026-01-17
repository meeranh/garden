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
	const width = 500;
	const height = 300;

	const bits = [1, 0, 1, 1, 0, 0, 1, 0];
	const bitWidth = 50;
	const startX = 50;
	const highY = 100;
	const lowY = 180;
	const midY = 140;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show the bits and the rule
		// Step 1: Draw the Manchester signal
		// Step 2: Highlight mid-bit transitions
		// Step 3: Show clock recovery

		svgEl.select('.manchester-signal')
			.transition()
			.duration(600)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.selectAll('.mid-transition')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.clock-note')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		const messages = [
			'Rule: 1 = low→high, 0 = high→low (at mid-bit)',
			'Every bit has a transition in the middle',
			'Mid-bit transitions marked',
			'Receiver uses transitions to stay synchronized!'
		];
		svgEl.select('.message').text(messages[step]);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2000);
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
			yellow: s.getPropertyValue('--color-math').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('Manchester Encoding');

		// Legend
		svgEl.append('text')
			.attr('x', 60)
			.attr('y', 50)
			.attr('fill', colors.yellow)
			.attr('font-size', '11px')
			.text('1 = low→high');

		svgEl.append('text')
			.attr('x', 160)
			.attr('y', 50)
			.attr('fill', colors.accent)
			.attr('font-size', '11px')
			.text('0 = high→low');

		// Bit labels
		bits.forEach((bit, i) => {
			svgEl.append('text')
				.attr('x', startX + i * bitWidth + bitWidth / 2)
				.attr('y', 75)
				.attr('text-anchor', 'middle')
				.attr('fill', bit === 1 ? colors.yellow : colors.accent)
				.attr('font-size', '14px')
				.attr('font-weight', 'bold')
				.text(bit);
		});

		// Voltage labels
		svgEl.append('text')
			.attr('x', startX - 15)
			.attr('y', highY + 5)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('High');

		svgEl.append('text')
			.attr('x', startX - 15)
			.attr('y', lowY + 5)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Low');

		// Vertical grid lines (bit boundaries)
		for (let i = 0; i <= bits.length; i++) {
			svgEl.append('line')
				.attr('x1', startX + i * bitWidth)
				.attr('x2', startX + i * bitWidth)
				.attr('y1', highY - 15)
				.attr('y2', lowY + 15)
				.attr('stroke', colors.border)
				.attr('stroke-width', 1)
				.attr('opacity', 0.3);
		}

		// Manchester Signal path
		// 1 = low for first half, high for second half (transition low→high at mid)
		// 0 = high for first half, low for second half (transition high→low at mid)
		let pathD = '';
		bits.forEach((bit, i) => {
			const x = startX + i * bitWidth;
			const midX = x + bitWidth / 2;
			const endX = x + bitWidth;

			if (bit === 1) {
				// Low then High
				if (i === 0) {
					pathD = `M ${x} ${lowY}`;
				} else {
					// Connect from previous endpoint
					const prevBit = bits[i - 1];
					const prevEndY = prevBit === 1 ? highY : lowY;
					if (prevEndY !== lowY) {
						pathD += ` L ${x} ${lowY}`;
					}
				}
				pathD += ` L ${midX} ${lowY} L ${midX} ${highY} L ${endX} ${highY}`;
			} else {
				// High then Low
				if (i === 0) {
					pathD = `M ${x} ${highY}`;
				} else {
					const prevBit = bits[i - 1];
					const prevEndY = prevBit === 1 ? highY : lowY;
					if (prevEndY !== highY) {
						pathD += ` L ${x} ${highY}`;
					}
				}
				pathD += ` L ${midX} ${highY} L ${midX} ${lowY} L ${endX} ${lowY}`;
			}
		});

		svgEl.append('path')
			.attr('class', 'manchester-signal')
			.attr('d', pathD)
			.attr('fill', 'none')
			.attr('stroke', colors.accent)
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// Mid-bit transition markers
		bits.forEach((bit, i) => {
			const midX = startX + i * bitWidth + bitWidth / 2;

			svgEl.append('circle')
				.attr('class', 'mid-transition')
				.attr('cx', midX)
				.attr('cy', midY)
				.attr('r', 6)
				.attr('fill', colors.yellow)
				.attr('opacity', 0);

			svgEl.append('line')
				.attr('class', 'mid-transition')
				.attr('x1', midX)
				.attr('x2', midX)
				.attr('y1', highY - 10)
				.attr('y2', lowY + 10)
				.attr('stroke', colors.yellow)
				.attr('stroke-width', 1)
				.attr('stroke-dasharray', '3,3')
				.attr('opacity', 0);
		});

		// Clock recovery note
		svgEl.append('text')
			.attr('class', 'clock-note')
			.attr('x', 380)
			.attr('y', 217)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Self-clocking!')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'clock-note')
			.attr('x', 380)
			.attr('y', 237)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Guaranteed transition every bit')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Rule: 1 = low→high, 0 = high→low (at mid-bit)');

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
