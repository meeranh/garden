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
		{ id: 'a', x: 80, y: 80 },
		{ id: 'b', x: 200, y: 80 },
		{ id: 'c', x: 140, y: 160 }
	];

	let display = $derived.by(() => {
		const loopsVisible = currentStep >= 1 ? currentStep : 0;
		let message: string | null = null;

		if (currentStep === 0) {
			message = 'A set with three elements';
		} else if (currentStep === 1) {
			message = 'a relates to itself: a R a';
		} else if (currentStep === 2) {
			message = 'b relates to itself: b R b';
		} else if (currentStep === 3) {
			message = 'Every element relates to itself';
		}

		return { loopsVisible, message };
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
		}, 1200);
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
	<div class="title">Reflexive</div>

	<div class="diagram-container">
		<svg viewBox="0 0 280 200" class="diagram">
			<defs>
				<marker
					id="arrowhead-reflexive"
					markerWidth="10"
					markerHeight="7"
					refX="9"
					refY="3.5"
					orient="auto"
				>
					<polygon points="0 0, 10 3.5, 0 7" fill="var(--color-accent)" />
				</marker>
			</defs>

			<!-- Nodes -->
			{#each nodes as node, i}
				<circle cx={node.x} cy={node.y} r="20" class="node-circle" />
				<text x={node.x} y={node.y + 5} class="node-text">{node.id}</text>

				<!-- Self-loop (centered on top) -->
				{#if display.loopsVisible > i}
					<path
						d="M {node.x - 12} {node.y - 16}
						   C {node.x - 30} {node.y - 55}, {node.x + 30} {node.y - 55}, {node.x + 12} {node.y - 16}"
						class="loop"
						marker-end="url(#arrowhead-reflexive)"
					/>
				{/if}
			{/each}
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

	.loop {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 2;
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
