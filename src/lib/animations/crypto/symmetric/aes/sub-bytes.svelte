<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	// Steps:
	// 0: Show input state and S-box
	// 1-5: Show individual byte lookups
	// 6: Show all bytes substituted

	// Input state values (4x4 bytes in hex)
	const inputState = [
		['19', '3D', 'E3', 'BE'],
		['A0', '53', 'F7', '7A'],
		['9C', 'CC', 'DF', '1B'],
		['2D', '50', '0D', 'B4']
	];

	// Output state after SubBytes
	const outputState = [
		['D4', '27', '11', 'AE'],
		['E0', 'ED', '68', 'DA'],
		['DE', '4B', '9E', 'AF'],
		['D8', '53', 'D7', '8D']
	];

	// Cells to highlight during animation: [row, col, inVal, outVal, sboxRow, sboxCol]
	const lookups = [
		{ row: 0, col: 0, inVal: '19', outVal: 'D4', sboxRow: 1, sboxCol: 9 },
		{ row: 0, col: 1, inVal: '3D', outVal: '27', sboxRow: 3, sboxCol: 13 },
		{ row: 1, col: 0, inVal: 'A0', outVal: 'E0', sboxRow: 10, sboxCol: 0 },
		{ row: 1, col: 1, inVal: '53', outVal: 'ED', sboxRow: 5, sboxCol: 3 },
		{ row: 2, col: 0, inVal: '9C', outVal: 'DE', sboxRow: 9, sboxCol: 12 }
	];

	const labels = [
		'SubBytes: Replace each byte using the S-box',
		'0x19 → row 1, col 9 → 0xD4',
		'0x3D → row 3, col D → 0x27',
		'0xA0 → row A, col 0 → 0xE0',
		'0x53 → row 5, col 3 → 0xED',
		'0x9C → row 9, col C → 0xDE',
		'All 16 bytes substituted independently'
	];

	// Track which output cells are filled
	let filledCells = $state<boolean[][]>([
		[false, false, false, false],
		[false, false, false, false],
		[false, false, false, false],
		[false, false, false, false]
	]);

	let display = $derived.by(() => {
		const lookupIdx = currentStep - 1;
		const showLookup = currentStep >= 1 && currentStep <= 5;
		const lookup = showLookup ? lookups[lookupIdx] : null;

		return {
			label: labels[currentStep],
			showLookup,
			lookup,
			showAllFilled: currentStep >= 6
		};
	});

	// Layout constants
	const width = 700;
	const height = 380;
	const cellSize = 28;
	const sboxCellSize = 15;
	const inputX = 15;
	const inputY = 90;
	const sboxX = 145;
	const sboxY = 45;
	const outputX = 545;
	const outputY = 90;

	function resetFilledCells() {
		filledCells = [
			[false, false, false, false],
			[false, false, false, false],
			[false, false, false, false],
			[false, false, false, false]
		];
	}

	function fillAllCells() {
		filledCells = [
			[true, true, true, true],
			[true, true, true, true],
			[true, true, true, true],
			[true, true, true, true]
		];
	}

	function scheduleNext() {
		if (!isPlaying) return;
		animationTimer = setTimeout(() => {
			if (!isPlaying) return;
			if (currentStep < maxStep) {
				currentStep++;
				// Fill the cell from previous lookup
				if (currentStep >= 2 && currentStep <= 6) {
					const prevLookup = lookups[currentStep - 2];
					if (prevLookup) {
						filledCells[prevLookup.row][prevLookup.col] = true;
					}
				}
				if (currentStep === 6) {
					fillAllCells();
				}
				scheduleNext();
			} else {
				isPlaying = false;
			}
		}, 1800);
	}

	function play() {
		if (isPlaying) return;
		isPlaying = true;
		if (currentStep >= maxStep) {
			currentStep = 0;
			resetFilledCells();
		}
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
			// Fill previous cell before moving
			if (currentStep >= 1 && currentStep <= 5) {
				const prevLookup = lookups[currentStep - 1];
				if (prevLookup) {
					filledCells[prevLookup.row][prevLookup.col] = true;
				}
			}
			currentStep++;
			if (currentStep === 6) {
				fillAllCells();
			}
		}
	}

	function prev() {
		if (currentStep > 0) {
			// Unfill cell when going back
			if (currentStep >= 2 && currentStep <= 6) {
				const prevLookup = lookups[currentStep - 2];
				if (prevLookup) {
					filledCells[prevLookup.row][prevLookup.col] = false;
				}
			}
			if (currentStep === 6) {
				// Reset to only show filled up to step 5
				resetFilledCells();
				for (let i = 0; i < 4; i++) {
					const l = lookups[i];
					if (l) filledCells[l.row][l.col] = true;
				}
			}
			currentStep--;
		}
	}

	function skip() {
		pause();
		currentStep = maxStep;
		fillAllCells();
	}

	function replay() {
		pause();
		currentStep = 0;
		resetFilledCells();
		play();
	}

	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

	onMount(() => register?.({ play, pause, next, prev, skip, replay, getState }));
	onDestroy(() => pause());

	// Hex characters for S-box headers
	const hexChars = '0123456789ABCDEF';

	// Partial S-box for display (first few rows/cols shown, rest implied)
	const sboxDisplay = [
		['63', '7C', '77', '7B', 'F2', '6B', '6F', 'C5', '30', '01', '67', '2B', 'FE', 'D7', 'AB', '76'],
		['CA', '82', 'C9', '7D', 'FA', '59', '47', 'F0', 'AD', 'D4', 'A2', 'AF', '9C', 'A4', '72', 'C0'],
		['B7', 'FD', '93', '26', '36', '3F', 'F7', 'CC', '34', 'A5', 'E5', 'F1', '71', 'D8', '31', '15'],
		['04', 'C7', '23', 'C3', '18', '96', '05', '9A', '07', '12', '80', 'E2', 'EB', '27', 'B2', '75'],
		['09', '83', '2C', '1A', '1B', '6E', '5A', 'A0', '52', '3B', 'D6', 'B3', '29', 'E3', '2F', '84'],
		['53', 'D1', '00', 'ED', '20', 'FC', 'B1', '5B', '6A', 'CB', 'BE', '39', '4A', '4C', '58', 'CF'],
		['D0', 'EF', 'AA', 'FB', '43', '4D', '33', '85', '45', 'F9', '02', '7F', '50', '3C', '9F', 'A8'],
		['51', 'A3', '40', '8F', '92', '9D', '38', 'F5', 'BC', 'B6', 'DA', '21', '10', 'FF', 'F3', 'D2'],
		['CD', '0C', '13', 'EC', '5F', '97', '44', '17', 'C4', 'A7', '7E', '3D', '64', '5D', '19', '73'],
		['60', '81', '4F', 'DC', '22', '2A', '90', '88', '46', 'EE', 'B8', '14', 'DE', '5E', '0B', 'DB'],
		['E0', '32', '3A', '0A', '49', '06', '24', '5C', 'C2', 'D3', 'AC', '62', '91', '95', 'E4', '79'],
		['E7', 'C8', '37', '6D', '8D', 'D5', '4E', 'A9', '6C', '56', 'F4', 'EA', '65', '7A', 'AE', '08'],
		['BA', '78', '25', '2E', '1C', 'A6', 'B4', 'C6', 'E8', 'DD', '74', '1F', '4B', 'BD', '8B', '8A'],
		['70', '3E', 'B5', '66', '48', '03', 'F6', '0E', '61', '35', '57', 'B9', '86', 'C1', '1D', '9E'],
		['E1', 'F8', '98', '11', '69', 'D9', '8E', '94', '9B', '1E', '87', 'E9', 'CE', '55', '28', 'DF'],
		['8C', 'A1', '89', '0D', 'BF', 'E6', '42', '68', '41', '99', '2D', '0F', 'B0', '54', 'BB', '16']
	];
