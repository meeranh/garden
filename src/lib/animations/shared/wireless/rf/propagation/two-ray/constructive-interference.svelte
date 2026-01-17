<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;
	let waveFrame: number | null = null;
	let phase = $state(0);
	let mergeProgress = $state(0);

	const totalSteps = 4;
	const maxStep = totalSteps - 1;

	// Step 0: Show two separate waves
	// Step 1: Waves start moving together
	// Step 2: Waves overlapping, showing combination
	// Step 3: Final combined wave

	let display = $derived.by(() => {
		return {
			step: currentStep,
			label:
				currentStep === 0 ? 'Two waves, both in sync (same phase)' :
				currentStep === 1 ? 'They meet at the same point...' :
				currentStep === 2 ? 'Peaks align with peaks!' :
				'Result: DOUBLE the amplitude!'
		};
	});

	// Wave vertical positions - merge together over steps
	let wave1Y = $derived(
		currentStep === 0 ? 45 :
		currentStep === 1 ? 65 :
		85
	);
	let wave2Y = $derived(
		currentStep === 0 ? 125 :
		currentStep === 1 ? 105 :
		85
	);

	function animateWaves() {
		phase = (phase + 0.04) % (Math.PI * 2);
		waveFrame = requestAnimationFrame(animateWaves);
	}

	function scheduleNext() {
		if (!isPlaying) return;
		animationTimer = setTimeout(() => {
			if (!isPlaying) return;
			if (currentStep < maxStep) {
				currentStep++;
				scheduleNext();
			} else {
				isPlaying = false;
			}
		}, 1800);
	}

	function play() {
		if (isPlaying) return;
		isPlaying = true;
		if (currentStep >= maxStep) currentStep = 0;
		scheduleNext();
	}

	function pause() {
		isPlaying = false;
		if (animationTimer) {
			clearTimeout(animationTimer);
			animationTimer = null;
		}
	}

	function next() { if (currentStep < maxStep) currentStep++; }
	function prev() { if (currentStep > 0) currentStep--; }
	function skip() { pause(); currentStep = maxStep; }
	function replay() { pause(); currentStep = 0; play(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	onMount(() => {
		register?.({ play, pause, next, prev, skip, replay, getState });
		animateWaves();
	});

	onDestroy(() => {
		pause();
		if (waveFrame) cancelAnimationFrame(waveFrame);
	});

	// Generate wave path
	function generateWavePath(yOffset: number, amplitude: number, phaseOffset: number = 0): string {
		const points: string[] = [];
		for (let x = 20; x <= 280; x += 4) {
			const y = yOffset + amplitude * Math.sin((x / 25) + phase + phaseOffset);
			points.push(`${x},${y}`);
		}
		return `M ${points.join(' L ')}`;
	}

	let wave1Path = $derived(generateWavePath(wave1Y, 25, 0));
	let wave2Path = $derived(generateWavePath(wave2Y, 25, 0)); // Same phase
	let combinedPath = $derived(generateWavePath(85, 50, 0)); // Double amplitude
</script>

<div class="container">
	<svg viewBox="0 0 300 180" class="diagram">
		<!-- Wave 1 -->
		<g class="wave1" style="opacity: {currentStep >= 3 ? 0.2 : 1}; transition: opacity 0.5s">
			<path d={wave1Path} class="wave-path stroke1" style="transition: d 0.6s ease-out" />
			{#if currentStep < 2}
				<text x="285" y={wave1Y + 5} class="wave-label label1">1</text>
			{/if}
		</g>

		<!-- Wave 2 -->
		<g class="wave2" style="opacity: {currentStep >= 3 ? 0.2 : 1}; transition: opacity 0.5s">
			<path d={wave2Path} class="wave-path stroke2" style="transition: d 0.6s ease-out" />
			{#if currentStep < 2}
				<text x="285" y={wave2Y + 5} class="wave-label label2">2</text>
			{/if}
		</g>

		<!-- Combined wave (shown at end) -->
		{#if currentStep >= 3}
			<g class="combined">
				<path d={combinedPath} class="wave-path stroke-combined" />
			</g>
		{/if}

		<!-- Visual indicator when overlapping -->
		{#if currentStep === 2}
			<g class="peak-indicator" transform="translate(150, 40)">
				<text x="0" y="0" class="indicator-text">↑ Peak + Peak</text>
			</g>
		{/if}

		<!-- Amplitude comparison -->
		{#if currentStep >= 3}
			<g class="amplitude-compare">
				<line x1="12" y1="60" x2="12" y2="110" class="amp-line dim" />
				<text x="12" y="125" class="amp-text dim">1x</text>

				<line x1="30" y1="35" x2="30" y2="135" class="amp-line bright" />
				<text x="30" y="150" class="amp-text bright">2x</text>
			</g>
		{/if}
	</svg>

	<div class="label-text">{display.label}</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
	}

	.diagram {
		width: 100%;
		max-width: 340px;
		height: auto;
		background: var(--color-bg-card);
		border-radius: 0.5rem;
	}

	.wave-path {
		fill: none;
		stroke-width: 3;
	}

	.stroke1 {
		stroke: var(--color-accent);
	}

	.stroke2 {
		stroke: var(--color-math);
	}

	.stroke-combined {
		stroke: var(--color-accent);
		stroke-width: 4;
	}

	.wave-label {
		font-size: 0.8rem;
		font-weight: bold;
	}

	.label1 {
		fill: var(--color-accent);
	}

	.label2 {
		fill: var(--color-math);
	}

	.indicator-text {
		font-size: 0.7rem;
		fill: var(--color-fg);
		text-anchor: middle;
		font-weight: bold;
	}

	.amp-line {
		stroke-width: 2;
		stroke-linecap: round;
	}

	.amp-line.dim {
		stroke: var(--color-fg-muted);
		stroke-dasharray: 4 2;
	}

	.amp-line.bright {
		stroke: var(--color-accent);
	}

	.amp-text {
		font-size: 0.65rem;
		text-anchor: middle;
	}

	.amp-text.dim {
		fill: var(--color-fg-muted);
	}

	.amp-text.bright {
		fill: var(--color-accent);
		font-weight: bold;
	}

	.label-text {
		font-size: 0.95rem;
		color: var(--color-fg);
		font-style: italic;
		text-align: center;
	}
</style>
