<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;
	let waveFrame: number | null = null;
	let waveOffset = $state(0);

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Step 0: Show signal waves flowing
	// Step 1: Show low frequency antenna with large aperture
	// Step 2: Show captured signal (lots)
	// Step 3: Show high frequency antenna with small aperture
	// Step 4: Show captured signal (little) + comparison

	let display = $derived.by(() => {
		return {
			showWaves: currentStep >= 0,
			showLowFreqAntenna: currentStep >= 1,
			showLowFreqCapture: currentStep >= 2,
			showHighFreqAntenna: currentStep >= 3,
			showHighFreqCapture: currentStep >= 4,
			showComparison: currentStep >= 4,
			label:
				currentStep === 0 ? 'Signal energy spreads out uniformly...' :
				currentStep === 1 ? 'Low frequency antenna: LARGE capture window' :
				currentStep === 2 ? 'Catches a lot of the passing signal' :
				currentStep === 3 ? 'High frequency antenna: SMALL capture window' :
				'Same signal, but catches much less!'
		};
	});

	function animateWaves() {
		waveOffset = (waveOffset + 1.5) % 40;
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
		}, 2200);
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

	// Generate wave lines
	let waveLines = $derived(
		Array.from({ length: 12 }, (_, i) => ({
			x: (i * 40 + waveOffset) % 480 - 40,
			opacity: 0.3 + Math.sin(i * 0.5) * 0.15
		}))
	);
</script>

<div class="container">
	<svg viewBox="0 0 440 220" class="diagram">
		<!-- Signal waves flowing left to right -->
		{#if display.showWaves}
			<g class="waves">
				{#each waveLines as wave}
					<line
						x1={wave.x}
						y1="20"
						x2={wave.x}
						y2="200"
						class="wave-line"
						style="opacity: {wave.opacity}"
					/>
				{/each}
			</g>
			<text x="220" y="15" class="title">Signal energy (same everywhere)</text>
		{/if}

		<!-- Low frequency antenna (left side) -->
		{#if display.showLowFreqAntenna}
			<g class="antenna low-freq" transform="translate(80, 50)">
				<!-- Large aperture window -->
				<rect
					x="0" y="0"
					width="60" height="120"
					class="aperture large"
					class:capturing={display.showLowFreqCapture}
				/>

				<!-- Antenna icon -->
				<circle cx="30" cy="140" r="8" class="antenna-point" />
				<line x1="30" y1="132" x2="30" y2="120" class="antenna-stem" />

				<!-- Labels -->
				<text x="30" y="170" class="freq-label">900 MHz</text>
				<text x="30" y="185" class="aperture-label">λ ≈ 33 cm</text>

				{#if display.showLowFreqCapture}
					<!-- Captured signal indicator -->
					<g class="captured" transform="translate(70, 40)">
						<rect x="0" y="0" width="50" height="40" rx="4" class="capture-box high" />
						<text x="25" y="25" class="capture-text">LOTS</text>
					</g>
				{/if}
			</g>
		{/if}

		<!-- High frequency antenna (right side) -->
		{#if display.showHighFreqAntenna}
			<g class="antenna high-freq" transform="translate(280, 50)">
				<!-- Small aperture window -->
				<rect
					x="15" y="40"
					width="30" height="40"
					class="aperture small"
					class:capturing={display.showHighFreqCapture}
				/>

				<!-- Antenna icon -->
				<circle cx="30" cy="140" r="8" class="antenna-point" />
				<line x1="30" y1="132" x2="30" y2="80" class="antenna-stem" />

				<!-- Labels -->
				<text x="30" y="170" class="freq-label">5 GHz</text>
				<text x="30" y="185" class="aperture-label">λ ≈ 6 cm</text>

				{#if display.showHighFreqCapture}
					<!-- Captured signal indicator -->
					<g class="captured" transform="translate(55, 40)">
						<rect x="0" y="0" width="50" height="40" rx="4" class="capture-box low" />
						<text x="25" y="25" class="capture-text">little</text>
					</g>
				{/if}
			</g>
		{/if}

	</svg>

	<div class="label-text">{display.label}</div>

	{#if display.showComparison}
		<div class="insight">
			<span class="key">Same signal.</span>
			<span class="result">Different capture area.</span>
			<span class="conclusion">Different received power.</span>
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 1rem;
	}

	.diagram {
		width: 100%;
		max-width: 480px;
		height: auto;
	}

	.title {
		font-size: 0.7rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.wave-line {
		stroke: var(--color-accent);
		stroke-width: 2;
		stroke-dasharray: 8 4;
	}

	.aperture {
		fill: none;
		stroke-width: 3;
		stroke-dasharray: none;
		transition: all 0.3s ease;
	}

	.aperture.large {
		stroke: var(--color-accent);
	}

	.aperture.small {
		stroke: var(--color-error);
	}

	.aperture.capturing {
		fill-opacity: 0.15;
	}

	.aperture.large.capturing {
		fill: var(--color-accent);
	}

	.aperture.small.capturing {
		fill: var(--color-error);
	}

	.antenna-point {
		fill: var(--color-math);
	}

	.antenna-stem {
		stroke: var(--color-math);
		stroke-width: 2;
	}

	.freq-label {
		font-size: 0.75rem;
		font-weight: bold;
		fill: var(--color-fg);
		text-anchor: middle;
	}

	.aperture-label {
		font-size: 0.6rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.capture-box {
		stroke-width: 2;
	}

	.capture-box.high {
		fill: var(--color-accent);
		fill-opacity: 0.2;
		stroke: var(--color-accent);
	}

	.capture-box.low {
		fill: var(--color-error);
		fill-opacity: 0.2;
		stroke: var(--color-error);
	}

	.capture-text {
		font-size: 0.7rem;
		font-weight: bold;
		text-anchor: middle;
		dominant-baseline: middle;
		fill: var(--color-fg);
	}

	.vs-text {
		font-size: 0.8rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.compare-line {
		stroke: var(--color-fg-muted);
		stroke-width: 1;
		stroke-dasharray: 4 2;
	}

	.label-text {
		font-size: 1rem;
		color: var(--color-fg);
		font-style: italic;
		text-align: center;
	}

	.insight {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		padding: 0.75rem 1rem;
		background: var(--color-bg-card);
		border-radius: 0.35rem;
	}

	.key {
		color: var(--color-fg);
	}

	.result {
		color: var(--color-math);
		font-weight: bold;
	}

	.conclusion {
		color: var(--color-error);
	}
</style>
