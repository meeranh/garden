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
		'Initial state after ShiftRows',
		'Column 0: Each output byte uses all 4 inputs',
		'Column 1: Mix all 4 bytes together',
		'Column 2: Same mixing operation',
		'Column 3: Final column mixed',
		'MixColumns complete!'
	];

	// Input values (after ShiftRows)
	const inputValues = [
		['D4', 'E0', 'B8', '1E'],
		['BF', 'B4', '41', '27'],
		['5D', '52', '11', '98'],
		['30', 'AE', 'F1', 'E5']
	];

	// Output values (after MixColumns)
	const outputValues = [
		['04', 'E0', '48', '28'],
		['66', 'CB', 'F8', '06'],
		['81', '19', 'D3', '26'],
		['E5', '9A', '7A', '4C']
	];

	// Which column is being processed
	let activeCol = $derived.by(() => {
		if (currentStep >= 1 && currentStep <= 4) return currentStep - 1;
		return -1;
	});

	// Which columns have been mixed
	let mixedCols = $derived.by(() => [
		currentStep >= 2,
		currentStep >= 3,
		currentStep >= 4,
		currentStep >= 5
	]);

	// Layout
	const cellSize = 46;
	const cellGap = 4;
	const stateWidth = 4 * cellSize + 3 * cellGap;
	const leftX = 30;
	const rightX = 325;
	const topY = 50;
	const width = 555;
	const height = 310;

	function getCellX(col: number, baseX: number): number {
		return baseX + col * (cellSize + cellGap);
	}

	function getCellY(row: number): number {
		return topY + row * (cellSize + cellGap);
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
		<!-- Labels -->
		<text x={leftX + stateWidth / 2} y={topY - 18} class="state-label">Input</text>
		<text x={rightX + stateWidth / 2} y={topY - 18} class="state-label output-label">Output</text>

		<!-- Arrow between states -->
		<line x1={leftX + stateWidth + 15} y1={topY + stateWidth / 2} x2={rightX - 15} y2={topY + stateWidth / 2} class="main-arrow" />
		<polygon points="{rightX - 12},{topY + stateWidth / 2} {rightX - 22},{topY + stateWidth / 2 - 6} {rightX - 22},{topY + stateWidth / 2 + 6}" class="main-arrow-head" />
		<text x={(leftX + stateWidth + rightX) / 2} y={topY + stateWidth / 2 - 12} class="arrow-label">MixColumns</text>

		<!-- Input state (left) -->
		{#each inputValues as row, rowIdx}
			{#each row as val, colIdx}
				<rect
					x={getCellX(colIdx, leftX)}
					y={getCellY(rowIdx)}
					width={cellSize}
					height={cellSize}
					rx="5"
					class="cell"
					class:active-col={activeCol === colIdx}
				/>
				<text
					x={getCellX(colIdx, leftX) + cellSize / 2}
					y={getCellY(rowIdx) + cellSize / 2 + 5}
					class="cell-text"
					class:active-text={activeCol === colIdx}
				>{val}</text>
			{/each}
		{/each}

		<!-- Output state (right) -->
		{#each outputValues as row, rowIdx}
			{#each row as val, colIdx}
				<rect
					x={getCellX(colIdx, rightX)}
					y={getCellY(rowIdx)}
					width={cellSize}
					height={cellSize}
					rx="5"
					class="cell output-cell"
					class:mixed={mixedCols[colIdx]}
					class:active-col={activeCol === colIdx}
				/>
				{#if mixedCols[colIdx]}
					<text
						x={getCellX(colIdx, rightX) + cellSize / 2}
						y={getCellY(rowIdx) + cellSize / 2 + 5}
						class="cell-text output-text"
					>{val}</text>
				{/if}
			{/each}
		{/each}

		<!-- Mixing arrows for active column -->
		{#if activeCol >= 0}
			{@const colX = getCellX(activeCol, leftX) + cellSize / 2}
			{@const outColX = getCellX(activeCol, rightX)}

			<!-- Arrows showing all inputs going to each output -->
			{#each [0, 1, 2, 3] as outRow}
				{#each [0, 1, 2, 3] as inRow}
					<line
						x1={getCellX(activeCol, leftX) + cellSize}
						y1={getCellY(inRow) + cellSize / 2}
						x2={outColX}
						y2={getCellY(outRow) + cellSize / 2}
						class="mix-line"
						style="animation-delay: {inRow * 0.1}s"
					/>
				{/each}
			{/each}
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
		max-width: 580px;
		height: auto;
	}

	.state-label {
		fill: var(--color-fg-muted);
		font-size: 14px;
		font-weight: bold;
		text-anchor: middle;
	}

	.output-label {
		fill: var(--color-accent);
	}

	.main-arrow {
		stroke: var(--color-fg-muted);
		stroke-width: 2;
	}

	.main-arrow-head {
		fill: var(--color-fg-muted);
	}

	.arrow-label {
		fill: var(--color-fg-muted);
		font-size: 12px;
		text-anchor: middle;
	}

	/* Cells */
	.cell {
		fill: var(--color-bg-card);
		stroke: var(--color-border);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.cell.active-col {
		stroke: var(--color-math);
		stroke-width: 2.5;
		filter: drop-shadow(0 0 6px var(--color-math));
	}

	.cell.output-cell {
		stroke: var(--color-border);
		opacity: 0.5;
	}

	.cell.output-cell.mixed {
		opacity: 1;
		stroke: var(--color-accent);
	}

	.cell.output-cell.active-col {
		opacity: 1;
		stroke: var(--color-math);
		filter: drop-shadow(0 0 6px var(--color-math));
	}

	.cell-text {
		fill: var(--color-fg);
		font-size: 14px;
		font-family: monospace;
		font-weight: bold;
		text-anchor: middle;
		transition: fill 0.3s ease;
	}

	.cell-text.active-text {
		fill: var(--color-math);
	}

	.cell-text.output-text {
		fill: var(--color-accent);
	}

	/* Mixing lines */
	.mix-line {
		stroke: var(--color-math);
		stroke-width: 1;
		opacity: 0.4;
		animation: fadeIn 0.3s ease forwards;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 0.4; }
	}

	.label {
		font-size: 1.1rem;
		color: var(--color-fg);
		text-align: center;
		font-weight: 500;
	}
</style>
