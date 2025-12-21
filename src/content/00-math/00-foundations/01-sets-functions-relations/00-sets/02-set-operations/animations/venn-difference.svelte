<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Steps:
	// 0: Show two circles A and B
	// 1: Highlight all of A
	// 2: Show what we're removing (intersection)
	// 3: Show difference (A minus intersection)
	// 4: Show result

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Two sets: A and B',
				phase: 'intro'
			};
		} else if (currentStep === 1) {
			return {
				title: 'Start with A = {1, 2, 3}',
				phase: 'showA'
			};
		} else if (currentStep === 2) {
			return {
				title: 'Remove what\'s also in B',
				phase: 'showRemove'
			};
		} else if (currentStep === 3) {
			return {
				title: 'A \\ B = what\'s left',
				phase: 'showDifference'
			};
		} else {
			return {
				title: 'A \\ B = {1, 2}',
				phase: 'result'
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
</script>

<div class="container">
	<div class="title">{display.title}</div>

	<div class="venn-container">
		<svg viewBox="0 0 300 180" class="venn">
			<defs>
				<clipPath id="clipADiff">
					<circle cx="110" cy="90" r="60" />
				</clipPath>
				<clipPath id="clipBDiff">
					<circle cx="190" cy="90" r="60" />
				</clipPath>
				<!-- A minus B clip path -->
				<mask id="diffMask">
					<rect width="100%" height="100%" fill="white" />
					<circle cx="190" cy="90" r="60" fill="black" />
				</mask>
			</defs>

			<!-- Circle A - difference highlighted -->
			{#if display.phase === 'showDifference' || display.phase === 'result'}
				<circle
					cx="110"
					cy="90"
					r="60"
					mask="url(#diffMask)"
					class="difference-fill"
				/>
			{/if}

			<!-- Circle A -->
			<circle
				cx="110"
				cy="90"
				r="60"
				class="circle-a"
				class:highlight={display.phase === 'showA'}
				class:dim={display.phase === 'showDifference' || display.phase === 'result'}
			/>

			<!-- Circle B -->
			<circle
				cx="190"
				cy="90"
				r="60"
				class="circle-b"
				class:dim={display.phase === 'showA' || display.phase === 'showDifference' || display.phase === 'result'}
			/>

			<!-- Intersection to remove -->
			{#if display.phase === 'showRemove'}
				<circle
					cx="190"
					cy="90"
					r="60"
					clip-path="url(#clipADiff)"
					class="remove-zone"
				/>
			{/if}

			<!-- Labels above circles -->
			<text x="90" y="22" class="label">A</text>
			<text x="210" y="22" class="label" class:dim={display.phase !== 'intro'}>B</text>

			<!-- Elements in A only -->
			<text
				x="90"
				y="80"
				class="element"
				class:highlight={display.phase === 'showDifference' || display.phase === 'result'}
			>1</text>
			<text
				x="90"
				y="110"
				class="element"
				class:highlight={display.phase === 'showDifference' || display.phase === 'result'}
			>2</text>

			<!-- Element in intersection -->
			<text
				x="150"
				y="95"
				class="element overlap"
				class:removing={display.phase === 'showRemove'}
				class:removed={display.phase === 'showDifference' || display.phase === 'result'}
			>3</text>

			<!-- Elements in B only -->
			<text x="210" y="80" class="element" class:dim={display.phase !== 'intro'}>4</text>
			<text x="210" y="110" class="element" class:dim={display.phase !== 'intro'}>5</text>
		</svg>
	</div>

	{#if display.phase === 'result'}
		<div class="result">
			Difference: A <strong>minus</strong> what's shared with B
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem;
	}

	.title {
		font-size: 0.95rem;
		color: var(--color-fg);
		font-weight: 500;
	}

	.venn-container {
		width: 100%;
		max-width: 300px;
	}

	.venn {
		width: 100%;
		height: auto;
	}

	.circle-a,
	.circle-b {
		fill: transparent;
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: all 0.3s ease;
	}

	.circle-a.highlight {
		fill: rgba(142, 192, 124, 0.2);
		stroke: var(--color-accent);
	}

	.circle-a.dim,
	.circle-b.dim {
		stroke: var(--color-border);
	}

	.difference-fill {
		fill: rgba(142, 192, 124, 0.3);
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.remove-zone {
		fill: rgba(251, 73, 52, 0.2);
		stroke: var(--color-error);
		stroke-width: 2;
		stroke-dasharray: 4 2;
	}

	.label {
		fill: var(--color-fg-muted);
		font-size: 1rem;
		font-weight: bold;
		transition: all 0.3s ease;
	}

	.label.dim {
		fill: var(--color-border);
	}

	.element {
		fill: var(--color-fg);
		font-size: 0.85rem;
		text-anchor: middle;
		transition: all 0.3s ease;
	}

	.element.dim {
		fill: var(--color-border);
	}

	.element.highlight {
		fill: var(--color-accent);
		font-weight: bold;
	}

	.element.overlap {
		fill: var(--color-fg);
	}

	.element.overlap.removing {
		fill: var(--color-error);
	}

	.element.overlap.removed {
		fill: var(--color-border);
		text-decoration: line-through;
	}

	.result {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.result strong {
		color: var(--color-accent);
	}
</style>
