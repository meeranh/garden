<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	const domain = ['1', '2', '3'];
	const codomain = ['a', 'b'];

	type Arrow = { from: string; to: string };

	const arrows: Arrow[] = [
		{ from: '1', to: 'a' },
		{ from: '2', to: 'a' },
		{ from: '3', to: 'b' }
	];

	// Steps:
	// 0: Show function
	// 1: Highlight input 1, show arrow to a
	// 2: "Image of 1 is a"
	// 3: Highlight set {1, 2}, show both arrows
	// 4: "Image of {1,2} is {a}"

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'A function f: A → B',
				highlightInputs: [] as string[],
				highlightOutputs: [] as string[],
				highlightArrows: [] as string[],
				message: 'Each input has one arrow'
			};
		} else if (currentStep === 1) {
			return {
				title: 'Pick an input: 1',
				highlightInputs: ['1'],
				highlightOutputs: [],
				highlightArrows: ['1'],
				message: 'Where does it go?'
			};
		} else if (currentStep === 2) {
			return {
				title: 'Image of 1',
				highlightInputs: ['1'],
				highlightOutputs: ['a'],
				highlightArrows: ['1'],
				message: 'Image of 1 is a'
			};
		} else if (currentStep === 3) {
			return {
				title: 'Pick a set: {1, 2}',
				highlightInputs: ['1', '2'],
				highlightOutputs: [],
				highlightArrows: ['1', '2'],
				message: 'Where do they go?'
			};
		} else {
			return {
				title: 'Image of {1, 2}',
				highlightInputs: ['1', '2'],
				highlightOutputs: ['a'],
				highlightArrows: ['1', '2'],
				message: 'Both land on a → Image is {a}'
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
		return startY + idx * gapY + 17;
	}
</script>

<div class="container">
	<div class="title">{display.title}</div>

	<div class="diagram-container">
		<svg viewBox="0 0 300 150" class="diagram">
			<!-- Domain box -->
			<rect x="20" y="25" width="80" height="115" rx="8" class="set-box" />
			<text x="60" y="17" class="set-label">A</text>

			<!-- Codomain box -->
			<rect x="200" y="25" width="80" height="115" rx="8" class="set-box" />
			<text x="240" y="17" class="set-label">B</text>

			<!-- Domain elements -->
			{#each domain as el, i}
				<circle
					cx={leftX}
					cy={getLeftY(i)}
					r="14"
					class="element-circle"
					class:highlight={display.highlightInputs.includes(el)}
				/>
				<text
					x={leftX}
					y={getLeftY(i) + 5}
					class="element-text"
					class:highlight={display.highlightInputs.includes(el)}
				>{el}</text>
			{/each}

			<!-- Codomain elements -->
			{#each codomain as el, i}
				<circle
					cx={rightX}
					cy={getRightY(i)}
					r="14"
					class="element-circle"
					class:highlight={display.highlightOutputs.includes(el)}
				/>
				<text
					x={rightX}
					y={getRightY(i) + 5}
					class="element-text"
					class:highlight={display.highlightOutputs.includes(el)}
				>{el}</text>
			{/each}

			<!-- Arrows -->
			{#each arrows as arrow}
				{@const fromIdx = domain.indexOf(arrow.from)}
				{@const toIdx = codomain.indexOf(arrow.to)}
				{@const isHighlighted = display.highlightArrows.includes(arrow.from)}
				<line
					x1={leftX + 14}
					y1={getLeftY(fromIdx)}
					x2={rightX - 14}
					y2={getRightY(toIdx)}
					class="arrow"
					class:highlight={isHighlighted}
					class:dimmed={display.highlightArrows.length > 0 && !isHighlighted}
				/>
				<polygon
					points="{rightX - 14},{getRightY(toIdx)} {rightX - 22},{getRightY(toIdx) - 4} {rightX - 22},{getRightY(toIdx) + 4}"
					class="arrow-head"
					class:highlight={isHighlighted}
					class:dimmed={display.highlightArrows.length > 0 && !isHighlighted}
				/>
			{/each}
		</svg>
	</div>

	<div class="message">{display.message}</div>
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
		stroke: var(--color-fg-muted);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.arrow.highlight {
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.arrow.dimmed {
		opacity: 0.2;
	}

	.arrow-head {
		fill: var(--color-fg-muted);
		transition: all 0.3s ease;
	}

	.arrow-head.highlight {
		fill: var(--color-accent);
	}

	.arrow-head.dimmed {
		opacity: 0.2;
	}

	.message {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}
</style>
