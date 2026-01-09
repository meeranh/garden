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
	const height = 280;
	const centerX = 250;
	const centerY = 150;
	const radius = 80;

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

		// Step 0: Show QPSK constellation
		// Step 1: Highlight the circle they sit on
		// Step 2: Show wasted space

		svgEl.select('.circle-highlight')
			.transition()
			.duration(500)
			.attr('opacity', step >= 1 ? 0.8 : 0)
			.attr('stroke-width', step >= 1 ? 3 : 0);

		svgEl.select('.wasted-space')
			.transition()
			.duration(500)
			.attr('opacity', step >= 2 ? 0.3 : 0);

		svgEl.select('.wasted-label')
			.transition()
			.duration(500)
			.attr('opacity', step >= 2 ? 1 : 0);

		const messages = [
			'QPSK: 4 symbols, 2 bits each',
			'All symbols sit on a circle (same amplitude)',
			'All this space is unused!'
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
		applyStep(0);
		isPlaying = true;
		runAnimation();
	}
	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
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

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('QPSK Only Uses a Circle');

		// Wasted space (filled area)
		svgEl.append('rect')
			.attr('class', 'wasted-space')
			.attr('x', centerX - radius - 20)
			.attr('y', centerY - radius - 20)
			.attr('width', (radius + 20) * 2)
			.attr('height', (radius + 20) * 2)
			.attr('fill', '#fb4934')
			.attr('opacity', 0);

		// Cut out the circle (by drawing white circle on top - but we use a different approach)
		// Actually, let's use a different visual

		// Axes
		svgEl.append('line')
			.attr('x1', centerX - radius - 30)
			.attr('x2', centerX + radius + 30)
			.attr('y1', centerY)
			.attr('y2', centerY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		svgEl.append('line')
			.attr('x1', centerX)
			.attr('x2', centerX)
			.attr('y1', centerY - radius - 30)
			.attr('y2', centerY + radius + 30)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		// Circle highlight
		svgEl.append('circle')
			.attr('class', 'circle-highlight')
			.attr('cx', centerX)
			.attr('cy', centerY)
			.attr('r', radius)
			.attr('fill', 'none')
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 0)
			.attr('opacity', 0);

		// QPSK symbols
		const symbols = [
			{ angle: 45, bits: '00' },
			{ angle: 135, bits: '01' },
			{ angle: 225, bits: '11' },
			{ angle: 315, bits: '10' }
		];

		for (const sym of symbols) {
			const rad = (sym.angle * Math.PI) / 180;
			const x = centerX + Math.cos(rad) * radius;
			const y = centerY - Math.sin(rad) * radius;

			svgEl.append('circle')
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', 10)
				.attr('fill', colors.accent);

			svgEl.append('text')
				.attr('x', x)
				.attr('y', y + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '9px')
				.attr('font-weight', 'bold')
				.text(sym.bits);
		}

		// Wasted label
		svgEl.append('text')
			.attr('class', 'wasted-label')
			.attr('x', centerX + radius + 50)
			.attr('y', centerY - radius + 20)
			.attr('fill', '#fb4934')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Unused!')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 20)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('QPSK: 4 symbols, 2 bits each');

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
