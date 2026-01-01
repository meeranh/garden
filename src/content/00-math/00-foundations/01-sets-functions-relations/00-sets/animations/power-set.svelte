<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 6;
	const maxStep = totalSteps - 1;

	const originalSet = [1, 2];
	const subsets = [
		{ elements: [], label: '∅' },
		{ elements: [1], label: '{1}' },
		{ elements: [2], label: '{2}' },
		{ elements: [1, 2], label: '{1, 2}' }
	];

	// Steps:
	// 0: Show original set A = {1, 2}
	// 1: Show empty subset
	// 2: Show {1}
	// 3: Show {2}
	// 4: Show {1, 2}
	// 5: Show complete power set

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Set A = {1, 2}',
				visibleSubsets: 0,
				showResult: false
			};
		} else if (currentStep >= 1 && currentStep <= 4) {
			return {
				title: `Subset: ${subsets[currentStep - 1].label}`,
				visibleSubsets: currentStep,
				showResult: false
			};
		} else {
			return {
				title: 'P(A) = all 4 subsets',
				visibleSubsets: 4,
				showResult: true
			};
		}
	});

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
		}, 1200);
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
	<div class="title">{display.title}</div>

	<div class="diagram">
		<div class="original-set">
			<div class="set-label">A</div>
			<div class="set-box">
				{#each originalSet as el}
					<span class="element">{el}</span>
				{/each}
			</div>
		</div>

		<div class="arrow">→</div>

		<div class="power-set">
			<div class="set-label">P(A)</div>
			<div class="subsets-box">
				{#each subsets.slice(0, display.visibleSubsets) as subset, i}
					<span
						class="subset"
						class:latest={i === display.visibleSubsets - 1 && !display.showResult}
					>
						{subset.label}
					</span>
				{/each}
				{#if display.visibleSubsets === 0}
					<span class="placeholder">?</span>
				{/if}
			</div>
		</div>
	</div>

	{#if display.showResult}
		<div class="result">
			2 elements → 2² = <strong>4 subsets</strong>
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem;
	}

	.title {
		font-size: 0.95rem;
		color: var(--color-fg);
		font-weight: 500;
	}

	.diagram {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	.original-set,
	.power-set {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.set-label {
		font-weight: bold;
		color: var(--color-math);
		font-size: 0.9rem;
	}

	.set-box {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		min-width: 60px;
		justify-content: center;
	}

	.subsets-box {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		min-width: 120px;
		max-width: 160px;
		justify-content: center;
	}

	.element {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.9rem;
		color: var(--color-fg);
	}

	.subset {
		padding: 0.25rem 0.5rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.8rem;
		color: var(--color-fg-muted);
		transition: all 0.3s ease;
	}

	.subset.latest {
		border-color: var(--color-accent);
		color: var(--color-accent);
		background: rgba(142, 192, 124, 0.15);
	}

	.placeholder {
		color: var(--color-fg-muted);
		font-size: 0.9rem;
	}

	.arrow {
		color: var(--color-fg-muted);
		font-size: 1.25rem;
	}

	.result {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.result strong {
		color: var(--color-accent);
	}
</style>
