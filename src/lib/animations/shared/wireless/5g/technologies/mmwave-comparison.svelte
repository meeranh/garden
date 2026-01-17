<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let animationFrame: number;
	let waveOffset = 0;
	let colors: Record<string, string>;

	const width = 650;
	const height = 320;

	const bands = [
		{ name: 'LTE', freq: '700 MHz', wavelength: '43 cm', color: '#8ec07c', waveCount: 3, range: 'Kilometers' },
		{ name: 'Sub-6 GHz', freq: '3.5 GHz', wavelength: '8 cm', color: '#fabd2f', waveCount: 8, range: '1-2 km' },
		{ name: 'mmWave', freq: '28 GHz', wavelength: '1 cm', color: '#83a598', waveCount: 25, range: '200-300m' }
	];

	function generateWavePath(startX: number, endX: number, y: number, amplitude: number, waveCount: number, offset: number): string {
		const points: string[] = [];
		const waveWidth = endX - startX;
		const step = 2;

		for (let x = 0; x <= waveWidth; x += step) {
			const waveY = y + Math.sin((x / waveWidth) * waveCount * Math.PI * 2 + offset) * amplitude;
			points.push(`${startX + x},${waveY}`);
		}

		return 'M' + points.join(' L');
	}

	function updateWaves() {
		waveOffset += 0.05;

		bands.forEach((band, i) => {
			const y = 90 + i * 85;
			const path = generateWavePath(180, 480, y, 18, band.waveCount, waveOffset);
			svgEl.select(`.wave-${i}`).attr('d', path);
		});

		animationFrame = requestAnimationFrame(updateWaves);
	}

	// Simple controller - no steps needed
	function play() {}
	function pause() {}
	function next() {}
	function prev() {}
	function skip() {}
	function replay() {}
	function getState() { return { isPlaying: false, currentStep: 0, totalSteps: 0 }; }

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2).attr('y', 28)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('Wavelength Comparison');

		// Create each band row
		bands.forEach((band, i) => {
			const y = 90 + i * 85;

			// Label on left
			svgEl.append('text')
				.attr('x', 30).attr('y', y - 12)
				.attr('fill', band.color)
				.attr('font-size', '13px')
				.attr('font-weight', 'bold')
				.text(band.name);

			svgEl.append('text')
				.attr('x', 30).attr('y', y + 5)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(band.freq);

			svgEl.append('text')
				.attr('x', 30).attr('y', y + 20)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(`λ = ${band.wavelength}`);

			// Wave container background
			svgEl.append('rect')
				.attr('x', 175).attr('y', y - 28)
				.attr('width', 310).attr('height', 56)
				.attr('fill', band.color)
				.attr('fill-opacity', 0.05)
				.attr('stroke', band.color)
				.attr('stroke-opacity', 0.3)
				.attr('stroke-width', 1)
				.attr('rx', 4);

			// Animated wave
			svgEl.append('path')
				.attr('class', `wave-${i}`)
				.attr('d', generateWavePath(180, 480, y, 18, band.waveCount, 0))
				.attr('fill', 'none')
				.attr('stroke', band.color)
				.attr('stroke-width', 2.5);

			// Range label on right
			svgEl.append('text')
				.attr('x', 510).attr('y', y - 5)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text('Range:');

			svgEl.append('text')
				.attr('x', 510).attr('y', y + 12)
				.attr('fill', band.color)
				.attr('font-size', '11px')
				.attr('font-weight', 'bold')
				.text(band.range);
		});

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Higher frequency → Shorter wavelength → More bandwidth, but shorter range');

		// Start wave animation
		updateWaves();

		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => {
		if (animationFrame) cancelAnimationFrame(animationFrame);
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
