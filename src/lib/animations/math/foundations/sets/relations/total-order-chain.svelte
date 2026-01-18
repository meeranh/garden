<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	const numbers = [1, 2, 3, 4, 5];

	// Scattered positions
	const scatteredPos: Record<number, { x: number; y: number }> = {
		1: { x: 200, y: 50 },
		2: { x: 60, y: 90 },
		3: { x: 160, y: 140 },
		4: { x: 90, y: 170 },
		5: { x: 220, y: 120 }
	};

	// Chain positions (vertical line)
	const chainPos: Record<number, { x: number; y: number }> = {
		1: { x: 140, y: 170 },
		2: { x: 140, y: 135 },
		3: { x: 140, y: 100 },
		4: { x: 140, y: 65 },
		5: { x: 140, y: 30 }
	};

	// Horizontal positions
	const horizontalPos: Record<number, { x: number; y: number }> = {
		1: { x: 30, y: 100 },
		2: { x: 80, y: 100 },
		3: { x: 140, y: 100 },
		4: { x: 200, y: 100 },
		5: { x: 250, y: 100 }
	};

	let display = $derived.by(() => {
		let position: 'scattered' | 'chain' | 'horizontal' = 'scattered';
		let showEdges = false;
		let showLeqSymbols = false;
		let highlightPair = false;
		let message: string | null = null;

		if (currentStep === 0) {
			message = 'Five numbers';
		} else if (currentStep === 1) {
			highlightPair = true;
			message = 'Pick any two: 2 ≤ 5? Yes!';
		} else if (currentStep === 2) {
			position = 'chain';
			message = 'Every pair is comparable';
		} else if (currentStep === 3) {
			position = 'chain';
			showEdges = true;
			message = 'Forms a single chain - total order';
		} else if (currentStep === 4) {
			position = 'horizontal';
			showLeqSymbols = true;
			message = '1 ≤ 2 ≤ 3 ≤ 4 ≤ 5';
		}

		return { position, showEdges, showLeqSymbols, highlightPair, message };
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
	<div class="title">Total Order</div>

	<div class="diagram-container">
		<svg viewBox="0 0 280 200" class="diagram">
			<defs>
				<marker
					id="arrowhead-total"
					markerWidth="10"
					markerHeight="7"
					refX="9"
					refY="3.5"
					orient="auto"
				>
					<polygon points="0 0, 10 3.5, 0 7" fill="var(--color-accent)" />
				</marker>
			</defs>

			<!-- Chain edges -->
			{#if display.showEdges}
				{#each [1, 2, 3, 4] as n}
					{@const from = chainPos[n]}
					{@const to = chainPos[n + 1]}
					<line
						x1={from.x}
						y1={from.y - 18}
						x2={to.x}
						y2={to.y + 18}
						class="edge"
						marker-end="url(#arrowhead-total)"
					/>
				{/each}
			{/if}

			<!-- Highlight line between 2 and 5 -->
			{#if display.highlightPair}
				<line
					x1={scatteredPos[2].x}
					y1={scatteredPos[2].y}
					x2={scatteredPos[5].x}
					y2={scatteredPos[5].y}
					class="compare-line"
				/>
			{/if}

			<!-- ≤ symbols between horizontal numbers -->
			{#if display.showLeqSymbols}
				{#each [1, 2, 3, 4] as n}
					{@const from = horizontalPos[n]}
					{@const to = horizontalPos[n + 1]}
					<text x={(from.x + to.x) / 2} y={100 + 5} class="leq-symbol">≤</text>
				{/each}
			{/if}

			<!-- Numbers -->
			{#each numbers as n}
				{@const pos = display.position === 'horizontal' ? horizontalPos[n] : display.position === 'chain' ? chainPos[n] : scatteredPos[n]}
				{@const isHighlighted = display.highlightPair && (n === 2 || n === 5)}
				<circle
					cx={pos.x}
					cy={pos.y}
					r="18"
					class="number-circle"
					class:highlighted={isHighlighted}
				/>
				<text x={pos.x} y={pos.y + 6} class="number-text" class:highlighted={isHighlighted}
					>{n}</text
				>
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

	.number-circle {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: all 0.5s ease;
	}

	.number-circle.highlighted {
		stroke: var(--color-accent);
		fill: rgba(142, 192, 124, 0.2);
	}

	.number-text {
		fill: var(--color-fg);
		font-size: 1rem;
		font-weight: 500;
		text-anchor: middle;
		transition: all 0.5s ease;
	}

	.number-text.highlighted {
		fill: var(--color-accent);
	}

	.edge {
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.compare-line {
		stroke: var(--color-accent);
		stroke-width: 2;
		stroke-dasharray: 5 3;
		opacity: 0.6;
	}

	.leq-symbol {
		fill: var(--color-accent);
		font-size: 1.1rem;
		font-weight: 600;
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
