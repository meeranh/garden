<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	// Step 0: Show antenna transmitting total power
	// Step 1: Small sphere - power concentrated
	// Step 2: Medium sphere - power more spread
	// Step 3: Large sphere - power very spread
	// Step 4: Show the math/insight

	let display = $derived.by(() => {
		return {
			showAntenna: currentStep >= 0,
			sphereRadius:
				currentStep === 0 ? 0 :
				currentStep === 1 ? 40 :
				currentStep === 2 ? 80 :
				currentStep >= 3 ? 130 : 0,
			showSphere: currentStep >= 1,
			showPowerLabel: currentStep >= 1,
			showDensityBars: currentStep >= 1,
			showInsight: currentStep >= 4,
			distance:
				currentStep === 1 ? '1m' :
				currentStep === 2 ? '2m' :
				currentStep >= 3 ? '3m' : '',
			area:
				currentStep === 1 ? '1x' :
				currentStep === 2 ? '4x' :
				currentStep >= 3 ? '9x' : '',
			density:
				currentStep === 1 ? '100%' :
				currentStep === 2 ? '25%' :
				currentStep >= 3 ? '11%' : '',
			label:
				currentStep === 0 ? 'Antenna transmits 100 watts of power' :
				currentStep === 1 ? 'At 1m: ALL 100W spread over small sphere' :
				currentStep === 2 ? 'At 2m: SAME 100W spread over 4x larger sphere' :
				currentStep === 3 ? 'At 3m: SAME 100W spread over 9x larger sphere' :
				'Power density drops with the SQUARE of distance'
		};
	});

	// Density bar height (visual representation)
	let densityHeight = $derived(
		currentStep === 1 ? 80 :
		currentStep === 2 ? 20 :
		currentStep >= 3 ? 9 : 0
	);

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
		}, 2500);
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

	onMount(() => {
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => pause());
</script>

<div class="container">
	<svg viewBox="0 -5 500 305" class="diagram">
		<!-- Antenna at center-left -->
		{#if display.showAntenna}
			<g class="antenna" transform="translate(140, 130)">
				<circle cx="0" cy="0" r="10" class="antenna-point" />
				<line x1="0" y1="10" x2="0" y2="35" class="antenna-stem" />

				<!-- Power label -->
				<g transform="translate(0, 55)">
					<text x="0" y="0" class="power-label">100W</text>
					<text x="0" y="14" class="power-sublabel">total power</text>
				</g>
			</g>
		{/if}

		<!-- Expanding sphere (shown as circle in 2D) -->
		{#if display.showSphere}
			<circle
				cx="140"
				cy="130"
				r={display.sphereRadius}
				class="sphere"
				style="transition: r 0.6s ease-out"
			/>

			<!-- Distance label -->
			<text
				x={140 + display.sphereRadius + 8}
				y="130"
				class="distance-label"
				style="transition: x 0.6s ease-out"
			>
				{display.distance}
			</text>

			<!-- Small patch on sphere surface to show density -->
			<g transform="translate({140 + display.sphereRadius - 5}, 100)">
				<rect
					x="0" y="0"
					width="10" height="20"
					class="patch"
					style="transition: transform 0.6s ease-out"
				/>
			</g>
		{/if}

		<!-- Right side: density visualization -->
		{#if display.showDensityBars}
			<g class="density-panel" transform="translate(340, 40)">
				<text x="60" y="0" class="panel-title">At this distance:</text>

				<!-- Surface area -->
				<g transform="translate(0, 25)">
					<text x="0" y="12" class="stat-label">Surface area:</text>
					<text x="120" y="12" class="stat-value">{display.area}</text>
				</g>

				<!-- Power density bar -->
				<g transform="translate(0, 55)">
					<text x="0" y="12" class="stat-label">Power density:</text>
					<text x="120" y="12" class="stat-value density">{display.density}</text>
				</g>

				<!-- Visual bar -->
				<g transform="translate(0, 80)">
					<rect x="0" y="0" width="120" height="90" class="bar-bg" rx="4" />
					<rect
						x="0"
						y={90 - densityHeight}
						width="120"
						height={densityHeight}
						class="bar-fill"
						rx="4"
						style="transition: all 0.6s ease-out"
					/>
					<text x="60" y={90 - densityHeight / 2 + 5} class="bar-label">
						{#if densityHeight > 30}
							{display.density}
						{/if}
					</text>
				</g>
			</g>
		{/if}

		<!-- Insight text at bottom -->
		{#if display.showInsight}
			<g transform="translate(250, 285)">
				<text x="0" y="0" class="insight-text">
					Area grows with r² → Density shrinks with 1/r²
				</text>
			</g>
		{/if}
	</svg>

	<div class="label-text">{display.label}</div>

	{#if display.showInsight}
		<div class="formula-note">
			<span class="highlight">2× distance</span> = <span class="highlight">4× area</span> = <span class="result">¼ power density</span>
		</div>
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

	.diagram {
		width: 100%;
		max-width: 520px;
		height: auto;
	}

	.antenna-point {
		fill: var(--color-math);
	}

	.antenna-stem {
		stroke: var(--color-math);
		stroke-width: 3;
	}

	.power-label {
		font-size: 1rem;
		font-weight: bold;
		fill: var(--color-math);
		text-anchor: middle;
	}

	.power-sublabel {
		font-size: 0.6rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.sphere {
		fill: var(--color-accent);
		fill-opacity: 0.1;
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.distance-label {
		font-size: 0.75rem;
		font-weight: bold;
		fill: var(--color-accent);
		dominant-baseline: middle;
	}

	.patch {
		fill: var(--color-error);
		fill-opacity: 0.5;
		stroke: var(--color-error);
		stroke-width: 1;
	}

	.panel-title {
		font-size: 0.7rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
	}

	.stat-label {
		font-size: 0.65rem;
		fill: var(--color-fg-muted);
	}

	.stat-value {
		font-size: 0.75rem;
		font-weight: bold;
		fill: var(--color-fg);
	}

	.stat-value.density {
		fill: var(--color-error);
	}

	.bar-bg {
		fill: var(--color-bg-card);
		stroke: var(--color-border);
		stroke-width: 1;
	}

	.bar-fill {
		fill: var(--color-error);
		fill-opacity: 0.7;
	}

	.bar-label {
		font-size: 0.7rem;
		font-weight: bold;
		fill: var(--color-bg);
		text-anchor: middle;
	}

	.insight-text {
		font-size: 0.7rem;
		fill: var(--color-fg-muted);
		text-anchor: middle;
		font-style: italic;
	}

	.label-text {
		font-size: 1rem;
		color: var(--color-fg);
		font-style: italic;
		text-align: center;
	}

	.formula-note {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		font-size: 0.9rem;
		padding: 0.6rem 1rem;
		background: var(--color-bg-card);
		border-radius: 0.35rem;
	}

	.highlight {
		color: var(--color-accent);
		font-weight: bold;
	}

	.result {
		color: var(--color-error);
		font-weight: bold;
	}
</style>
