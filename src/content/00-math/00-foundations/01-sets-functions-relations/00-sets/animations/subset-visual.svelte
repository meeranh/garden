<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 4;
	const maxStep = totalSteps - 1;

	// Steps:
	// 0: Show B = {1, 2, 3, 4}
	// 1: Show A = {1, 2} nested inside B
	// 2: Highlight A's elements - they're all in B
	// 3: Therefore A ⊆ B

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Set B = {1, 2, 3, 4}',
				showA: false,
				highlightContainment: false,
				showResult: false
			};
		} else if (currentStep === 1) {
			return {
				title: 'Set A = {1, 2} is inside B',
				showA: true,
				highlightContainment: false,
				showResult: false
			};
		} else if (currentStep === 2) {
			return {
				title: 'Every element of A is in B',
				showA: true,
				highlightContainment: true,
				showResult: false
			};
		} else {
			return {
				title: 'A ⊆ B',
				showA: true,
				highlightContainment: true,
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
			<!-- Circle B (outer) -->
			<circle
				cx="150"
				cy="100"
				r="75"
				class="circle-b"
			/>

			<!-- Circle A (inner, nested inside B) -->
			{#if display.showA}
				<circle
					cx="130"
					cy="100"
					r="35"
					class="circle-a"
					class:highlight={display.highlightContainment}
				/>
			{/if}

			<!-- Labels -->
			<text x="215" y="22" class="label">B</text>
			{#if display.showA}
				<text x="80" y="100" class="label-a" class:highlight={display.highlightContainment}>A</text>
			{/if}

			<!-- Elements in A (also in B) -->
			{#if display.showA}
				<text
					x="115"
					y="95"
					class="element"
					class:highlight={display.highlightContainment}
				>1</text>
				<text
					x="145"
					y="110"
					class="element"
					class:highlight={display.highlightContainment}
				>2</text>
			{/if}

			<!-- Elements only in B (outside A) -->
			<text x="185" y="85" class="element b-only">3</text>
			<text x="195" y="115" class="element b-only">4</text>

			<!-- Elements 1, 2 shown in B before A appears -->
			{#if !display.showA}
				<text x="110" y="95" class="element b-only">1</text>
				<text x="140" y="95" class="element b-only">2</text>
			{/if}
		</svg>
	</div>

	{#if display.showResult}
		<div class="result">
			A is entirely contained in B, so <strong>A ⊆ B</strong>
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

	.circle-b {
		fill: transparent;
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: all 0.3s ease;
	}

	.circle-a {
		fill: transparent;
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: all 0.3s ease;
	}

	.circle-a.highlight {
		fill: rgba(142, 192, 124, 0.2);
		stroke: var(--color-accent);
	}

	.label {
		fill: var(--color-fg-muted);
		font-size: 1rem;
		font-weight: bold;
		text-anchor: middle;
	}

	.label-a {
		fill: var(--color-fg-muted);
		font-size: 0.9rem;
		font-weight: bold;
		text-anchor: middle;
		transition: all 0.3s ease;
	}

	.label-a.highlight {
		fill: var(--color-accent);
	}

	.element {
		fill: var(--color-fg);
		font-size: 0.85rem;
		text-anchor: middle;
		transition: all 0.3s ease;
	}

	.element.highlight {
		fill: var(--color-accent);
		font-weight: bold;
	}

	.element.b-only {
		fill: var(--color-fg-muted);
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
