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
		'State and Round Key ready',
		'Row 0: XOR each byte with the key',
		'Row 1: XOR each byte',
		'Row 2: XOR each byte',
		'Row 3: XOR each byte',
		'AddRoundKey complete!'
	];

	// State values
	const stateValues = [
		['04', 'E0', '48', '28'],
		['66', 'CB', 'F8', '06'],
		['81', '19', 'D3', '26'],
		['E5', '9A', '7A', '4C']
	];

	// Round key values
	const keyValues = [
		['A0', '88', '23', '2A'],
		['FA', '54', 'A3', '6C'],
		['FE', '2C', '39', '76'],
		['17', 'B1', '39', '05']
	];

	// Output values (State XOR Key)
	const outputValues = [
		['A4', '68', '6B', '02'],
		['9C', '9F', '5B', '6A'],
		['7F', '35', 'EA', '50'],
		['F2', '2B', '43', '49']
	];

	// Which row is currently being XORed
	let activeRow = $derived.by(() => {
		if (currentStep >= 1 && currentStep <= 4) return currentStep - 1;
		return -1;
	});

	// Which rows have been completed
	let completedRows = $derived.by(() => [
		currentStep >= 2,
		currentStep >= 3,
		currentStep >= 4,
		currentStep >= 5
	]);

	// Layout
	const cellSize = 40;
	const cellGap = 3;
	const matrixWidth = 4 * cellSize + 3 * cellGap;
	const stateX = 25;
	const keyX = 230;
	const outputX = 435;
	const topY = 55;
	const width = 610;
	const height = 280;

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
		<!-- Labels -->
		<text x={stateX + matrixWidth / 2} y={topY - 20} class="matrix-label">State</text>
		<text x={keyX + matrixWidth / 2} y={topY - 20} class="matrix-label key-label">Round Key</text>
		<text x={outputX + matrixWidth / 2} y={topY - 20} class="matrix-label output-label">Output</text>

		<!-- XOR symbol between State and Key -->
		<text x={(stateX + matrixWidth + keyX) / 2} y={topY + matrixWidth / 2 + 8} class="operator">⊕</text>

		<!-- Equals symbol between Key and Output -->
		<text x={(keyX + matrixWidth + outputX) / 2} y={topY + matrixWidth / 2 + 8} class="operator">=</text>

		<!-- State matrix -->
		{#each stateValues as row, rowIdx}
			{#each row as val, colIdx}
				<rect
					x={getCellX(colIdx, stateX)}
					y={getCellY(rowIdx)}
					width={cellSize}
					height={cellSize}
					rx="4"
					class="cell state-cell"
					class:active={activeRow === rowIdx}
				/>
				<text
					x={getCellX(colIdx, stateX) + cellSize / 2}
					y={getCellY(rowIdx) + cellSize / 2 + 5}
					class="cell-text"
					class:active-text={activeRow === rowIdx}
				>{val}</text>
			{/each}
		{/each}

		<!-- Key matrix -->
		{#each keyValues as row, rowIdx}
			{#each row as val, colIdx}
				<rect
					x={getCellX(colIdx, keyX)}
					y={getCellY(rowIdx)}
					width={cellSize}
					height={cellSize}
					rx="4"
					class="cell key-cell"
					class:active={activeRow === rowIdx}
				/>
				<text
					x={getCellX(colIdx, keyX) + cellSize / 2}
					y={getCellY(rowIdx) + cellSize / 2 + 5}
					class="cell-text key-text"
					class:active-text={activeRow === rowIdx}
				>{val}</text>
			{/each}
		{/each}

		<!-- Output matrix -->
		{#each outputValues as row, rowIdx}
			{#each row as val, colIdx}
				<rect
					x={getCellX(colIdx, outputX)}
					y={getCellY(rowIdx)}
					width={cellSize}
					height={cellSize}
					rx="4"
					class="cell output-cell"
					class:active={activeRow === rowIdx}
					class:completed={completedRows[rowIdx]}
				/>
				{#if completedRows[rowIdx] || activeRow === rowIdx}
					<text
						x={getCellX(colIdx, outputX) + cellSize / 2}
						y={getCellY(rowIdx) + cellSize / 2 + 5}
						class="cell-text output-text"
						class:active-text={activeRow === rowIdx}
					>{val}</text>
				{/if}
			{/each}
		{/each}

		<!-- XOR arrows for active row -->
		{#if activeRow >= 0}
			<line
				x1={stateX + matrixWidth + 5}
				y1={getCellY(activeRow) + cellSize / 2}
				x2={keyX - 25}
				y2={getCellY(activeRow) + cellSize / 2}
				class="xor-line"
			/>
			<line
				x1={keyX + matrixWidth + 5}
				y1={getCellY(activeRow) + cellSize / 2}
				x2={outputX - 25}
				y2={getCellY(activeRow) + cellSize / 2}
				class="xor-line"
			/>
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
		max-width: 640px;
		height: auto;
	}

	.matrix-label {
		fill: var(--color-fg-muted);
		font-size: 13px;
		font-weight: bold;
		text-anchor: middle;
	}

	.key-label {
		fill: var(--color-math);
	}

	.output-label {
		fill: var(--color-accent);
	}

	.operator {
		fill: var(--color-fg);
		font-size: 24px;
		font-weight: bold;
		text-anchor: middle;
	}

	/* Cells */
	.cell {
		fill: var(--color-bg-card);
		stroke: var(--color-border);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.cell.active {
		stroke-width: 2.5;
	}

	.state-cell.active {
		stroke: var(--color-fg);
		filter: drop-shadow(0 0 4px var(--color-fg-muted));
	}

	.key-cell.active {
		stroke: var(--color-math);
		filter: drop-shadow(0 0 4px var(--color-math));
	}

	.output-cell {
		opacity: 0.4;
	}

	.output-cell.active {
		opacity: 1;
		stroke: var(--color-accent);
		filter: drop-shadow(0 0 4px var(--color-accent));
	}

	.output-cell.completed {
		opacity: 1;
		stroke: var(--color-accent);
	}

	.cell-text {
		fill: var(--color-fg);
		font-size: 12px;
		font-family: monospace;
		font-weight: bold;
		text-anchor: middle;
		transition: fill 0.3s ease;
	}

	.cell-text.active-text {
		fill: var(--color-fg);
	}

	.key-text {
		fill: var(--color-math);
	}

	.output-text {
		fill: var(--color-accent);
	}

	/* XOR lines */
	.xor-line {
		stroke: var(--color-accent);
		stroke-width: 2;
		stroke-dasharray: 4 2;
		opacity: 0.7;
	}

	.label {
		font-size: 1.1rem;
		color: var(--color-fg);
		text-align: center;
		font-weight: 500;
	}
</style>
