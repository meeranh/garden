<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 8;
	const maxStep = totalSteps - 1;

	// Step 0: Bob has key pair
	// Step 1: Bob publishes public key
	// Step 2: Alice has a message
	// Step 3: Alice encrypts with public key
	// Step 4: Encrypted message travels
	// Step 5: Eve sees public key, confused
	// Step 6: Bob decrypts with private key
	// Step 7: Success!

	let display = $derived.by(() => {
		return {
			bobHasKeyPair: currentStep >= 0,
			publicKeyPublished: currentStep >= 1,
			aliceHasMessage: currentStep >= 2 && currentStep < 4,
			aliceEncrypts: currentStep >= 3,
			messageEncrypted: currentStep >= 4,
			showEve: currentStep >= 5,
			bobDecrypts: currentStep >= 6,
			success: currentStep >= 7,

			label: currentStep === 0 ? 'Bob has a key pair: public and private' :
			       currentStep === 1 ? 'Bob publishes his public key' :
			       currentStep === 2 ? 'Alice wants to send a secret message' :
			       currentStep === 3 ? 'Alice encrypts with Bob\'s public key' :
			       currentStep === 4 ? 'The encrypted message travels...' :
			       currentStep === 5 ? 'Eve has the public key, but...' :
			       currentStep === 6 ? 'Only Bob can decrypt with his private key' :
			       'Message received! Eve got nothing.'
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
	<svg viewBox="0 0 440 220" class="scene">
		<!-- Network line -->
		<line x1="80" y1="140" x2="320" y2="140" class="network" />

		<!-- Alice (left) -->
		<g class="person">
			<text x="60" y="95" class="name">Alice</text>
			<circle cx="60" cy="115" r="12" class="head" />
			<line x1="60" y1="127" x2="60" y2="160" class="body" />
			<line x1="60" y1="135" x2="42" y2="150" class="limb" />
			<line x1="60" y1="135" x2="78" y2="150" class="limb" />
			<line x1="60" y1="160" x2="45" y2="185" class="limb" />
			<line x1="60" y1="160" x2="75" y2="185" class="limb" />
		</g>

		<!-- Message near Alice -->
		{#if display.aliceHasMessage}
			<g transform="translate(85, 120)">
				<rect x="0" y="-8" width="30" height="16" rx="3" class="message-box" />
				<text x="15" y="4" class="message-text">msg</text>
			</g>
		{/if}

		<!-- Encrypted message traveling -->
		{#if display.messageEncrypted && !display.success}
			<g transform="translate({currentStep >= 6 ? 280 : 180}, 130)">
				<rect x="0" y="-10" width="35" height="20" rx="3" class="encrypted-box" />
				<text x="17" y="5" class="encrypted-text">????</text>
			</g>
		{/if}

		<!-- Bob (right) -->
		<g class="person">
			<text x="340" y="95" class="name">Bob</text>
			<circle cx="340" cy="115" r="12" class="head" />
			<line x1="340" y1="127" x2="340" y2="160" class="body" />
			<line x1="340" y1="135" x2="322" y2="150" class="limb" />
			<line x1="340" y1="135" x2="358" y2="150" class="limb" />
			<line x1="340" y1="160" x2="325" y2="185" class="limb" />
			<line x1="340" y1="160" x2="355" y2="185" class="limb" />
		</g>

		<!-- Bob's key pair - positioned to the right of Bob -->
		{#if display.bobHasKeyPair}
			<!-- Key pair box -->
			<g class="key-pair-box" transform="translate(365, 105)">
				<!-- Private key -->
				<g transform="translate(0, 0)">
					<circle cx="6" cy="0" r="5" class="private-key-head" />
					<line x1="11" y1="0" x2="22" y2="0" class="private-key-stem" />
					<line x1="18" y1="0" x2="18" y2="4" class="private-key-stem" />
					<line x1="22" y1="0" x2="22" y2="4" class="private-key-stem" />
					<text x="30" y="4" class="key-label private-label">private</text>
				</g>

				<!-- Public key (when not published) -->
				{#if !display.publicKeyPublished}
					<g transform="translate(0, 20)">
						<circle cx="6" cy="0" r="5" class="public-key-head" />
						<line x1="11" y1="0" x2="22" y2="0" class="public-key-stem" />
						<line x1="18" y1="0" x2="18" y2="4" class="public-key-stem" />
						<line x1="22" y1="0" x2="22" y2="4" class="public-key-stem" />
						<text x="30" y="4" class="key-label public-label">public</text>
					</g>
				{/if}
			</g>

			<!-- Public key (when published - moves to center) -->
			{#if display.publicKeyPublished}
				<g class="key-group" transform="translate(185, 158)">
					<circle cx="6" cy="0" r="5" class="public-key-head" />
					<line x1="11" y1="0" x2="22" y2="0" class="public-key-stem" />
					<line x1="18" y1="0" x2="18" y2="4" class="public-key-stem" />
					<line x1="22" y1="0" x2="22" y2="4" class="public-key-stem" />
					<text x="14" y="15" class="key-label public-label">public</text>
				</g>
			{/if}
		{/if}

		<!-- Eve (appears later, confused) -->
		{#if display.showEve}
			<g class="person eve">
				<text x="200" y="15" class="name eve-name">Eve</text>
				<circle cx="200" cy="35" r="12" class="head eve-head" />
				<line x1="200" y1="47" x2="200" y2="80" class="body eve-body" />
				<line x1="200" y1="55" x2="182" y2="70" class="limb eve-body" />
				<line x1="200" y1="55" x2="218" y2="70" class="limb eve-body" />
				<line x1="200" y1="80" x2="185" y2="105" class="limb eve-body" />
				<line x1="200" y1="80" x2="215" y2="105" class="limb eve-body" />
				<!-- Confused marks -->
				<text x="230" y="45" class="confused">?</text>
			</g>
		{/if}

		<!-- Decrypted message near Bob -->
		{#if display.success}
			<g transform="translate(295, 120)">
				<rect x="0" y="-8" width="30" height="16" rx="3" class="decrypted-box" />
				<text x="15" y="4" class="decrypted-text">msg</text>
			</g>
		{/if}
	</svg>

	<div class="label" class:success={display.success} class:danger={currentStep === 5}>{display.label}</div>

	{#if display.success}
		<div class="insight">Public key visible to all. Only private key decrypts.</div>
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
		max-width: 400px;
		height: auto;
	}

	.network {
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		stroke-dasharray: 8 4;
		opacity: 0.6;
	}

	.person .head {
		fill: var(--color-bg-card);
		stroke: var(--color-accent);
		stroke-width: 2.5;
	}

	.person .body,
	.person .limb {
		stroke: var(--color-accent);
		stroke-width: 2.5;
		stroke-linecap: round;
	}

	.person .name {
		fill: var(--color-fg);
		font-size: 13px;
		text-anchor: middle;
		font-weight: bold;
	}

	/* Eve */
	.eve-head {
		stroke: var(--color-error) !important;
	}

	.eve-body {
		stroke: var(--color-error) !important;
	}

	.eve-name {
		fill: var(--color-error) !important;
	}

	.confused {
		fill: var(--color-error);
		font-size: 18px;
		font-weight: bold;
	}

	/* Keys */
	.public-key-head {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 1.5;
	}

	.public-key-stem {
		stroke: var(--color-accent);
		stroke-width: 1.5;
		stroke-linecap: round;
	}

	.private-key-head {
		fill: none;
		stroke: var(--color-math);
		stroke-width: 1.5;
	}

	.private-key-stem {
		stroke: var(--color-math);
		stroke-width: 1.5;
		stroke-linecap: round;
	}

	.key-label {
		font-size: 9px;
		text-anchor: start;
	}

	.public-label {
		fill: var(--color-accent);
	}

	.private-label {
		fill: var(--color-math);
	}

	.key-group {
		transition: transform 0.5s ease;
	}

	/* Messages */
	.message-box {
		fill: var(--color-bg-card);
		stroke: var(--color-accent);
		stroke-width: 1.5;
	}

	.message-text {
		fill: var(--color-accent);
		font-size: 10px;
		text-anchor: middle;
		font-family: monospace;
	}

	.encrypted-box {
		fill: var(--color-bg-card);
		stroke: var(--color-error);
		stroke-width: 1.5;
	}

	.encrypted-text {
		fill: var(--color-error);
		font-size: 10px;
		text-anchor: middle;
		font-family: monospace;
	}

	.decrypted-box {
		fill: var(--color-bg-card);
		stroke: var(--color-accent);
		stroke-width: 1.5;
	}

	.decrypted-text {
		fill: var(--color-accent);
		font-size: 10px;
		text-anchor: middle;
		font-family: monospace;
	}

	.label {
		font-size: 1.1rem;
		color: var(--color-fg);
		text-align: center;
		transition: color 0.3s ease;
	}

	.label.danger {
		color: var(--color-error);
	}

	.label.success {
		color: var(--color-accent);
	}

	.insight {
		font-size: 1rem;
		color: var(--color-math);
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 2px solid var(--color-math);
		border-radius: 0.5rem;
		font-weight: bold;
	}
</style>
