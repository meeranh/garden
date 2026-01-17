<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Steps:
	// 0: Show two circles A and B
	// 1: Highlight A with its elements
	// 2: Highlight B with its elements
	// 3: Show union (both highlighted)
	// 4: Show result

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Two sets: A and B',
				highlightA: false,
				highlightB: false,
				highlightUnion: false,
				showResult: false
			};
		} else if (currentStep === 1) {
			return {
				title: 'Set A = {1, 2, 3}',
				highlightA: true,
				highlightB: false,
				highlightUnion: false,
				showResult: false
			};
		} else if (currentStep === 2) {
			return {
				title: 'Set B = {3, 4, 5}',
				highlightA: false,
				highlightB: true,
				highlightUnion: false,
				showResult: false
			};
		} else if (currentStep === 3) {
			return {
				title: 'A ∪ B = everything in either',
				highlightA: false,
				highlightB: false,
				highlightUnion: true,
				showResult: false
			};
		} else {
			return {
				title: 'A ∪ B = {1, 2, 3, 4, 5}',
				highlightA: false,
				highlightB: false,
				highlightUnion: true,
				showResult: true
			};
		}
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
		}, 1500);
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
	<div class="title">{display.title}</div>

	<div class="venn-container">
		<svg viewBox="0 0 300 180" class="venn">
			<!-- Circle A -->
			<circle
				cx="110"
				cy="90"
				r="60"
				class="circle-a"
				class:highlight={display.highlightA || display.highlightUnion}
			/>
			<!-- Circle B -->
			<circle
				cx="190"
				cy="90"
				r="60"
				class="circle-b"
				class:highlight={display.highlightB || display.highlightUnion}
			/>

			<!-- Labels above circles -->
			<text x="90" y="22" class="label">A</text>
			<text x="210" y="22" class="label">B</text>

			<!-- Elements in A only (center of A-only region: x=90) -->
			<text x="90" y="80" class="element">1</text>
			<text x="90" y="110" class="element">2</text>

			<!-- Element in intersection -->
			<text x="150" y="95" class="element overlap">3</text>

			<!-- Elements in B only (center of B-only region: x=210) -->
			<text x="210" y="80" class="element">4</text>
			<text x="210" y="110" class="element">5</text>
		</svg>
	</div>

	{#if display.showResult}
		<div class="result">
			Union combines <strong>all</strong> elements from both sets
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem;
	}

	.title {
		font-size: 0.95rem;
		color: var(--color-fg);
		font-weight: 500;
	}

	.venn-container {
		width: 100%;
		max-width: 300px;
	}

	.venn {
		width: 100%;
		height: auto;
	}

	.circle-a,
	.circle-b {
		fill: transparent;
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: all 0.3s ease;
	}

	.circle-a.highlight {
		fill: rgba(142, 192, 124, 0.2);
		stroke: var(--color-accent);
	}

	.circle-b.highlight {
		fill: rgba(142, 192, 124, 0.2);
		stroke: var(--color-accent);
	}

	.label {
		fill: var(--color-fg-muted);
		font-size: 1rem;
		font-weight: bold;
	}

	.element {
		fill: var(--color-fg);
		font-size: 0.85rem;
		text-anchor: middle;
	}

	.element.overlap {
		fill: var(--color-math);
		font-weight: bold;
	}

	.result {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.result strong {
		color: var(--color-accent);
	}
</style>
