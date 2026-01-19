<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const maxStep = 5;

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
	<div class="equation">
		{#if currentStep === 0}
			<span class="abs">|2x + 1|</span>
			<span class="eq">=</span>
			<span class="term">7</span>
		{:else if currentStep === 1}
			<span class="term">2x + 1</span>
			<span class="eq">=</span>
			<span class="op">±7</span>
		{:else if currentStep === 2}
			<div class="cases">
				<div class="case">
					<span class="label">Case 1:</span>
					<span class="term">2x + 1</span>
					<span class="eq">=</span>
					<span class="op">7</span>
				</div>
				<div class="case">
					<span class="label">Case 2:</span>
					<span class="term">2x + 1</span>
					<span class="eq">=</span>
					<span class="op">−7</span>
				</div>
			</div>
		{:else if currentStep === 3}
			<div class="cases">
				<div class="case">
					<span class="term">2x</span>
					<span class="eq">=</span>
					<span class="term">6</span>
				</div>
				<div class="case">
					<span class="term">2x</span>
					<span class="eq">=</span>
					<span class="term">−8</span>
				</div>
			</div>
		{:else if currentStep === 4}
			<div class="cases">
				<div class="case">
					<span class="result">x = 3</span>
				</div>
				<div class="case">
					<span class="result">x = −4</span>
				</div>
			</div>
		{:else if currentStep === 5}
			<span class="result">x = 3</span>
			<span class="or">or</span>
			<span class="result">x = −4</span>
		{/if}
	</div>

	<div class="message">
		{#if currentStep === 0}
			Solve |2x + 1| = 7
		{:else if currentStep === 1}
			Inside can be 7 or −7
		{:else if currentStep === 2}
			Split into two cases
		{:else if currentStep === 3}
			Subtract 1 from both sides
		{:else if currentStep === 4}
			Divide by 2
		{:else if currentStep === 5}
			Two solutions!
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
		min-height: 4rem;
	}

	.term {
		color: var(--color-fg);
	}

	.abs {
		color: var(--color-fg);
		font-weight: 600;
	}

	.eq {
		color: var(--color-fg-muted);
		margin: 0 0.2rem;
	}

	.op {
		color: var(--color-accent);
		font-weight: 600;
	}

	.or {
		color: var(--color-fg-muted);
		margin: 0 0.5rem;
		font-size: 1rem;
	}

	.cases {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.case {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.label {
		color: var(--color-fg-muted);
		font-size: 0.9rem;
		margin-right: 0.3rem;
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
