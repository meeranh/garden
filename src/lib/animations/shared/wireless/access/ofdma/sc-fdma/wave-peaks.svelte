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
	let phase = 0;
	let smoothPeakX = 0; // For smooth line tracking

	const maxStep = 2;
	const width = 400;
	const height = 180;

	const waveY = 50;
	const waveHeight = 20;
	const combinedY = 130;
	const combinedHeight = 35;
	const waveStartX = 50;
	const waveWidth = 320;

	// Wave frequencies (different for each subcarrier)
	const frequencies = [1, 1.5, 2, 2.5];
	const waveColors = ['#83a598', '#fabd2f', '#d3869b', '#8ec07c'];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function generateWavePath(freq: number, yCenter: number, amplitude: number, phaseOffset: number): string {
		const points: [number, number][] = [];
		for (let x = 0; x <= waveWidth; x += 2) {
			const y = yCenter + Math.sin((x / waveWidth) * Math.PI * 2 * freq + phaseOffset) * amplitude;
			points.push([waveStartX + x, y]);
		}
		return d3.line()(points) || '';
	}

	function generateCombinedPath(phaseOffset: number, aligned: boolean): string {
		const points: [number, number][] = [];
		for (let x = 0; x <= waveWidth; x += 2) {
			let sum = 0;
			frequencies.forEach((freq, i) => {
				const offset = aligned ? 0 : (i * Math.PI / 2);
				sum += Math.sin((x / waveWidth) * Math.PI * 2 * freq + phaseOffset + offset);
			});
			// Normalize
			const y = combinedY + (sum / frequencies.length) * combinedHeight;
			points.push([waveStartX + x, y]);
		}
		return d3.line()(points) || '';
	}

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.waves-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.combined-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.peak-marker')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Initialize smooth peak position when entering step 2
		if (step === 2) {
			smoothPeakX = waveStartX + waveWidth / 2;
		}
	}

	function animate() {
		phase += 0.03;

		// Update individual waves
		svgEl.selectAll('.wave-path').each(function(_, i) {
			const offset = currentStep >= 2 ? 0 : (i * Math.PI / 2); // Align at step 2
			d3.select(this).attr('d', generateWavePath(frequencies[i], waveY, waveHeight, phase + offset));
		});

		// Update combined wave
		const aligned = currentStep >= 2;
		svgEl.select('.combined-path')
			.attr('d', generateCombinedPath(phase, aligned));

		// Update peak marker position
		if (currentStep >= 2) {
			// Find the peak position with fine resolution
			let minY = combinedY;
			let targetPeakX = waveStartX;
			for (let x = 0; x <= waveWidth; x += 1) {
				let sum = 0;
				frequencies.forEach((freq) => {
					sum += Math.sin((x / waveWidth) * Math.PI * 2 * freq + phase);
				});
				const y = combinedY + (sum / frequencies.length) * combinedHeight;
				if (y < minY) {
					minY = y;
					targetPeakX = waveStartX + x;
				}
			}

			// Smooth interpolation (lerp) toward target position
			const diff = targetPeakX - smoothPeakX;

			// If target jumped far (wrap-around), snap to avoid long travel
			if (Math.abs(diff) > waveWidth * 0.4) {
				smoothPeakX = targetPeakX;
			} else {
				smoothPeakX = smoothPeakX + diff * 0.15;
			}

			svgEl.select('.peak-line')
				.attr('x1', smoothPeakX)
				.attr('x2', smoothPeakX);
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
	function replay() { pause(); currentStep = 0; applyStep(0); isPlaying = true; runAnimation(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Individual waves group
		const wavesGroup = svgEl.append('g').attr('class', 'waves-group').attr('opacity', 0);

		wavesGroup.append('text')
			.attr('x', 10)
			.attr('y', waveY + 5)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Waves:');

		frequencies.forEach((freq, i) => {
			wavesGroup.append('path')
				.attr('class', 'wave-path')
				.attr('d', generateWavePath(freq, waveY, waveHeight, i * Math.PI / 2))
				.attr('fill', 'none')
				.attr('stroke', waveColors[i])
				.attr('stroke-width', 1.5)
				.attr('opacity', 0.7);
		});

		// Combined wave group
		const combinedGroup = svgEl.append('g').attr('class', 'combined-group').attr('opacity', 0);

		combinedGroup.append('text')
			.attr('x', 10)
			.attr('y', combinedY + 5)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Sum:');

		// Average line
		combinedGroup.append('line')
			.attr('x1', waveStartX)
			.attr('x2', waveStartX + waveWidth)
			.attr('y1', combinedY)
			.attr('y2', combinedY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4')
			.attr('opacity', 0.5);

		combinedGroup.append('path')
			.attr('class', 'combined-path')
			.attr('d', generateCombinedPath(0, false))
			.attr('fill', 'none')
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);

		// Peak marker
		const peakMarker = svgEl.append('g').attr('class', 'peak-marker').attr('opacity', 0);

		peakMarker.append('line')
			.attr('class', 'peak-line')
			.attr('x1', waveStartX + 100)
			.attr('x2', waveStartX + 100)
			.attr('y1', combinedY - combinedHeight - 10)
			.attr('y2', combinedY + combinedHeight + 10)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2);

		peakMarker.append('text')
			.attr('x', width / 2)
			.attr('y', height - 8)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Waves align → Big peak!');

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
