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
		let showA = false;
		let showB = false;
		let showOperation = false;
		let showResult = false;
		let message = '';

		if (currentStep === 0) {
			showA = true;
			message = 'Take a real number: 3';
		} else if (currentStep === 1) {
			showA = true;
			showB = true;
			message = 'Take another: 5';
		} else if (currentStep === 2) {
			showA = true;
			showB = true;
			showOperation = true;
			message = 'Add them together...';
		} else if (currentStep === 3) {
			showResult = true;
			message = 'Result is still a real number!';
		}

		return { showA, showB, showOperation, showResult, message };
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
	<div class="title">Closure</div>

	<div class="diagram-container">
		<svg viewBox="0 0 300 160" class="diagram">
			<!-- Real numbers box -->
			<rect x="20" y="20" width="260" height="120" rx="10" class="real-box" />
			<text x="35" y="45" class="box-label">ℝ</text>

			{#if display.showA && !display.showResult}
				<g class="number" style="transform: translate(80px, 80px)">
					<circle r="25" class="num-circle" />
					<text y="6" class="num-text">3</text>
				</g>
			{/if}

			{#if display.showB && !display.showResult}
				<g class="number" style="transform: translate(180px, 80px)">
					<circle r="25" class="num-circle" />
					<text y="6" class="num-text">5</text>
				</g>
			{/if}

			{#if display.showOperation && !display.showResult}
				<text x="130" y="86" class="operation">+</text>
			{/if}

			{#if display.showResult}
				<g class="number result" style="transform: translate(150px, 80px)">
					<circle r="30" class="num-circle result-circle" />
					<text y="7" class="num-text">8</text>
				</g>
				<text x="200" y="86" class="in-real">∈ ℝ</text>
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

	.real-box {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 2;
		stroke-dasharray: 5 3;
	}

	.box-label {
		fill: var(--color-accent);
		font-size: 1.2rem;
		font-weight: 700;
	}

	.num-circle {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: all 0.4s ease;
	}

	.result-circle {
		stroke: var(--color-accent);
		fill: rgba(142, 192, 124, 0.15);
	}

	.num-text {
		fill: var(--color-fg);
		font-size: 1.2rem;
		font-weight: 600;
		text-anchor: middle;
	}

	.operation {
		fill: var(--color-fg-muted);
		font-size: 1.5rem;
		text-anchor: middle;
	}

	.in-real {
		fill: var(--color-accent);
		font-size: 1rem;
		font-weight: 600;
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
