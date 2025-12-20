<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 8;
	const maxStep = totalSteps - 1;

	// Steps:
	// 0: Show 5-square bar, "5 squares - how many breaks?"
	// 1: Show break at position 2 (2 and 3)
	// 2: Show calculation for 2+3 split
	// 3: Reset, show bar again
	// 4: Show break at position 1 (1 and 4)
	// 5: Show calculation for 1+4 split
	// 6: Show "both give 4 breaks"
	// 7: Conclusion - need formula for ALL smaller sizes

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				phase: 'intro',
				title: 'A 5-square chocolate bar',
				subtitle: 'How many breaks to separate all squares?',
				bar: [1, 2, 3, 4, 5],
				breakAt: null,
				leftPiece: null,
				rightPiece: null,
				calculation: null,
				conclusion: null
			};
		} else if (currentStep === 1) {
			return {
				phase: 'break1',
				title: 'First break: split into 2 and 3',
				subtitle: '',
				bar: null,
				breakAt: 2,
				leftPiece: [1, 2],
				rightPiece: [3, 4, 5],
				calculation: null,
				conclusion: null
			};
		} else if (currentStep === 2) {
			return {
				phase: 'calc1',
				title: 'Count the breaks',
				subtitle: '',
				bar: null,
				breakAt: 2,
				leftPiece: [1, 2],
				rightPiece: [3, 4, 5],
				calculation: {
					left: { size: 2, breaks: 1 },
					right: { size: 3, breaks: 2 },
					firstBreak: 1,
					total: 4
				},
				conclusion: null
			};
		} else if (currentStep === 3) {
			return {
				phase: 'reset',
				title: 'What if we break somewhere else?',
				subtitle: '',
				bar: [1, 2, 3, 4, 5],
				breakAt: null,
				leftPiece: null,
				rightPiece: null,
				calculation: null,
				conclusion: null
			};
		} else if (currentStep === 4) {
			return {
				phase: 'break2',
				title: 'Break into 1 and 4',
				subtitle: '',
				bar: null,
				breakAt: 1,
				leftPiece: [1],
				rightPiece: [2, 3, 4, 5],
				calculation: null,
				conclusion: null
			};
		} else if (currentStep === 5) {
			return {
				phase: 'calc2',
				title: 'Count the breaks',
				subtitle: '',
				bar: null,
				breakAt: 1,
				leftPiece: [1],
				rightPiece: [2, 3, 4, 5],
				calculation: {
					left: { size: 1, breaks: 0 },
					right: { size: 4, breaks: 3 },
					firstBreak: 1,
					total: 4
				},
				conclusion: null
			};
		} else if (currentStep === 6) {
			return {
				phase: 'result',
				title: 'Both ways give 4 breaks!',
				subtitle: 'Formula works: 5 - 1 = 4',
				bar: null,
				breakAt: null,
				leftPiece: null,
				rightPiece: null,
				calculation: null,
				conclusion: null
			};
		} else {
			return {
				phase: 'why-strong',
				title: 'Why strong induction?',
				subtitle: '',
				bar: null,
				breakAt: null,
				leftPiece: null,
				rightPiece: null,
				calculation: null,
				conclusion: 'We needed the formula for sizes 1, 2, 3, and 4. Not just size 4.'
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

	<div class="bar-area">
		{#if display.bar}
			<div class="chocolate-bar">
				{#each display.bar as square}
					<div class="square">{square}</div>
				{/each}
			</div>
		{/if}

		{#if display.leftPiece && display.rightPiece}
			<div class="split-bars">
				<div class="chocolate-bar piece-left">
					{#each display.leftPiece as square}
						<div class="square">{square}</div>
					{/each}
				</div>
				<div class="break-indicator">✂</div>
				<div class="chocolate-bar piece-right">
					{#each display.rightPiece as square}
						<div class="square">{square}</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	{#if display.calculation}
		<div class="calculation">
			<div class="calc-row">
				<span class="label">Left piece ({display.calculation.left.size} squares):</span>
				<span class="value">{display.calculation.left.breaks} breaks</span>
			</div>
			<div class="calc-row">
				<span class="label">Right piece ({display.calculation.right.size} squares):</span>
				<span class="value">{display.calculation.right.breaks} breaks</span>
			</div>
			<div class="calc-row">
				<span class="label">First break:</span>
				<span class="value">1 break</span>
			</div>
			<div class="calc-row total">
				<span class="label">Total:</span>
				<span class="value">{display.calculation.left.breaks} + {display.calculation.right.breaks} + 1 = {display.calculation.total} breaks</span>
			</div>
		</div>
	{/if}

	{#if display.conclusion}
		<div class="conclusion">
			{display.conclusion}
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

	.bar-area {
		display: flex;
		justify-content: center;
		min-height: 60px;
		align-items: center;
	}

	.chocolate-bar {
		display: flex;
		border: 2px solid var(--color-accent);
		border-radius: 4px;
		overflow: hidden;
	}

	.square {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
		color: var(--color-fg);
		font-size: 0.8rem;
		border-right: 1px solid rgba(0,0,0,0.3);
	}

	.square:last-child {
		border-right: none;
	}

	.split-bars {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.break-indicator {
		font-size: 1.2rem;
		color: var(--color-error);
	}

	.calculation {
		background: var(--color-bg-card);
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.calc-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
	}

	.calc-row .label {
		color: var(--color-fg-muted);
	}

	.calc-row .value {
		color: var(--color-fg);
	}

	.calc-row.total {
		border-top: 1px solid var(--color-border);
		padding-top: 0.4rem;
		margin-top: 0.2rem;
	}

	.calc-row.total .label,
	.calc-row.total .value {
		color: var(--color-accent);
		font-weight: 500;
	}

	.conclusion {
		text-align: center;
		padding: 0.75rem;
		background: rgba(142, 192, 124, 0.1);
		border: 1px solid var(--color-accent);
		font-size: 0.9rem;
		color: var(--color-accent);
	}
</style>
