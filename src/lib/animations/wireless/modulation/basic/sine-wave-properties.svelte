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
	const height = 280;
	const waveY = 160;
	const waveAmplitude = 50;
	const waveStartX = 50;
	const waveEndX = 450;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => {
			timeouts.push(setTimeout(r, ms));
		});
	}
	function clearTimeouts() {
		timeouts.forEach(clearTimeout);
		timeouts = [];
	}

	function generateWave(
		amplitude: number,
		frequency: number,
		phase: number,
		numPoints: number = 200
	): [number, number][] {
		const points: [number, number][] = [];
		for (let i = 0; i < numPoints; i++) {
			const x = waveStartX + (i / (numPoints - 1)) * (waveEndX - waveStartX);
			const t = (i / (numPoints - 1)) * Math.PI * 4 * frequency;
			const y = waveY - amplitude * Math.sin(t + phase);
			points.push([x, y]);
		}
		return points;
	}

	function applyStep(step: number) {
		currentStep = step;

		let amplitude = waveAmplitude;
		let frequency = 1;
		let phase = 0;
		let label = 'Normal sine wave';
		let highlight = '';

		if (step === 1) {
			amplitude = waveAmplitude * 0.5;
			label = 'Lower AMPLITUDE';
			highlight = 'amplitude';
		} else if (step === 2) {
			frequency = 2;
			label = 'Higher FREQUENCY';
			highlight = 'frequency';
		} else if (step === 3) {
			phase = Math.PI;
			label = 'Shifted PHASE (180°)';
			highlight = 'phase';
		}

		const line = d3.line<[number, number]>()
			.x(d => d[0])
			.y(d => d[1])
			.curve(d3.curveBasis);

		const waveData = generateWave(amplitude, frequency, phase);

		svgEl.select('.wave-path')
			.transition()
			.duration(600)
			.attr('d', line(waveData));

		svgEl.select('.wave-label')
			.text(label);

		// Update property labels
		svgEl.select('.prop-amplitude')
			.transition()
			.duration(300)
			.attr('fill', highlight === 'amplitude' ? colors.yellow : colors.fgMuted);

		svgEl.select('.prop-frequency')
			.transition()
			.duration(300)
			.attr('fill', highlight === 'frequency' ? colors.yellow : colors.fgMuted);

		svgEl.select('.prop-phase')
			.transition()
			.duration(300)
			.attr('fill', highlight === 'phase' ? colors.yellow : colors.fgMuted);
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
			.text('Three Properties of a Sine Wave');

		// Center line (zero)
		svgEl.append('line')
			.attr('x1', waveStartX)
			.attr('x2', waveEndX)
			.attr('y1', waveY)
			.attr('y2', waveY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,2');

		// Wave path
		const line = d3.line<[number, number]>()
			.x(d => d[0])
			.y(d => d[1])
			.curve(d3.curveBasis);

		const initialWave = generateWave(waveAmplitude, 1, 0);

		svgEl.append('path')
			.attr('class', 'wave-path')
			.attr('d', line(initialWave))
			.attr('fill', 'none')
			.attr('stroke', colors.accent)
			.attr('stroke-width', 3);

		// Property labels on the right
		const propX = 80;
		const propY = 250;

		svgEl.append('text')
			.attr('class', 'prop-amplitude')
			.attr('x', propX)
			.attr('y', propY)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Amplitude');

		svgEl.append('text')
			.attr('class', 'prop-frequency')
			.attr('x', propX + 120)
			.attr('y', propY)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Frequency');

		svgEl.append('text')
			.attr('class', 'prop-phase')
			.attr('x', propX + 240)
			.attr('y', propY)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Phase');

		// Wave label
		svgEl.append('text')
			.attr('class', 'wave-label')
			.attr('x', width / 2)
			.attr('y', 55)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('Normal sine wave');

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
