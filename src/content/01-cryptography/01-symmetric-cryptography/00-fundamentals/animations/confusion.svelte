<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Step 0: Show key
	// Step 1: Show output
	// Step 2: Weak confusion - simple connections
	// Step 3: Strong confusion - complex web
	// Step 4: Insight

	const keyLabels = ['K1', 'K2', 'K3', 'K4'];
	const outputLabels = ['C1', 'C2', 'C3', 'C4'];

	// Positions for key and output boxes
	const keyX = 80;
	const outputX = 280;
	const startY = 50;
	const spacing = 45;

	// Weak connections: 1-to-1
	const weakConnections = [
		{ from: 0, to: 0 },
		{ from: 1, to: 1 },
		{ from: 2, to: 2 },
		{ from: 3, to: 3 }
	];

	// Strong connections: each key affects all outputs
	const strongConnections = [
		// K1 to all
		{ from: 0, to: 0 }, { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 },
		// K2 to all
		{ from: 1, to: 0 }, { from: 1, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 },
		// K3 to all
		{ from: 2, to: 0 }, { from: 2, to: 1 }, { from: 2, to: 2 }, { from: 2, to: 3 },
		// K4 to all
		{ from: 3, to: 0 }, { from: 3, to: 1 }, { from: 3, to: 2 }, { from: 3, to: 3 }
	];

	let display = $derived.by(() => {
		return {
			showKey: currentStep >= 0,
			showOutput: currentStep >= 1,
			showWeak: currentStep === 2,
			showStrong: currentStep >= 3,
			showInsight: currentStep >= 4,

			label: currentStep === 0 ? 'The secret key' :
			       currentStep === 1 ? 'The ciphertext output' :
			       currentStep === 2 ? 'Weak confusion: simple relationship' :
			       currentStep === 3 ? 'Strong confusion: complex relationship' :
			       'The key becomes impossible to find'
		};
	});

	function getKeyY(index: number) {
		return startY + index * spacing;
	}

	function getOutputY(index: number) {
		return startY + index * spacing;
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

	function play() {
		if (isPlaying) return;
		isPlaying = true;
		if (currentStep >= maxStep) currentStep = 0;
		scheduleNext();
	}

	function pause() {
		isPlaying = false;
		if (animationTimer) {
			clearTimeout(animationTimer);
			animationTimer = null;
		}
	}

	function next() { if (currentStep < maxStep) currentStep++; }
	function prev() { if (currentStep > 0) currentStep--; }
	function skip() { pause(); currentStep = maxStep; }
	function replay() { pause(); currentStep = 0; play(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	onMount(() => register?.({ play, pause, next, prev, skip, replay, getState }));
	onDestroy(() => pause());
</script>

<div class="container">
	<svg viewBox="0 0 360 230" class="scene">
		<!-- Labels -->
		{#if display.showKey}
			<text x={keyX} y="25" class="column-label">KEY</text>
		{/if}
		{#if display.showOutput}
			<text x={outputX} y="25" class="column-label">OUTPUT</text>
		{/if}

		<!-- Weak connections (simple 1-to-1) -->
		{#if display.showWeak}
			{#each weakConnections as conn}
				<line
					x1={keyX + 25}
					y1={getKeyY(conn.from)}
					x2={outputX - 25}
					y2={getOutputY(conn.to)}
					class="connection weak"
				/>
			{/each}
		{/if}

		<!-- Strong connections (complex web) -->
		{#if display.showStrong}
			{#each strongConnections as conn, i}
				<line
					x1={keyX + 25}
					y1={getKeyY(conn.from)}
					x2={outputX - 25}
					y2={getOutputY(conn.to)}
					class="connection strong"
					style="animation-delay: {i * 30}ms"
				/>
			{/each}
		{/if}

		<!-- Key boxes -->
		{#if display.showKey}
			{#each keyLabels as label, i}
				<g transform="translate({keyX - 20}, {getKeyY(i) - 15})">
					<rect
						width="40"
						height="30"
						rx="5"
						class="key-box"
					/>
					<text x="20" y="20" class="box-label key-label">{label}</text>
				</g>
			{/each}
		{/if}

		<!-- Output boxes -->
		{#if display.showOutput}
			{#each outputLabels as label, i}
				<g transform="translate({outputX - 20}, {getOutputY(i) - 15})">
					<rect
						width="40"
						height="30"
						rx="5"
						class="output-box"
						class:strong-output={display.showStrong}
					/>
					<text x="20" y="20" class="box-label output-label">{label}</text>
				</g>
			{/each}
		{/if}

		<!-- Annotation for weak -->
		{#if display.showWeak}
			<g transform="translate(180, 200)">
				<text x="0" y="0" class="annotation weak-text">Easy to trace backwards</text>
			</g>
		{/if}

		<!-- Annotation for strong -->
		{#if display.showStrong && !display.showInsight}
			<g transform="translate(180, 200)">
				<text x="0" y="0" class="annotation strong-text">Impossible to untangle</text>
			</g>
		{/if}
	</svg>

	<div class="label" class:insight={currentStep === 4}>{display.label}</div>

	{#if display.showInsight}
		<div class="insight-box">Every output bit depends on every key bit.</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 1rem;
	}

	.scene {
		width: 100%;
		max-width: 380px;
		height: auto;
	}

	.column-label {
		fill: var(--color-fg-muted);
		font-size: 12px;
		font-weight: bold;
		text-anchor: middle;
		letter-spacing: 0.1em;
	}

	.key-box {
		fill: var(--color-bg-card);
		stroke: var(--color-math);
		stroke-width: 2;
	}

	.output-box {
		fill: var(--color-bg-card);
		stroke: var(--color-accent);
		stroke-width: 2;
		transition: stroke 0.3s ease;
	}

	.output-box.strong-output {
		stroke: var(--color-error);
	}

	.box-label {
		font-size: 12px;
		font-family: monospace;
		font-weight: bold;
		text-anchor: middle;
	}

	.key-label {
		fill: var(--color-math);
	}

	.output-label {
		fill: var(--color-accent);
	}

	.connection {
		stroke-width: 2;
		stroke-linecap: round;
		transition: all 0.3s ease;
	}

	.connection.weak {
		stroke: var(--color-fg-muted);
		opacity: 0.8;
	}

	.connection.strong {
		stroke: var(--color-error);
		opacity: 0.5;
		animation: fadeIn 0.3s ease forwards;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 0.5; }
	}

	.annotation {
		font-size: 12px;
		text-anchor: middle;
		font-style: italic;
	}

	.weak-text {
		fill: var(--color-fg-muted);
	}

	.strong-text {
		fill: var(--color-error);
	}

	.label {
		font-size: 1.1rem;
		color: var(--color-fg);
		text-align: center;
		transition: color 0.3s ease;
	}

	.label.insight {
		color: var(--color-accent);
		font-weight: bold;
	}

	.insight-box {
		font-size: 1rem;
		color: var(--color-math);
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 2px solid var(--color-math);
		border-radius: 0.5rem;
		font-weight: bold;
	}
</style>