</script>

<div class="container">
	<svg viewBox="0 0 {width} {height}" class="scene">
		<!-- Input State -->
		<g>
			<text x={inputX + 2 * cellSize} y={inputY - 15} class="matrix-label">Input</text>
			{#each inputState as row, i}
				{#each row as val, j}
					<rect
						x={inputX + j * cellSize}
						y={inputY + i * cellSize}
						width={cellSize - 2}
						height={cellSize - 2}
						rx="3"
						class="cell"
						class:highlight-input={display.lookup?.row === i && display.lookup?.col === j}
					/>
					<text
						x={inputX + j * cellSize + cellSize / 2}
						y={inputY + i * cellSize + cellSize / 2 + 5}
						class="cell-text"
					>{val}</text>
				{/each}
			{/each}
		</g>

		<!-- S-box -->
		<g>
			<text x={sboxX + 18 + 8 * sboxCellSize} y={sboxY - 8} class="sbox-label">S-box</text>

			<!-- Column headers -->
			{#each hexChars as char, c}
				<text
					x={sboxX + 18 + c * sboxCellSize + sboxCellSize / 2}
					y={sboxY + 14}
					class="sbox-header col-header"
					class:highlight-col={display.lookup?.sboxCol === c}
				>{char}</text>
			{/each}

			<!-- Row headers -->
			{#each hexChars as char, r}
				<text
					x={sboxX + 8}
					y={sboxY + 26 + r * sboxCellSize + sboxCellSize / 2}
					class="sbox-header row-header"
					class:highlight-row={display.lookup?.sboxRow === r}
				>{char}</text>
			{/each}

			<!-- S-box grid background -->
			<rect
				x={sboxX + 18}
				y={sboxY + 22}
				width={16 * sboxCellSize}
				height={16 * sboxCellSize}
				rx="3"
				class="sbox-bg"
			/>

			<!-- Row highlight -->
			{#if display.lookup}
				<rect
					x={sboxX + 18}
					y={sboxY + 22 + display.lookup.sboxRow * sboxCellSize}
					width={16 * sboxCellSize}
					height={sboxCellSize}
					class="sbox-row-highlight"
				/>
				<rect
					x={sboxX + 18 + display.lookup.sboxCol * sboxCellSize}
					y={sboxY + 22}
					width={sboxCellSize}
					height={16 * sboxCellSize}
					class="sbox-col-highlight"
				/>
				<rect
					x={sboxX + 18 + display.lookup.sboxCol * sboxCellSize}
					y={sboxY + 22 + display.lookup.sboxRow * sboxCellSize}
					width={sboxCellSize}
					height={sboxCellSize}
					class="sbox-cell-highlight"
				/>
			{/if}

			<!-- S-box values -->
			{#each sboxDisplay as row, r}
				{#each row as val, c}
					<text
						x={sboxX + 18 + c * sboxCellSize + sboxCellSize / 2}
						y={sboxY + 26 + r * sboxCellSize + sboxCellSize / 2 + 1}
						class="sbox-value"
						class:sbox-value-highlight={display.lookup?.sboxRow === r && display.lookup?.sboxCol === c}
					>{val}</text>
				{/each}
			{/each}
		</g>

		<!-- Arrows -->
		{#if display.showLookup && display.lookup}
			<!-- Arrow from input to sbox -->
			<line
				x1={inputX + 4 * cellSize + 8}
				y1={inputY + display.lookup.row * cellSize + cellSize / 2}
				x2={sboxX + 10}
				y2={inputY + display.lookup.row * cellSize + cellSize / 2}
				class="arrow"
			/>
			<polygon
				points="{sboxX + 14},{inputY + display.lookup.row * cellSize + cellSize / 2} {sboxX + 6},{inputY + display.lookup.row * cellSize + cellSize / 2 - 5} {sboxX + 6},{inputY + display.lookup.row * cellSize + cellSize / 2 + 5}"
				class="arrow-head"
			/>

			<!-- Arrow from sbox to output -->
			<line
				x1={sboxX + 18 + 16 * sboxCellSize + 8}
				y1={outputY + display.lookup.row * cellSize + cellSize / 2}
				x2={outputX - 10}
				y2={outputY + display.lookup.row * cellSize + cellSize / 2}
				class="arrow"
			/>
			<polygon
				points="{outputX - 6},{outputY + display.lookup.row * cellSize + cellSize / 2} {outputX - 14},{outputY + display.lookup.row * cellSize + cellSize / 2 - 5} {outputX - 14},{outputY + display.lookup.row * cellSize + cellSize / 2 + 5}"
				class="arrow-head"
			/>
		{/if}

		<!-- Output State -->
		<g>
			<text x={outputX + 2 * cellSize} y={outputY - 15} class="matrix-label output-label">Output</text>
			{#each outputState as row, i}
				{#each row as val, j}
					<rect
						x={outputX + j * cellSize}
						y={outputY + i * cellSize}
						width={cellSize - 2}
						height={cellSize - 2}
						rx="3"
						class="cell output-cell"
						class:highlight-output={display.lookup?.row === i && display.lookup?.col === j}
						class:filled={filledCells[i][j] || display.showAllFilled}
					/>
					{#if filledCells[i][j] || display.showAllFilled}
						<text
							x={outputX + j * cellSize + cellSize / 2}
							y={outputY + i * cellSize + cellSize / 2 + 5}
							class="cell-text output-text"
						>{val}</text>
					{/if}
				{/each}
			{/each}
		</g>

		<!-- Lookup explanation -->
		{#if display.showLookup && display.lookup}
			<text x={width / 2} y={height - 35} class="lookup-text">
				0x{display.lookup.inVal} → row {hexChars[display.lookup.sboxRow]}, col {hexChars[display.lookup.sboxCol]}
			</text>
			<text x={width / 2} y={height - 18} class="result-text">
				S-box[{hexChars[display.lookup.sboxRow]}][{hexChars[display.lookup.sboxCol]}] = 0x{display.lookup.outVal}
			</text>
		{/if}
	</svg>

	<div class="label">{display.label}</div>
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
		max-width: 720px;
		height: auto;
	}

	/* Matrix labels */
	.matrix-label {
		fill: var(--color-fg);
		font-size: 14px;
		font-weight: bold;
		text-anchor: middle;
	}

	.output-label {
		fill: var(--color-accent);
	}

	/* Cells */
	.cell {
		fill: var(--color-bg-card);
		stroke: var(--color-border);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.cell.highlight-input {
		stroke: var(--color-math);
		stroke-width: 2.5;
		filter: drop-shadow(0 0 6px var(--color-math));
	}

	.cell.output-cell {
		stroke: var(--color-border);
	}

	.cell.highlight-output {
		stroke: var(--color-accent);
		stroke-width: 2.5;
	}

	.cell.filled {
		stroke: var(--color-accent);
	}

	.cell-text {
		fill: var(--color-fg);
		font-size: 12px;
		font-family: monospace;
		text-anchor: middle;
	}

	.output-text {
		fill: var(--color-accent);
		font-weight: bold;
	}

	/* S-box */
	.sbox-label {
		fill: var(--color-math);
		font-size: 13px;
		font-weight: bold;
		text-anchor: middle;
	}

	.sbox-header {
		fill: var(--color-fg-muted);
		font-size: 10px;
		font-family: monospace;
		text-anchor: middle;
	}

	.sbox-header.highlight-row {
		fill: var(--color-error);
		font-weight: bold;
	}

	.sbox-header.highlight-col {
		fill: var(--color-math);
		font-weight: bold;
	}

	.sbox-bg {
		fill: var(--color-bg-card);
		stroke: var(--color-border);
		stroke-width: 1;
	}

	.sbox-row-highlight {
		fill: var(--color-error);
		opacity: 0.2;
	}

	.sbox-col-highlight {
		fill: var(--color-math);
		opacity: 0.2;
	}

	.sbox-cell-highlight {
		fill: var(--color-accent);
		opacity: 0.8;
	}

	.sbox-value {
		fill: var(--color-fg-muted);
		font-size: 8px;
		font-family: monospace;
		text-anchor: middle;
	}

	.sbox-value-highlight {
		fill: var(--color-bg);
		font-weight: bold;
		font-size: 9px;
	}

	/* Arrows */
	.arrow {
		stroke: var(--color-math);
		stroke-width: 2.5;
	}

	.arrow-head {
		fill: var(--color-math);
	}

	/* Lookup text */
	.lookup-text {
		fill: var(--color-fg);
		font-size: 13px;
		font-family: monospace;
		text-anchor: middle;
	}

	.result-text {
		fill: var(--color-accent);
		font-size: 13px;
		font-family: monospace;
		font-weight: bold;
		text-anchor: middle;
	}

	/* Label */
	.label {
		font-size: 1rem;
		color: var(--color-fg);
		text-anchor: middle;
	}
</style>
