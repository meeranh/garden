<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Message: 1010, Key: 1100, Ciphertext: 0110
	const message = '1010';
	const key = '1100';
	const cipher = '0110';

	// Step 0: Show message
	// Step 1: Show key
	// Step 2: XOR → ciphertext (encrypt)
	// Step 3: XOR ciphertext with key again
	// Step 4: Get message back (decrypt)

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
		}, 1800);
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
	<!-- Encrypt phase -->
	<div class="phase">
		<div class="phase-label">Encrypt</div>

		<div class="row">
			<span class="label">message</span>
			<span class="bits">{message}</span>
		</div>

		{#if currentStep >= 1}
			<div class="row">
				<span class="label"><span class="xor">⊕</span> key</span>
				<span class="bits">{key}</span>
			</div>
		{/if}

		{#if currentStep >= 2}
			<div class="row result">
				<span class="label">ciphertext</span>
				<span class="bits cipher">{cipher}</span>
			</div>
		{/if}
	</div>

	<!-- Decrypt phase -->
	{#if currentStep >= 3}
		<div class="arrow">↓</div>

		<div class="phase">
			<div class="phase-label">Decrypt</div>

			<div class="row">
				<span class="label">ciphertext</span>
				<span class="bits cipher">{cipher}</span>
			</div>

			<div class="row">
				<span class="label"><span class="xor">⊕</span> key</span>
				<span class="bits">{key}</span>
			</div>

			{#if currentStep >= 4}
				<div class="row result">
					<span class="label">message</span>
					<span class="bits message">{message}</span>
				</div>
			{/if}
		</div>
	{/if}

	{#if currentStep >= 4}
		<div class="conclusion">Same key encrypts and decrypts!</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem 1rem;
		font-family: monospace;
	}

	.phase {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		min-width: 200px;
	}

	.phase-label {
		font-size: 0.85rem;
		color: var(--color-fg-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s ease;
	}

	.label {
		font-size: 0.9rem;
		color: var(--color-fg-muted);
		width: 70px;
		text-align: right;
	}

	.xor {
		font-size: 1.4rem;
	}

	.bits {
		font-size: 1.4rem;
		color: var(--color-fg);
		letter-spacing: 0.15em;
	}

	.bits.cipher {
		color: var(--color-error);
	}

	.bits.message {
		color: var(--color-accent);
		font-weight: bold;
	}

	.result {
		margin-top: 0.25rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
	}

	.arrow {
		font-size: 1.5rem;
		color: var(--color-fg-muted);
	}

	.conclusion {
		margin-top: 0.5rem;
		font-size: 1rem;
		color: var(--color-math);
		font-style: italic;
	}
</style>
