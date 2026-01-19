<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	let display = $derived.by(() => {
		let showA = false;
		let showBC = false;
		let showSplit = false;
		let showDistributed = false;
		let showResult = false;
		let message = '';

		if (currentStep === 0) {
			showA = true;
			message = '3 × (4 + 2)';
		} else if (currentStep === 1) {
			showA = true;
			showBC = true;
			message = '3 times the sum of 4 and 2';
		} else if (currentStep === 2) {
			showA = true;
			showSplit = true;
			message = 'Split into two parts...';
		} else if (currentStep === 3) {
			showDistributed = true;
			message = '(3 × 4) + (3 × 2)';
		} else if (currentStep === 4) {
			showResult = true;
			message = '12 + 6 = 18';
		}

		return { showA, showBC, showSplit, showDistributed, showResult, message };
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
			1800
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
	<div class="title">Distributive</div>

	<div class="diagram-container">
		<svg viewBox="0 0 300 160" class="diagram">
			{#if !display.showDistributed && !display.showResult}
				<!-- Combined rectangle showing 3 × (4 + 2) -->
				<!-- Height label (3) -->
				{#if display.showA}
					<text x="25" y="90" class="dim-label label-a">3</text>
					<line x1="40" y1="40" x2="40" y2="130" class="dim-line" />
				{/if}

				<!-- The rectangle -->
				{#if display.showBC && !display.showSplit}
					<rect x="50" y="40" width="180" height="90" class="rect-combined" />
					<text x="140" y="150" class="dim-label label-bc">4 + 2</text>
				{/if}

				<!-- Split rectangle -->
				{#if display.showSplit}
					<rect x="50" y="40" width="120" height="90" class="rect-part rect-b" />
					<rect x="170" y="40" width="60" height="90" class="rect-part rect-c" />
					<text x="110" y="150" class="dim-label label-b">4</text>
					<text x="200" y="150" class="dim-label label-c">2</text>
					<line x1="170" y1="40" x2="170" y2="130" class="split-line" />
				{/if}
			{/if}

			{#if display.showDistributed && !display.showResult}
				<!-- Two separate rectangles -->
				<rect x="30" y="50" width="100" height="75" class="rect-part rect-b" />
				<text x="80" y="95" class="rect-label">3 × 4</text>

				<text x="145" y="95" class="operation">+</text>

				<rect x="165" y="50" width="100" height="75" class="rect-part rect-c" />
				<text x="215" y="95" class="rect-label">3 × 2</text>
			{/if}

			{#if display.showResult}
				<!-- Final result -->
				<rect x="20" y="50" width="85" height="70" class="rect-part rect-b" />
				<text x="62" y="92" class="rect-label">12</text>

				<text x="120" y="92" class="operation">+</text>

				<rect x="138" y="50" width="85" height="70" class="rect-part rect-c" />
				<text x="180" y="92" class="rect-label">6</text>

				<text x="245" y="92" class="operation">=</text>
				<text x="280" y="92" class="result">18</text>
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

	.rect-combined {
		fill: rgba(142, 192, 124, 0.2);
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.rect-part {
		stroke-width: 2;
		transition: all 0.4s ease;
	}

	.rect-b {
		fill: rgba(142, 192, 124, 0.2);
		stroke: var(--color-accent);
	}

	.rect-c {
		fill: rgba(250, 189, 47, 0.2);
		stroke: var(--color-math);
	}

	.dim-line {
		stroke: var(--color-fg-muted);
		stroke-width: 1;
	}

	.dim-label {
		font-size: 1rem;
		font-weight: 600;
		text-anchor: middle;
	}

	.label-a {
		fill: var(--color-fg);
	}

	.label-bc {
		fill: var(--color-fg-muted);
	}

	.label-b {
		fill: var(--color-accent);
	}

	.label-c {
		fill: var(--color-math);
	}

	.split-line {
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		stroke-dasharray: 4 2;
	}

	.rect-label {
		fill: var(--color-fg);
		font-size: 1rem;
		font-weight: 500;
		text-anchor: middle;
	}

	.operation {
		fill: var(--color-fg-muted);
		font-size: 1.3rem;
		text-anchor: middle;
	}

	.result {
		fill: var(--color-accent);
		font-size: 1.2rem;
		font-weight: 700;
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
