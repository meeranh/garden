<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 4;
	const maxStep = totalSteps - 1;

	let display = $derived.by(() => {
		let swapped = false;
		let showEquals = false;
		let showResult = false;
		let message = '';

		if (currentStep === 0) {
			message = '3 + 5';
		} else if (currentStep === 1) {
			swapped = true;
			message = 'Swap the order...';
		} else if (currentStep === 2) {
			swapped = true;
			showEquals = true;
			message = '5 + 3';
		} else if (currentStep === 3) {
			swapped = true;
			showEquals = true;
			showResult = true;
			message = 'Same result! Order doesn\'t matter.';
		}

		return { swapped, showEquals, showResult, message };
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
		animationTimer = setTimeout(
			() => {
				if (!isPlaying) return;
				if (currentStep < maxStep) {
					currentStep++;
					scheduleNext();
				} else {
					isPlaying = false;
				}
			},
			1500
		);
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
	<div class="title">Commutative</div>

	<div class="diagram-container">
		<svg viewBox="0 0 300 140" class="diagram">
			<!-- First number -->
			<g class="number" style="transform: translate({display.swapped ? 180 : 60}px, 70px); transition: transform 0.6s ease">
				<circle r="28" class="num-circle num-a" />
				<text y="7" class="num-text">3</text>
			</g>

			<!-- Plus sign -->
			<text x="120" y="77" class="operation">+</text>

			<!-- Second number -->
			<g class="number" style="transform: translate({display.swapped ? 60 : 180}px, 70px); transition: transform 0.6s ease">
				<circle r="28" class="num-circle num-b" />
				<text y="7" class="num-text">5</text>
			</g>

			<!-- Equals and result -->
			{#if display.showEquals}
				<text x="230" y="77" class="operation">=</text>
			{/if}

			{#if display.showResult}
				<text x="270" y="77" class="result">8</text>
			{/if}
		</svg>
	</div>

	{#if display.message}
		<div class="message">{display.message}</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.title {
		font-size: 0.95rem;
		color: var(--color-accent);
		font-weight: 500;
	}

	.diagram-container {
		width: 100%;
		max-width: 300px;
	}

	.diagram {
		width: 100%;
		height: auto;
	}

	.num-circle {
		fill: var(--color-bg-card);
		stroke-width: 2;
	}

	.num-a {
		stroke: var(--color-accent);
	}

	.num-b {
		stroke: var(--color-math);
	}

	.num-text {
		fill: var(--color-fg);
		font-size: 1.3rem;
		font-weight: 600;
		text-anchor: middle;
	}

	.operation {
		fill: var(--color-fg-muted);
		font-size: 1.5rem;
		text-anchor: middle;
	}

	.result {
		fill: var(--color-accent);
		font-size: 1.5rem;
		font-weight: 700;
		text-anchor: middle;
	}

	.message {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg);
		text-align: center;
	}
</style>
