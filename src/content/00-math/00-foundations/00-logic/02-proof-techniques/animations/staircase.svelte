<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 9;
	const maxStep = totalSteps - 1;

	// The staircase data
	const stairs = [
		{ step: 1, ways: 1, paths: ['1'] },
		{ step: 2, ways: 2, paths: ['1+1', '2'] },
		{ step: 3, ways: 3, paths: ['1+1+1', '1+2', '2+1'] },
		{ step: 4, ways: 5, paths: ['1+1+1+1', '1+1+2', '1+2+1', '2+1+1', '2+2'] },
		{ step: 5, ways: 8, paths: [] }
	];

	// Steps:
	// 0: Show staircase, "How many ways to climb?"
	// 1: Step 1 = 1 way
	// 2: Step 2 = 2 ways
	// 3: Step 3 = 3 ways, show paths
	// 4: KEY INSIGHT - to reach step 4...
	// 5: ...you came from step 3 (1-step) or step 2 (2-step)
	// 6: So ways(4) = ways(3) + ways(2) = 3 + 2 = 5
	// 7: Step 5 = ways(4) + ways(3) = 5 + 3 = 8
	// 8: Why strong induction: we needed BOTH previous values

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Climbing Stairs',
				subtitle: 'You can take 1 step or 2 steps at a time',
				highlight: null,
				showArrows: false,
				formula: null,
				filledSteps: [],
				insight: null
			};
		} else if (currentStep === 1) {
			return {
				title: 'Step 1: Only 1 way',
				subtitle: 'Just take a single step',
				highlight: 1,
				showArrows: false,
				formula: null,
				filledSteps: [1],
				insight: null
			};
		} else if (currentStep === 2) {
			return {
				title: 'Step 2: 2 ways',
				subtitle: '(1+1) or (2)',
				highlight: 2,
				showArrows: false,
				formula: null,
				filledSteps: [1, 2],
				insight: null
			};
		} else if (currentStep === 3) {
			return {
				title: 'Step 3: 3 ways',
				subtitle: '(1+1+1), (1+2), (2+1)',
				highlight: 3,
				showArrows: false,
				formula: null,
				filledSteps: [1, 2, 3],
				insight: null
			};
		} else if (currentStep === 4) {
			return {
				title: 'Step 4: How many ways?',
				subtitle: 'Think about your LAST move...',
				highlight: 4,
				showArrows: false,
				formula: null,
				filledSteps: [1, 2, 3],
				insight: null
			};
		} else if (currentStep === 5) {
			return {
				title: 'Your last move was either:',
				subtitle: '',
				highlight: 4,
				showArrows: true,
				formula: null,
				filledSteps: [1, 2, 3],
				insight: null
			};
		} else if (currentStep === 6) {
			return {
				title: 'So we add them!',
				subtitle: '',
				highlight: 4,
				showArrows: true,
				formula: 'ways(4) = ways(3) + ways(2) = 3 + 2 = 5',
				filledSteps: [1, 2, 3, 4],
				insight: null
			};
		} else if (currentStep === 7) {
			return {
				title: 'Step 5: Same pattern',
				subtitle: '',
				highlight: 5,
				showArrows: false,
				formula: 'ways(5) = ways(4) + ways(3) = 5 + 3 = 8',
				filledSteps: [1, 2, 3, 4, 5],
				insight: null
			};
		} else {
			return {
				title: 'Why strong induction?',
				subtitle: '',
				highlight: null,
				showArrows: false,
				formula: null,
				filledSteps: [1, 2, 3, 4, 5],
				insight: 'To find ways(n), we need BOTH ways(n-1) AND ways(n-2). Regular induction only gives us n-1.'
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
		}, 2500);
	}

	onMount(() => {
		if (register) {
			register({ play, pause, next, prev, skip, replay, getState });
		}
	});

	onDestroy(() => {
		pause();
	});
</script>

<div class="container">
	<div class="header">
		<div class="title">{display.title}</div>
		{#if display.subtitle}
			<div class="subtitle">{display.subtitle}</div>
		{/if}
	</div>

	<div class="staircase-area">
		<div class="staircase">
			{#each stairs as stair}
				<div class="stair-row">
					<div
						class="stair"
						class:highlight={display.highlight === stair.step}
						class:filled={display.filledSteps.includes(stair.step)}
					>
						<span class="step-num">{stair.step}</span>
						{#if display.filledSteps.includes(stair.step)}
							<span class="ways-count">{stair.ways} ways</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if display.showArrows}
			<div class="arrows-explanation">
				<div class="arrow-item">
					<span class="arrow-label">1 step from step 3</span>
					<span class="arrow-value">→ 3 ways</span>
				</div>
				<div class="arrow-item">
					<span class="arrow-label">2 steps from step 2</span>
					<span class="arrow-value">→ 2 ways</span>
				</div>
			</div>
		{/if}
	</div>

	{#if display.formula}
		<div class="formula">
			{display.formula}
		</div>
	{/if}

	{#if display.insight}
		<div class="insight">
			{display.insight}
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.5rem;
	}

	.header {
		text-align: center;
	}

	.title {
		font-size: 0.95rem;
		color: var(--color-fg);
		font-weight: 500;
	}

	.subtitle {
		font-size: 0.85rem;
		color: var(--color-fg-muted);
		margin-top: 0.25rem;
	}

	.staircase-area {
		display: flex;
		gap: 2rem;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
	}

	.staircase {
		display: flex;
		flex-direction: column-reverse;
		gap: 2px;
	}

	.stair-row {
		display: flex;
		justify-content: flex-start;
	}

	.stair {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		min-width: 120px;
		transition: all 0.3s ease;
	}

	.stair.highlight {
		border-color: var(--color-math);
		background: rgba(250, 189, 47, 0.1);
	}

	.stair.filled {
		border-color: var(--color-accent);
	}

	.step-num {
		font-weight: bold;
		color: var(--color-fg);
		min-width: 20px;
	}

	.ways-count {
		font-size: 0.8rem;
		color: var(--color-accent);
	}

	.arrows-explanation {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
	}

	.arrow-item {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.85rem;
	}

	.arrow-label {
		color: var(--color-fg-muted);
	}

	.arrow-value {
		color: var(--color-accent);
		font-weight: 500;
	}

	.formula {
		text-align: center;
		padding: 0.75rem;
		background: var(--color-bg-card);
		font-size: 0.9rem;
		color: var(--color-math);
		font-weight: 500;
	}

	.insight {
		text-align: center;
		padding: 0.75rem;
		background: rgba(142, 192, 124, 0.1);
		border: 1px solid var(--color-accent);
		font-size: 0.85rem;
		color: var(--color-accent);
	}
</style>
