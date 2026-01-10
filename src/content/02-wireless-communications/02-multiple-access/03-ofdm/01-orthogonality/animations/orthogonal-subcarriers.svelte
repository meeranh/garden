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
	let samplerX = 0;
	let samplerDirection = 1;

	const maxStep = 4;
	const width = 560;
	const height = 320;

	const subcarrierColors = ['#fb4934', '#b8bb26', '#83a598', '#d3869b', '#fabd2f'];
	const numSubcarriers = 5;
	const graphLeft = 60;
	const graphRight = 500;
	const graphWidth = graphRight - graphLeft;
	const graphTop = 80;
	const graphBottom = 220;
	const graphHeight = graphBottom - graphTop;

	// Sinc function
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

		// Step 0: Show axes
		// Step 1: Show first subcarrier
		// Step 2: Show all subcarriers overlapping
		// Step 3: Show sampling points
		// Step 4: Animate sampler moving

		svgEl.select('.axes-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		// Show subcarriers progressively
		svgEl.selectAll('.subcarrier-path').each(function(_, i) {
			d3.select(this)
				.transition()
				.duration(400)
				.attr('opacity', step >= 1 && (step === 1 ? i === 2 : true) ? 1 : 0);
		});

		svgEl.selectAll('.subcarrier-label').each(function(_, i) {
			d3.select(this)
				.transition()
				.duration(400)
				.attr('opacity', step >= 2 ? 1 : 0);
		});

		svgEl.select('.sampling-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		svgEl.select('.sampler-line')
			.transition()
			.duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		svgEl.select('.zero-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		const messages = [
			'Frequency spectrum of subcarriers',
			'Each subcarrier has a sinc shape with zero crossings',
			'Multiple subcarriers overlap in frequency',
			'At each peak, all other subcarriers are at ZERO',
			'Sample at the peaks: no interference!'
		];
		svgEl.select('.message').text(messages[step]);
	}

	function animate() {
		// Animate the sampler line moving
		if (currentStep >= 4) {
			samplerX += samplerDirection * 0.5;
			if (samplerX > graphWidth - 20) {
				samplerDirection = -1;
			} else if (samplerX < 20) {
				samplerDirection = 1;
			}

			const x = graphLeft + samplerX;
			svgEl.select('.sampler-line')
				.attr('x1', x)
				.attr('x2', x);

			// Calculate which subcarrier we're near and update indicator
			const spacing = graphWidth / (numSubcarriers + 1);
			let nearestIdx = -1;
			let minDist = Infinity;
			for (let i = 0; i < numSubcarriers; i++) {
				const peakX = graphLeft + spacing * (i + 1);
				const dist = Math.abs(x - peakX);
				if (dist < minDist) {
					minDist = dist;
					nearestIdx = i;
				}
			}

			// Highlight sampling points when sampler is near a peak
			svgEl.selectAll('.sample-dot').each(function(_, i) {
				const dot = d3.select(this);
				const peakX = graphLeft + spacing * (i + 1);
				const isNear = Math.abs(x - peakX) < 8;
				dot.attr('r', isNear ? 8 : 5)
					.attr('opacity', isNear ? 1 : 0.7);
			});
		}

		animationId = requestAnimationFrame(animate);
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
	function replay() { pause(); currentStep = 0; samplerX = 20; applyStep(0); isPlaying = true; runAnimation(); }
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
			.attr('font-weight', 'bold')
			.text('Orthogonal Subcarriers');

		// Axes group
		const axesGroup = svgEl.append('g').attr('class', 'axes-group').attr('opacity', 0);

		// X-axis
		axesGroup.append('line')
			.attr('x1', graphLeft - 10)
			.attr('x2', graphRight + 20)
			.attr('y1', graphBottom)
			.attr('y2', graphBottom)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1);

		axesGroup.append('text')
			.attr('x', graphRight + 25)
			.attr('y', graphBottom + 5)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Frequency →');

		// Y-axis
		axesGroup.append('line')
			.attr('x1', graphLeft)
			.attr('x2', graphLeft)
			.attr('y1', graphTop - 10)
			.attr('y2', graphBottom + 5)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1);

		axesGroup.append('text')
			.attr('x', graphLeft - 5)
			.attr('y', graphTop - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Amplitude');

		// Zero line label
		svgEl.append('text')
			.attr('class', 'zero-label')
			.attr('x', graphLeft - 15)
			.attr('y', graphBottom + 4)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('0')
			.attr('opacity', 0);

		// Subcarrier sinc curves
		const spacing = graphWidth / (numSubcarriers + 1);

		for (let i = 0; i < numSubcarriers; i++) {
			const centerX = graphLeft + spacing * (i + 1);

			// Generate sinc path
			let pathData = '';
			for (let px = graphLeft; px <= graphRight; px += 2) {
				// Normalized distance from center (in units of spacing)
				const normalizedX = (px - centerX) / spacing;
				const amplitude = sinc(normalizedX);
				const y = graphBottom - amplitude * graphHeight * 0.85;

				if (pathData === '') {
					pathData = `M ${px} ${y}`;
				} else {
					pathData += ` L ${px} ${y}`;
				}
			}

			svgEl.append('path')
				.attr('class', 'subcarrier-path')
				.attr('d', pathData)
				.attr('fill', 'none')
				.attr('stroke', subcarrierColors[i])
				.attr('stroke-width', 2.5)
				.attr('opacity', 0);

			// Subcarrier label
			svgEl.append('text')
				.attr('class', 'subcarrier-label')
				.attr('x', centerX)
				.attr('y', graphTop - 5)
				.attr('text-anchor', 'middle')
				.attr('fill', subcarrierColors[i])
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text(`f${i + 1}`)
				.attr('opacity', 0);
		}

		// Sampling points group
		const samplingGroup = svgEl.append('g').attr('class', 'sampling-group').attr('opacity', 0);

		for (let i = 0; i < numSubcarriers; i++) {
			const x = graphLeft + spacing * (i + 1);
			const y = graphBottom - graphHeight * 0.85;

			// Vertical dashed line at sampling point
			samplingGroup.append('line')
				.attr('x1', x)
				.attr('x2', x)
				.attr('y1', y)
				.attr('y2', graphBottom)
				.attr('stroke', subcarrierColors[i])
				.attr('stroke-width', 1)
				.attr('stroke-dasharray', '4,3')
				.attr('opacity', 0.5);

			// Dot at the peak
			samplingGroup.append('circle')
				.attr('class', 'sample-dot')
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', 5)
				.attr('fill', subcarrierColors[i]);
		}

		// Moving sampler line
		samplerX = 20;
		svgEl.append('line')
			.attr('class', 'sampler-line')
			.attr('x1', graphLeft + samplerX)
			.attr('x2', graphLeft + samplerX)
			.attr('y1', graphTop - 10)
			.attr('y2', graphBottom + 10)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('opacity', 0);

		// Explanation labels
		const labelY = graphBottom + 50;
		svgEl.append('text')
			.attr('class', 'sampling-group')
			.attr('x', width / 2)
			.attr('y', labelY)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('Spacing = 1/T Hz  →  Zero crossings align with peaks')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Frequency spectrum of subcarriers');

		// Start animation loop
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
