<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Positions for the Hasse diagram
	const nodes = [
		{ id: 'empty', label: '{ }', x: 140, y: 160 },
		{ id: 'a', label: '{a}', x: 80, y: 100 },
		{ id: 'b', label: '{b}', x: 200, y: 100 },
		{ id: 'ab', label: '{a,b}', x: 140, y: 40 }
	];

	// Edges in the Hasse diagram (from lower to higher)
	const edges = [
		{ from: 'empty', to: 'a' },
		{ from: 'empty', to: 'b' },
		{ from: 'a', to: 'ab' },
		{ from: 'b', to: 'ab' }
	];

	function getNode(id: string) {
		return nodes.find((n) => n.id === id)!;
	}

	let display = $derived.by(() => {
		let showNodes = false;
		let showEdges = false;
		let highlightIncomparable = false;
		let showIncomparableLine = false;
		let message: string | null = null;

		if (currentStep === 0) {
			showNodes = true;
			message = 'Subsets of {a, b}';
		} else if (currentStep === 1) {
			showNodes = true;
			showEdges = true;
			message = 'Lines show ⊆ relationships';
		} else if (currentStep === 2) {
			showNodes = true;
			showEdges = true;
			message = '{ } ⊆ {a} ⊆ {a,b}';
		} else if (currentStep === 3) {
			showNodes = true;
			showEdges = true;
			highlightIncomparable = true;
			message = '{a} and {b} have no line...';
		} else if (currentStep === 4) {
			showNodes = true;
			showEdges = true;
			highlightIncomparable = true;
			showIncomparableLine = true;
			message = 'They are incomparable!';
		}

		return { showNodes, showEdges, highlightIncomparable, showIncomparableLine, message };
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
			currentStep === 3 ? 2000 : 1500
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
	<div class="title">Hasse Diagram</div>

	<div class="diagram-container">
		<svg viewBox="0 0 280 200" class="diagram">
			<!-- Edges -->
			{#if display.showEdges}
				{#each edges as edge}
					{@const from = getNode(edge.from)}
					{@const to = getNode(edge.to)}
					<line x1={from.x} y1={from.y - 15} x2={to.x} y2={to.y + 15} class="edge" />
				{/each}
			{/if}

			<!-- Incomparable gap highlight -->
			{#if display.showIncomparableLine}
				<line x1={95} y1={100} x2={185} y2={100} class="no-edge" />
				<text x="140" y="118" class="no-edge-label">✗</text>
			{/if}

			<!-- Nodes -->
			{#if display.showNodes}
				{#each nodes as node}
					{@const isHighlighted =
						display.highlightIncomparable && (node.id === 'a' || node.id === 'b')}
					<rect
						x={node.x - 25}
						y={node.y - 15}
						width="50"
						height="30"
						rx="6"
						class="node-box"
						class:highlighted={isHighlighted}
					/>
					<text x={node.x} y={node.y + 5} class="node-text" class:highlighted={isHighlighted}
						>{node.label}</text
					>
				{/each}
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

	.node-box {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 1.5;
	}

	.node-box.highlighted {
		stroke: var(--color-math);
		fill: rgba(250, 189, 47, 0.15);
	}

	.node-text {
		fill: var(--color-fg);
		font-size: 0.85rem;
		text-anchor: middle;
		font-family: inherit;
	}

	.node-text.highlighted {
		fill: var(--color-math);
		font-weight: 500;
	}

	.edge {
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.no-edge {
		stroke: var(--color-error, #fb4934);
		stroke-width: 2;
		stroke-dasharray: 6 4;
	}

	.no-edge-label {
		fill: var(--color-error, #fb4934);
		font-size: 1rem;
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
