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
		let showForward = false;
		let showBackward = false;
		let showCross = false;
		let showEquals = false;
		let message: string | null = null;

		if (currentStep === 0) {
			message = 'Two different elements a and b';
		} else if (currentStep === 1) {
			showForward = true;
			message = 'a relates to b...';
		} else if (currentStep === 2) {
			showForward = true;
			showBackward = true;
			message = '...and b relates to a?';
		} else if (currentStep === 3) {
			showForward = true;
			showBackward = true;
			showEquals = true;
			message = 'Then a must equal b!';
		}

		return { showForward, showBackward, showCross, showEquals, message };
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
	<div class="title">Antisymmetric</div>

	<div class="diagram-container">
		<svg viewBox="0 0 280 160" class="diagram">
			<defs>
				<marker
					id="arrowhead-antisymmetric"
					markerWidth="10"
					markerHeight="7"
					refX="9"
					refY="3.5"
					orient="auto"
				>
					<polygon points="0 0, 10 3.5, 0 7" fill="var(--color-accent)" />
				</marker>
			</defs>

			<!-- Node a -->
			<circle cx="70" cy="100" r="20" class="node-circle" />
			<text x="70" y="105" class="node-text">a</text>

			<!-- Node b -->
			<circle cx="210" cy="100" r="20" class="node-circle" />
			<text x="210" y="105" class="node-text">b</text>

			<!-- Forward arrow (a -> b) - curved up -->
			{#if display.showForward}
				<path
					d="M 92 88 Q 140 50, 188 88"
					class="arrow"
					marker-end="url(#arrowhead-antisymmetric)"
				/>
			{/if}

			<!-- Backward arrow (b -> a) - curved down -->
			{#if display.showBackward}
				<path
					d="M 188 112 Q 140 150, 92 112"
					class="arrow"
					marker-end="url(#arrowhead-antisymmetric)"
				/>
			{/if}

			<!-- Equals sign between them -->
			{#if display.showEquals}
				<text x="140" y="105" class="equals-text">=</text>
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

	.node-circle {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 2;
	}

	.node-text {
		fill: var(--color-fg);
		font-size: 1rem;
		font-weight: 500;
		text-anchor: middle;
	}

	.arrow {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.equals-text {
		fill: var(--color-math);
		font-size: 1.5rem;
		font-weight: bold;
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
