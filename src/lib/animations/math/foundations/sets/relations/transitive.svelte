<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 4;
	const maxStep = totalSteps - 1;

	const nodes = [
		{ id: 'a', x: 50, y: 100 },
		{ id: 'b', x: 140, y: 100 },
		{ id: 'c', x: 230, y: 100 }
	];

	let display = $derived.by(() => {
		let showAB = false;
		let showBC = false;
		let showAC = false;
		let message: string | null = null;

		if (currentStep === 0) {
			message = 'Three elements a, b, and c';
		} else if (currentStep === 1) {
			showAB = true;
			message = 'a relates to b...';
		} else if (currentStep === 2) {
			showAB = true;
			showBC = true;
			message = '...and b relates to c...';
		} else if (currentStep === 3) {
			showAB = true;
			showBC = true;
			showAC = true;
			message = '...then a must relate to c';
		}

		return { showAB, showBC, showAC, message };
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
	<div class="title">Transitive</div>

	<div class="diagram-container">
		<svg viewBox="0 0 280 160" class="diagram">
			<!-- Nodes -->
			{#each nodes as node}
				<circle cx={node.x} cy={node.y} r="20" class="node-circle" />
				<text x={node.x} y={node.y + 5} class="node-text">{node.id}</text>
			{/each}

			<!-- Arrow a -> b -->
			{#if display.showAB}
				<line x1="72" y1="100" x2="118" y2="100" class="arrow" />
				<polygon points="118,100 108,95 108,105" class="arrow-head" />
			{/if}

			<!-- Arrow b -> c -->
			{#if display.showBC}
				<line x1="162" y1="100" x2="208" y2="100" class="arrow" />
				<polygon points="208,100 198,95 198,105" class="arrow-head" />
			{/if}

			<!-- Arrow a -> c (curved below) -->
			{#if display.showAC}
				<path
					d="M 60 122 Q 140 180, 220 122"
					class="arrow implied"
				/>
				<polygon
					points="220,122 212,130 208,118"
					class="arrow-head implied"
				/>
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
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.arrow.implied {
		fill: none;
		stroke: var(--color-math);
		stroke-dasharray: 6 3;
	}

	.arrow-head {
		fill: var(--color-accent);
	}

	.arrow-head.implied {
		fill: var(--color-math);
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
