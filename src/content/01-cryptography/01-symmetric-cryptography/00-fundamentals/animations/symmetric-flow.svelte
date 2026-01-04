<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	// Step 0: Show plaintext
	// Step 1: Show key
	// Step 2: Encrypting...
	// Step 3: Show ciphertext
	// Step 4: Show same key again
	// Step 5: Decrypting...
	// Step 6: Show recovered plaintext

	let display = $derived.by(() => {
		return {
			showPlaintext: currentStep >= 0,
			showKey1: currentStep >= 1 && currentStep <= 3,
			encrypting: currentStep === 2,
			showCiphertext: currentStep >= 3,
			showKey2: currentStep >= 4 && currentStep <= 5,
			decrypting: currentStep === 5,
			showRecovered: currentStep >= 6,

			plaintextFaded: currentStep >= 3,
			ciphertextFaded: currentStep >= 6,

			label: currentStep === 0 ? 'Plaintext message' :
			       currentStep === 1 ? 'Apply the key...' :
			       currentStep === 2 ? 'Encrypting...' :
			       currentStep === 3 ? 'Unreadable ciphertext' :
			       currentStep === 4 ? 'Same key...' :
			       currentStep === 5 ? 'Decrypting...' :
			       'Message recovered!'
		};
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
		}, 1400);
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
	<div class="flow">
		<!-- Plaintext -->
		<div class="stage" class:faded={display.plaintextFaded && !display.showRecovered}>
			<div class="message plaintext">HELLO</div>
			{#if currentStep === 0}
				<div class="stage-label">plaintext</div>
			{/if}
		</div>

		<!-- Arrow 1 -->
		{#if currentStep >= 1}
			<div class="arrow-section">
				<div class="arrow">→</div>
				{#if display.showKey1}
					<div class="key" class:active={display.encrypting}>
						<svg class="key-icon" viewBox="0 0 24 12" width="24" height="12">
							<circle cx="6" cy="6" r="5" class="key-head" />
							<line x1="11" y1="6" x2="23" y2="6" class="key-stem" />
							<line x1="19" y1="6" x2="19" y2="10" class="key-tooth" />
							<line x1="23" y1="6" x2="23" y2="10" class="key-tooth" />
						</svg>
						<span class="key-text">KEY</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Ciphertext -->
		{#if display.showCiphertext}
			<div class="stage" class:faded={display.ciphertextFaded}>
				<div class="message ciphertext">X7#mK</div>
				{#if currentStep === 3}
					<div class="stage-label">ciphertext</div>
				{/if}
			</div>
		{/if}

		<!-- Arrow 2 -->
		{#if currentStep >= 4}
			<div class="arrow-section">
				<div class="arrow">→</div>
				{#if display.showKey2}
					<div class="key" class:active={display.decrypting}>
						<svg class="key-icon" viewBox="0 0 24 12" width="24" height="12">
							<circle cx="6" cy="6" r="5" class="key-head" />
							<line x1="11" y1="6" x2="23" y2="6" class="key-stem" />
							<line x1="19" y1="6" x2="19" y2="10" class="key-tooth" />
							<line x1="23" y1="6" x2="23" y2="10" class="key-tooth" />
						</svg>
						<span class="key-text">KEY</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Recovered -->
		{#if display.showRecovered}
			<div class="stage">
				<div class="message recovered">HELLO</div>
				<div class="stage-label">recovered</div>
			</div>
		{/if}
	</div>

	<div class="label">{display.label}</div>

	{#if display.showRecovered}
		<div class="insight">Same key encrypts and decrypts</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem 1rem;
	}

	.flow {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		justify-content: center;
	}

	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		transition: opacity 0.4s ease;
		min-height: 80px;
	}

	.stage.faded {
		opacity: 0.4;
	}

	.message {
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-family: monospace;
		font-size: 1.4rem;
		font-weight: bold;
		letter-spacing: 0.1em;
		transition: all 0.3s ease;
	}

	.plaintext {
		background: var(--color-bg-card);
		border: 2px solid var(--color-accent);
		color: var(--color-accent);
	}

	.ciphertext {
		background: var(--color-bg-card);
		border: 2px solid var(--color-error);
		color: var(--color-error);
	}

	.recovered {
		background: var(--color-bg-card);
		border: 2px solid var(--color-accent);
		color: var(--color-accent);
	}

	.stage-label {
		font-size: 0.8rem;
		color: var(--color-fg-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.arrow-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		min-height: 80px;
		justify-content: flex-start;
		padding-top: 0.75rem;
	}

	.arrow {
		font-size: 1.5rem;
		color: var(--color-fg-muted);
	}

	.key {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.35rem 0.6rem;
		background: var(--color-bg-card);
		border: 2px solid var(--color-math);
		border-radius: 0.35rem;
		transition: all 0.3s ease;
	}

	.key.active {
		background: var(--color-math);
	}

	.key.active .key-text {
		color: var(--color-bg);
	}

	.key-icon {
		display: block;
	}

	.key-icon .key-head {
		fill: none;
		stroke: var(--color-math);
		stroke-width: 1.5;
	}

	.key-icon .key-stem,
	.key-icon .key-tooth {
		stroke: var(--color-math);
		stroke-width: 1.5;
		stroke-linecap: round;
	}

	.key.active .key-icon .key-head,
	.key.active .key-icon .key-stem,
	.key.active .key-icon .key-tooth {
		stroke: var(--color-bg);
	}

	.key-text {
		font-size: 0.75rem;
		font-weight: bold;
		color: var(--color-math);
		font-family: monospace;
	}

	.label {
		font-size: 1.1rem;
		color: var(--color-fg);
		font-style: italic;
	}

	.insight {
		font-size: 1rem;
		color: var(--color-math);
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-math);
		border-radius: 0.35rem;
	}
</style>
