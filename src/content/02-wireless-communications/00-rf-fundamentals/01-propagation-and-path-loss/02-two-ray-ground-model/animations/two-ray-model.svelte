<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;
	let waveFrame: number | null = null;
	let wavePhase = $state(0);

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Step 0: Show transmitter and receiver
	// Step 1: Show direct ray
	// Step 2: Show reflected ray
	// Step 3: Show both arriving (constructive)
	// Step 4: Show interference note

	let display = $derived.by(() => {
		return {
			showAntennas: currentStep >= 0,
			showGround: currentStep >= 0,
			showDirectRay: currentStep >= 1,
			showReflectedRay: currentStep >= 2,
			showBothArriving: currentStep >= 3,
			showInterference: currentStep >= 4,
			label:
				currentStep === 0 ? 'Transmitter and receiver on the ground' :
				currentStep === 1 ? 'Direct ray: straight line path' :
				currentStep === 2 ? 'Reflected ray: bounces off the ground' :
				currentStep === 3 ? 'Receiver gets BOTH signals' :
				'They can add (constructive) or cancel (destructive)'
		};
	});

	function animateWaves() {
		wavePhase = (wavePhase + 0.03) % (Math.PI * 2);
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

	// Positions
	const txX = 60, txY = 100;
	const rxX = 340, rxY = 100;
	const groundY = 150;
	const reflectX = 200, reflectY = groundY;

	// Animated pulse positions along paths
	let directPulse = $derived({
		x: txX + (rxX - txX) * ((Math.sin(wavePhase) + 1) / 2),
		y: txY
	});

	let reflectedPulse = $derived(() => {
		const t = (Math.sin(wavePhase - 0.5) + 1) / 2;
		if (t < 0.5) {
			// First half: tx to reflection point
			const progress = t * 2;
			return {
				x: txX + (reflectX - txX) * progress,
				y: txY + (reflectY - txY) * progress
			};
		} else {
			// Second half: reflection point to rx
			const progress = (t - 0.5) * 2;
			return {
				x: reflectX + (rxX - reflectX) * progress,
				y: reflectY + (rxY - reflectY) * progress
			};
		}
	});
</script>

<div class="container">
	<svg viewBox="0 0 400 200" class="diagram">
		<defs>
			<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
				<polygon points="0 0, 10 3.5, 0 7" fill="var(--color-accent)" />
			</marker>
			<marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
				<polygon points="0 0, 10 3.5, 0 7" fill="var(--color-error)" />
			</marker>
		</defs>

		<!-- Ground -->
		{#if display.showGround}
			<line x1="20" y1={groundY} x2="380" y2={groundY} class="ground" />
			<text x="200" y={groundY + 18} class="ground-label">Ground</text>
		{/if}

		<!-- Transmitter -->
		{#if display.showAntennas}
			<g class="transmitter">
				<line x1={txX} y1={txY} x2={txX} y2={groundY} class="tower" />
				<circle cx={txX} cy={txY} r="6" class="antenna-point tx" />
				<text x={txX} y={txY - 15} class="label">TX</text>
			</g>

			<!-- Receiver -->
			<g class="receiver">
				<line x1={rxX} y1={rxY} x2={rxX} y2={groundY} class="tower" />
				<circle cx={rxX} cy={rxY} r="6" class="antenna-point rx" />
				<text x={rxX} y={rxY - 15} class="label">RX</text>
			</g>
		{/if}

		<!-- Direct ray -->
		{#if display.showDirectRay}
			<line
				x1={txX + 8} y1={txY}
				x2={rxX - 10} y2={rxY}
				class="ray direct"
				marker-end="url(#arrowhead)"
			/>
			<text x="200" y={txY - 15} class="ray-label direct">Direct Ray</text>

			<!-- Animated pulse on direct path -->
			{#if display.showBothArriving}
				<circle cx={directPulse.x} cy={directPulse.y} r="4" class="pulse direct" />
			{/if}
		{/if}

		<!-- Reflected ray -->
		{#if display.showReflectedRay}
			<!-- TX to reflection point -->
			<line
				x1={txX + 6} y1={txY + 4}
				x2={reflectX} y2={reflectY - 3}
				class="ray reflected"
			/>
			<!-- Reflection point to RX -->
			<line
				x1={reflectX} y1={reflectY - 3}
				x2={rxX - 8} y2={rxY + 4}
				class="ray reflected"
				marker-end="url(#arrowhead-red)"
			/>

			<!-- Reflection point indicator -->
			<circle cx={reflectX} cy={reflectY} r="4" class="reflection-point" />

			<text x="130" y="135" class="ray-label reflected">Reflected Ray</text>

			<!-- Animated pulse on reflected path -->
			{#if display.showBothArriving}
				<circle cx={reflectedPulse().x} cy={reflectedPulse().y} r="4" class="pulse reflected" />
			{/if}
		{/if}

		<!-- Interference indicator -->
		{#if display.showInterference}
			<g class="interference" transform="translate(280, 55)">
				<rect x="0" y="0" width="100" height="40" rx="4" class="info-box" />
				<text x="50" y="17" class="info-title">Interference:</text>
				<text x="50" y="32" class="info-text">+ or - ?</text>
			</g>
		{/if}
	</svg>

	<div class="label-text">{display.label}</div>

	{#if display.showInterference}
		<div class="interference-note">
			<span class="constructive">In phase → Stronger</span>
			<span class="separator">|</span>
			<span class="destructive">Out of phase → Weaker</span>
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
		max-width: 450px;
		height: auto;
	}

	.ground {
		stroke: var(--color-border);
		stroke-width: 3;
	}

	.ground-label {
		font-size: 0.65rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.tower {
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		stroke-dasharray: 4 2;
	}

	.antenna-point.tx {
		fill: var(--color-math);
	}

	.antenna-point.rx {
		fill: var(--color-fg);
	}

	.label {
		font-size: 0.75rem;
		font-weight: bold;
		fill: var(--color-fg);
		text-anchor: middle;
	}

	.ray {
		stroke-width: 2;
	}

	.ray.direct {
		stroke: var(--color-accent);
	}

	.ray.reflected {
		stroke: var(--color-error);
	}

	.ray-label {
		font-size: 0.65rem;
		text-anchor: middle;
	}

	.ray-label.direct {
		fill: var(--color-accent);
	}

	.ray-label.reflected {
		fill: var(--color-error);
	}

	.reflection-point {
		fill: var(--color-error);
		opacity: 0.7;
	}

	.pulse {
		opacity: 0.8;
	}

	.pulse.direct {
		fill: var(--color-accent);
	}

	.pulse.reflected {
		fill: var(--color-error);
	}

	.info-box {
		fill: var(--color-bg-card);
		stroke: var(--color-border);
		stroke-width: 1;
	}

	.info-title {
		font-size: 0.6rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.info-text {
		font-size: 0.7rem;
		fill: var(--color-fg);
		text-anchor: middle;
		font-weight: bold;
	}

	.label-text {
		font-size: 1rem;
		color: var(--color-fg);
		font-style: italic;
		text-align: center;
	}

	.interference-note {
		display: flex;
		gap: 0.75rem;
		font-size: 0.85rem;
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border-radius: 0.35rem;
	}

	.constructive {
		color: var(--color-accent);
	}

	.destructive {
		color: var(--color-error);
	}

	.separator {
		color: var(--color-fg-muted);
	}
</style>
