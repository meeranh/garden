<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Step 0: Show original message
	// Step 1: Show changed message (one letter different)
	// Step 2: Show weak cipher outputs
	// Step 3: Show strong cipher outputs
	// Step 4: Insight

	const original = ['H', 'E', 'L', 'L', 'O'];
	const changed = ['H', 'A', 'L', 'L', 'O'];
	const weakOriginal = ['K', 'H', 'O', 'O', 'R'];
	const weakChanged = ['K', 'D', 'O', 'O', 'R'];
	const strongOriginal = ['X', '7', '#', 'm', 'K'];
	const strongChanged = ['9', 'p', 'Q', '2', 'z'];

	let display = $derived.by(() => {
		return {
			showOriginal: currentStep >= 0,
			showChanged: currentStep >= 1,
			showWeak: currentStep >= 2,
			showStrong: currentStep >= 3,
			showInsight: currentStep >= 4,

			label: currentStep === 0 ? 'Original message' :
			       currentStep === 1 ? 'Change one letter...' :
			       currentStep === 2 ? 'Weak cipher: only one output changes' :
			       currentStep === 3 ? 'Strong cipher: everything changes!' :
			       'This is the avalanche effect'
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
	<svg viewBox="0 0 400 295" class="scene">
		<!-- Input Section -->
		<text x="200" y="20" class="section-label">Input</text>

		<!-- Original message -->
		<g class="message-group" transform="translate(45, 35)">
			<text x="55" y="0" class="msg-label">Original</text>
			{#each original as char, i}
				<rect
					x={i * 28}
					y="10"
					width="24"
					height="30"
					rx="4"
					class="char-box"
				/>
				<text x={i * 28 + 12} y="30" class="char">{char}</text>
			{/each}
		</g>

		<!-- Changed message -->
		{#if display.showChanged}
			<g class="message-group" transform="translate(220, 35)">
				<text x="55" y="0" class="msg-label">Changed</text>
				{#each changed as char, i}
					<rect
						x={i * 28}
						y="10"
						width="24"
						height="30"
						rx="4"
						class="char-box"
						class:changed={char !== original[i]}
					/>
					<text
						x={i * 28 + 12}
						y="30"
						class="char"
						class:changed-text={char !== original[i]}
					>{char}</text>
				{/each}
			</g>
		{/if}

		<!-- Arrows -->
		{#if display.showWeak}
			<line x1="110" y1="80" x2="110" y2="110" class="arrow-line" />
			<polygon points="110,115 105,105 115,105" class="arrow-head" />

			<line x1="285" y1="80" x2="285" y2="110" class="arrow-line" />
			<polygon points="285,115 280,105 290,105" class="arrow-head" />
		{/if}

		<!-- Weak Cipher Output -->
		{#if display.showWeak}
			<g transform="translate(0, 120)">
				<text x="200" y="0" class="section-label">Weak Cipher</text>

				<g class="message-group" transform="translate(45, 15)">
					{#each weakOriginal as char, i}
						<rect
							x={i * 28}
							y="10"
							width="24"
							height="30"
							rx="4"
							class="char-box output"
						/>
						<text x={i * 28 + 12} y="30" class="char output-text">{char}</text>
					{/each}
				</g>

				<g class="message-group" transform="translate(220, 15)">
					{#each weakChanged as char, i}
						<rect
							x={i * 28}
							y="10"
							width="24"
							height="30"
							rx="4"
							class="char-box output"
							class:changed={char !== weakOriginal[i]}
						/>
						<text
							x={i * 28 + 12}
							y="30"
							class="char output-text"
							class:changed-text={char !== weakOriginal[i]}
						>{char}</text>
					{/each}
				</g>

				<text x="200" y="70" class="diff-label weak">1 character changed</text>
			</g>
		{/if}

		<!-- Strong Cipher Output -->
		{#if display.showStrong}
			<g transform="translate(0, 225)">
				<text x="200" y="0" class="section-label">Strong Cipher</text>

				<g class="message-group" transform="translate(45, 15)">
					{#each strongOriginal as char, i}
						<rect
							x={i * 28}
							y="10"
							width="24"
							height="30"
							rx="4"
							class="char-box output strong"
						/>
						<text x={i * 28 + 12} y="30" class="char output-text">{char}</text>
					{/each}
				</g>

				<g class="message-group" transform="translate(220, 15)">
					{#each strongChanged as char, i}
						<rect
							x={i * 28}
							y="10"
							width="24"
							height="30"
							rx="4"
							class="char-box output strong all-changed"
						/>
						<text
							x={i * 28 + 12}
							y="30"
							class="char changed-text"
						>{char}</text>
					{/each}
				</g>

				<text x="200" y="70" class="diff-label strong">ALL characters changed</text>
			</g>
		{/if}
	</svg>

	<div class="label" class:insight={currentStep === 4}>{display.label}</div>

	{#if display.showInsight}
		<div class="insight-box">One input change cascades through the entire output.</div>
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
		max-width: 420px;
		height: auto;
	}

	.section-label {
		fill: var(--color-fg-muted);
		font-size: 12px;
		text-anchor: middle;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.msg-label {
		fill: var(--color-fg-muted);
		font-size: 10px;
		text-anchor: middle;
	}

	.char-box {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.char-box.changed {
		stroke: var(--color-error);
		stroke-width: 2;
	}

	.char-box.output {
		stroke: var(--color-accent);
	}

	.char-box.output.strong {
		stroke: var(--color-math);
	}

	.char-box.all-changed {
		stroke: var(--color-error);
		stroke-width: 2;
	}

	.char {
		fill: var(--color-fg);
		font-size: 14px;
		font-family: monospace;
		font-weight: bold;
		text-anchor: middle;
	}

	.char.output-text {
		fill: var(--color-accent);
	}

	.char.changed-text {
		fill: var(--color-error);
	}

	.arrow-line {
		stroke: var(--color-fg-muted);
		stroke-width: 2;
	}

	.arrow-head {
		fill: var(--color-fg-muted);
	}

	.diff-label {
		font-size: 11px;
		text-anchor: middle;
		font-weight: bold;
	}

	.diff-label.weak {
		fill: var(--color-fg-muted);
	}

	.diff-label.strong {
		fill: var(--color-error);
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
		color: var(--color-math);
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 2px solid var(--color-math);
		border-radius: 0.5rem;
		font-weight: bold;
	}
</style>
