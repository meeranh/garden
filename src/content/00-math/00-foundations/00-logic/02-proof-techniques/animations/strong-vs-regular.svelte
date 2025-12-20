<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 6;
	const maxStep = totalSteps - 1;

	// Steps:
	// 0: Show both sides empty
	// 1: Regular - show "To prove step 5..."
	// 2: Regular - show "you only get to use step 4"
	// 3: Strong - show "To prove step 5..."
	// 4: Strong - show "you get to use steps 1, 2, 3, AND 4"
	// 5: Summary

	let display = $derived.by(() => {
		return {
			// Regular induction side
			regular: {
				showQuestion: currentStep >= 1,
				showAnswer: currentStep >= 2,
				steps: [1, 2, 3, 4, 5],
				available: currentStep >= 2 ? [4] : [],
				proving: currentStep >= 1 ? 5 : null
			},
			// Strong induction side
			strong: {
				showQuestion: currentStep >= 3,
				showAnswer: currentStep >= 4,
				steps: [1, 2, 3, 4, 5],
				available: currentStep >= 4 ? [1, 2, 3, 4] : [],
				proving: currentStep >= 3 ? 5 : null
			},
			showSummary: currentStep >= 5
		};
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
		}, 2000);
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
	<div class="columns">
		<!-- Regular Induction -->
		<div class="column">
			<div class="column-title">Regular Induction</div>

			<div class="steps-row">
				{#each display.regular.steps as step}
					<div
						class="step-box"
						class:proving={display.regular.proving === step}
						class:available={display.regular.available.includes(step)}
						class:dimmed={display.regular.showAnswer && !display.regular.available.includes(step) && display.regular.proving !== step}
					>
						{step}
					</div>
				{/each}
			</div>

			{#if display.regular.showQuestion}
				<div class="question">To prove step 5...</div>
			{/if}

			{#if display.regular.showAnswer}
				<div class="answer">you can only use step 4</div>
			{/if}
		</div>

		<!-- Divider -->
		<div class="divider"></div>

		<!-- Strong Induction -->
		<div class="column">
			<div class="column-title">Strong Induction</div>

			<div class="steps-row">
				{#each display.strong.steps as step}
					<div
						class="step-box"
						class:proving={display.strong.proving === step}
						class:available={display.strong.available.includes(step)}
						class:dimmed={display.strong.showAnswer && !display.strong.available.includes(step) && display.strong.proving !== step}
					>
						{step}
					</div>
				{/each}
			</div>

			{#if display.strong.showQuestion}
				<div class="question">To prove step 5...</div>
			{/if}

			{#if display.strong.showAnswer}
				<div class="answer">you can use steps 1, 2, 3, and 4</div>
			{/if}
		</div>
	</div>

	{#if display.showSummary}
		<div class="summary">
			Strong induction gives you <strong>more information</strong> to work with.
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

	.columns {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.column {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.column-title {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-fg);
	}

	.divider {
		width: 1px;
		background: var(--color-border);
		align-self: stretch;
	}

	.steps-row {
		display: flex;
		gap: 0.5rem;
	}

	.step-box {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border);
		font-size: 0.9rem;
		color: var(--color-fg);
		transition: all 0.3s ease;
	}

	.step-box.proving {
		border-color: var(--color-math);
		color: var(--color-math);
		background: rgba(250, 189, 47, 0.1);
	}

	.step-box.available {
		border-color: var(--color-accent);
		color: var(--color-accent);
		background: rgba(142, 192, 124, 0.15);
	}

	.step-box.dimmed {
		opacity: 0.3;
	}

	.question {
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.answer {
		font-size: 0.85rem;
		color: var(--color-accent);
		font-weight: 500;
	}

	.summary {
		text-align: center;
		padding: 0.75rem;
		background: var(--color-bg-card);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.summary strong {
		color: var(--color-accent);
	}

	@media (max-width: 400px) {
		.columns {
			flex-direction: column;
		}

		.divider {
			width: 100%;
			height: 1px;
		}
	}
</style>
