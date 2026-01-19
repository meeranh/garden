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
		}, 2200);
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
	<div class="equations">
		{#if currentStep === 0}
			<div class="eq-row"><span class="term">x + y</span><span class="eq">=</span><span class="term">10</span></div>
			<div class="eq-row"><span class="term">x − y</span><span class="eq">=</span><span class="term">2</span></div>
		{:else if currentStep === 1}
			<div class="eq-row"><span class="op">y</span><span class="eq">=</span><span class="op">10 − x</span></div>
		{:else if currentStep === 2}
			<div class="eq-row"><span class="term">x − </span><span class="op">(10 − x)</span><span class="eq">=</span><span class="term">2</span></div>
		{:else if currentStep === 3}
			<div class="eq-row"><span class="term">x − 10 + x</span><span class="eq">=</span><span class="term">2</span></div>
		{:else if currentStep === 4}
			<div class="eq-row"><span class="term">2x</span><span class="eq">=</span><span class="term">12</span></div>
		{:else if currentStep === 5}
			<div class="eq-row"><span class="result">x</span><span class="eq">=</span><span class="result">6</span></div>
		{:else if currentStep === 6}
			<div class="eq-row"><span class="result">x = 6</span><span class="comma">,</span><span class="result">y = 4</span></div>
		{/if}
	</div>

	<div class="message">
		{#if currentStep === 0}
			System: find x and y for both
		{:else if currentStep === 1}
			Solve first equation for y
		{:else if currentStep === 2}
			Substitute into second equation
		{:else if currentStep === 3}
			Expand
		{:else if currentStep === 4}
			Simplify
		{:else if currentStep === 5}
			Solve for x
		{:else if currentStep === 6}
			Plug back to get y
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

	.equations {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		font-size: 1.4rem;
		font-family: var(--font-mono, monospace);
		min-height: 4rem;
		justify-content: center;
	}

	.eq-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
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

	.comma {
		color: var(--color-fg-muted);
		margin: 0 0.3rem;
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
