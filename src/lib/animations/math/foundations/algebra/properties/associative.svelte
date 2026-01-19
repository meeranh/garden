<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	let display = $derived.by(() => {
		let groupLeft = true;
		let showFirstCalc = false;
		let showSecondCalc = false;
		let showFinal = false;
		let message = '';

		if (currentStep === 0) {
			message = '(2 + 3) + 4 — group left';
		} else if (currentStep === 1) {
			showFirstCalc = true;
			message = '5 + 4 = 9';
		} else if (currentStep === 2) {
			groupLeft = false;
			message = '2 + (3 + 4) — group right';
		} else if (currentStep === 3) {
			groupLeft = false;
			showSecondCalc = true;
			message = '2 + 7 = 9';
		} else if (currentStep === 4) {
			groupLeft = false;
			showFinal = true;
			message = 'Same result! Grouping doesn\'t matter.';
		}

		return { groupLeft, showFirstCalc, showSecondCalc, showFinal, message };
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
			1800
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
	<div class="title">Associative</div>

	<div class="diagram-container">
		<svg viewBox="0 0 340 140" class="diagram">
			<!-- Numbers -->
			<g class="number" style="transform: translate(55px, 70px)">
				<circle r="24" class="num-circle" />
				<text y="6" class="num-text">2</text>
			</g>

			<text x="100" y="76" class="operation">+</text>

			<g class="number" style="transform: translate(145px, 70px)">
				<circle r="24" class="num-circle" />
				<text y="6" class="num-text">3</text>
			</g>

			<text x="190" y="76" class="operation">+</text>

			<g class="number" style="transform: translate(235px, 70px)">
				<circle r="24" class="num-circle" />
				<text y="6" class="num-text">4</text>
			</g>

			<!-- Left grouping bracket (around 2 and 3) -->
			{#if display.groupLeft}
				<path d="M 22 38 Q 12 70 22 102" class="bracket" />
				<path d="M 178 38 Q 188 70 178 102" class="bracket" />
			{/if}

			<!-- Right grouping bracket (around 3 and 4) -->
			{#if !display.groupLeft}
				<path d="M 112 38 Q 102 70 112 102" class="bracket" />
				<path d="M 268 38 Q 278 70 268 102" class="bracket" />
			{/if}

			<!-- Result -->
			{#if display.showFirstCalc || display.showSecondCalc || display.showFinal}
				<text x="285" y="76" class="equals">=</text>
				<text x="318" y="76" class="result">9</text>
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
		max-width: 340px;
	}

	.diagram {
		width: 100%;
		height: auto;
	}

	.num-circle {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 2;
	}

	.num-text {
		fill: var(--color-fg);
		font-size: 1.2rem;
		font-weight: 600;
		text-anchor: middle;
	}

	.operation {
		fill: var(--color-fg-muted);
		font-size: 1.3rem;
		text-anchor: middle;
	}

	.bracket {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 3;
		stroke-linecap: round;
		transition: all 0.4s ease;
	}

	.equals {
		fill: var(--color-fg-muted);
		font-size: 1.3rem;
		text-anchor: middle;
	}

	.result {
		fill: var(--color-accent);
		font-size: 1.4rem;
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
