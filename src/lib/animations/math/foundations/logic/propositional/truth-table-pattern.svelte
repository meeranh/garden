<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	// Two tables: 3 variables and 4 variables
	const tables = [
		{ vars: ['p', 'q', 'r'], rows: 8 },
		{ vars: ['p', 'q', 'r', 's'], rows: 16 }
	];

	const MAX_DISPLAY_ROWS = 8;

	// Animation state
	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	// Steps:
	// For each table, we fill columns right to left
	// 3 vars: r (step 0), q (step 1), p (step 2)
	// 4 vars: s (step 3), r (step 4), q (step 5), p (step 6)
	// Total: 7 steps (0-6)
	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	// Figure out which columns are filled based on current step
	let displayState = $derived.by(() => {
		// Table 1 (3 vars): steps 0, 1, 2 fill r, q, p
		// Table 2 (4 vars): steps 3, 4, 5, 6 fill s, r, q, p

		const table1Filled = Math.min(currentStep + 1, 3); // 0->1, 1->2, 2->3, 3+->3
		const table2Filled = currentStep >= 3 ? currentStep - 2 : 0; // 3->1, 4->2, 5->3, 6->4

		// Which column is currently being highlighted
		let activeTable: number | null = null;
		let activeColIndex: number | null = null;

		if (currentStep < 3) {
			activeTable = 0;
			activeColIndex = 2 - currentStep; // r=2, q=1, p=0
		} else {
			activeTable = 1;
			activeColIndex = 6 - currentStep; // s=3, r=2, q=1, p=0
		}

		// Calculate the block size for the active column
		const activeVarCount = activeTable === 0 ? 3 : 4;
		const posFromRight = activeVarCount - 1 - activeColIndex;
		const blockSize = Math.pow(2, posFromRight);

		return {
			table1Filled,
			table2Filled,
			activeTable,
			activeColIndex,
			posFromRight,
			blockSize
		};
	});

	// Generate column values
	function getColumnValues(numVars: number, colIndex: number, maxRows: number): string[] {
		const totalRows = Math.pow(2, numVars);
		const posFromRight = numVars - 1 - colIndex;
		const blockSize = Math.pow(2, posFromRight);
		const values: string[] = [];

		for (let row = 0; row < Math.min(totalRows, maxRows); row++) {
			const blockIndex = Math.floor(row / blockSize);
			values.push(blockIndex % 2 === 0 ? 'T' : 'F');
		}

		return values;
	}

	// Controller methods
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
		if (currentStep < maxStep) {
			currentStep++;
		}
	}

	function prev() {
		if (currentStep > 0) {
			currentStep--;
		}
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
	<!-- Explanation box -->
	<div class="explanation">
		{#if displayState.activeTable !== null}
			{@const varName = displayState.activeTable === 0
				? tables[0].vars[displayState.activeColIndex ?? 0]
				: tables[1].vars[displayState.activeColIndex ?? 0]}

			<div class="current-step">
				<span class="var-name">{varName}</span>
				<span class="block-info">
					block size = <strong>{displayState.blockSize}</strong>
					{#if displayState.posFromRight > 0}
						<span class="doubled">(doubled from {displayState.blockSize / 2})</span>
					{/if}
				</span>
			</div>

			<div class="instruction">
				{#if displayState.blockSize === 1}
					Write <strong>T</strong>, then <strong>F</strong>, then <strong>T</strong>, then <strong>F</strong>...
				{:else}
					Write <strong>{displayState.blockSize} T's</strong>, then <strong>{displayState.blockSize} F's</strong>, repeat
				{/if}
			</div>
		{/if}
	</div>

	<!-- Two tables side by side -->
	<div class="tables-container">
		{#each tables as table, tableIndex}
			{@const filledCount = tableIndex === 0 ? displayState.table1Filled : displayState.table2Filled}
			{@const displayRows = Math.min(table.rows, MAX_DISPLAY_ROWS)}
			{@const isTruncated = table.rows > MAX_DISPLAY_ROWS}

			<div class="table-wrapper">
				<div class="table-label">{table.vars.length} variables = {table.rows} rows</div>

				<div class="table">
					<!-- Header -->
					<div class="header-row">
						{#each table.vars as varName, colIndex}
							{@const isActive = displayState.activeTable === tableIndex && displayState.activeColIndex === colIndex}
							<div class="header-cell" class:active={isActive}>
								{varName}
							</div>
						{/each}
					</div>

					<!-- Rows -->
					{#each Array(displayRows) as _, rowIndex}
						<div class="row">
							{#each table.vars as varName, colIndex}
								{@const posFromRight = table.vars.length - 1 - colIndex}
								{@const isFilled = posFromRight < filledCount}
								{@const isActive = displayState.activeTable === tableIndex && displayState.activeColIndex === colIndex}
								{@const values = getColumnValues(table.vars.length, colIndex, displayRows)}

								<div
									class="cell"
									class:true-val={isFilled && values[rowIndex] === 'T'}
									class:false-val={isFilled && values[rowIndex] === 'F'}
									class:highlight={isActive && isFilled}
								>
									{isFilled ? values[rowIndex] : ''}
								</div>
							{/each}
						</div>
					{/each}

					<!-- Truncation indicator -->
					{#if isTruncated}
						<div class="row truncated">
							{#each table.vars as _}
								<div class="cell dots">⋮</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
	}

	.explanation {
		background: var(--color-bg-card);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 4rem;
	}

	.current-step {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.var-name {
		font-weight: bold;
		color: var(--color-math);
		font-size: 1.25rem;
	}

	.block-info {
		color: var(--color-fg);
		font-size: 1rem;
	}

	.block-info strong {
		color: var(--color-accent);
	}

	.doubled {
		color: var(--color-fg-muted);
		font-size: 0.85rem;
	}

	.instruction {
		font-size: 0.95rem;
		color: var(--color-fg-muted);
	}

	.instruction strong {
		color: var(--color-fg);
	}

	.tables-container {
		display: flex;
		gap: 2rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.table-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.table-label {
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.table {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background: var(--color-border);
		padding: 1px;
	}

	.header-row,
	.row {
		display: flex;
		gap: 1px;
	}

	.header-cell,
	.cell {
		width: 2rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 0.85rem;
		transition: all 0.15s ease;
	}

	.header-cell {
		background: var(--color-bg-card);
		color: var(--color-fg-muted);
	}

	.header-cell.active {
		background: var(--color-math);
		color: var(--color-bg);
	}

	.cell {
		background: var(--color-bg);
		color: var(--color-fg-muted);
	}

	.cell.highlight {
		background: rgba(250, 189, 47, 0.15);
	}

	.cell.true-val {
		color: var(--color-accent);
	}

	.cell.false-val {
		color: #fb4934;
	}

	.cell.dots {
		color: var(--color-fg-muted);
		font-size: 0.75rem;
	}

	.truncated {
		opacity: 0.6;
	}

	@media (max-width: 500px) {
		.tables-container {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
