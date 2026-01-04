<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	// Step 0: Alice and Bob appear
	// Step 1: Alice has a key
	// Step 2: Alice sends key over network
	// Step 3: Key traveling...
	// Step 4: Eve appears, intercepts
	// Step 5: Eve has the key
	// Step 6: Problem revealed

	let display = $derived.by(() => {
		return {
			showAlice: true,
			showBob: true,
			showEve: currentStep >= 4,

			aliceHasKey: currentStep === 1,
			keyTraveling: currentStep === 3,
			eveHasKey: currentStep >= 5,
			bobHasKey: currentStep >= 5,

			showNetwork: currentStep >= 2,
			keyX: currentStep === 2 ? 100 : currentStep === 3 ? 190 : currentStep >= 4 ? 280 : 100,

			label: currentStep === 0 ? 'Alice wants to send Bob a secret message' :
			       currentStep === 1 ? 'They need to share a key first' :
			       currentStep === 2 ? 'Alice sends the key over the network...' :
			       currentStep === 3 ? 'The key travels through the internet...' :
			       currentStep === 4 ? 'Eve is watching the network!' :
			       currentStep === 5 ? 'Eve copies the key' :
			       'Eve can now decrypt everything'
		};
	});

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

	onMount(() => register?.({ play, pause, next, prev, skip, replay, getState }));
	onDestroy(() => pause());
</script>

