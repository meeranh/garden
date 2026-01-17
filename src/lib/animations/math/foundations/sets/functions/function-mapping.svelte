<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	const setA = ['1', '2'];
	const setB = ['a', 'b'];

	// Steps:
	// 0: Show sets A and B
	// 1: Valid function: 1→a, 2→b
	// 2: Also valid: 1→b, 2→b (both to same output)
	// 3: Not a function: 1→a AND 1→b (two arrows from 1)
	// 4: Not a function: only 1→a, 2 has no arrow

	type Arrow = { from: string; to: string };

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Sets A = {1, 2} and B = {a, b}',
				arrows: [] as Arrow[],
				invalid: null as string | null,
				isValid: true,
				message: null as string | null
			};
		} else if (currentStep === 1) {
			return {
				title: 'Valid function',
				arrows: [{ from: '1', to: 'a' }, { from: '2', to: 'b' }],
				invalid: null,
				isValid: true,
				message: 'Each input has one arrow'
			};
		} else if (currentStep === 2) {
			return {
				title: 'Also valid',
				arrows: [{ from: '1', to: 'b' }, { from: '2', to: 'b' }],
				invalid: null,
				isValid: true,
				message: 'Multiple inputs can share an output'
			};
		} else if (currentStep === 3) {
			return {
				title: 'Not a function',
				arrows: [{ from: '1', to: 'a' }, { from: '1', to: 'b' }, { from: '2', to: 'a' }],
				invalid: '1',
				isValid: false,
				message: 'Input 1 has two arrows'
			};
		} else {
			return {
				title: 'Not a function',
				arrows: [{ from: '1', to: 'a' }],
				invalid: '2',
				isValid: false,
				message: 'Input 2 has no arrow'
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

	// SVG positions
	const leftX = 60;
	const rightX = 240;
	const startY = 50;
	const gapY = 50;

	function getLeftY(el: string): number {
		const idx = setA.indexOf(el);
		return startY + idx * gapY;
	}

	function getRightY(el: string): number {
		const idx = setB.indexOf(el);
		return startY + idx * gapY;
	}
</script>

<div class="container">
	<div class="title" class:valid={display.isValid} class:invalid={!display.isValid && currentStep > 0}>
		{display.title}
	</div>

	<div class="diagram-container">
		<svg viewBox="0 0 300 150" class="diagram">
			<!-- Set A box -->
			<rect x="20" y="20" width="80" height="110" rx="8" class="set-box" />
			<text x="60" y="12" class="set-label">A</text>

			<!-- Set B box -->
			<rect x="200" y="20" width="80" height="110" rx="8" class="set-box" />
			<text x="240" y="12" class="set-label">B</text>

			<!-- Elements of A -->
			{#each setA as el}
				<circle
					cx={leftX}
					cy={getLeftY(el)}
					r="18"
					class="element-circle"
					class:invalid={display.invalid === el}
				/>
				<text
					x={leftX}
					y={getLeftY(el) + 5}
					class="element-text"
					class:invalid={display.invalid === el}
				>{el}</text>
			{/each}

			<!-- Elements of B -->
			{#each setB as el}
				<circle
					cx={rightX}
					cy={getRightY(el)}
					r="18"
					class="element-circle"
				/>
				<text
					x={rightX}
					y={getRightY(el) + 5}
					class="element-text"
				>{el}</text>
			{/each}

			<!-- Arrows -->
			{#each display.arrows as arrow}
				<line
					x1={leftX + 18}
					y1={getLeftY(arrow.from)}
					x2={rightX - 18}
					y2={getRightY(arrow.to)}
					class="arrow"
					class:invalid={display.invalid === arrow.from}
				/>
				<!-- Arrow head -->
				<polygon
					points="{rightX - 18},{getRightY(arrow.to)} {rightX - 28},{getRightY(arrow.to) - 5} {rightX - 28},{getRightY(arrow.to) + 5}"
					class="arrow-head"
					class:invalid={display.invalid === arrow.from}
				/>
			{/each}
		</svg>
	</div>

	{#if display.message}
		<div class="message" class:valid={display.isValid} class:invalid={!display.isValid}>
			{display.message}
		</div>
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
		color: var(--color-fg);
		font-weight: 500;
	}

	.title.valid {
		color: var(--color-accent);
	}

	.title.invalid {
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

	.element-circle.invalid {
		stroke: var(--color-error);
		fill: rgba(251, 73, 52, 0.15);
	}

	.element-text {
		fill: var(--color-fg);
		font-size: 0.9rem;
		text-anchor: middle;
		transition: all 0.3s ease;
	}

	.element-text.invalid {
		fill: var(--color-error);
	}

	.arrow {
		stroke: var(--color-accent);
		stroke-width: 2;
		transition: all 0.3s ease;
	}

	.arrow.invalid {
		stroke: var(--color-error);
	}

	.arrow-head {
		fill: var(--color-accent);
		transition: all 0.3s ease;
	}

	.arrow-head.invalid {
		fill: var(--color-error);
	}

	.message {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.message.valid {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.message.invalid {
		border-color: var(--color-error);
		color: var(--color-error);
	}
</style>
