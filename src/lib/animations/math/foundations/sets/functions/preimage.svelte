<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	const domain = ['1', '2', '3'];
	const codomain = ['a', 'b', 'c'];

	type Arrow = { from: string; to: string };

	const arrows: Arrow[] = [
		{ from: '1', to: 'a' },
		{ from: '2', to: 'a' },
		{ from: '3', to: 'b' }
		// Note: nothing maps to 'c'
	];

	// Steps:
	// 0: Show function (note: c has no arrow)
	// 1: Pick output a, ask "who maps here?"
	// 2: Show preimage of a = {1, 2}
	// 3: Pick output b, ask "who maps here?"
	// 4: Show preimage of b = {3}
	// 5: Pick output c, ask "who maps here?"
	// 6: Show preimage of c = {} (empty)

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'A function f: A → B',
				highlightInputs: [] as string[],
				highlightOutput: '',
				showQuestion: false,
				showEmpty: false,
				message: 'Notice: nothing maps to c'
			};
		} else if (currentStep === 1) {
			return {
				title: 'Pick output: a',
				highlightInputs: [],
				highlightOutput: 'a',
				showQuestion: true,
				showEmpty: false,
				message: 'Who maps to a?'
			};
		} else if (currentStep === 2) {
			return {
				title: 'Preimage of a',
				highlightInputs: ['1', '2'],
				highlightOutput: 'a',
				showQuestion: false,
				showEmpty: false,
				message: 'Preimage of a = {1, 2}'
			};
		} else if (currentStep === 3) {
			return {
				title: 'Pick output: b',
				highlightInputs: [],
				highlightOutput: 'b',
				showQuestion: true,
				showEmpty: false,
				message: 'Who maps to b?'
			};
		} else if (currentStep === 4) {
			return {
				title: 'Preimage of b',
				highlightInputs: ['3'],
				highlightOutput: 'b',
				showQuestion: false,
				showEmpty: false,
				message: 'Preimage of b = {3}'
			};
		} else if (currentStep === 5) {
			return {
				title: 'Pick output: c',
				highlightInputs: [],
				highlightOutput: 'c',
				showQuestion: true,
				showEmpty: false,
				message: 'Who maps to c?'
			};
		} else {
			return {
				title: 'Preimage of c',
				highlightInputs: [],
				highlightOutput: 'c',
				showQuestion: false,
				showEmpty: true,
				message: 'Preimage of c = { } (empty!)'
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
	const domainStartY = 50;
	const codomainStartY = 45;
	const gapY = 35;

	function getLeftY(idx: number): number {
		return domainStartY + idx * gapY;
	}

	function getRightY(idx: number): number {
		return codomainStartY + idx * gapY;
	}

	function getArrowsTo(output: string): string[] {
		return arrows.filter(a => a.to === output).map(a => a.from);
	}
</script>

<div class="container">
	<div class="title" class:empty={display.showEmpty}>{display.title}</div>

	<div class="diagram-container">
		<svg viewBox="0 0 300 155" class="diagram">
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
				{@const isUnhit = el === 'c'}
				<circle
					cx={rightX}
					cy={getRightY(i)}
					r="14"
					class="element-circle"
					class:unhit={isUnhit && currentStep === 0}
					class:highlight={display.highlightOutput === el}
					class:empty={display.showEmpty && el === 'c'}
				/>
				<text
					x={rightX}
					y={getRightY(i) + 5}
					class="element-text"
					class:unhit={isUnhit && currentStep === 0}
					class:highlight={display.highlightOutput === el}
					class:empty={display.showEmpty && el === 'c'}
				>{el}</text>
			{/each}

			<!-- Arrows -->
			{#each arrows as arrow}
				{@const fromIdx = domain.indexOf(arrow.from)}
				{@const toIdx = codomain.indexOf(arrow.to)}
				{@const isHighlighted = display.highlightInputs.includes(arrow.from) && display.highlightOutput === arrow.to}
				<line
					x1={leftX + 14}
					y1={getLeftY(fromIdx)}
					x2={rightX - 14}
					y2={getRightY(toIdx)}
					class="arrow"
					class:highlight={isHighlighted}
					class:dimmed={display.highlightOutput && !isHighlighted}
				/>
				<polygon
					points="{rightX - 14},{getRightY(toIdx)} {rightX - 22},{getRightY(toIdx) - 4} {rightX - 22},{getRightY(toIdx) + 4}"
					class="arrow-head"
					class:highlight={isHighlighted}
					class:dimmed={display.highlightOutput && !isHighlighted}
				/>
			{/each}

			<!-- Question mark -->
			{#if display.showQuestion}
				<text x="150" y="145" class="question">?</text>
			{/if}
		</svg>
	</div>

	<div class="message" class:empty={display.showEmpty}>{display.message}</div>
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

	.title.empty {
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

	.element-circle.unhit {
		stroke-dasharray: 4 2;
	}

	.element-circle.highlight {
		stroke: var(--color-math);
		fill: rgba(250, 189, 47, 0.2);
	}

	.element-circle.empty {
		stroke: var(--color-error);
		fill: rgba(251, 73, 52, 0.2);
	}

	.element-text {
		fill: var(--color-fg);
		font-size: 0.8rem;
		text-anchor: middle;
		transition: all 0.3s ease;
	}

	.element-text.unhit {
		fill: var(--color-fg-muted);
	}

	.element-text.highlight {
		fill: var(--color-math);
	}

	.element-text.empty {
		fill: var(--color-error);
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

	.question {
		fill: var(--color-math);
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

	.message.empty {
		border-color: var(--color-error);
		color: var(--color-error);
	}
</style>
