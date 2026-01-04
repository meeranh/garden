<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 6;
	const maxStep = totalSteps - 1;

	const labels = [
		'Initial state: 4×4 grid of bytes',
		'Row 0: No shift',
		'Row 1: Shift left by 1',
		'Row 2: Shift left by 2',
		'Row 3: Shift left by 3',
		'ShiftRows complete!'
	];

	// Cell values
	const values = [
		['0', '4', '8', 'C'],
		['1', '5', '9', 'D'],
		['2', '6', 'A', 'E'],
		['3', '7', 'B', 'F']
	];

	// Distinct colors for each row so you can track movement
	const rowColors = [
		'var(--color-accent)',    // green
		'var(--color-math)',      // yellow
		'#fe8019',                // orange
		'#b16286'                 // purple
	];

	const shifts = [0, 1, 2, 3];

	// Track which rows have been shifted
	let rowShifted = $derived.by(() => [
		currentStep >= 1,
		currentStep >= 2,
		currentStep >= 3,
		currentStep >= 4
	]);

	let activeRow = $derived.by(() => {
		if (currentStep >= 1 && currentStep <= 4) return currentStep - 1;
		return -1;
	});

	// Layout
	const cellSize = 52;
	const cellGap = 4;
	const gridX = 75;
	const gridY = 50;
	const width = 450;
	const height = 330;

	// Calculate where a box should be positioned
	function getBoxX(row: number, originalCol: number): number {
		const shifted = rowShifted[row];
		const shift = shifted ? shifts[row] : 0;
		const newCol = (originalCol - shift + 4) % 4;
		return gridX + newCol * (cellSize + cellGap);
	}

	function getBoxY(row: number): number {
		return gridY + row * (cellSize + cellGap);
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
		}, 1200);
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
	<svg viewBox="0 0 {width} {height}" class="scene">
		<!-- Column labels -->
		{#each [0, 1, 2, 3] as col}
			<text
				x={gridX + col * (cellSize + cellGap) + cellSize / 2}
				y={gridY - 12}
				class="header-label"
			>{col}</text>
		{/each}

		<!-- Row labels -->
		{#each [0, 1, 2, 3] as row}
			<text
				x={gridX - 18}
				y={getBoxY(row) + cellSize / 2 + 5}
				class="header-label"
				class:active-label={activeRow === row}
			>{row}</text>
		{/each}

		<!-- Background grid slots (fixed, shows where boxes can be) -->
		{#each [0, 1, 2, 3] as row}
			{#each [0, 1, 2, 3] as col}
				<rect
					x={gridX + col * (cellSize + cellGap)}
					y={gridY + row * (cellSize + cellGap)}
					width={cellSize}
					height={cellSize}
					rx="6"
					class="grid-slot"
				/>
			{/each}
		{/each}

		<!-- Moving boxes with values (these slide around) -->
		{#each values as row, rowIdx}
			{#each row as val, colIdx}
				<g
					class="moving-box"
					style="transform: translate({getBoxX(rowIdx, colIdx)}px, {getBoxY(rowIdx)}px)"
				>
					<rect
						x={0}
						y={0}
						width={cellSize}
						height={cellSize}
						rx="6"
						class="cell-box"
						class:active={activeRow === rowIdx}
						style="--row-color: {rowColors[rowIdx]}"
					/>
					<text
						x={cellSize / 2}
						y={cellSize / 2 + 6}
						class="cell-text"
					>{val}</text>
				</g>
			{/each}
		{/each}

		<!-- Shift indicator on right -->
		{#if activeRow >= 0}
			{@const shift = shifts[activeRow]}
			<g class="shift-indicator">
				<rect
					x={gridX + 4 * (cellSize + cellGap) + 20}
					y={getBoxY(activeRow) + cellSize / 2 - 15}
					width={shift === 0 ? 65 : 45}
					height={30}
					rx="5"
					class="shift-badge"
					style="--row-color: {rowColors[activeRow]}"
				/>
				<text
					x={gridX + 4 * (cellSize + cellGap) + 20 + (shift === 0 ? 32 : 22)}
					y={getBoxY(activeRow) + cellSize / 2 + 4}
					class="shift-text"
				>{shift === 0 ? 'no shift' : '← ' + shift}</text>
			</g>
		{/if}
	</svg>

	<div class="label">{labels[currentStep]}</div>
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
		max-width: 470px;
		height: auto;
	}

	.header-label {
		fill: var(--color-fg-muted);
		font-size: 13px;
		font-weight: bold;
		text-anchor: middle;
	}

	.header-label.active-label {
		fill: var(--color-fg);
	}

	/* Background grid - faint slots showing where boxes go */
	.grid-slot {
		fill: none;
		stroke: var(--color-border);
		stroke-width: 1;
		stroke-dasharray: 4 3;
		opacity: 0.5;
	}

	/* The actual moving boxes */
	.moving-box {
		transition: transform 0.5s ease;
	}

	.cell-box {
		fill: var(--row-color);
		opacity: 0.25;
		stroke: var(--row-color);
		stroke-width: 2;
		transition: opacity 0.3s ease, stroke-width 0.3s ease;
	}

	.cell-box.active {
		opacity: 0.4;
		stroke-width: 3;
	}

	.cell-text {
		fill: var(--color-fg);
		font-size: 18px;
		font-family: monospace;
		font-weight: bold;
		text-anchor: middle;
	}

	/* Shift indicator */
	.shift-badge {
		fill: var(--color-bg-card);
		stroke: var(--row-color);
		stroke-width: 2;
	}

	.shift-text {
		fill: var(--color-fg);
		font-size: 13px;
		font-weight: bold;
		text-anchor: middle;
	}

	.label {
		font-size: 1.1rem;
		color: var(--color-fg);
		text-align: center;
		font-weight: 500;
	}
</style>
