<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const maxStep = 4;

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
	<div class="equation">
		{#if currentStep === 0}
			<span class="term">2x + 3</span>
			<span class="eq">=</span>
			<span class="term">7</span>
		{:else if currentStep === 1}
			<span class="term">2x + 3</span>
			<span class="op">− 3</span>
			<span class="eq">=</span>
			<span class="term">7</span>
			<span class="op">− 3</span>
		{:else if currentStep === 2}
			<span class="term">2x</span>
			<span class="eq">=</span>
			<span class="term">4</span>
		{:else if currentStep === 3}
			<span class="frac"><span class="num">2x</span><span class="den op">2</span></span>
			<span class="eq">=</span>
			<span class="frac"><span class="num">4</span><span class="den op">2</span></span>
		{:else if currentStep === 4}
			<span class="term result">x</span>
			<span class="eq">=</span>
			<span class="term result">2</span>
		{/if}
	</div>

	<div class="message">
		{#if currentStep === 0}
			Start: 2x + 3 = 7
		{:else if currentStep === 1}
			Subtract 3 from both sides
		{:else if currentStep === 2}
			Simplify
		{:else if currentStep === 3}
			Divide both sides by 2
		{:else if currentStep === 4}
			x = 2
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.equation {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		font-size: 1.4rem;
		font-family: var(--font-mono, monospace);
		min-height: 3.5rem;
	}

	.term {
		color: var(--color-fg);
	}

	.eq {
		color: var(--color-fg-muted);
		margin: 0 0.2rem;
	}

	.op {
		color: var(--color-accent);
		font-weight: 600;
	}

	.frac {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		vertical-align: middle;
	}

	.num {
		color: var(--color-fg);
		border-bottom: 2px solid var(--color-accent);
		padding: 0 0.3rem 0.15rem;
		line-height: 1.2;
	}

	.den {
		padding: 0.15rem 0.3rem 0;
		line-height: 1.2;
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
