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
	let highlightIndex = 0;
	let lastHighlight = 0;

	const maxStep = 1;
	const width = 480;
	const height = 180;

	const subcarrierColors = ['#fb4934', '#b8bb26', '#83a598', '#d3869b', '#fabd2f'];
	const numSubcarriers = 5;
	const graphLeft = 50;
	const graphRight = 430;
	const graphWidth = graphRight - graphLeft;
	const graphTop = 45;
	const graphBottom = 130;
	const graphHeight = graphBottom - graphTop;

	function sinc(x: number): number {
		if (Math.abs(x) < 0.001) return 1;
		return Math.sin(Math.PI * x) / (Math.PI * x);
	}

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.curves-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.zero-markers')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);
	}

	function animate() {
		const now = Date.now();

		// Cycle through highlighting each subcarrier
		if (currentStep >= 1 && now - lastHighlight > 800) {
			lastHighlight = now;
			highlightIndex = (highlightIndex + 1) % numSubcarriers;

			// Update curve opacities
			svgEl.selectAll('.sinc-curve').each(function(_, i) {
				d3.select(this)
					.attr('stroke-width', i === highlightIndex ? 3 : 2)
					.attr('opacity', i === highlightIndex ? 1 : 0.5);
			});

			// Update peak dots
			svgEl.selectAll('.peak-dot').each(function(_, i) {
				d3.select(this)
					.attr('r', i === highlightIndex ? 7 : 5)
					.attr('opacity', i === highlightIndex ? 1 : 0.6);
			});

			// Show zero crossings for highlighted subcarrier
			svgEl.selectAll('.zero-cross').each(function() {
				const idx = parseInt(d3.select(this).attr('data-subcarrier') || '0');
				d3.select(this).attr('opacity', idx === highlightIndex ? 1 : 0);
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
	function replay() { pause(); currentStep = 0; highlightIndex = 0; applyStep(0); isPlaying = true; runAnimation(); }
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
			.text('OFDM: Overlapping Subcarriers');

		// Curves group
		const curvesGroup = svgEl.append('g').attr('class', 'curves-group').attr('opacity', 0);

		// Frequency axis
		curvesGroup.append('line')
			.attr('x1', graphLeft - 10)
			.attr('x2', graphRight + 20)
			.attr('y1', graphBottom)
			.attr('y2', graphBottom)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1);

		curvesGroup.append('text')
			.attr('x', graphRight + 25)
			.attr('y', graphBottom + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Frequency');

		// Spacing between subcarrier centers
		const spacing = graphWidth / (numSubcarriers + 1);

		// Draw sinc curves
		for (let i = 0; i < numSubcarriers; i++) {
			const centerX = graphLeft + spacing * (i + 1);

			// Generate sinc path
			let pathData = '';
			for (let px = graphLeft - 20; px <= graphRight + 20; px += 2) {
				const normalizedX = (px - centerX) / spacing;
				const amplitude = sinc(normalizedX);
				const y = graphBottom - Math.max(0, amplitude) * graphHeight * 0.9;

				if (pathData === '') {
					pathData = `M ${px} ${y}`;
				} else {
					pathData += ` L ${px} ${y}`;
				}
			}

			curvesGroup.append('path')
				.attr('class', 'sinc-curve')
				.attr('d', pathData)
				.attr('fill', 'none')
				.attr('stroke', subcarrierColors[i])
				.attr('stroke-width', 2)
				.attr('opacity', 0.7);

			// Peak dot
			curvesGroup.append('circle')
				.attr('class', 'peak-dot')
				.attr('cx', centerX)
				.attr('cy', graphBottom - graphHeight * 0.9)
				.attr('r', 5)
				.attr('fill', subcarrierColors[i]);

			// Frequency label
			curvesGroup.append('text')
				.attr('x', centerX)
				.attr('y', graphTop - 8)
				.attr('text-anchor', 'middle')
				.attr('fill', subcarrierColors[i])
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text(`f${i + 1}`);
		}

		// Zero crossing markers group
		const zeroMarkers = svgEl.append('g').attr('class', 'zero-markers').attr('opacity', 0);

		// Add zero crossing indicators for each subcarrier
		for (let i = 0; i < numSubcarriers; i++) {
			const centerX = graphLeft + spacing * (i + 1);

			// Mark where this subcarrier crosses zero (at other subcarrier centers)
			for (let j = 0; j < numSubcarriers; j++) {
				if (i !== j) {
					const otherCenterX = graphLeft + spacing * (j + 1);

					zeroMarkers.append('circle')
						.attr('class', 'zero-cross')
						.attr('data-subcarrier', i)
						.attr('cx', otherCenterX)
						.attr('cy', graphBottom)
						.attr('r', 4)
						.attr('fill', 'none')
						.attr('stroke', subcarrierColors[i])
						.attr('stroke-width', 2)
						.attr('opacity', 0);
				}
			}
		}

		// Success label
		zeroMarkers.append('text')
			.attr('x', width / 2)
			.attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.text('✓ Each peak aligns with others\' zero crossings!');

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
