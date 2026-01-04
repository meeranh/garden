<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 6;
	const maxStep = totalSteps - 1;

	// Step 0: Show the number of keys
	// Step 1: 1977 - centuries
	// Step 2: 1998 - 56 hours
	// Step 3: 1999 - 22 hours
	// Step 4: Today - minutes
	// Step 5: Insight

	const timelineData = [
		{ year: '1977', time: 'Centuries', barWidth: 280, detail: 'Computers too slow' },
		{ year: '1998', time: '56 hours', barWidth: 120, detail: 'EFF Deep Crack ($250k)' },
		{ year: '1999', time: '22 hours', barWidth: 80, detail: 'Distributed computing' },
		{ year: 'Today', time: 'Minutes', barWidth: 15, detail: 'Modern hardware' }
	];

	let display = $derived.by(() => {
		return {
			showNumber: currentStep >= 0,
			showTimeline: currentStep >= 1,
			visibleYears: currentStep >= 1 ? Math.min(currentStep, 4) : 0,
			showInsight: currentStep >= 5,

			label: currentStep === 0 ? '2⁵⁶ = 72,057,594,037,927,936 possible keys' :
			       currentStep === 1 ? '1977: Would take centuries to try them all' :
			       currentStep === 2 ? '1998: Cracked in 56 hours' :
			       currentStep === 3 ? '1999: Cracked in 22 hours' :
			       currentStep === 4 ? 'Today: Could be cracked in minutes' :
			       'Computing power grows exponentially'
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
	<svg viewBox="0 0 380 270" class="scene">
		<!-- Big number display -->
		{#if display.showNumber}
			<g transform="translate(190, 30)">
				<text x="0" y="0" class="key-count">2⁵⁶ possible keys</text>
				<text x="0" y="22" class="key-number">72 quadrillion</text>
			</g>
		{/if}

		<!-- Timeline bars -->
		{#if display.showTimeline}
			<g transform="translate(30, 70)">
				{#each timelineData as item, i}
					{#if i < display.visibleYears}
						<g transform="translate(0, {i * 50})" class="timeline-row">
							<!-- Year label -->
							<text x="0" y="14" class="year-label">{item.year}</text>

							<!-- Bar -->
							<rect
								x="60"
								y="0"
								width={item.barWidth}
								height="22"
								rx="4"
								class="time-bar"
								class:old={i === 0}
								class:cracked={i > 0 && i < 3}
								class:today={i === 3}
							/>

							<!-- Time label -->
							<text
								x={65 + item.barWidth + 8}
								y="15"
								class="time-label"
								class:old={i === 0}
								class:cracked={i > 0 && i < 3}
								class:today={i === 3}
							>
								{item.time}
							</text>

							<!-- Detail (smaller text) -->
							<text x="60" y="34" class="detail-label">{item.detail}</text>
						</g>
					{/if}
				{/each}
			</g>
		{/if}
	</svg>

	<div class="label" class:insight={currentStep === 5}>{display.label}</div>

	{#if display.showInsight}
		<div class="insight-box">What takes years today takes seconds tomorrow.</div>
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

	.key-count {
		fill: var(--color-fg);
		font-size: 14px;
		text-anchor: middle;
		font-weight: bold;
	}

	.key-number {
		fill: var(--color-math);
		font-size: 18px;
		font-weight: bold;
		text-anchor: middle;
		font-family: monospace;
	}

	.year-label {
		fill: var(--color-fg);
		font-size: 13px;
		font-weight: bold;
		font-family: monospace;
	}

	.time-bar {
		transition: all 0.5s ease;
	}

	.time-bar.old {
		fill: var(--color-accent);
		opacity: 0.8;
	}

	.time-bar.cracked {
		fill: var(--color-math);
		opacity: 0.8;
	}

	.time-bar.today {
		fill: var(--color-error);
		opacity: 0.9;
	}

	.time-label {
		font-size: 12px;
		font-weight: bold;
	}

	.time-label.old {
		fill: var(--color-accent);
	}

	.time-label.cracked {
		fill: var(--color-math);
	}

	.time-label.today {
		fill: var(--color-error);
	}

	.detail-label {
		fill: var(--color-fg-muted);
		font-size: 10px;
		font-style: italic;
	}

	.timeline-row {
		animation: fadeIn 0.4s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
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
