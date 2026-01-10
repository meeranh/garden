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
	let animationId: number;
	let pulsePhase = 0;

	const maxStep = 1;
	const width = 480;
	const height = 160;

	const channelColors = ['#fb4934', '#b8bb26', '#83a598'];
	const channelWidth = 80;
	const gapWidth = 40;
	const startX = 60;
	const channelY = 50;
	const channelHeight = 60;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.channels-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.waste-labels')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);
	}

	function animate() {
		pulsePhase += 0.05;

		// Pulse the gap labels
		if (currentStep >= 1) {
			const scale = 1 + Math.sin(pulsePhase * 2) * 0.1;
			svgEl.selectAll('.gap-x')
				.attr('transform', function() {
					const x = parseFloat(d3.select(this).attr('data-x') || '0');
					const y = parseFloat(d3.select(this).attr('data-y') || '0');
					return `translate(${x}, ${y}) scale(${scale})`;
				});
		}

		animationId = requestAnimationFrame(animate);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1500);
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

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 20)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('Traditional: Gaps Between Channels');

		// Channels group
		const channelsGroup = svgEl.append('g').attr('class', 'channels-group').attr('opacity', 0);

		// Frequency axis
		channelsGroup.append('line')
			.attr('x1', 30)
			.attr('x2', width - 30)
			.attr('y1', channelY + channelHeight + 15)
			.attr('y2', channelY + channelHeight + 15)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('marker-end', 'url(#freqArrow)');

		channelsGroup.append('text')
			.attr('x', width - 25)
			.attr('y', channelY + channelHeight + 20)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Frequency');

		// Arrow marker
		svgEl.append('defs').append('marker')
			.attr('id', 'freqArrow')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', colors.fgMuted);

		// Draw channels with gaps
		for (let i = 0; i < 3; i++) {
			const x = startX + i * (channelWidth + gapWidth);

			// Channel rectangle
			channelsGroup.append('rect')
				.attr('x', x)
				.attr('y', channelY)
				.attr('width', channelWidth)
				.attr('height', channelHeight)
				.attr('fill', channelColors[i])
				.attr('rx', 4);

			// Channel label
			channelsGroup.append('text')
				.attr('x', x + channelWidth / 2)
				.attr('y', channelY + channelHeight / 2 + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '12px')
				.attr('font-weight', 'bold')
				.text(`Ch ${i + 1}`);
		}

		// Waste labels group
		const wasteLabels = svgEl.append('g').attr('class', 'waste-labels').attr('opacity', 0);

		// Gap indicators
		for (let i = 0; i < 2; i++) {
			const gapX = startX + channelWidth + i * (channelWidth + gapWidth) + gapWidth / 2;

			// Gap bracket
			wasteLabels.append('rect')
				.attr('x', gapX - gapWidth / 2 + 5)
				.attr('y', channelY + 5)
				.attr('width', gapWidth - 10)
				.attr('height', channelHeight - 10)
				.attr('fill', 'none')
				.attr('stroke', '#fb4934')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '4,3')
				.attr('rx', 3);

			// X mark
			wasteLabels.append('text')
				.attr('class', 'gap-x')
				.attr('data-x', gapX)
				.attr('data-y', channelY + channelHeight / 2 + 6)
				.attr('text-anchor', 'middle')
				.attr('fill', '#fb4934')
				.attr('font-size', '16px')
				.attr('font-weight', 'bold')
				.text('✗');
		}

		// Wasted spectrum label
		wasteLabels.append('text')
			.attr('x', width / 2)
			.attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.text('Gaps waste spectrum bandwidth!');

		animate();
		applyStep(0);
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => {
		clearTimeouts();
		if (animationId) cancelAnimationFrame(animationId);
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
