<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	const domain = ['1', '2', '3'];
	const codomain = ['a', 'b', 'c', 'd'];
	const arrows = [
		{ from: '1', to: 'a' },
		{ from: '2', to: 'a' },
		{ from: '3', to: 'b' }
	];
	const range = ['a', 'b']; // Elements that actually get hit

	// Steps:
	// 0: Show both sets
	// 1: Highlight domain
	// 2: Highlight codomain
	// 3: Show arrows (the function)
	// 4: Highlight range, dim unused codomain elements

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'A function f: A → B',
				highlightDomain: false,
				highlightCodomain: false,
				showArrows: false,
				showRange: false
			};
		} else if (currentStep === 1) {
			return {
				title: 'Domain: all inputs',
				highlightDomain: true,
				highlightCodomain: false,
				showArrows: false,
				showRange: false
			};
		} else if (currentStep === 2) {
			return {
				title: 'Codomain: all possible outputs',
				highlightDomain: false,
				highlightCodomain: true,
				showArrows: false,
				showRange: false
			};
		} else if (currentStep === 3) {
			return {
				title: 'The function maps inputs to outputs',
				highlightDomain: false,
				highlightCodomain: false,
				showArrows: true,
				showRange: false
			};
		} else {
			return {
				title: 'Range: outputs actually used',
				highlightDomain: false,
				highlightCodomain: false,
				showArrows: true,
				showRange: true
			};
		}
	});

	function play() {
		if (isPlaying) return;
		isPlaying = true;
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

	onMount(() => {
		if (register) {
			register({ play, pause, next, prev, skip, replay, getState });
		}
	});

	onDestroy(() => {
		pause();
	});

	// SVG positions
	const leftX = 60;
	const rightX = 240;
	const domainStartY = 50;
	const codomainStartY = 45;
	const gapY = 32;

	function getLeftY(el: string): number {
		const idx = domain.indexOf(el);
		return domainStartY + idx * gapY;
	}

	function getRightY(el: string): number {
		const idx = codomain.indexOf(el);
		return codomainStartY + idx * gapY;
	}

	function isInRange(el: string): boolean {
		return range.includes(el);
	}
</script>

<div class="container">
	<div class="title">{display.title}</div>

	<div class="diagram-container">
		<svg viewBox="0 0 300 180" class="diagram">
			<!-- Domain box -->
			<rect
				x="20" y="25" width="80" height="135" rx="8"
				class="set-box"
				class:highlight={display.highlightDomain}
			/>
			<text x="60" y="17" class="set-label">A</text>
			{#if display.highlightDomain}
				<text x="60" y="175" class="subset-label domain-label">Domain</text>
			{/if}

			<!-- Codomain box -->
			<rect
				x="200" y="25" width="80" height="135" rx="8"
				class="set-box"
				class:highlight-codomain={display.highlightCodomain}
			/>
			<text x="240" y="17" class="set-label">B</text>
			{#if display.highlightCodomain}
				<text x="240" y="175" class="subset-label codomain-label">Codomain</text>
			{/if}

			<!-- Domain elements -->
			{#each domain as el}
				<circle
					cx={leftX}
					cy={getLeftY(el)}
					r="14"
					class="element-circle"
					class:highlight={display.highlightDomain}
				/>
				<text
					x={leftX}
					y={getLeftY(el) + 5}
					class="element-text"
				>{el}</text>
			{/each}

			<!-- Codomain elements -->
			{#each codomain as el}
				<circle
					cx={rightX}
					cy={getRightY(el)}
					r="14"
					class="element-circle"
					class:highlight-codomain={display.highlightCodomain}
					class:in-range={display.showRange && isInRange(el)}
					class:not-in-range={display.showRange && !isInRange(el)}
				/>
				<text
					x={rightX}
					y={getRightY(el) + 5}
					class="element-text"
					class:in-range={display.showRange && isInRange(el)}
					class:not-in-range={display.showRange && !isInRange(el)}
				>{el}</text>
			{/each}

			<!-- Arrows -->
			{#if display.showArrows}
				{#each arrows as arrow}
					<line
						x1={leftX + 14}
						y1={getLeftY(arrow.from)}
						x2={rightX - 14}
						y2={getRightY(arrow.to)}
						class="arrow"
						class:range-arrow={display.showRange}
					/>
					<polygon
						points="{rightX - 14},{getRightY(arrow.to)} {rightX - 22},{getRightY(arrow.to) - 4} {rightX - 22},{getRightY(arrow.to) + 4}"
						class="arrow-head"
						class:range-arrow={display.showRange}
					/>
				{/each}
			{/if}

			<!-- Range label -->
			{#if display.showRange}
				<text x="240" y="175" class="subset-label range-label">Range = {'{'}a, b{'}'}</text>
			{/if}
		</svg>
	</div>

	{#if display.showRange}
		<div class="message">
			c and d are in codomain but <strong>not</strong> in range
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.title {
		font-size: 0.95rem;
		color: var(--color-fg);
		font-weight: 500;
	}

	.diagram-container {
		width: 100%;
		max-width: 300px;
	}

	.diagram {
		width: 100%;
		height: auto;
	}

	.set-box {
		fill: transparent;
		stroke: var(--color-border);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.set-box.highlight {
		stroke: var(--color-accent);
		fill: rgba(142, 192, 124, 0.1);
	}

	.set-box.highlight-codomain {
		stroke: var(--color-math);
		fill: rgba(250, 189, 47, 0.1);
	}

	.set-label {
		fill: var(--color-math);
		font-size: 0.9rem;
		font-weight: bold;
		text-anchor: middle;
	}

	.subset-label {
		font-size: 0.7rem;
		text-anchor: middle;
		font-weight: 500;
	}

	.domain-label {
		fill: var(--color-accent);
	}

	.codomain-label {
		fill: var(--color-math);
	}

	.range-label {
		fill: var(--color-accent);
	}

	.element-circle {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.element-circle.highlight {
		stroke: var(--color-accent);
		fill: rgba(142, 192, 124, 0.2);
	}

	.element-circle.highlight-codomain {
		stroke: var(--color-math);
		fill: rgba(250, 189, 47, 0.2);
	}

	.element-circle.in-range {
		stroke: var(--color-accent);
		fill: rgba(142, 192, 124, 0.25);
	}

	.element-circle.not-in-range {
		stroke: var(--color-border);
		fill: var(--color-bg);
		opacity: 0.5;
	}

	.element-text {
		fill: var(--color-fg);
		font-size: 0.8rem;
		text-anchor: middle;
		transition: all 0.3s ease;
	}

	.element-text.in-range {
		fill: var(--color-accent);
		font-weight: bold;
	}

	.element-text.not-in-range {
		fill: var(--color-border);
	}

	.arrow {
		stroke: var(--color-fg-muted);
		stroke-width: 1.5;
		transition: all 0.3s ease;
	}

	.arrow.range-arrow {
		stroke: var(--color-accent);
	}

	.arrow-head {
		fill: var(--color-fg-muted);
		transition: all 0.3s ease;
	}

	.arrow-head.range-arrow {
		fill: var(--color-accent);
	}

	.message {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.8rem;
		color: var(--color-fg-muted);
	}

	.message strong {
		color: var(--color-error);
	}
</style>
