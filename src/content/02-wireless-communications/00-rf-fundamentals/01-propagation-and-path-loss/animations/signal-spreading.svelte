<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;
	let rippleFrame: number | null = null;
	let ripplePhase = $state(0);

	const totalSteps = 4;
	const maxStep = totalSteps - 1;

	// Step 0: Show transmitter
	// Step 1: Show expanding ripples
	// Step 2: Show receiver close (strong signal)
	// Step 3: Show receiver far (weak signal)

	let display = $derived.by(() => {
		return {
			showTransmitter: currentStep >= 0,
			showRipples: currentStep >= 1,
			showCloseReceiver: currentStep === 2,
			showFarReceiver: currentStep === 3,
			label:
				currentStep === 0 ? 'Transmitter sends a signal' :
				currentStep === 1 ? 'Signal spreads outward in all directions' :
				currentStep === 2 ? 'Close receiver: strong signal (small area)' :
				'Far receiver: weak signal (same energy, larger area)'
		};
	});

	function animateRipples() {
		ripplePhase = (ripplePhase + 0.02) % 1;
		rippleFrame = requestAnimationFrame(animateRipples);
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
		}, 2500);
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
		animateRipples();
	});

	onDestroy(() => {
		pause();
		if (rippleFrame) cancelAnimationFrame(rippleFrame);
	});

	// Ripple calculations - 3 expanding rings
	let ripples = $derived([0, 1, 2].map(i => {
		const phase = (ripplePhase + i * 0.33) % 1;
		const radius = 30 + phase * 120;
		const opacity = 0.6 * (1 - phase);
		return { radius, opacity };
	}));
</script>

<div class="container">
	<svg viewBox="-100 0 500 200" class="diagram">
		<!-- Transmitter -->
		{#if display.showTransmitter}
			<g class="transmitter">
				<!-- Antenna icon -->
				<line x1="60" y1="100" x2="60" y2="70" class="antenna-pole" />
				<line x1="50" y1="75" x2="60" y2="65" class="antenna-arm" />
				<line x1="70" y1="75" x2="60" y2="65" class="antenna-arm" />
				<circle cx="60" cy="100" r="8" class="antenna-base" />
				<text x="60" y="125" class="label">TX</text>
			</g>
		{/if}

		<!-- Expanding ripples -->
		{#if display.showRipples}
			{#each ripples as ripple}
				<circle
					cx="60"
					cy="100"
					r={ripple.radius}
					class="ripple"
					style="opacity: {ripple.opacity}"
				/>
			{/each}
		{/if}

		<!-- Close receiver -->
		{#if display.showCloseReceiver}
			<g class="receiver close">
				<rect x="130" y="90" width="20" height="20" rx="3" class="receiver-box" />
				<line x1="140" y1="90" x2="140" y2="75" class="receiver-antenna" />
				<text x="140" y="125" class="label">RX</text>

				<!-- Signal strength indicator -->
				<g class="signal-strength" transform="translate(165, 85)">
					<rect x="0" y="10" width="6" height="10" class="bar strong" />
					<rect x="8" y="5" width="6" height="15" class="bar strong" />
					<rect x="16" y="0" width="6" height="20" class="bar strong" />
				</g>
				<text x="185" y="120" class="strength-label strong">Strong</text>
			</g>
		{/if}

		<!-- Far receiver -->
		{#if display.showFarReceiver}
			<g class="receiver far">
				<rect x="310" y="90" width="20" height="20" rx="3" class="receiver-box" />
				<line x1="320" y1="90" x2="320" y2="75" class="receiver-antenna" />
				<text x="320" y="125" class="label">RX</text>

				<!-- Signal strength indicator -->
				<g class="signal-strength" transform="translate(345, 85)">
					<rect x="0" y="15" width="6" height="5" class="bar weak" />
					<rect x="8" y="13" width="6" height="7" class="bar weak" />
					<rect x="16" y="10" width="6" height="10" class="bar dim" />
				</g>
				<text x="365" y="120" class="strength-label weak">Weak</text>
			</g>

			<!-- Distance annotation -->
			<line x1="70" y1="160" x2="310" y2="160" class="distance-line" />
			<text x="190" y="180" class="distance-label">Same energy spread over larger area</text>
		{/if}
	</svg>

	<div class="label-text">{display.label}</div>
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
		max-width: 450px;
		height: auto;
	}

	.antenna-pole, .antenna-arm {
		stroke: var(--color-math);
		stroke-width: 3;
		stroke-linecap: round;
	}

	.antenna-base {
		fill: var(--color-math);
	}

	.ripple {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.receiver-box {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 2;
	}

	.receiver-antenna {
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		stroke-linecap: round;
	}

	.label {
		font-size: 0.75rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.bar {
		rx: 1;
	}

	.bar.strong {
		fill: var(--color-accent);
	}

	.bar.weak {
		fill: var(--color-error);
	}

	.bar.dim {
		fill: var(--color-border);
	}

	.strength-label {
		font-size: 0.65rem;
		text-anchor: middle;
	}

	.strength-label.strong {
		fill: var(--color-accent);
	}

	.strength-label.weak {
		fill: var(--color-error);
	}

	.distance-line {
		stroke: var(--color-fg-muted);
		stroke-width: 1;
		stroke-dasharray: 4 2;
	}

	.distance-label {
		font-size: 0.65rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.label-text {
		font-size: 1rem;
		color: var(--color-fg);
		font-style: italic;
		text-align: center;
	}
</style>
