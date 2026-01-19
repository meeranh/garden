<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const maxStep = 6;

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
	{#if currentStep === 0}
		<div class="binomials">
			<span class="paren">(</span>
			<span class="term">x</span>
			<span class="op">+</span>
			<span class="term">2</span>
			<span class="paren">)</span>
			<span class="paren">(</span>
			<span class="term">x</span>
			<span class="op">+</span>
			<span class="term">3</span>
			<span class="paren">)</span>
		</div>
	{:else if currentStep === 1}
		<div class="binomials">
			<span class="paren">(</span>
			<span class="term highlight">x</span>
			<span class="op">+</span>
			<span class="term dim">2</span>
			<span class="paren">)</span>
			<span class="paren">(</span>
			<span class="term highlight">x</span>
			<span class="op">+</span>
			<span class="term dim">3</span>
			<span class="paren">)</span>
		</div>
		<div class="result-step">
			<span class="highlight">x</span>
			<span class="mult">×</span>
			<span class="highlight">x</span>
			<span class="eq">=</span>
			<span class="product">x²</span>
		</div>
	{:else if currentStep === 2}
		<div class="binomials">
			<span class="paren">(</span>
			<span class="term highlight">x</span>
			<span class="op">+</span>
			<span class="term dim">2</span>
			<span class="paren">)</span>
			<span class="paren">(</span>
			<span class="term dim">x</span>
			<span class="op">+</span>
			<span class="term highlight">3</span>
			<span class="paren">)</span>
		</div>
		<div class="result-step">
			<span class="highlight">x</span>
			<span class="mult">×</span>
			<span class="highlight">3</span>
			<span class="eq">=</span>
			<span class="product">3x</span>
		</div>
	{:else if currentStep === 3}
		<div class="binomials">
			<span class="paren">(</span>
			<span class="term dim">x</span>
			<span class="op">+</span>
			<span class="term highlight">2</span>
			<span class="paren">)</span>
			<span class="paren">(</span>
			<span class="term highlight">x</span>
			<span class="op">+</span>
			<span class="term dim">3</span>
			<span class="paren">)</span>
		</div>
		<div class="result-step">
			<span class="highlight">2</span>
			<span class="mult">×</span>
			<span class="highlight">x</span>
			<span class="eq">=</span>
			<span class="product">2x</span>
		</div>
	{:else if currentStep === 4}
		<div class="binomials">
			<span class="paren">(</span>
			<span class="term dim">x</span>
			<span class="op">+</span>
			<span class="term highlight">2</span>
			<span class="paren">)</span>
			<span class="paren">(</span>
			<span class="term dim">x</span>
			<span class="op">+</span>
			<span class="term highlight">3</span>
			<span class="paren">)</span>
		</div>
		<div class="result-step">
			<span class="highlight">2</span>
			<span class="mult">×</span>
			<span class="highlight">3</span>
			<span class="eq">=</span>
			<span class="product">6</span>
		</div>
	{:else if currentStep === 5}
		<div class="combine">
			<span class="product">x²</span>
			<span class="op">+</span>
			<span class="product">3x</span>
			<span class="op">+</span>
			<span class="product">2x</span>
			<span class="op">+</span>
			<span class="product">6</span>
		</div>
	{:else if currentStep === 6}
		<div class="final">
			<span class="result">x² + 5x + 6</span>
		</div>
	{/if}

	<div class="message">
		{#if currentStep === 0}
			Multiply each term by each term
		{:else if currentStep === 1}
			First × First
		{:else if currentStep === 2}
			First × Second
		{:else if currentStep === 3}
			Second × First
		{:else if currentStep === 4}
			Second × Second
		{:else if currentStep === 5}
			Combine all products
		{:else if currentStep === 6}
			Combine like terms
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.binomials, .combine, .final {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 1.5rem;
		font-family: var(--font-mono, monospace);
	}

	.term {
		color: var(--color-fg);
		transition: all 0.3s ease;
	}

	.term.highlight {
		color: var(--color-accent);
		font-weight: 700;
		transform: scale(1.1);
	}

	.term.dim {
		color: var(--color-fg-muted);
		opacity: 0.4;
	}

	.paren {
		color: var(--color-fg-muted);
	}

	.op {
		color: var(--color-fg-muted);
		margin: 0 0.15rem;
	}

	.result-step {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 1.3rem;
		font-family: var(--font-mono, monospace);
		padding: 0.3rem 0.6rem;
		background: var(--color-bg-card);
		border-radius: 4px;
	}

	.mult {
		color: var(--color-fg-muted);
	}

	.eq {
		color: var(--color-fg-muted);
		margin: 0 0.2rem;
	}

	.product {
		color: var(--color-math);
		font-weight: 600;
	}

	.result {
		color: var(--color-accent);
		font-weight: 700;
	}

	.message {
		padding: 0.4rem 0.8rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.8rem;
		color: var(--color-fg-muted);
	}
</style>
