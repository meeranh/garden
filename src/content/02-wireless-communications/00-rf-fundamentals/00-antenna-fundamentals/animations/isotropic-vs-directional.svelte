<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;
	let pulseFrame: number | null = null;
	let pulsePhase = $state(0);

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Step 0: Show both antennas
	// Step 1: Isotropic radiates (circle)
	// Step 2: Directional radiates (focused beam)
	// Step 3: Show power comparison
	// Step 4: Show gain formula

	let display = $derived.by(() => {
		return {
			showAntennas: currentStep >= 0,
			showIsotropicWaves: currentStep >= 1,
			showDirectionalWaves: currentStep >= 2,
			showComparison: currentStep >= 3,
			showFormula: currentStep >= 4,
			label:
				currentStep === 0 ? 'Two antennas, same input power' :
				currentStep === 1 ? 'Isotropic: radiates equally in all directions' :
				currentStep === 2 ? 'Directional: focuses power in one direction' :
				currentStep === 3 ? 'Same power, different concentration' :
				'Gain = Directivity × Efficiency'
		};
	});

	function animatePulse() {
		pulsePhase = (pulsePhase + 0.03) % (Math.PI * 2);
		pulseFrame = requestAnimationFrame(animatePulse);
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
		}, 2000);
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
		animatePulse();
	});

	onDestroy(() => {
		pause();
		if (pulseFrame) cancelAnimationFrame(pulseFrame);
	});

	// Wave calculations
	let waveOpacity = $derived(0.3 + 0.2 * Math.sin(pulsePhase));
	let waveScale = $derived(1 + 0.1 * Math.sin(pulsePhase * 2));
</script>

<div class="container">
	<div class="antennas">
		<!-- Isotropic Side -->
		<div class="antenna-section">
			<div class="antenna-label">Isotropic</div>
			<svg viewBox="0 0 200 200" class="antenna-svg">
				<!-- Power indicator -->
				{#if display.showComparison}
					<text x="100" y="18" class="power-text">1x intensity</text>
				{/if}

				<!-- Antenna point -->
				<circle cx="100" cy="120" r="8" class="antenna-point" />

				<!-- Isotropic waves (circles) -->
				{#if display.showIsotropicWaves}
					<circle
						cx="100" cy="120"
						r={35 * waveScale}
						class="wave isotropic-wave"
						style="opacity: {waveOpacity}"
					/>
					<circle
						cx="100" cy="120"
						r={55 * waveScale}
						class="wave isotropic-wave"
						style="opacity: {waveOpacity * 0.7}"
					/>
					<circle
						cx="100" cy="120"
						r={75 * waveScale}
						class="wave isotropic-wave"
						style="opacity: {waveOpacity * 0.4}"
					/>
				{/if}
			</svg>
		</div>

		<!-- Directional Side -->
		<div class="antenna-section">
			<div class="antenna-label">Directional</div>
			<svg viewBox="0 0 200 200" class="antenna-svg">
				<!-- Power indicator -->
				{#if display.showComparison}
					<text x="100" y="18" class="power-text highlight">10x intensity</text>
				{/if}

				<!-- Antenna point -->
				<circle cx="100" cy="120" r="8" class="antenna-point" />

				<!-- Directional waves (focused beam) -->
				{#if display.showDirectionalWaves}
					<!-- Main lobe (focused) -->
					<ellipse
						cx="100" cy={75 - 10 * waveScale}
						rx={20 * waveScale}
						ry={40 * waveScale}
						class="wave directional-wave main-lobe"
						style="opacity: {waveOpacity * 1.5}"
					/>

					<!-- Side lobes (small) -->
					<ellipse
						cx={60 - 5 * waveScale} cy="120"
						rx={15 * waveScale}
						ry={10 * waveScale}
						class="wave directional-wave side-lobe"
						style="opacity: {waveOpacity * 0.3}"
					/>
					<ellipse
						cx={140 + 5 * waveScale} cy="120"
						rx={15 * waveScale}
						ry={10 * waveScale}
						class="wave directional-wave side-lobe"
						style="opacity: {waveOpacity * 0.3}"
					/>

					<!-- Back lobe (tiny) -->
					<ellipse
						cx="100" cy={160 + 5 * waveScale}
						rx={8 * waveScale}
						ry={12 * waveScale}
						class="wave directional-wave back-lobe"
						style="opacity: {waveOpacity * 0.2}"
					/>
				{/if}
			</svg>
		</div>
	</div>

	<div class="label">{display.label}</div>

	{#if display.showFormula}
		<div class="formula">
			<span class="gain">G</span> = <span class="directivity">D</span> × <span class="efficiency">η</span>
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

	.antennas {
		display: flex;
		gap: 2rem;
		justify-content: center;
	}

	.antenna-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.antenna-label {
		font-size: 0.9rem;
		color: var(--color-fg-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.antenna-svg {
		width: 180px;
		height: 180px;
	}

	.antenna-point {
		fill: var(--color-math);
	}

	.wave {
		fill: none;
		stroke-width: 2;
		transition: opacity 0.3s ease;
	}

	.isotropic-wave {
		stroke: var(--color-accent);
	}

	.directional-wave {
		stroke: var(--color-error);
		fill: var(--color-error);
		fill-opacity: 0.1;
	}

	.main-lobe {
		stroke-width: 3;
		fill-opacity: 0.2;
	}

	.side-lobe, .back-lobe {
		stroke-width: 1.5;
	}

	.power-text {
		font-size: 0.8rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.power-text.highlight {
		fill: var(--color-error);
		font-weight: bold;
	}

	.label {
		font-size: 1rem;
		color: var(--color-fg);
		font-style: italic;
		text-align: center;
	}

	.formula {
		font-size: 1.4rem;
		font-family: serif;
		padding: 0.75rem 1.5rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	.gain {
		color: var(--color-math);
		font-weight: bold;
	}

	.directivity {
		color: var(--color-accent);
	}

	.efficiency {
		color: var(--color-error);
	}
</style>
