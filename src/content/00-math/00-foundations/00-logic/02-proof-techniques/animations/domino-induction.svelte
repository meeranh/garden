<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	// Steps:
	// 0: Show dominos standing
	// 1: Base case - first domino falls
	// 2: Domino 2 falls
	// 3: Domino 3 falls
	// 4: Domino 4 falls
	// 5: Domino 5 falls
	// 6: Domino 6 falls (chain complete)
	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	const dominos = [1, 2, 3, 4, 5, 6];

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				fallen: [],
				label: 'Setup',
				description: 'Infinite row of dominos...'
			};
		} else if (currentStep === 1) {
			return {
				fallen: [1],
				label: 'Base Case',
				description: 'Push the first domino (n = 1)'
			};
		} else {
			const fallenCount = currentStep;
			const fallen = dominos.slice(0, fallenCount);
			const lastFallen = fallenCount;
			return {
				fallen,
				label: 'Inductive Step',
				description: `Domino ${lastFallen - 1} knocks down domino ${lastFallen}`
			};
		}
	});

	// Controller methods
	function play() {
		if (isPlaying) return;
		isPlaying = true;
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
		}, currentStep === 0 ? 1500 : 400);
	}

	onMount(() => {
		if (register) {
			register({ play, pause, next, prev, skip, replay, getState });
		}
	});

	onDestroy(() => {
		pause();
	});
</script>

<div class="container">
	<!-- Header -->
	<div class="header">
		<span class="step-label">{display.label}</span>
		<span class="step-desc">{display.description}</span>
	</div>

	<!-- Domino row -->
	<div class="domino-row">
		{#each dominos as num}
			<div class="domino-wrapper">
				<div
					class="domino"
					class:fallen={display.fallen.includes(num)}
				>
					<span class="domino-label">{num}</span>
				</div>
			</div>
		{/each}
		<div class="ellipsis">...</div>
	</div>

	<!-- Legend -->
	{#if currentStep >= 1}
		<div class="legend">
			{#if currentStep === 1}
				<span class="legend-item base">Base case: True for n = 1</span>
			{:else}
				<span class="legend-item inductive">If true for k, then true for k + 1</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.5rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.step-label {
		font-size: 0.85rem;
		color: var(--color-accent);
		font-weight: 500;
	}

	.step-desc {
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.domino-row {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 0.75rem;
		height: 100px;
		padding: 1rem 0;
	}

	.domino-wrapper {
		width: 24px;
		height: 70px;
		position: relative;
	}

	.domino {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 24px;
		height: 70px;
		background: var(--color-fg);
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s ease-out, background 0.3s ease;
		transform-origin: bottom left;
	}

	.domino.fallen {
		transform: rotate(60deg);
		background: var(--color-accent);
	}

	.domino-label {
		color: var(--color-bg);
		font-size: 0.75rem;
		font-weight: bold;
	}

	.ellipsis {
		color: var(--color-fg-muted);
		font-size: 1.5rem;
		margin-left: 1.5rem;
		align-self: center;
	}

	.legend {
		text-align: center;
		padding: 0.5rem;
		background: var(--color-bg-card);
	}

	.legend-item {
		font-size: 0.85rem;
	}

	.legend-item.base {
		color: var(--color-accent);
	}

	.legend-item.inductive {
		color: var(--color-fg-muted);
	}
</style>
