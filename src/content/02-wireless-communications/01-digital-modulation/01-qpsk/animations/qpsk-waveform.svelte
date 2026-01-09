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

	// Bit pairs and their corresponding phases
	const bitPairs = [
		{ bits: '00', phase: 45 },
		{ bits: '11', phase: 225 },
		{ bits: '01', phase: 135 },
		{ bits: '10', phase: 315 }
	];

	const maxStep = bitPairs.length;
	const width = 500;
	const height = 220;
	const waveY = 140;
	const waveAmplitude = 40;
	const symbolWidth = 80;
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

	function generateSymbolWave(phaseDeg: number, startX: number, symbolWidth: number): [number, number][] {
		const points: [number, number][] = [];
		const numPoints = 50;
		const phaseRad = (phaseDeg * Math.PI) / 180;

		for (let i = 0; i <= numPoints; i++) {
			const x = startX + (i / numPoints) * symbolWidth;
			const t = (i / numPoints) * Math.PI * 4;
			const y = waveY - waveAmplitude * Math.sin(t + phaseRad);
			points.push([x, y]);
		}
		return points;
	}

	function applyStep(step: number) {
		currentStep = step;

		const symbolColors = [colors.accent, '#fb4934', colors.yellow, '#83a598'];

		for (let i = 0; i < bitPairs.length; i++) {
			const isActive = i < step;
			const isCurrent = i === step - 1;

			svgEl.select(`.bits-${i}`)
				.transition()
				.duration(300)
				.attr('fill', isActive ? symbolColors[i] : colors.border);

			svgEl.select(`.phase-${i}`)
				.transition()
				.duration(300)
				.attr('opacity', isActive ? 0.8 : 0);

			svgEl.select(`.wave-${i}`)
				.transition()
				.duration(300)
				.attr('opacity', isActive ? 1 : 0.2)
				.attr('stroke', isCurrent ? colors.yellow : symbolColors[i]);
		}
	}

	async function runAnimation() {
		if (!isPlaying) return;

		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1000);
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

		const symbolColors = [colors.accent, '#fb4934', colors.yellow, '#83a598'];

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('QPSK Waveform: 2 bits per symbol');

		// Bit pairs label
		svgEl.append('text')
			.attr('x', 20)
			.attr('y', 55)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Bits:');

		// Phase label
		svgEl.append('text')
			.attr('x', 20)
			.attr('y', 75)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Phase:');

		// Center line
		svgEl.append('line')
			.attr('x1', startX)
			.attr('x2', startX + bitPairs.length * symbolWidth)
			.attr('y1', waveY)
			.attr('y2', waveY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,2');

		const line = d3.line<[number, number]>()
			.x(d => d[0])
			.y(d => d[1])
			.curve(d3.curveBasis);

		// Draw bit pairs and waves
		for (let i = 0; i < bitPairs.length; i++) {
			const x = startX + i * symbolWidth;
			const pair = bitPairs[i];

			// Bit pair label
			svgEl.append('text')
				.attr('class', `bits-${i}`)
				.attr('x', x + symbolWidth / 2)
				.attr('y', 55)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.border)
				.attr('font-size', '14px')
				.attr('font-weight', 'bold')
				.text(pair.bits);

			// Phase label
			svgEl.append('text')
				.attr('class', `phase-${i}`)
				.attr('x', x + symbolWidth / 2)
				.attr('y', 75)
				.attr('text-anchor', 'middle')
				.attr('fill', symbolColors[i])
				.attr('font-size', '11px')
				.text(`${pair.phase}°`)
				.attr('opacity', 0);

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

			// Wave for this symbol
			const waveData = generateSymbolWave(pair.phase, x, symbolWidth);
			svgEl.append('path')
				.attr('class', `wave-${i}`)
				.attr('d', line(waveData))
				.attr('fill', 'none')
				.attr('stroke', symbolColors[i])
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
			.text('Each symbol carries 2 bits • Phase determines which pair');

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