<div class="container">
	<svg viewBox="0 0 400 220" class="scene">
		<!-- Network line -->
		{#if display.showNetwork}
			<line x1="80" y1="140" x2="320" y2="140" class="network" />
			<text x="200" y="155" class="network-label">network</text>
		{/if}

		<!-- Alice (left) -->
		<g class="person alice">
			<text x="60" y="95" class="name">Alice</text>
			<!-- Head -->
			<circle cx="60" cy="115" r="12" class="head" />
			<!-- Body -->
			<line x1="60" y1="127" x2="60" y2="160" class="body" />
			<!-- Arms -->
			<line x1="60" y1="135" x2="42" y2="150" class="limb" />
			<line x1="60" y1="135" x2="78" y2="150" class="limb" />
			<!-- Legs -->
			<line x1="60" y1="160" x2="45" y2="185" class="limb" />
			<line x1="60" y1="160" x2="75" y2="185" class="limb" />
		</g>

		<!-- Key near Alice -->
		{#if display.aliceHasKey}
			<g class="key-shape" transform="translate(85, 125)">
				<circle cx="0" cy="0" r="6" class="key-head" />
				<line x1="6" y1="0" x2="20" y2="0" class="key-stem" />
				<line x1="16" y1="0" x2="16" y2="5" class="key-tooth" />
				<line x1="20" y1="0" x2="20" y2="5" class="key-tooth" />
			</g>
		{/if}

		<!-- Traveling key -->
		{#if currentStep >= 2 && currentStep <= 4}
			<g class="key-shape traveling" transform="translate({display.keyX}, 130)">
				<circle cx="0" cy="0" r="6" class="key-head" />
				<line x1="6" y1="0" x2="20" y2="0" class="key-stem" />
				<line x1="16" y1="0" x2="16" y2="5" class="key-tooth" />
				<line x1="20" y1="0" x2="20" y2="5" class="key-tooth" />
			</g>
		{/if}

		<!-- Bob (right) -->
		<g class="person bob">
			<text x="340" y="95" class="name">Bob</text>
			<!-- Head -->
			<circle cx="340" cy="115" r="12" class="head" />
			<!-- Body -->
			<line x1="340" y1="127" x2="340" y2="160" class="body" />
			<!-- Arms -->
			<line x1="340" y1="135" x2="322" y2="150" class="limb" />
			<line x1="340" y1="135" x2="358" y2="150" class="limb" />
			<!-- Legs -->
			<line x1="340" y1="160" x2="325" y2="185" class="limb" />
			<line x1="340" y1="160" x2="355" y2="185" class="limb" />
		</g>

		<!-- Key near Bob -->
		{#if display.bobHasKey}
			<g class="key-shape" transform="translate(295, 125)">
				<circle cx="0" cy="0" r="6" class="key-head" />
				<line x1="6" y1="0" x2="20" y2="0" class="key-stem" />
				<line x1="16" y1="0" x2="16" y2="5" class="key-tooth" />
				<line x1="20" y1="0" x2="20" y2="5" class="key-tooth" />
			</g>
		{/if}

		<!-- Eve (middle, eavesdropper) -->
		{#if display.showEve}
			<g class="person eve">
				<text x="200" y="15" class="name eve-name">Eve</text>
				<!-- Head -->
				<circle cx="200" cy="35" r="12" class="head eve-head" />
				<!-- Body -->
				<line x1="200" y1="47" x2="200" y2="80" class="body eve-body" />
				<!-- Arms -->
				<line x1="200" y1="55" x2="182" y2="70" class="limb eve-body" />
				<line x1="200" y1="55" x2="218" y2="70" class="limb eve-body" />
				<!-- Legs -->
				<line x1="200" y1="80" x2="185" y2="105" class="limb eve-body" />
				<line x1="200" y1="80" x2="215" y2="105" class="limb eve-body" />
			</g>
		{/if}

		<!-- Key near Eve -->
		{#if display.eveHasKey}
			<g class="key-shape eve-key" transform="translate(225, 45)">
				<circle cx="0" cy="0" r="5" class="key-head" />
				<line x1="5" y1="0" x2="16" y2="0" class="key-stem" />
				<line x1="12" y1="0" x2="12" y2="4" class="key-tooth" />
				<line x1="16" y1="0" x2="16" y2="4" class="key-tooth" />
			</g>
		{/if}
	</svg>

	<div class="label" class:danger={currentStep >= 4}>{display.label}</div>

	{#if currentStep >= 6}
		<div class="problem">This is the key distribution problem</div>
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

	.scene {
		width: 100%;
		max-width: 400px;
		height: auto;
	}

	.network {
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		stroke-dasharray: 8 4;
		opacity: 0.6;
	}

	.network-label {
		fill: var(--color-fg-muted);
		font-size: 11px;
		text-anchor: middle;
		opacity: 0.6;
	}

	.person .head {
		fill: var(--color-bg-card);
		stroke: var(--color-accent);
		stroke-width: 2.5;
	}

	.person .body,
	.person .limb {
		stroke: var(--color-accent);
		stroke-width: 2.5;
		stroke-linecap: round;
	}

	.person .name {
		fill: var(--color-fg);
		font-size: 13px;
		text-anchor: middle;
		font-weight: bold;
	}

	/* Eve styling */
	.eve-head {
		fill: var(--color-bg-card);
		stroke: var(--color-error) !important;
	}

	.eve-body {
		stroke: var(--color-error) !important;
	}

	.eve-name {
		fill: var(--color-error) !important;
	}

	/* Key shape */
	.key-shape .key-head {
		fill: none;
		stroke: var(--color-math);
		stroke-width: 2;
	}

	.key-shape .key-stem,
	.key-shape .key-tooth {
		stroke: var(--color-math);
		stroke-width: 2;
		stroke-linecap: round;
	}

	.key-shape.traveling {
		transition: transform 0.6s ease;
	}

	.key-shape.eve-key .key-head {
		stroke-width: 1.5;
	}

	.key-shape.eve-key .key-stem,
	.key-shape.eve-key .key-tooth {
		stroke-width: 1.5;
	}

	.label {
		font-size: 1.1rem;
		color: var(--color-fg);
		text-align: center;
		transition: color 0.3s ease;
	}

	.label.danger {
		color: var(--color-error);
	}

	.problem {
		font-size: 1rem;
		color: var(--color-math);
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 2px solid var(--color-math);
		border-radius: 0.5rem;
		font-weight: bold;
	}
</style>
