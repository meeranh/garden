<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 6;
	const maxStep = totalSteps - 1;

	// Center of the diagram
	const cx = 200;
	const cy = 170;

	// Radii for each set - much more spread out
	const radii = {
		N: 40,
		Z: 75,
		Q: 110,
		Irrational: 145
	};

	let display = $derived.by(() => {
		let showN = false;
		let showZ = false;
		let showQ = false;
		let showIrrational = false;
		let showR = false;
		let highlightSet: string | null = null;
		let message: string | null = null;

		if (currentStep === 0) {
			message = 'The Real Number System';
		} else if (currentStep === 1) {
			showN = true;
			highlightSet = 'N';
			message = 'ℕ: Natural numbers (1, 2, 3, ...)';
		} else if (currentStep === 2) {
			showN = true;
			showZ = true;
			highlightSet = 'Z';
			message = 'ℤ: Add zero and negatives';
		} else if (currentStep === 3) {
			showN = true;
			showZ = true;
			showQ = true;
			highlightSet = 'Q';
			message = 'ℚ: Add fractions (ratios)';
		} else if (currentStep === 4) {
			showN = true;
			showZ = true;
			showQ = true;
			showIrrational = true;
			highlightSet = 'irrational';
			message = 'Irrationals: √2, π, e (not fractions)';
		} else if (currentStep === 5) {
			showN = true;
			showZ = true;
			showQ = true;
			showIrrational = true;
			showR = true;
			highlightSet = 'R';
			message = 'ℝ: All real numbers';
		}

		return { showN, showZ, showQ, showIrrational, showR, highlightSet, message };
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
			currentStep === 0 ? 1200 : 2000
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
	<div class="diagram-container">
		<svg viewBox="0 0 560 340" class="diagram">
			<!-- R (outermost box) -->
			{#if display.showR}
				<rect
					x="15"
					y="5"
					width="370"
					height="330"
					rx="12"
					class="set-rect set-r"
					class:highlighted={display.highlightSet === 'R'}
				/>
				<text x="30" y="30" class="set-label label-r">ℝ</text>
			{/if}

			<!-- Irrational circle -->
			{#if display.showIrrational}
				<circle
					cx={cx}
					cy={cy}
					r={radii.Irrational}
					class="set-circle set-irrational"
					class:highlighted={display.highlightSet === 'irrational'}
				/>
			{/if}

			<!-- Q -->
			{#if display.showQ}
				<circle
					cx={cx}
					cy={cy}
					r={radii.Q}
					class="set-circle set-q"
					class:highlighted={display.highlightSet === 'Q'}
				/>
				<text x={cx + 85} y={cy - 75} class="set-label label-q">ℚ</text>
			{/if}

			<!-- Z -->
			{#if display.showZ}
				<circle
					cx={cx}
					cy={cy}
					r={radii.Z}
					class="set-circle set-z"
					class:highlighted={display.highlightSet === 'Z'}
				/>
				<text x={cx + 58} y={cy - 48} class="set-label label-z">ℤ</text>
			{/if}

			<!-- N (innermost) -->
			{#if display.showN}
				<circle
					cx={cx}
					cy={cy}
					r={radii.N}
					class="set-circle set-n"
					class:highlighted={display.highlightSet === 'N'}
				/>
				<text x={cx + 32} y={cy - 25} class="set-label label-n">ℕ</text>
			{/if}

			<!-- N examples (inside N) -->
			{#if display.showN}
				<text x={cx} y={cy + 6} class="example-text example-n">1, 2, 3</text>
			{/if}

			<!-- Z examples (ring between N and Z) - positioned diagonally -->
			{#if display.showZ}
				<text x={cx - 58} y={cy - 5} class="example-text example-z">0</text>
				<text x={cx + 58} y={cy + 15} class="example-text example-z">-1</text>
			{/if}

			<!-- Q examples (ring between Z and Q) - spread around -->
			{#if display.showQ}
				<text x={cx - 93} y={cy + 5} class="example-text example-q">⅓</text>
				<text x={cx + 93} y={cy - 5} class="example-text example-q">½</text>
				<text x={cx} y={cy + 95} class="example-text example-q">0.75</text>
			{/if}

			<!-- Irrational examples (ring between Q and Irrational) - spread around -->
			{#if display.showIrrational}
				<text
					x={cx - 128}
					y={cy}
					class="example-text example-irrational"
					class:highlighted={display.highlightSet === 'irrational'}>π</text
				>
				<text
					x={cx + 128}
					y={cy}
					class="example-text example-irrational"
					class:highlighted={display.highlightSet === 'irrational'}>√2</text
				>
				<text
					x={cx}
					y={cy + 130}
					class="example-text example-irrational"
					class:highlighted={display.highlightSet === 'irrational'}>e</text
				>
			{/if}

			<!-- Legend on the right -->
			<g class="legend">
				<text x="410" y="100" class="legend-symbol label-n">ℕ</text>
				<text x="430" y="100" class="legend-text">Natural</text>

				<text x="410" y="135" class="legend-symbol label-z">ℤ</text>
				<text x="430" y="135" class="legend-text">Integer</text>

				<text x="410" y="170" class="legend-symbol label-q">ℚ</text>
				<text x="430" y="170" class="legend-text">Rational</text>

				<text x="410" y="205" class="legend-symbol label-irrational">—</text>
				<text x="430" y="205" class="legend-text">Irrational</text>

				<text x="410" y="240" class="legend-symbol label-r">ℝ</text>
				<text x="430" y="240" class="legend-text">Real</text>
			</g>
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

	.diagram-container {
		width: 100%;
		max-width: 560px;
	}

	.diagram {
		width: 100%;
		height: auto;
	}

	.set-circle,
	.set-rect {
		fill-opacity: 0.08;
		stroke-width: 2.5;
		transition: all 0.4s ease;
	}

	.set-circle.highlighted,
	.set-rect.highlighted {
		fill-opacity: 0.18;
		stroke-width: 3.5;
	}

	.set-n {
		fill: var(--color-accent);
		stroke: var(--color-accent);
	}

	.set-z {
		fill: var(--color-math);
		stroke: var(--color-math);
	}

	.set-q {
		fill: #83a598;
		stroke: #83a598;
	}

	.set-irrational {
		fill: #d3869b;
		stroke: #d3869b;
	}

	.set-r {
		fill: #b16286;
		stroke: #b16286;
	}

	.set-label {
		font-size: 1.1rem;
		font-weight: 700;
	}

	.label-n {
		fill: var(--color-accent);
	}

	.label-z {
		fill: var(--color-math);
	}

	.label-q {
		fill: #83a598;
	}

	.label-irrational {
		fill: #d3869b;
	}

	.label-r {
		fill: #b16286;
	}

	.example-text {
		font-size: 1rem;
		text-anchor: middle;
		font-weight: 500;
	}

	.example-n {
		fill: var(--color-accent);
	}

	.example-z {
		fill: var(--color-math);
	}

	.example-q {
		fill: #83a598;
	}

	.example-irrational {
		fill: #d3869b;
	}

	.example-irrational.highlighted {
		font-weight: 700;
		font-size: 1.1rem;
	}

	.legend-symbol {
		font-size: 1rem;
		font-weight: 700;
	}

	.legend-text {
		font-size: 0.85rem;
		fill: var(--color-fg-muted);
	}

	.message {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.9rem;
		color: var(--color-fg);
		text-align: center;
	}
</style>
