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
	const numChannels = 8;
	const channelWidth = 40;
	const channelGap = 8;
	const maxBarHeight = 120;

	// Which channels fade at each step (0 = no fade, indices = faded channels)
	const fadePatterns = [
		[], // Step 0: all good
		[2, 5], // Step 1: channels 2 and 5 fade
		[1, 3, 6], // Step 2: different channels fade
		[0, 4, 7] // Step 3: yet different channels fade
	];

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

		const fadedChannels = fadePatterns[step] || [];

		// Update each channel bar
		for (let i = 0; i < numChannels; i++) {
			const isFaded = fadedChannels.includes(i);
			const targetHeight = isFaded ? 20 : maxBarHeight;
			const targetColor = isFaded ? '#fb4934' : colors.accent;
			const targetOpacity = isFaded ? 0.6 : 1;

			svgEl
				.select(`.channel-${i}`)
				.transition()
				.duration(500)
				.attr('height', targetHeight)
				.attr('y', 180 - targetHeight)
				.attr('fill', targetColor)
				.attr('opacity', targetOpacity);

			// Data packet indicator
			svgEl
				.select(`.packet-${i}`)
				.transition()
				.duration(500)
				.attr('opacity', isFaded ? 0.3 : 1)
				.attr('fill', isFaded ? colors.border : colors.yellow);

			// X mark for faded
			svgEl
				.select(`.fade-x-${i}`)
				.transition()
				.duration(300)
				.attr('opacity', isFaded ? 1 : 0);
		}

		// Update status
		const goodCount = numChannels - fadedChannels.length;
		const statusText =
			step === 0
				? 'Data spread across 8 frequency channels'
				: `${fadedChannels.length} channels faded, ${goodCount} still carrying data`;

		svgEl.select('.status').text(statusText);
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

		svgEl = d3.select(svg).attr('viewBox', '0 0 500 280');

		// Title
		svgEl
			.append('text')
			.attr('x', 250)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('Frequency Diversity: Spreading Across Channels');

		const startX = (500 - numChannels * channelWidth - (numChannels - 1) * channelGap) / 2;

		// Draw channel bars
		for (let i = 0; i < numChannels; i++) {
			const x = startX + i * (channelWidth + channelGap);

			// Channel bar
			svgEl
				.append('rect')
				.attr('class', `channel-${i}`)
				.attr('x', x)
				.attr('y', 180 - maxBarHeight)
				.attr('width', channelWidth)
				.attr('height', maxBarHeight)
				.attr('fill', colors.accent)
				.attr('rx', 4);

			// Data packet indicator (small square)
			svgEl
				.append('rect')
				.attr('class', `packet-${i}`)
				.attr('x', x + channelWidth / 2 - 8)
				.attr('y', 190)
				.attr('width', 16)
				.attr('height', 16)
				.attr('fill', colors.yellow)
				.attr('rx', 2);

			// Frequency label
			svgEl
				.append('text')
				.attr('x', x + channelWidth / 2)
				.attr('y', 225)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`f${i + 1}`);

			// X mark for faded channels (hidden initially)
			svgEl
				.append('text')
				.attr('class', `fade-x-${i}`)
				.attr('x', x + channelWidth / 2)
				.attr('y', 120)
				.attr('text-anchor', 'middle')
				.attr('fill', '#fb4934')
				.attr('font-size', '20px')
				.attr('font-weight', 'bold')
				.text('✗')
				.attr('opacity', 0);
		}

		// Legend
		svgEl
			.append('rect')
			.attr('x', 50)
			.attr('y', 245)
			.attr('width', 12)
			.attr('height', 12)
			.attr('fill', colors.yellow)
			.attr('rx', 2);
		svgEl
			.append('text')
			.attr('x', 68)
			.attr('y', 255)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('= data packet');

		// Axis label
		svgEl
			.append('text')
			.attr('x', 250)
			.attr('y', 240)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Frequency →');

		// Status text
		svgEl
			.append('text')
			.attr('class', 'status')
			.attr('x', 250)
			.attr('y', 275)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Data spread across 8 frequency channels');

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
