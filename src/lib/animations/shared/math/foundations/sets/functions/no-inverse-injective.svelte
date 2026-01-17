<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 3;
	const maxStep = totalSteps - 1;

	const domain = ['2', '-2', '3'];
	const codomain = ['4', '9'];

	type Arrow = { from: string; to: string };

	const arrows: Arrow[] = [
		{ from: '2', to: '4' },
		{ from: '-2', to: '4' },
		{ from: '3', to: '9' }
	];

	// Steps:
	// 0: Show function (not injective - two inputs to same output)
	// 1: Try to reverse - which input for 4?
	// 2: Ambiguous - no inverse

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'f(x) = x² (not injective)',
				showArrows: true,
				showReverse: false,
				showProblem: false,
				message: 'Two inputs map to the same output'
			};
		} else if (currentStep === 1) {
			return {
				title: 'Try to reverse...',
				showArrows: true,
				showReverse: true,
				showProblem: false,
				message: 'f⁻¹(4) = ?'
			};
		} else {
			return {
				title: 'No inverse exists',
				showArrows: true,
				showReverse: true,
				showProblem: true,
				message: 'Is it 2 or -2? Ambiguous!'
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
	<div class="title" class:error={display.showProblem}>{display.title}</div>

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
					class:problem={display.showProblem && (el === '2' || el === '-2')}
				/>
				<text
					x={leftX}
					y={getLeftY(i) + 5}
					class="element-text"
					class:problem={display.showProblem && (el === '2' || el === '-2')}
				>{el}</text>
			{/each}

			<!-- Codomain elements -->
			{#each codomain as el, i}
				<circle
					cx={rightX}
					cy={getRightY(i)}
					r="14"
					class="element-circle"
					class:highlight={display.showReverse && el === '4'}
				/>
				<text
					x={rightX}
					y={getRightY(i) + 5}
					class="element-text"
					class:highlight={display.showReverse && el === '4'}
				>{el}</text>
			{/each}

			<!-- Forward arrows -->
			{#if display.showArrows}
				{#each arrows as arrow}
					{@const fromIdx = domain.indexOf(arrow.from)}
					{@const toIdx = codomain.indexOf(arrow.to)}
					<line
						x1={leftX + 14}
						y1={getLeftY(fromIdx)}
						x2={rightX - 14}
						y2={getRightY(toIdx)}
						class="arrow"
						class:problem={display.showProblem && arrow.to === '4'}
					/>
					<polygon
						points="{rightX - 14},{getRightY(toIdx)} {rightX - 22},{getRightY(toIdx) - 4} {rightX - 22},{getRightY(toIdx) + 4}"
						class="arrow-head"
						class:problem={display.showProblem && arrow.to === '4'}
					/>
				{/each}
			{/if}

			<!-- Reverse arrow attempt -->
			{#if display.showReverse}
				<text x="150" y="145" class="question">?</text>
			{/if}
		</svg>
	</div>

	<div class="message" class:error={display.showProblem}>{display.message}</div>
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

	.title.error {
		color: var(--color-error);
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
		stroke: var(--color-math);
		fill: rgba(250, 189, 47, 0.2);
	}

	.element-circle.problem {
		stroke: var(--color-error);
		fill: rgba(251, 73, 52, 0.2);
	}

	.element-text {
		fill: var(--color-fg);
		font-size: 0.8rem;
		text-anchor: middle;
		transition: all 0.3s ease;
	}

	.element-text.highlight {
		fill: var(--color-math);
	}

	.element-text.problem {
		fill: var(--color-error);
	}

	.arrow {
		stroke: var(--color-accent);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.arrow.problem {
		stroke: var(--color-error);
	}

	.arrow-head {
		fill: var(--color-accent);
		transition: all 0.3s ease;
	}

	.arrow-head.problem {
		fill: var(--color-error);
	}

	.question {
		fill: var(--color-error);
		font-size: 1.2rem;
		font-weight: bold;
		text-anchor: middle;
	}

	.message {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.message.error {
		border-color: var(--color-error);
		color: var(--color-error);
	}
</style>
