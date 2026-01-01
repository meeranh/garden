<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 2;
	const maxStep = totalSteps - 1;

	const domain = ['1', '2', '3'];
	const codomain = ['a', 'b', 'c'];

	type Arrow = { from: string; to: string };

	const arrows: Arrow[] = [
		{ from: '1', to: 'a' },
		{ from: '2', to: 'b' },
		{ from: '3', to: 'c' }
	];

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Bijective function',
				showArrows: false,
				message: null as string | null
			};
		} else {
			return {
				title: 'Bijective function',
				showArrows: true,
				message: 'Perfect pairing — injective + surjective'
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

	const leftX = 60;
	const rightX = 240;
	const startY = 45;
	const gapY = 35;

	function getY(idx: number): number {
		return startY + idx * gapY;
	}
</script>

<div class="container">
	<div class="title">{display.title}</div>

	<div class="diagram-container">
		<svg viewBox="0 0 300 160" class="diagram">
			<!-- Domain box -->
			<rect x="20" y="20" width="80" height="120" rx="8" class="set-box" />
			<text x="60" y="12" class="set-label">A</text>

			<!-- Codomain box -->
			<rect x="200" y="20" width="80" height="120" rx="8" class="set-box" />
			<text x="240" y="12" class="set-label">B</text>

			<!-- Domain elements -->
			{#each domain as el, i}
				<circle cx={leftX} cy={getY(i)} r="14" class="element-circle" />
				<text x={leftX} y={getY(i) + 5} class="element-text">{el}</text>
			{/each}

			<!-- Codomain elements -->
			{#each codomain as el, i}
				<circle cx={rightX} cy={getY(i)} r="14" class="element-circle" />
				<text x={rightX} y={getY(i) + 5} class="element-text">{el}</text>
			{/each}

			<!-- Arrows -->
			{#if display.showArrows}
				{#each arrows as arrow, i}
					<line
						x1={leftX + 14}
						y1={getY(i)}
						x2={rightX - 14}
						y2={getY(i)}
						class="arrow"
					/>
					<polygon
						points="{rightX - 14},{getY(i)} {rightX - 22},{getY(i) - 4} {rightX - 22},{getY(i) + 4}"
						class="arrow-head"
					/>
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
		max-width: 300px;
	}

	.diagram {
		width: 100%;
		height: auto;
	}

	.set-box {
		fill: transparent;
		stroke: var(--color-border);
		stroke-width: 1.5;
	}

	.set-label {
		fill: var(--color-math);
		font-size: 0.9rem;
		font-weight: bold;
		text-anchor: middle;
	}

	.element-circle {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 1.5;
	}

	.element-text {
		fill: var(--color-fg);
		font-size: 0.8rem;
		text-anchor: middle;
	}

	.arrow {
		stroke: var(--color-accent);
		stroke-width: 1.5;
	}

	.arrow-head {
		fill: var(--color-accent);
	}

	.message {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-accent);
		font-size: 0.85rem;
		color: var(--color-accent);
	}
</style>
