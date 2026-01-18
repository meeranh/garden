<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 4;
	const maxStep = totalSteps - 1;

	// Numbers 0-8, will be grouped by mod 3
	const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	// Scattered positions (step 0)
	const scatteredPos: Record<number, { x: number; y: number }> = {
		0: { x: 50, y: 60 },
		1: { x: 140, y: 40 },
		2: { x: 230, y: 70 },
		3: { x: 80, y: 120 },
		4: { x: 170, y: 100 },
		5: { x: 250, y: 130 },
		6: { x: 60, y: 170 },
		7: { x: 150, y: 160 },
		8: { x: 220, y: 180 }
	};

	// Grouped positions (step 2+)
	const groupedPos: Record<number, { x: number; y: number }> = {
		// [0] class - left group
		0: { x: 55, y: 80 },
		3: { x: 55, y: 120 },
		6: { x: 55, y: 160 },
		// [1] class - middle group
		1: { x: 140, y: 80 },
		4: { x: 140, y: 120 },
		7: { x: 140, y: 160 },
		// [2] class - right group
		2: { x: 225, y: 80 },
		5: { x: 225, y: 120 },
		8: { x: 225, y: 160 }
	};

	const classColors: Record<number, string> = {
		0: 'var(--color-accent)',
		1: 'var(--color-math)',
		2: 'var(--color-fg-muted)'
	};

	function getClass(n: number): number {
		return n % 3;
	}

	let display = $derived.by(() => {
		let useGrouped = false;
		let showClasses = false;
		let showLabels = false;
		let message: string | null = null;

		if (currentStep === 0) {
			message = 'Numbers 0 through 8';
		} else if (currentStep === 1) {
			message = 'Group by "same remainder mod 3"';
		} else if (currentStep === 2) {
			useGrouped = true;
			showClasses = true;
			message = 'Three equivalence classes';
		} else if (currentStep === 3) {
			useGrouped = true;
			showClasses = true;
			showLabels = true;
			message = 'No overlaps. Nothing left out.';
		}

		return { useGrouped, showClasses, showLabels, message };
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
			currentStep === 1 ? 1800 : 1500
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
	<div class="title">Equivalence Classes</div>

	<div class="diagram-container">
		<svg viewBox="0 0 280 210" class="diagram">
			<!-- Class backgrounds -->
			{#if display.showClasses}
				<rect x="20" y="50" width="70" height="140" rx="10" class="class-bg class-0" />
				<rect x="105" y="50" width="70" height="140" rx="10" class="class-bg class-1" />
				<rect x="190" y="50" width="70" height="140" rx="10" class="class-bg class-2" />
			{/if}

			<!-- Class labels -->
			{#if display.showLabels}
				<text x="55" y="42" class="class-label label-0">[0]</text>
				<text x="140" y="42" class="class-label label-1">[1]</text>
				<text x="225" y="42" class="class-label label-2">[2]</text>
			{/if}

			<!-- Numbers -->
			{#each numbers as n}
				{@const pos = display.useGrouped ? groupedPos[n] : scatteredPos[n]}
				{@const cls = getClass(n)}
				<circle
					cx={pos.x}
					cy={pos.y}
					r="18"
					class="number-circle"
					class:colored={display.showClasses}
					style={display.showClasses ? `stroke: ${classColors[cls]}` : ''}
				/>
				<text
					x={pos.x}
					y={pos.y + 5}
					class="number-text"
					class:colored={display.showClasses}
					style={display.showClasses ? `fill: ${classColors[cls]}` : ''}>{n}</text
				>
			{/each}
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
		max-width: 280px;
	}

	.diagram {
		width: 100%;
		height: auto;
	}

	.class-bg {
		fill-opacity: 0.15;
		stroke-width: 2;
		stroke-opacity: 0.5;
	}

	.class-bg.class-0 {
		fill: var(--color-accent);
		stroke: var(--color-accent);
	}

	.class-bg.class-1 {
		fill: var(--color-math);
		stroke: var(--color-math);
	}

	.class-bg.class-2 {
		fill: var(--color-fg-muted);
		stroke: var(--color-fg-muted);
	}

	.class-label {
		font-size: 0.85rem;
		font-weight: 600;
		text-anchor: middle;
	}

	.label-0 {
		fill: var(--color-accent);
	}

	.label-1 {
		fill: var(--color-math);
	}

	.label-2 {
		fill: var(--color-fg-muted);
	}

	.number-circle {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: all 0.6s ease;
	}

	.number-circle.colored {
		stroke-width: 2.5;
	}

	.number-text {
		fill: var(--color-fg);
		font-size: 0.9rem;
		font-weight: 500;
		text-anchor: middle;
		transition: all 0.6s ease;
	}

	.number-text.colored {
		font-weight: 600;
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
