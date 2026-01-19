<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const maxStep = 4;

	const examples = [
		{ poly: '5', degree: '0', name: 'Constant' },
		{ poly: '3x + 1', degree: '1', name: 'Linear' },
		{ poly: 'x² + 2x + 1', degree: '2', name: 'Quadratic' },
		{ poly: 'x³ − x + 4', degree: '3', name: 'Cubic' },
		{ poly: 'x⁴ + x² − 1', degree: '4', name: 'Quartic' }
	];

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
		}, 1800);
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
	<div class="example">
		<span class="poly">{examples[currentStep].poly}</span>
	</div>
	<div class="info">
		<span class="label">Degree:</span>
		<span class="degree">{examples[currentStep].degree}</span>
		<span class="name">({examples[currentStep].name})</span>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.example {
		min-height: 2.5rem;
		display: flex;
		align-items: center;
	}

	.poly {
		font-size: 1.5rem;
		font-family: var(--font-mono, monospace);
		color: var(--color-fg);
	}

	.info {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.8rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.9rem;
	}

	.label {
		color: var(--color-fg-muted);
	}

	.degree {
		color: var(--color-accent);
		font-weight: 700;
		font-size: 1.1rem;
	}

	.name {
		color: var(--color-fg-muted);
	}
</style>
