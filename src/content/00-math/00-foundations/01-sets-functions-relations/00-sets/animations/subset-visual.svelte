<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 6;
	const maxStep = totalSteps - 1;

	// Steps:
	// 0: Show B = {1, 2, 3, 4}
	// 1: Show A = {1, 2} inside B
	// 2: Check: is 1 in B? Yes
	// 3: Check: is 2 in B? Yes
	// 4: All elements of A are in B
	// 5: Therefore A ⊆ B

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Set B = {1, 2, 3, 4}',
				showA: false,
				checking: null,
				checkResult: null,
				conclusion: null
			};
		} else if (currentStep === 1) {
			return {
				title: 'Set A = {1, 2}',
				showA: true,
				checking: null,
				checkResult: null,
				conclusion: null
			};
		} else if (currentStep === 2) {
			return {
				title: 'Is 1 in B?',
				showA: true,
				checking: 1,
				checkResult: true,
				conclusion: null
			};
		} else if (currentStep === 3) {
			return {
				title: 'Is 2 in B?',
				showA: true,
				checking: 2,
				checkResult: true,
				conclusion: null
			};
		} else if (currentStep === 4) {
			return {
				title: 'All elements of A are in B',
				showA: true,
				checking: null,
				checkResult: null,
				conclusion: 'checking'
			};
		} else {
			return {
				title: 'A ⊆ B',
				showA: true,
				checking: null,
				checkResult: null,
				conclusion: 'subset'
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
		}, 1500);
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
	<div class="title">{display.title}</div>

	<div class="sets-container">
		<!-- Set B (outer) -->
		<div class="set-b">
			<div class="set-label">B</div>

			<!-- Set A (inner) -->
			{#if display.showA}
				<div class="set-a">
					<div class="set-label-a">A</div>
					<div class="elements-a">
						<span
							class="element"
							class:checking={display.checking === 1}
							class:checked={display.checking === 2 || display.conclusion}
						>1</span>
						<span
							class="element"
							class:checking={display.checking === 2}
							class:checked={display.conclusion}
						>2</span>
					</div>
				</div>
			{/if}

			<!-- Elements only in B -->
			<div class="elements-b-only">
				<span class="element b-only">3</span>
				<span class="element b-only">4</span>
			</div>
		</div>
	</div>

	{#if display.checking && display.checkResult}
		<div class="check-result">
			{display.checking} ∈ B ✓
		</div>
	{/if}

	{#if display.conclusion === 'subset'}
		<div class="conclusion">
			Every element of A is in B, so <strong>A ⊆ B</strong>
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem;
	}

	.title {
		font-size: 0.95rem;
		color: var(--color-fg);
		font-weight: 500;
	}

	.sets-container {
		display: flex;
		justify-content: center;
		padding: 1rem;
	}

	.set-b {
		position: relative;
		width: 200px;
		height: 140px;
		border: 2px solid var(--color-fg-muted);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.set-label {
		position: absolute;
		top: -10px;
		right: 20px;
		background: var(--color-bg);
		padding: 0 0.5rem;
		color: var(--color-fg-muted);
		font-weight: bold;
	}

	.set-a {
		position: absolute;
		left: 20px;
		width: 90px;
		height: 80px;
		border: 2px solid var(--color-accent);
		border-radius: 50%;
		background: rgba(142, 192, 124, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.set-label-a {
		position: absolute;
		top: -10px;
		left: 15px;
		background: var(--color-bg);
		padding: 0 0.25rem;
		color: var(--color-accent);
		font-weight: bold;
		font-size: 0.85rem;
	}

	.elements-a {
		display: flex;
		gap: 0.5rem;
	}

	.elements-b-only {
		position: absolute;
		right: 25px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.element {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.85rem;
		color: var(--color-fg);
		transition: all 0.3s ease;
	}

	.element.checking {
		border-color: var(--color-math);
		color: var(--color-math);
		background: rgba(250, 189, 47, 0.15);
		transform: scale(1.1);
	}

	.element.checked {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.element.b-only {
		color: var(--color-fg-muted);
	}

	.check-result {
		padding: 0.5rem 1rem;
		background: rgba(142, 192, 124, 0.1);
		border: 1px solid var(--color-accent);
		color: var(--color-accent);
		font-size: 0.9rem;
	}

	.conclusion {
		padding: 0.5rem 1rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-fg-muted);
	}

	.conclusion strong {
		color: var(--color-accent);
	}
</style>
