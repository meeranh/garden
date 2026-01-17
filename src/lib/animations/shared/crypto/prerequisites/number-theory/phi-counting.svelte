<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 6;
	const maxStep = totalSteps - 1;

	const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	const multiplesOf2 = [2, 4, 6, 8, 10];
	const multiplesOf5 = [5, 10];
	const coprime = [1, 3, 7, 9];

	let display = $derived.by(() => {
		// Step 0: Just show numbers
		// Step 1: Show "10 = 2 × 5"
		// Step 2: Cross out multiples of 2
		// Step 3: Cross out multiples of 5
		// Step 4: Highlight coprime numbers
		// Step 5: Show result

		const crossedOut = new Set<number>();
		const highlighted = new Set<number>();
		let showFactorization = false;
		let showResult = false;
		let crossingLabel = '';

		if (currentStep >= 1) {
			showFactorization = true;
		}

		if (currentStep >= 2) {
			multiplesOf2.forEach(n => crossedOut.add(n));
			if (currentStep === 2) crossingLabel = 'Multiples of 2';
		}

		if (currentStep >= 3) {
			multiplesOf5.forEach(n => crossedOut.add(n));
			if (currentStep === 3) crossingLabel = 'Multiples of 5';
		}

		if (currentStep >= 4) {
			coprime.forEach(n => highlighted.add(n));
			crossingLabel = '';
		}

		if (currentStep >= 5) {
			showResult = true;
		}

		return { crossedOut, highlighted, showFactorization, showResult, crossingLabel };
	});

	function getNumberState(n: number): 'normal' | 'crossed' | 'highlighted' {
		if (display.highlighted.has(n)) return 'highlighted';
		if (display.crossedOut.has(n)) return 'crossed';
		return 'normal';
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
		}, 1200);
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

	function next() {
		if (currentStep < maxStep) currentStep++;
	}

	function prev() {
		if (currentStep > 0) currentStep--;
	}

	function skip() {
		pause();
		currentStep = maxStep;
	}

	function replay() {
		pause();
		currentStep = 0;
		play();
	}

	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

	onMount(() => register?.({ play, pause, next, prev, skip, replay, getState }));
	onDestroy(() => pause());
</script>

<div class="container">
	{#if display.showFactorization}
		<div class="factorization">
			10 = 2 × 5
		</div>
	{/if}

	<div class="numbers">
		{#each numbers as n}
			<div class="number" class:crossed={getNumberState(n) === 'crossed'} class:highlighted={getNumberState(n) === 'highlighted'}>
				<span class="value">{n}</span>
				{#if getNumberState(n) === 'crossed'}
					<span class="strike"></span>
				{/if}
			</div>
		{/each}
	</div>

	{#if display.crossingLabel}
		<div class="label">{display.crossingLabel}</div>
	{/if}

	{#if display.showResult}
		<div class="result">
			<span class="phi">φ(10)</span> = <span class="count">4</span>
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem 1rem;
		min-height: 200px;
	}

	.factorization {
		font-size: 1.25rem;
		color: var(--color-fg-muted);
	}

	.numbers {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
		max-width: 400px;
	}

	.number {
		position: relative;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--color-bg-card);
		border: 2px solid var(--color-fg-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.4s ease;
	}

	.value {
		font-size: 1.25rem;
		color: var(--color-fg);
		transition: all 0.4s ease;
	}

	.number.crossed {
		border-color: var(--color-error);
		opacity: 0.4;
	}

	.number.crossed .value {
		color: var(--color-error);
	}

	.strike {
		position: absolute;
		width: 70%;
		height: 3px;
		background: var(--color-error);
		transform: rotate(-45deg);
	}

	.number.highlighted {
		border-color: var(--color-accent);
		border-width: 3px;
		background: var(--color-bg-card);
	}

	.number.highlighted .value {
		color: var(--color-accent);
		font-weight: bold;
	}

	.label {
		font-size: 1rem;
		color: var(--color-error);
		font-style: italic;
	}

	.result {
		font-size: 1.5rem;
		color: var(--color-fg);
		padding: 0.75rem 1.5rem;
		background: var(--color-bg-card);
		border: 2px solid var(--color-math);
		border-radius: 0.5rem;
	}

	.phi {
		color: var(--color-fg-muted);
	}

	.count {
		color: var(--color-math);
		font-weight: bold;
	}
</style>
