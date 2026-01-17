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
	// 0: Show universal set with A inside
	// 1: Highlight universal set U
	// 2: Highlight set A
	// 3: Show complement (U minus A)
	// 4: Show result

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Universal set U contains everything',
				phase: 'intro'
			};
		} else if (currentStep === 1) {
			return {
				title: 'U = {1, 2, 3, 4, 5}',
				phase: 'showU'
			};
		} else if (currentStep === 2) {
			return {
				title: 'A = {1, 2, 3}',
				phase: 'showA'
			};
		} else if (currentStep === 3) {
			return {
				title: 'Aᶜ = everything NOT in A',
				phase: 'showComplement'
			};
		} else {
			return {
				title: 'Aᶜ = {4, 5}',
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
				<mask id="complementMask">
					<rect x="20" y="20" width="260" height="140" fill="white" />
					<circle cx="120" cy="90" r="55" fill="black" />
				</mask>
			</defs>

			<!-- Universal set background -->
			<rect
				x="20"
				y="20"
				width="260"
				height="140"
				class="universal"
				class:highlight={display.phase === 'showU'}
			/>

			<!-- Complement highlight (U minus A) -->
			{#if display.phase === 'showComplement' || display.phase === 'result'}
				<rect
					x="20"
					y="20"
					width="260"
					height="140"
					mask="url(#complementMask)"
					class="complement-fill"
				/>
			{/if}

			<!-- Circle A -->
			<circle
				cx="120"
				cy="90"
				r="55"
				class="circle-a"
				class:highlight={display.phase === 'showA'}
				class:dim={display.phase === 'showComplement' || display.phase === 'result'}
			/>

			<!-- U label -->
			<text x="35" y="40" class="label-u">U</text>

			<!-- A label left of circle -->
			<text x="45" y="90" class="label" class:dim={display.phase === 'showComplement' || display.phase === 'result'}>A</text>

			<!-- Elements in A -->
			<text x="100" y="85" class="element" class:dim={display.phase === 'showComplement' || display.phase === 'result'}>1</text>
			<text x="140" y="85" class="element" class:dim={display.phase === 'showComplement' || display.phase === 'result'}>2</text>
			<text x="120" y="115" class="element" class:dim={display.phase === 'showComplement' || display.phase === 'result'}>3</text>

			<!-- Elements in complement -->
			<text
				x="220"
				y="70"
				class="element"
				class:highlight={display.phase === 'showComplement' || display.phase === 'result'}
			>4</text>
			<text
				x="220"
				y="110"
				class="element"
				class:highlight={display.phase === 'showComplement' || display.phase === 'result'}
			>5</text>
		</svg>
	</div>

	{#if display.phase === 'result'}
		<div class="result">
			Complement: everything in U that's <strong>not</strong> in A
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

	.universal {
		fill: transparent;
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		rx: 4;
		transition: all 0.3s ease;
	}

	.universal.highlight {
		stroke: var(--color-math);
		fill: rgba(250, 189, 47, 0.1);
	}

	.circle-a {
		fill: transparent;
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: all 0.3s ease;
	}

	.circle-a.highlight {
		fill: rgba(142, 192, 124, 0.2);
		stroke: var(--color-accent);
	}

	.circle-a.dim {
		stroke: var(--color-border);
		fill: rgba(60, 56, 54, 0.5);
	}

	.complement-fill {
		fill: rgba(142, 192, 124, 0.25);
		stroke: none;
	}

	.label-u {
		fill: var(--color-math);
		font-size: 0.9rem;
		font-weight: bold;
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
