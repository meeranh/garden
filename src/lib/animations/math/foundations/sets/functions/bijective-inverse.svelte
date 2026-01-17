<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 4;
	const maxStep = totalSteps - 1;

	const domain = ['1', '2', '3'];
	const codomain = ['a', 'b', 'c'];

	type Arrow = { from: string; to: string };

	const forwardArrows: Arrow[] = [
		{ from: '1', to: 'a' },
		{ from: '2', to: 'b' },
		{ from: '3', to: 'c' }
	];

	const reverseArrows: Arrow[] = [
		{ from: 'a', to: '1' },
		{ from: 'b', to: '2' },
		{ from: 'c', to: '3' }
	];

	// Steps:
	// 0: Show bijective function f
	// 1: Highlight that it's bijective (one-to-one and onto)
	// 2: Show reverse arrows (f⁻¹)
	// 3: Both directions work perfectly

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Bijective function f',
				showForward: true,
				showReverse: false,
				highlightBijective: false,
				message: 'Each input maps to exactly one output'
			};
		} else if (currentStep === 1) {
			return {
				title: 'One-to-one and onto',
				showForward: true,
				showReverse: false,
				highlightBijective: true,
				message: 'Injective + surjective = bijective'
			};
		} else if (currentStep === 2) {
			return {
				title: 'Reverse: f⁻¹',
				showForward: false,
				showReverse: true,
				highlightBijective: false,
				message: 'Every arrow can be reversed'
			};
		} else {
			return {
				title: 'f and f⁻¹',
				showForward: true,
				showReverse: true,
				highlightBijective: false,
				message: 'Bijective = invertible'
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
		}, 2000);
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
	const startY = 50;
	const gapY = 35;

	function getLeftY(idx: number): number {
		return startY + idx * gapY;
	}

	function getRightY(idx: number): number {
		return startY + idx * gapY;
	}
</script>

<div class="container">
	<div class="title" class:highlight={display.highlightBijective}>{display.title}</div>

	<div class="diagram-container">
		<svg viewBox="0 0 300 160" class="diagram">
			<!-- Domain box -->
			<rect x="20" y="25" width="80" height="120" rx="8" class="set-box" />
			<text x="60" y="17" class="set-label">A</text>

			<!-- Codomain box -->
			<rect x="200" y="25" width="80" height="120" rx="8" class="set-box" />
			<text x="240" y="17" class="set-label">B</text>

			<!-- Domain elements -->
			{#each domain as el, i}
				<circle
					cx={leftX}
					cy={getLeftY(i)}
					r="14"
					class="element-circle"
					class:highlight={display.highlightBijective}
				/>
				<text
					x={leftX}
					y={getLeftY(i) + 5}
					class="element-text"
					class:highlight={display.highlightBijective}
				>{el}</text>
			{/each}

			<!-- Codomain elements -->
			{#each codomain as el, i}
				<circle
					cx={rightX}
					cy={getRightY(i)}
					r="14"
					class="element-circle"
					class:highlight={display.highlightBijective}
				/>
				<text
					x={rightX}
					y={getRightY(i) + 5}
					class="element-text"
					class:highlight={display.highlightBijective}
				>{el}</text>
			{/each}

			<!-- Forward arrows (f) -->
			{#if display.showForward}
				{#each forwardArrows as arrow}
					{@const fromIdx = domain.indexOf(arrow.from)}
					{@const toIdx = codomain.indexOf(arrow.to)}
					<line
						x1={leftX + 14}
						y1={getLeftY(fromIdx)}
						x2={rightX - 14}
						y2={getRightY(toIdx)}
						class="arrow forward"
					/>
					<polygon
						points="{rightX - 14},{getRightY(toIdx)} {rightX - 22},{getRightY(toIdx) - 4} {rightX - 22},{getRightY(toIdx) + 4}"
						class="arrow-head forward"
					/>
				{/each}
			{/if}

			<!-- Reverse arrows (f⁻¹) -->
			{#if display.showReverse}
				{#each reverseArrows as arrow}
					{@const fromIdx = codomain.indexOf(arrow.from)}
					{@const toIdx = domain.indexOf(arrow.to)}
					<line
						x1={rightX - 14}
						y1={getRightY(fromIdx) + 8}
						x2={leftX + 14}
						y2={getLeftY(toIdx) + 8}
						class="arrow reverse"
					/>
					<polygon
						points="{leftX + 14},{getLeftY(toIdx) + 8} {leftX + 22},{getLeftY(toIdx) + 4} {leftX + 22},{getLeftY(toIdx) + 12}"
						class="arrow-head reverse"
					/>
				{/each}
			{/if}

			<!-- Labels for arrows -->
			{#if display.showForward && !display.showReverse}
				<text x="150" y="148" class="arrow-label forward-label">f</text>
			{/if}
			{#if display.showReverse && !display.showForward}
				<text x="150" y="148" class="arrow-label reverse-label">f⁻¹</text>
			{/if}
			{#if display.showForward && display.showReverse}
				<text x="130" y="148" class="arrow-label forward-label">f</text>
				<text x="170" y="148" class="arrow-label reverse-label">f⁻¹</text>
			{/if}
		</svg>
	</div>

	<div class="message" class:highlight={display.highlightBijective}>{display.message}</div>
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
		color: var(--color-fg);
		font-weight: 500;
	}

	.title.highlight {
		color: var(--color-accent);
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
		transition: all 0.3s ease;
	}

	.element-circle.highlight {
		stroke: var(--color-accent);
		fill: rgba(142, 192, 124, 0.2);
	}

	.element-text {
		fill: var(--color-fg);
		font-size: 0.8rem;
		text-anchor: middle;
		transition: all 0.3s ease;
	}

	.element-text.highlight {
		fill: var(--color-accent);
	}

	.arrow {
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.arrow.forward {
		stroke: var(--color-accent);
	}

	.arrow.reverse {
		stroke: var(--color-math);
	}

	.arrow-head {
		transition: all 0.3s ease;
	}

	.arrow-head.forward {
		fill: var(--color-accent);
	}

	.arrow-head.reverse {
		fill: var(--color-math);
	}

	.arrow-label {
		font-size: 0.85rem;
		font-weight: 500;
		text-anchor: middle;
	}

	.forward-label {
		fill: var(--color-accent);
	}

	.reverse-label {
		fill: var(--color-math);
	}

	.message {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.message.highlight {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
