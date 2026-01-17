<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Step 0: Show empty grid with "64-bit key"
	// Step 1: Fill in bits, label bytes
	// Step 2: Highlight parity column
	// Step 3: Dim parity bits, show calculation
	// Step 4: Insight

	// Example bit values for visualization
	const bits = [
		[1, 0, 1, 1, 0, 0, 1, 0],
		[0, 1, 1, 0, 1, 0, 0, 1],
		[1, 1, 0, 0, 1, 1, 0, 0],
		[0, 0, 1, 1, 0, 1, 1, 1],
		[1, 0, 0, 1, 1, 0, 1, 0],
		[0, 1, 1, 0, 0, 1, 0, 1],
		[1, 1, 0, 1, 0, 0, 1, 0],
		[0, 0, 1, 0, 1, 1, 0, 1]
	];

	const cellSize = 28;
	const cellGap = 4;
	const gridWidth = 8 * cellSize + 7 * cellGap;
	const gridHeight = 8 * cellSize + 7 * cellGap;

	let display = $derived.by(() => {
		return {
			showBits: currentStep >= 1,
			highlightParity: currentStep >= 2,
			dimParity: currentStep >= 3,
			showCalc: currentStep >= 3,
			showInsight: currentStep >= 4,

			label: currentStep === 0 ? '64-bit key (8 bytes)' :
			       currentStep === 1 ? 'Each row is one byte (8 bits)' :
			       currentStep === 2 ? 'The 8th bit of each byte is for parity' :
			       currentStep === 3 ? '7 key bits × 8 bytes = 56 bits' :
			       'Only 56 bits are actually secret'
		};
	});

	function getCellX(col: number) {
		return col * (cellSize + cellGap);
	}

	function getCellY(row: number) {
		return row * (cellSize + cellGap);
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
	<svg viewBox="0 0 360 340" class="scene">
		<!-- Column headers -->
		<g transform="translate(75, 15)">
			{#each Array(8) as _, col}
				<text
					x={getCellX(col) + cellSize / 2}
					y="0"
					class="col-header"
					class:parity-header={col === 7 && display.highlightParity}
				>
					{col === 7 && display.highlightParity ? 'P' : col + 1}
				</text>
			{/each}
		</g>

		<!-- Row labels -->
		<g transform="translate(45, 35)">
			{#each Array(8) as _, row}
				<text
					x="0"
					y={getCellY(row) + cellSize / 2 + 5}
					class="row-label"
				>
					B{row + 1}
				</text>
			{/each}
		</g>

		<!-- Bit grid -->
		<g transform="translate(75, 35)">
			{#each bits as row, rowIdx}
				{#each row as bit, colIdx}
					<rect
						x={getCellX(colIdx)}
						y={getCellY(rowIdx)}
						width={cellSize}
						height={cellSize}
						rx="4"
						class="cell"
						class:parity={colIdx === 7 && display.highlightParity}
						class:dimmed={colIdx === 7 && display.dimParity}
						class:key-bit={colIdx < 7 && display.dimParity}
					/>
					{#if display.showBits}
						<text
							x={getCellX(colIdx) + cellSize / 2}
							y={getCellY(rowIdx) + cellSize / 2 + 5}
							class="bit-text"
							class:parity-text={colIdx === 7 && display.highlightParity}
							class:dimmed-text={colIdx === 7 && display.dimParity}
						>
							{bit}
						</text>
					{/if}
				{/each}
			{/each}

			<!-- Strike through parity column -->
			{#if display.dimParity}
				<line
					x1={getCellX(7) + cellSize / 2}
					y1="-5"
					x2={getCellX(7) + cellSize / 2}
					y2={gridHeight + 5}
					class="strike-line"
				/>
			{/if}
		</g>

		<!-- Legend -->
		{#if display.showCalc}
			<g transform="translate(75, 320)">
				<rect x="0" y="-12" width="16" height="16" rx="3" class="legend-key" />
				<text x="22" y="0" class="legend-text">Key bits (56)</text>

				<rect x="120" y="-12" width="16" height="16" rx="3" class="legend-parity" />
				<text x="142" y="0" class="legend-text">Parity bits (8)</text>
			</g>
		{/if}
	</svg>

	<div class="label" class:insight={currentStep === 4}>{display.label}</div>

	{#if display.showInsight}
		<div class="insight-box">8 bits wasted on error checking, not security.</div>
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

	.col-header {
		fill: var(--color-fg-muted);
		font-size: 11px;
		font-family: monospace;
		text-anchor: middle;
	}

	.col-header.parity-header {
		fill: var(--color-error);
		font-weight: bold;
	}

	.row-label {
		fill: var(--color-fg-muted);
		font-size: 10px;
		font-family: monospace;
		text-anchor: end;
	}

	.cell {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 1.5;
		transition: all 0.4s ease;
	}

	.cell.parity {
		stroke: var(--color-error);
		stroke-width: 2;
	}

	.cell.dimmed {
		opacity: 0.3;
	}

	.cell.key-bit {
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.bit-text {
		fill: var(--color-fg);
		font-size: 12px;
		font-family: monospace;
		font-weight: bold;
		text-anchor: middle;
		transition: all 0.4s ease;
	}

	.bit-text.parity-text {
		fill: var(--color-error);
	}

	.bit-text.dimmed-text {
		opacity: 0.3;
	}

	.strike-line {
		stroke: var(--color-error);
		stroke-width: 2;
		stroke-dasharray: 4 2;
	}

	.legend-key {
		fill: var(--color-bg-card);
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.legend-parity {
		fill: var(--color-bg-card);
		stroke: var(--color-error);
		stroke-width: 2;
		opacity: 0.3;
	}

	.legend-text {
		fill: var(--color-fg-muted);
		font-size: 11px;
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
		color: var(--color-error);
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 2px solid var(--color-error);
		border-radius: 0.5rem;
		font-weight: bold;
	}
</style>
