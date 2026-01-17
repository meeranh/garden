<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 8;
	const maxStep = totalSteps - 1;

	const setA = [1, 2];
	const setB = ['a', 'b', 'c'];

	// All pairs in order
	const allPairs = [
		{ a: 1, b: 'a' },
		{ a: 1, b: 'b' },
		{ a: 1, b: 'c' },
		{ a: 2, b: 'a' },
		{ a: 2, b: 'b' },
		{ a: 2, b: 'c' }
	];

	// Steps:
	// 0: Show sets A and B
	// 1: Highlight 1, show pairing with a
	// 2: Show pairing with b
	// 3: Show pairing with c
	// 4: Highlight 2, show pairing with a
	// 5: Show pairing with b
	// 6: Show pairing with c
	// 7: Show all pairs result

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Two sets: A = {1, 2} and B = {a, b, c}',
				highlightA: null,
				visiblePairs: 0,
				showResult: false
			};
		} else if (currentStep >= 1 && currentStep <= 3) {
			return {
				title: `Pair 1 with each element of B`,
				highlightA: 1,
				visiblePairs: currentStep,
				showResult: false
			};
		} else if (currentStep >= 4 && currentStep <= 6) {
			return {
				title: `Pair 2 with each element of B`,
				highlightA: 2,
				visiblePairs: currentStep,
				showResult: false
			};
		} else {
			return {
				title: 'A × B = 6 pairs',
				highlightA: null,
				visiblePairs: 6,
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
		<div class="set-wrapper">
			<div class="set-label">A</div>
			<div class="set set-a">
				{#each setA as el}
					<div class="element" class:highlight={display.highlightA === el}>
						{el}
					</div>
				{/each}
			</div>
		</div>

		<div class="arrows">
			{#each allPairs.slice(0, display.visiblePairs) as pair, i}
				<div class="pair-display" class:latest={i === display.visiblePairs - 1 && !display.showResult}>
					({pair.a}, {pair.b})
				</div>
			{/each}
		</div>

		<div class="set-wrapper">
			<div class="set-label">B</div>
			<div class="set set-b">
				{#each setB as el}
					<div class="element">
						{el}
					</div>
				{/each}
			</div>
		</div>
	</div>

	{#if display.showResult}
		<div class="result">
			|A| × |B| = 2 × 3 = <strong>6 pairs</strong>
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
		text-align: center;
	}

	.diagram {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 2rem;
		width: 100%;
	}

	.set-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.set {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		min-width: 60px;
	}

	.set-label {
		font-weight: bold;
		color: var(--color-math);
		font-size: 0.9rem;
	}

	.element {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.9rem;
		color: var(--color-fg);
		transition: all 0.3s ease;
	}

	.element.highlight {
		border-color: var(--color-accent);
		background: rgba(142, 192, 124, 0.15);
		color: var(--color-accent);
	}

	.arrows {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 80px;
		align-items: center;
		padding-top: 1.5rem;
	}

	.pair-display {
		font-size: 0.85rem;
		color: var(--color-fg-muted);
		padding: 0.2rem 0.5rem;
		background: var(--color-bg-card);
		border-radius: 4px;
		transition: all 0.3s ease;
	}

	.pair-display.latest {
		color: var(--color-math);
		background: rgba(250, 189, 47, 0.15);
	}

	.result {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.9rem;
		color: var(--color-fg-muted);
	}

	.result strong {
		color: var(--color-accent);
	}
</style>
