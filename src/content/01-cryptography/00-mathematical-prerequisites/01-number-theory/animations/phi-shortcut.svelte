<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

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
		}, 1400);
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
	<div class="row">
		<span class="math">φ(15) = ?</span>
	</div>

	{#if currentStep >= 1}
		<div class="row">
			<span class="math">15 = 3 × 5</span>
			<span class="label">factor into primes</span>
		</div>
	{/if}

	{#if currentStep >= 2}
		<div class="row">
			<span class="math accent">(3 − 1) × (5 − 1)</span>
			<span class="label">subtract 1 from each</span>
		</div>
	{/if}

	{#if currentStep >= 3}
		<div class="row">
			<span class="math accent">2 × 4</span>
			<span class="label">multiply</span>
		</div>
	{/if}

	{#if currentStep >= 4}
		<div class="row result">
			<span class="math final">φ(15) = 8</span>
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 1rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s ease;
	}

	.math {
		font-size: 1.4rem;
		color: var(--color-fg);
	}

	.math.accent {
		color: var(--color-accent);
	}

	.label {
		font-size: 0.95rem;
		color: var(--color-fg-muted);
		font-style: italic;
	}

	.result {
		margin-top: 0.5rem;
		padding: 0.5rem 1.25rem;
		background: var(--color-bg-card);
		border: 2px solid var(--color-math);
		border-radius: 0.5rem;
	}

	.final {
		color: var(--color-math);
		font-weight: bold;
	}
</style>
