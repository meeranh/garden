<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 6;
	const maxStep = totalSteps - 1;

	// Two 4-bit numbers to XOR
	const numA = [1, 0, 1, 1];
	const numB = [0, 1, 1, 0];
	const result = [1, 1, 0, 1]; // 1011 XOR 0110 = 1101

	// Step 0: Show both numbers
	// Steps 1-4: Highlight each column, show comparison, reveal result
	// Step 5: Show complete

	let display = $derived.by(() => {
		const activeCol = currentStep >= 1 && currentStep <= 4 ? currentStep - 1 : -1;
		const revealedBits = currentStep >= 1 ? Math.min(currentStep, 4) : 0;
		const showComplete = currentStep >= 5;

		let comparison = '';
		if (activeCol >= 0 && activeCol < 4) {
			const a = numA[activeCol];
			const b = numB[activeCol];
			comparison = a === b ? 'same → 0' : 'different → 1';
		}

		return { activeCol, revealedBits, showComplete, comparison };
	});

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
	<div class="row">
		{#each numA as bit, i}
			<span class="bit" class:active={display.activeCol === i}>{bit}</span>
		{/each}
	</div>

	<div class="row operator">
		<span class="xor-symbol">⊕</span>
	</div>

	<div class="row">
		{#each numB as bit, i}
			<span class="bit" class:active={display.activeCol === i}>{bit}</span>
		{/each}
	</div>

	<div class="row divider">
		<span class="line"></span>
	</div>

	<div class="row result-row">
		{#each result as bit, i}
			{#if i < display.revealedBits}
				<span class="bit result" class:active={display.activeCol === i}>{bit}</span>
			{:else}
				<span class="bit placeholder">?</span>
			{/if}
		{/each}
	</div>

	{#if display.comparison}
		<div class="comparison">{display.comparison}</div>
	{/if}

	{#if display.showComplete}
		<div class="complete">1011 ⊕ 0110 = 1101</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 1rem;
		font-family: monospace;
	}

	.row {
		display: flex;
		gap: 0.75rem;
	}

	.bit {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		color: var(--color-fg);
		background: var(--color-bg-card);
		border: 2px solid var(--color-border);
		border-radius: 0.5rem;
		transition: all 0.3s ease;
	}

	.bit.active {
		border-color: var(--color-accent);
		background: var(--color-bg);
	}

	.bit.result {
		color: var(--color-math);
		font-weight: bold;
	}

	.bit.placeholder {
		color: var(--color-fg-muted);
		opacity: 0.5;
	}

	.operator {
		margin: 0.25rem 0;
	}

	.xor-symbol {
		font-size: 1.75rem;
		color: var(--color-fg-muted);
	}

	.divider {
		width: 100%;
		max-width: 180px;
		margin: 0.25rem 0;
	}

	.line {
		width: 100%;
		height: 2px;
		background: var(--color-fg-muted);
	}

	.result-row {
		margin-top: 0.25rem;
	}

	.comparison {
		margin-top: 1rem;
		font-size: 1rem;
		color: var(--color-accent);
		font-style: italic;
	}

	.complete {
		margin-top: 1rem;
		font-size: 1.1rem;
		color: var(--color-math);
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 2px solid var(--color-math);
		border-radius: 0.5rem;
	}
</style>
