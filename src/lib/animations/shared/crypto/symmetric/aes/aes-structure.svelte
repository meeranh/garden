<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 8;
	const maxStep = totalSteps - 1;

	// Step 0: Show plaintext
	// Step 1: AddRoundKey (K0)
	// Step 2: Round 1 - SubNibbles
	// Step 3: Round 1 - ShiftRows
	// Step 4: Round 1 - MixColumns
	// Step 5: Round 1 - AddRoundKey (K1)
	// Step 6: Round 2 - SubNibbles, ShiftRows, AddRoundKey (K2)
	// Step 7: Ciphertext

	const steps = [
		{ label: 'Plaintext (128 bits)', highlight: 'plaintext' },
		{ label: 'AddRoundKey: XOR plaintext with K₀', highlight: 'addroundkey0' },
		{ label: 'Rounds 1-9: SubBytes', highlight: 'subnibbles1' },
		{ label: 'Rounds 1-9: ShiftRows', highlight: 'shiftrows1' },
		{ label: 'Rounds 1-9: MixColumns', highlight: 'mixcolumns1' },
		{ label: 'Rounds 1-9: AddRoundKey with K₁...K₉', highlight: 'addroundkey1' },
		{ label: 'Round 10: SubBytes → ShiftRows → AddRoundKey', highlight: 'round2' },
		{ label: 'Ciphertext (128 bits)', highlight: 'ciphertext' }
	];

	let display = $derived.by(() => {
		return {
			label: steps[currentStep].label,
			highlight: steps[currentStep].highlight,
			showPlaintext: currentStep >= 0,
			showK0: currentStep >= 1,
			showRound1: currentStep >= 2,
			showSubNibbles1: currentStep >= 2,
			showShiftRows1: currentStep >= 3,
			showMixColumns1: currentStep >= 4,
			showAddRoundKey1: currentStep >= 5,
			showRound2: currentStep >= 6,
			showCiphertext: currentStep >= 7
		};
	});

	// Layout
	const width = 360;
	const height = 560;
	const centerX = width / 2;
	const boxW = 140;
	const boxH = 32;
	const opBoxW = 120;
	const opBoxH = 28;
	const xorR = 14;
	const keyOffset = 70;

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

	function next() {
		if (currentStep < maxStep) currentStep++;
	}
	function prev() {
		if (currentStep > 0) currentStep--;
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

	onMount(() => register?.({ play, pause, next, prev, skip, replay, getState }));
	onDestroy(() => pause());
</script>

<div class="container">
	<svg viewBox="0 0 {width} {height}" class="scene">
		<!-- Plaintext -->
		{#if display.showPlaintext}
			<g class="fade-in">
				<rect
					x={centerX - boxW / 2}
					y={20}
					width={boxW}
					height={boxH}
					rx="6"
					class="box"
					class:active={display.highlight === 'plaintext'}
				/>
				<text x={centerX} y={40} class="box-text">Plaintext</text>
			</g>
		{/if}

		<!-- XOR with K0 -->
		{#if display.showK0}
			<g class="fade-in">
				<!-- Arrow from plaintext to XOR -->
				<line x1={centerX} y1={52} x2={centerX} y2={72} class="arrow" />
				<polygon points="{centerX},{76} {centerX - 4},{68} {centerX + 4},{68}" class="arrow-head" />

				<!-- XOR circle -->
				<circle
					cx={centerX}
					cy={90}
					r={xorR}
					class="xor-circle"
					class:active={display.highlight === 'addroundkey0'}
				/>
				<text x={centerX} y={95} class="xor-text">⊕</text>

				<!-- Key box and arrow -->
				<rect
					x={centerX + keyOffset - 20}
					y={78}
					width={44}
					height={24}
					rx="4"
					class="key-box"
					class:active={display.highlight === 'addroundkey0'}
				/>
				<text x={centerX + keyOffset + 2} y={94} class="key-text">K₀</text>

				<!-- Arrow from key to XOR -->
				<line x1={centerX + keyOffset - 20} y1={90} x2={centerX + xorR + 4} y2={90} class="arrow" />
				<polygon points="{centerX + xorR + 2},{90} {centerX + xorR + 8},{86} {centerX + xorR + 8},{94}" class="arrow-head" />

				<!-- Arrow from XOR down -->
				<line x1={centerX} y1={104} x2={centerX} y2={122} class="arrow" />
				<polygon points="{centerX},{126} {centerX - 4},{118} {centerX + 4},{118}" class="arrow-head" />
			</g>
		{/if}

		<!-- Round 1 box -->
		{#if display.showRound1}
			<g class="fade-in">
				<!-- Round 1 container -->
				<rect
					x={centerX - boxW / 2 - 10}
					y={130}
					width={boxW + 20}
					height={185}
					rx="8"
					class="round-box"
				/>
				<text x={centerX} y={147} class="round-label">Rounds 1-9</text>

				<!-- SubNibbles -->
				<rect
					x={centerX - opBoxW / 2}
					y={155}
					width={opBoxW}
					height={opBoxH}
					rx="4"
					class="op-box"
					class:active={display.highlight === 'subnibbles1'}
				/>
				<text x={centerX} y={173} class="op-text">SubBytes</text>
			</g>
		{/if}

		{#if display.showShiftRows1}
			<g class="fade-in">
				<rect
					x={centerX - opBoxW / 2}
					y={190}
					width={opBoxW}
					height={opBoxH}
					rx="4"
					class="op-box"
					class:active={display.highlight === 'shiftrows1'}
				/>
				<text x={centerX} y={208} class="op-text">ShiftRows</text>
			</g>
		{/if}

		{#if display.showMixColumns1}
			<g class="fade-in">
				<rect
					x={centerX - opBoxW / 2}
					y={225}
					width={opBoxW}
					height={opBoxH}
					rx="4"
					class="op-box"
					class:active={display.highlight === 'mixcolumns1'}
				/>
				<text x={centerX} y={243} class="op-text">MixColumns</text>
			</g>
		{/if}

		{#if display.showAddRoundKey1}
			<g class="fade-in">
				<!-- Arrow to XOR -->
				<line x1={centerX} y1={253} x2={centerX} y2={268} class="arrow" />
				<polygon points="{centerX},{272} {centerX - 4},{264} {centerX + 4},{264}" class="arrow-head" />

				<!-- XOR circle -->
				<circle
					cx={centerX}
					cy={286}
					r={xorR}
					class="xor-circle"
					class:active={display.highlight === 'addroundkey1'}
				/>
				<text x={centerX} y={291} class="xor-text">⊕</text>

				<!-- Key box and arrow -->
				<rect
					x={centerX + keyOffset - 20}
					y={274}
					width={44}
					height={24}
					rx="4"
					class="key-box"
					class:active={display.highlight === 'addroundkey1'}
				/>
				<text x={centerX + keyOffset + 2} y={290} class="key-text">Kₙ</text>

				<!-- Arrow from key to XOR -->
				<line x1={centerX + keyOffset - 20} y1={286} x2={centerX + xorR + 4} y2={286} class="arrow" />
				<polygon points="{centerX + xorR + 2},{286} {centerX + xorR + 8},{282} {centerX + xorR + 8},{290}" class="arrow-head" />
			</g>
		{/if}

		<!-- Round 2 box -->
		{#if display.showRound2}
			<g class="fade-in">
				<!-- Arrow into round 2 -->
				<line x1={centerX} y1={315} x2={centerX} y2={333} class="arrow" />
				<polygon points="{centerX},{337} {centerX - 4},{329} {centerX + 4},{329}" class="arrow-head" />

				<!-- Round 2 container -->
				<rect
					x={centerX - boxW / 2 - 10}
					y={340}
					width={boxW + 20}
					height={150}
					rx="8"
					class="round-box"
					class:active={display.highlight === 'round2'}
				/>
				<text x={centerX} y={357} class="round-label">Final Round</text>

				<!-- SubNibbles -->
				<rect
					x={centerX - opBoxW / 2}
					y={365}
					width={opBoxW}
					height={opBoxH}
					rx="4"
					class="op-box"
				/>
				<text x={centerX} y={383} class="op-text">SubBytes</text>

				<!-- ShiftRows -->
				<rect
					x={centerX - opBoxW / 2}
					y={400}
					width={opBoxW}
					height={opBoxH}
					rx="4"
					class="op-box"
				/>
				<text x={centerX} y={418} class="op-text">ShiftRows</text>

				<!-- XOR with K2 -->
				<!-- Arrow to XOR -->
				<line x1={centerX} y1={428} x2={centerX} y2={443} class="arrow" />
				<polygon points="{centerX},{447} {centerX - 4},{439} {centerX + 4},{439}" class="arrow-head" />

				<!-- XOR circle -->
				<circle
					cx={centerX}
					cy={461}
					r={xorR}
					class="xor-circle"
				/>
				<text x={centerX} y={466} class="xor-text">⊕</text>

				<!-- Key box and arrow -->
				<rect
					x={centerX + keyOffset - 22}
					y={449}
					width={52}
					height={24}
					rx="4"
					class="key-box"
				/>
				<text x={centerX + keyOffset + 4} y={465} class="key-text">K₁₀</text>

				<!-- Arrow from key to XOR -->
				<line x1={centerX + keyOffset - 22} y1={461} x2={centerX + xorR + 4} y2={461} class="arrow" />
				<polygon points="{centerX + xorR + 2},{461} {centerX + xorR + 8},{457} {centerX + xorR + 8},{465}" class="arrow-head" />

				<!-- No MixColumns label -->
				<text x={centerX - boxW / 2 - 15} y={410} class="no-mix-label">No</text>
				<text x={centerX - boxW / 2 - 15} y={423} class="no-mix-label">MixColumns</text>
			</g>
		{/if}

		<!-- Ciphertext -->
		{#if display.showCiphertext}
			<g class="fade-in">
				<!-- Arrow to ciphertext -->
				<line x1={centerX} y1={490} x2={centerX} y2={505} class="arrow" />
				<polygon points="{centerX},{509} {centerX - 4},{501} {centerX + 4},{501}" class="arrow-head" />

				<rect
					x={centerX - boxW / 2}
					y={512}
					width={boxW}
					height={boxH}
					rx="6"
					class="box ciphertext"
					class:active={display.highlight === 'ciphertext'}
				/>
				<text x={centerX} y={532} class="box-text">Ciphertext</text>
			</g>
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
		max-width: 380px;
		height: auto;
	}

	.fade-in {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Main boxes */
	.box {
		fill: var(--color-bg-card);
		stroke: var(--color-accent);
		stroke-width: 2;
		transition: all 0.3s ease;
	}

	.box.active {
		stroke-width: 3;
		filter: drop-shadow(0 0 8px var(--color-accent));
	}

	.box.ciphertext {
		stroke: var(--color-math);
	}

	.box.ciphertext.active {
		filter: drop-shadow(0 0 8px var(--color-math));
	}

	.box-text {
		fill: var(--color-fg);
		font-size: 14px;
		font-weight: bold;
		text-anchor: middle;
	}

	/* XOR circle */
	.xor-circle {
		fill: var(--color-bg-card);
		stroke: var(--color-math);
		stroke-width: 2;
		transition: all 0.3s ease;
	}

	.xor-circle.active {
		stroke-width: 3;
		filter: drop-shadow(0 0 8px var(--color-math));
	}

	.xor-text {
		fill: var(--color-math);
		font-size: 16px;
		font-weight: bold;
		text-anchor: middle;
	}

	/* Key box */
	.key-box {
		fill: var(--color-bg-card);
		stroke: var(--color-math);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.key-box.active {
		stroke-width: 2;
		filter: drop-shadow(0 0 6px var(--color-math));
	}

	.key-text {
		fill: var(--color-math);
		font-size: 13px;
		font-weight: bold;
		text-anchor: middle;
	}

	/* Round containers */
	.round-box {
		fill: none;
		stroke: var(--color-border);
		stroke-width: 1.5;
		stroke-dasharray: 4 2;
		transition: all 0.3s ease;
	}

	.round-box.active {
		stroke: var(--color-accent);
	}

	.round-label {
		fill: var(--color-fg-muted);
		font-size: 11px;
		font-weight: bold;
		text-anchor: middle;
	}

	/* Operation boxes */
	.op-box {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.op-box.active {
		stroke: var(--color-accent);
		stroke-width: 2;
		filter: drop-shadow(0 0 6px var(--color-accent));
	}

	.op-text {
		fill: var(--color-fg);
		font-size: 12px;
		text-anchor: middle;
	}

	/* Arrows */
	.arrow {
		stroke: var(--color-fg-muted);
		stroke-width: 1.5;
	}

	.arrow-head {
		fill: var(--color-fg-muted);
	}

	/* No MixColumns label */
	.no-mix-label {
		fill: var(--color-error);
		font-size: 9px;
		font-style: italic;
		text-anchor: end;
	}

	/* Label */
	.label {
		font-size: 1.1rem;
		color: var(--color-fg);
		text-align: center;
		font-weight: 500;
	}
</style>
