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

	const bits = [1, 0, 1, 1, 0, 1];
	const maxStep = bits.length;
	const width = 500;
	const height = 220;
	const waveY = 140;
	const waveAmplitude = 40;
	const bitWidth = 60;
	const startX = 50;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => {
			timeouts.push(setTimeout(r, ms));
		});
	}
	function clearTimeouts() {
		timeouts.forEach(clearTimeout);
		timeouts = [];
	}

	function generateBitWave(bit: number, startX: number, bitWidth: number): [number, number][] {
		const points: [number, number][] = [];
		const numPoints = 50;
		// Higher frequency for 1, lower for 0
		const frequency = bit === 1 ? 6 : 2;

		for (let i = 0; i <= numPoints; i++) {
			const x = startX + (i / numPoints) * bitWidth;
			const t = (i / numPoints) * Math.PI * frequency;
			const y = waveY - waveAmplitude * Math.sin(t);
			points.push([x, y]);
		}
		return points;
	}

	function applyStep(step: number) {
		currentStep = step;

		for (let i = 0; i < bits.length; i++) {
			const isActive = i < step;
			const isCurrent = i === step - 1;

			svgEl.select(`.bit-${i}`)
				.transition()
				.duration(300)
				.attr('fill', isActive ? (bits[i] === 1 ? colors.accent : '#fb4934') : colors.border);

			svgEl.select(`.wave-${i}`)
				.transition()
				.duration(300)
				.attr('opacity', isActive ? 1 : 0.2)
				.attr('stroke', isCurrent ? colors.yellow : colors.accent);
		}
	}

	async function runAnimation() {
		if (!isPlaying) return;

		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(800);
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
			.text('FSK: Frequency Shift Keying');

		// Bit labels row
		svgEl.append('text')
			.attr('x', 25)
			.attr('y', 60)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Bits:');

		// Center line
		svgEl.append('line')
			.attr('x1', startX)
			.attr('x2', startX + bits.length * bitWidth)
			.attr('y1', waveY)
			.attr('y2', waveY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,2');

		const line = d3.line<[number, number]>()
			.x(d => d[0])
			.y(d => d[1])
			.curve(d3.curveBasis);

		// Draw bits and waves
		for (let i = 0; i < bits.length; i++) {
			const x = startX + i * bitWidth;

			// Bit label
			svgEl.append('text')
				.attr('class', `bit-${i}`)
				.attr('x', x + bitWidth / 2)
				.attr('y', 60)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.border)
				.attr('font-size', '16px')
				.attr('font-weight', 'bold')
				.text(bits[i]);

			// Vertical separator
			if (i > 0) {
				svgEl.append('line')
					.attr('x1', x)
					.attr('x2', x)
					.attr('y1', waveY - waveAmplitude - 10)
					.attr('y2', waveY + waveAmplitude + 10)
					.attr('stroke', colors.border)
					.attr('stroke-width', 1)
					.attr('stroke-dasharray', '2,2')
					.attr('opacity', 0.5);
			}

			// Wave for this bit
			const waveData = generateBitWave(bits[i], x, bitWidth);
			svgEl.append('path')
				.attr('class', `wave-${i}`)
				.attr('d', line(waveData))
				.attr('fill', 'none')
				.attr('stroke', colors.accent)
				.attr('stroke-width', 2.5)
				.attr('opacity', 0.2);
		}

		// Legend
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 205)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('1 = high frequency  •  0 = low frequency');

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
