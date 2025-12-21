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
	// 1: Highlight A
	// 2: Highlight B
	// 3: Show only intersection highlighted
	// 4: Show result

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Two sets: A and B',
				highlightA: false,
				highlightB: false,
				highlightIntersection: false,
				dimOuter: false,
				showResult: false
			};
		} else if (currentStep === 1) {
			return {
				title: 'Set A = {1, 2, 3}',
				highlightA: true,
				highlightB: false,
				highlightIntersection: false,
				dimOuter: false,
				showResult: false
			};
		} else if (currentStep === 2) {
			return {
				title: 'Set B = {3, 4, 5}',
				highlightA: false,
				highlightB: true,
				highlightIntersection: false,
				dimOuter: false,
				showResult: false
			};
		} else if (currentStep === 3) {
			return {
				title: 'A ∩ B = only what\'s in BOTH',
				highlightA: false,
				highlightB: false,
				highlightIntersection: true,
				dimOuter: true,
				showResult: false
			};
		} else {
			return {
				title: 'A ∩ B = {3}',
				highlightA: false,
				highlightB: false,
				highlightIntersection: true,
				dimOuter: true,
				showResult: true
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
				<clipPath id="clipA">
					<circle cx="110" cy="90" r="60" />
				</clipPath>
				<clipPath id="clipB">
					<circle cx="190" cy="90" r="60" />
				</clipPath>
			</defs>

			<!-- Circle A -->
			<circle
				cx="110"
				cy="90"
				r="60"
				class="circle-a"
				class:highlight={display.highlightA}
				class:dim={display.dimOuter}
			/>
			<!-- Circle B -->
			<circle
				cx="190"
				cy="90"
				r="60"
				class="circle-b"
				class:highlight={display.highlightB}
				class:dim={display.dimOuter}
			/>

			<!-- Intersection highlight -->
			{#if display.highlightIntersection}
				<circle
					cx="190"
					cy="90"
					r="60"
					clip-path="url(#clipA)"
					class="intersection"
				/>
			{/if}

			<!-- Labels above circles -->
			<text x="90" y="22" class="label" class:dim={display.dimOuter}>A</text>
			<text x="210" y="22" class="label" class:dim={display.dimOuter}>B</text>

			<!-- Elements in A only -->
			<text x="90" y="80" class="element" class:dim={display.dimOuter}>1</text>
			<text x="90" y="110" class="element" class:dim={display.dimOuter}>2</text>

			<!-- Element in intersection -->
			<text x="150" y="95" class="element overlap" class:highlight={display.highlightIntersection}>3</text>

			<!-- Elements in B only -->
			<text x="210" y="80" class="element" class:dim={display.dimOuter}>4</text>
			<text x="210" y="110" class="element" class:dim={display.dimOuter}>5</text>
		</svg>
	</div>

	{#if display.showResult}
		<div class="result">
			Intersection keeps only <strong>shared</strong> elements
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

	.circle-a.highlight,
	.circle-b.highlight {
		fill: rgba(142, 192, 124, 0.2);
		stroke: var(--color-accent);
	}

	.circle-a.dim,
	.circle-b.dim {
		stroke: var(--color-border);
	}

	.intersection {
		fill: rgba(250, 189, 47, 0.3);
		stroke: var(--color-math);
		stroke-width: 2;
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

	.element.overlap {
		fill: var(--color-math);
		font-weight: bold;
	}

	.element.overlap.highlight {
		font-size: 1rem;
	}

	.result {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.result strong {
		color: var(--color-math);
	}
</style>
