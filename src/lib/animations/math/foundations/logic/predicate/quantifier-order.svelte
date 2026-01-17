<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	// Animation state
	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	// Steps:
	// 0: Show the question
	// 1: Show ∀x ∃y - each person has their own drink
	// 2: Show ∃y ∀x - one drink for everyone
	// 3: Show the key difference
	const totalSteps = 4;
	const maxStep = totalSteps - 1;

	const people = ['Alice', 'Bob', 'Carol'];
	const drinks = ['coffee', 'tea', 'juice'];
	const sharedDrink = 'water';

	// Derived state for what to show
	let showForallExists = $derived(currentStep >= 1);
	let showExistsForall = $derived(currentStep >= 2);
	let showDifference = $derived(currentStep >= 3);
	let highlightLeft = $derived(currentStep === 1);
	let highlightRight = $derived(currentStep === 2);

	// Explanation text based on step
	let explanation = $derived.by(() => {
		switch (currentStep) {
			case 0:
				return {
					title: 'What\'s the difference?',
					subtitle: '∀x ∃y vs ∃y ∀x'
				};
			case 1:
				return {
					title: '∀x ∃y L(x, y)',
					subtitle: '"For every person, there exists a drink they like"'
				};
			case 2:
				return {
					title: '∃y ∀x L(x, y)',
					subtitle: '"There exists a drink that everyone likes"'
				};
			case 3:
				return {
					title: 'Order matters!',
					subtitle: 'Different structure, different meaning'
				};
			default:
				return { title: '', subtitle: '' };
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
		if (currentStep < maxStep) {
			currentStep++;
		}
	}

	function prev() {
		if (currentStep > 0) {
			currentStep--;
		}
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
	<!-- Explanation -->
	<div class="explanation">
		<div class="title">{explanation.title}</div>
		<div class="subtitle">{explanation.subtitle}</div>
	</div>

	<!-- Two diagrams side by side -->
	<div class="diagrams">
		<!-- Left: ∀x ∃y -->
		<div class="diagram" class:active={highlightLeft} class:visible={showForallExists}>
			<div class="diagram-label">∀x ∃y</div>
			<div class="diagram-desc">each has their own</div>

			<div class="tree forall-exists">
				{#each people as person, i}
					<div class="connection">
						<div class="node person">{person}</div>
						<div class="arrow">→</div>
						<div class="node drink">{drinks[i]}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Right: ∃y ∀x -->
		<div class="diagram" class:active={highlightRight} class:visible={showExistsForall}>
			<div class="diagram-label">∃y ∀x</div>
			<div class="diagram-desc">one for all</div>

			<div class="tree exists-forall">
				<div class="node drink shared">{sharedDrink}</div>
				<div class="branches">
					<div class="branch-lines">
						<span class="line">/</span>
						<span class="line">|</span>
						<span class="line">\</span>
					</div>
					<div class="people-row">
						{#each people as person}
							<div class="node person">{person}</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Key difference callout -->
	{#if showDifference}
		<div class="difference">
			<span class="left">Different drink per person</span>
			<span class="vs">vs</span>
			<span class="right">Same drink for everyone</span>
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
	}

	.explanation {
		text-align: center;
		min-height: 3.5rem;
	}

	.title {
		font-size: 1.25rem;
		font-weight: bold;
		color: var(--color-math);
	}

	.subtitle {
		font-size: 0.9rem;
		color: var(--color-fg-muted);
		margin-top: 0.25rem;
	}

	.diagrams {
		display: flex;
		justify-content: center;
		gap: 3rem;
		flex-wrap: wrap;
	}

	.diagram {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		min-width: 160px;
		opacity: 0;
		transform: translateY(10px);
		transition: all 0.4s ease;
	}

	.diagram.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.diagram.active {
		border-color: var(--color-math);
		background: rgba(250, 189, 47, 0.05);
	}

	.diagram-label {
		font-size: 1.1rem;
		font-weight: bold;
		color: var(--color-fg);
	}

	.diagram-desc {
		font-size: 0.8rem;
		color: var(--color-fg-muted);
		margin-bottom: 0.5rem;
	}

	.tree {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.tree.forall-exists {
		align-items: flex-start;
	}

	.connection {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.arrow {
		color: var(--color-fg-muted);
		font-size: 1rem;
	}

	.node {
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.node.person {
		background: var(--color-bg-card);
		color: var(--color-fg);
		border: 1px solid var(--color-border);
	}

	.node.drink {
		background: var(--color-accent);
		color: var(--color-bg);
	}

	.node.shared {
		background: var(--color-math);
		color: var(--color-bg);
		font-weight: bold;
	}

	.branches {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.branch-lines {
		display: flex;
		gap: 1.5rem;
		color: var(--color-fg-muted);
		font-size: 1rem;
	}

	.people-row {
		display: flex;
		gap: 0.5rem;
	}

	.difference {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--color-bg-card);
		font-size: 0.9rem;
		flex-wrap: wrap;
		animation: fadeIn 0.4s ease;
	}

	.difference .left {
		color: var(--color-accent);
	}

	.difference .vs {
		color: var(--color-fg-muted);
		font-weight: bold;
	}

	.difference .right {
		color: var(--color-math);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 400px) {
		.diagrams {
			flex-direction: column;
			align-items: center;
			gap: 1.5rem;
		}
	}
</style>
