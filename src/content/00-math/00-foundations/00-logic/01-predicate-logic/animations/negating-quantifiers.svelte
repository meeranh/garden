<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	// Steps:
	// 0: Show original ∀x P(x) - "Everyone passed"
	// 1: Apply NOT - show ¬(∀x P(x))
	// 2: Flip quantifier ∀ → ∃, move NOT inside - ∃x ¬P(x)
	// 3: Show the meaning - "Someone didn't pass"
	// 4: Show original ∃x P(x) - "Someone passed"
	// 5: Apply NOT - show ¬(∃x P(x))
	// 6: Flip quantifier ∃ → ∀, move NOT inside - ∀x ¬P(x)
	// 7: Show the meaning - "Nobody passed" / "Everyone didn't pass"
	const totalSteps = 8;
	const maxStep = totalSteps - 1;

	const people = ['Alice', 'Bob', 'Carol'];

	let display = $derived.by(() => {
		if (currentStep <= 3) {
			// First example: negating ∀
			return {
				example: 1,
				phase: currentStep,
				title: currentStep === 0 ? 'Start with a universal claim' :
				       currentStep === 1 ? 'Apply NOT to the whole thing' :
				       currentStep === 2 ? 'Flip the quantifier, move NOT inside' :
				       'The meaning',
				formula: currentStep === 0 ? '∀x P(x)' :
				         currentStep === 1 ? '¬(∀x P(x))' :
				         '∃x ¬P(x)',
				english: currentStep === 0 ? '"Everyone passed"' :
				         currentStep === 1 ? '"NOT everyone passed"' :
				         currentStep === 2 ? '"Someone didn\'t pass"' :
				         '"Someone didn\'t pass"',
				// For visualization
				showFlip: currentStep === 2,
				showResult: currentStep === 3,
				allPass: currentStep === 0,
				someFail: currentStep >= 2
			};
		} else {
			// Second example: negating ∃
			const phase = currentStep - 4;
			return {
				example: 2,
				phase: phase,
				title: phase === 0 ? 'Start with an existential claim' :
				       phase === 1 ? 'Apply NOT to the whole thing' :
				       phase === 2 ? 'Flip the quantifier, move NOT inside' :
				       'The meaning',
				formula: phase === 0 ? '∃x P(x)' :
				         phase === 1 ? '¬(∃x P(x))' :
				         '∀x ¬P(x)',
				english: phase === 0 ? '"Someone passed"' :
				         phase === 1 ? '"NOT someone passed" (nobody)' :
				         phase === 2 ? '"Everyone didn\'t pass"' :
				         '"Nobody passed"',
				showFlip: phase === 2,
				showResult: phase === 3,
				somePass: phase === 0,
				allFail: phase >= 2
			};
		}
	});

	// Controller methods
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
		}, 2000);
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
	<!-- Header -->
	<div class="header">
		<span class="example-label">Example {display.example}/2</span>
		<span class="step-title">{display.title}</span>
	</div>

	<!-- Formula display -->
	<div class="formula-box">
		<div class="formula" class:highlight={display.showFlip}>
			{display.formula}
		</div>
		<div class="english">{display.english}</div>
	</div>

	<!-- Transformation explanation -->
	{#if display.showFlip}
		<div class="transform-box">
			<div class="transform-step">
				<span class="label">1.</span>
				<span class="action">Flip the quantifier</span>
				<span class="change">
					{#if display.example === 1}
						∀ → ∃
					{:else}
						∃ → ∀
					{/if}
				</span>
			</div>
			<div class="transform-step">
				<span class="label">2.</span>
				<span class="action">Move NOT to predicate</span>
				<span class="change">P(x) → ¬P(x)</span>
			</div>
		</div>
	{/if}

	<!-- Visual representation -->
	<div class="visual">
		{#if display.example === 1}
			<!-- Negating universal -->
			<div class="people-row">
				{#each people as person, i}
					<div class="person-card">
						<div class="person-name">{person}</div>
						<div class="status" class:pass={display.allPass} class:fail={display.someFail && i === 1}>
							{#if display.allPass}
								passed
							{:else if display.someFail}
								{i === 1 ? 'failed' : 'passed'}
							{:else}
								?
							{/if}
						</div>
					</div>
				{/each}
			</div>
			{#if display.showResult}
				<div class="insight">
					Bob didn't pass — that's enough to break "everyone passed"
				</div>
			{/if}
		{:else}
			<!-- Negating existential -->
			<div class="people-row">
				{#each people as person}
					<div class="person-card">
						<div class="person-name">{person}</div>
						<div class="status" class:pass={display.somePass} class:fail={display.allFail}>
							{#if display.somePass}
								passed
							{:else if display.allFail}
								failed
							{:else}
								?
							{/if}
						</div>
					</div>
				{/each}
			</div>
			{#if display.showResult}
				<div class="insight">
					Everyone failed — nobody passed at all
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.example-label {
		font-size: 0.8rem;
		color: var(--color-fg-muted);
		background: var(--color-bg-card);
		padding: 0.25rem 0.5rem;
	}

	.step-title {
		font-size: 0.9rem;
		color: var(--color-fg);
		font-weight: 500;
	}

	.formula-box {
		background: var(--color-bg-card);
		padding: 1rem;
		text-align: center;
	}

	.formula {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--color-math);
		transition: all 0.3s ease;
	}

	.formula.highlight {
		color: var(--color-accent);
		transform: scale(1.05);
	}

	.english {
		font-size: 0.95rem;
		color: var(--color-fg-muted);
		margin-top: 0.5rem;
	}

	.transform-box {
		background: rgba(142, 192, 124, 0.1);
		border: 1px solid var(--color-accent);
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		animation: fadeIn 0.3s ease;
	}

	.transform-step {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.transform-step .label {
		color: var(--color-fg-muted);
		font-weight: bold;
	}

	.transform-step .action {
		color: var(--color-fg);
	}

	.transform-step .change {
		color: var(--color-accent);
		font-weight: bold;
		margin-left: auto;
	}

	.visual {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.people-row {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.person-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		min-width: 70px;
	}

	.person-name {
		font-size: 0.85rem;
		color: var(--color-fg);
		font-weight: 500;
	}

	.status {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		border-radius: 2px;
	}

	.status.pass {
		background: var(--color-accent);
		color: var(--color-bg);
	}

	.status.fail {
		background: var(--color-error);
		color: var(--color-bg);
	}

	.insight {
		font-size: 0.85rem;
		color: var(--color-fg-muted);
		font-style: italic;
		text-align: center;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(5px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
