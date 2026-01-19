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
		let showInverse = false;
		let showOperation = false;
		let showResult = false;
		let message = '';

		if (currentStep === 0) {
			showNumber = true;
			message = 'Take a number: 5';
		} else if (currentStep === 1) {
			showNumber = true;
			showInverse = true;
			message = 'Its inverse (opposite): -5';
		} else if (currentStep === 2) {
			showNumber = true;
			showInverse = true;
			showOperation = true;
			message = '5 + (-5)';
		} else if (currentStep === 3) {
			showResult = true;
			message = 'They cancel out to zero!';
		}

		return { showNumber, showInverse, showOperation, showResult, message };
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
	<div class="title">Inverse</div>

	<div class="diagram-container">
		<svg viewBox="0 0 280 140" class="diagram">
			{#if !display.showResult}
				<!-- Number 5 -->
				{#if display.showNumber}
					<g class="number" style="transform: translate(70px, 70px)">
						<circle r="28" class="num-circle num-pos" />
						<text y="7" class="num-text">5</text>
					</g>
				{/if}

				<!-- Plus sign -->
				{#if display.showOperation}
					<text x="120" y="78" class="operation">+</text>
				{/if}

				<!-- Negative 5 -->
				{#if display.showInverse}
					<g class="number" style="transform: translate(175px, 70px)">
						<circle r="28" class="num-circle num-neg" />
						<text y="7" class="num-text neg-text">-5</text>
					</g>
				{/if}
			{:else}
				<!-- Result: zero -->
				<g class="number" style="transform: translate(140px, 70px)">
					<circle r="35" class="num-circle num-result" />
					<text y="9" class="num-text result-text">0</text>
				</g>
				<text x="140" y="125" class="identity">back to identity</text>
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

	.num-pos {
		stroke: var(--color-accent);
	}

	.num-neg {
		stroke: #d3869b;
	}

	.num-result {
		stroke: var(--color-fg-muted);
		stroke-dasharray: 4 2;
		fill: transparent;
	}

	.num-text {
		fill: var(--color-fg);
		font-size: 1.3rem;
		font-weight: 600;
		text-anchor: middle;
	}

	.neg-text {
		fill: #d3869b;
	}

	.result-text {
		fill: var(--color-fg-muted);
		font-size: 1.5rem;
	}

	.operation {
		fill: var(--color-fg-muted);
		font-size: 1.5rem;
		text-anchor: middle;
	}

	.identity {
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
