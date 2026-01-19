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
		let showNumber = false;
		let showZero = false;
		let showOperation = false;
		let showResult = false;
		let message = '';

		if (currentStep === 0) {
			showNumber = true;
			message = 'Take any number: 7';
		} else if (currentStep === 1) {
			showNumber = true;
			showZero = true;
			message = 'Add zero...';
		} else if (currentStep === 2) {
			showNumber = true;
			showZero = true;
			showOperation = true;
			message = '7 + 0';
		} else if (currentStep === 3) {
			showResult = true;
			message = 'Still 7! Zero is the identity for addition.';
		}

		return { showNumber, showZero, showOperation, showResult, message };
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
	<div class="title">Identity</div>

	<div class="diagram-container">
		<svg viewBox="0 0 280 140" class="diagram">
			{#if !display.showResult}
				<!-- Number 7 -->
				{#if display.showNumber}
					<g class="number" style="transform: translate(70px, 70px)">
						<circle r="30" class="num-circle num-main" />
						<text y="8" class="num-text">7</text>
					</g>
				{/if}

				<!-- Plus sign -->
				{#if display.showOperation}
					<text x="120" y="78" class="operation">+</text>
				{/if}

				<!-- Zero -->
				{#if display.showZero}
					<g class="number" style="transform: translate(170px, 70px)">
						<circle r="25" class="num-circle num-zero" />
						<text y="7" class="num-text zero-text">0</text>
					</g>
				{/if}
			{:else}
				<!-- Result: just 7 again, centered -->
				<g class="number" style="transform: translate(140px, 70px)">
					<circle r="35" class="num-circle num-result" />
					<text y="9" class="num-text result-text">7</text>
				</g>
				<text x="140" y="125" class="unchanged">unchanged</text>
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
		max-width: 280px;
	}

	.diagram {
		width: 100%;
		height: auto;
	}

	.num-circle {
		fill: var(--color-bg-card);
		stroke-width: 2;
		transition: all 0.4s ease;
	}

	.num-main {
		stroke: var(--color-accent);
	}

	.num-zero {
		stroke: var(--color-fg-muted);
		stroke-dasharray: 4 2;
		fill: transparent;
	}

	.num-result {
		stroke: var(--color-accent);
		fill: rgba(142, 192, 124, 0.15);
	}

	.num-text {
		fill: var(--color-fg);
		font-size: 1.4rem;
		font-weight: 600;
		text-anchor: middle;
	}

	.zero-text {
		fill: var(--color-fg-muted);
	}

	.result-text {
		fill: var(--color-accent);
		font-size: 1.6rem;
	}

	.operation {
		fill: var(--color-fg-muted);
		font-size: 1.5rem;
		text-anchor: middle;
	}

	.unchanged {
		fill: var(--color-fg-muted);
		font-size: 0.8rem;
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
