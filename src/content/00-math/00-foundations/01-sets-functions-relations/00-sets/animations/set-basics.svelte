<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	// Steps:
	// 0: Show empty set braces
	// 1: Add elements 1, 2, 3
	// 2: Try to add duplicate 2 - it gets rejected
	// 3: Show "No duplicates" rule
	// 4: Shuffle the order
	// 5: Show they're still equal
	// 6: Show "Order doesn't matter" rule

	let display = $derived.by(() => {
		if (currentStep === 0) {
			return {
				title: 'Start with an empty set',
				elements: [],
				showDuplicate: false,
				duplicateRejected: false,
				shuffled: false,
				rule: null
			};
		} else if (currentStep === 1) {
			return {
				title: 'Add elements: 1, 2, 3',
				elements: [1, 2, 3],
				showDuplicate: false,
				duplicateRejected: false,
				shuffled: false,
				rule: null
			};
		} else if (currentStep === 2) {
			return {
				title: 'Try to add another 2...',
				elements: [1, 2, 3],
				showDuplicate: true,
				duplicateRejected: false,
				shuffled: false,
				rule: null
			};
		} else if (currentStep === 3) {
			return {
				title: 'Duplicate rejected!',
				elements: [1, 2, 3],
				showDuplicate: true,
				duplicateRejected: true,
				shuffled: false,
				rule: 'no-duplicates'
			};
		} else if (currentStep === 4) {
			return {
				title: 'Now shuffle the order...',
				elements: [1, 2, 3],
				showDuplicate: false,
				duplicateRejected: false,
				shuffled: false,
				rule: null
			};
		} else if (currentStep === 5) {
			return {
				title: 'Rearranged to {3, 1, 2}',
				elements: [3, 1, 2],
				showDuplicate: false,
				duplicateRejected: false,
				shuffled: true,
				rule: null
			};
		} else {
			return {
				title: 'Still the same set!',
				elements: [3, 1, 2],
				showDuplicate: false,
				duplicateRejected: false,
				shuffled: true,
				rule: 'order-doesnt-matter'
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
</script>

<div class="container">
	<div class="title">{display.title}</div>

	<div class="set-display">
		<span class="brace">{'{'}</span>

		<div class="elements">
			{#each display.elements as el, i}
				<span class="element" class:shuffled={display.shuffled}>
					{el}
				</span>
				{#if i < display.elements.length - 1}
					<span class="comma">,</span>
				{/if}
			{/each}
		</div>

		{#if display.showDuplicate}
			<span class="duplicate" class:rejected={display.duplicateRejected}>
				<span class="comma">,</span>
				<span class="element">2</span>
				{#if display.duplicateRejected}
					<span class="reject-x">✗</span>
				{/if}
			</span>
		{/if}

		<span class="brace">{'}'}</span>
	</div>

	{#if display.rule === 'no-duplicates'}
		<div class="rule">
			<strong>Rule 1:</strong> No duplicates allowed
		</div>
	{/if}

	{#if display.rule === 'order-doesnt-matter'}
		<div class="rule">
			<strong>Rule 2:</strong> Order doesn't matter
		</div>
	{/if}

	{#if display.shuffled && display.rule === 'order-doesnt-matter'}
		<div class="equality">
			{'{'}1, 2, 3{'}'} = {'{'}3, 1, 2{'}'}
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 1rem;
	}

	.title {
		font-size: 0.95rem;
		color: var(--color-fg);
		font-weight: 500;
	}

	.set-display {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 1.5rem;
		font-family: var(--font-mono);
	}

	.brace {
		color: var(--color-fg-muted);
		font-weight: bold;
	}

	.elements {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.element {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-accent);
		border-radius: 4px;
		color: var(--color-accent);
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.element.shuffled {
		background: rgba(142, 192, 124, 0.15);
	}

	.comma {
		color: var(--color-fg-muted);
	}

	.duplicate {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		transition: all 0.3s ease;
	}

	.duplicate .element {
		border-color: var(--color-math);
		color: var(--color-math);
		background: rgba(250, 189, 47, 0.1);
	}

	.duplicate.rejected {
		opacity: 0.5;
		text-decoration: line-through;
	}

	.duplicate.rejected .element {
		border-color: var(--color-error);
		color: var(--color-error);
		background: rgba(251, 73, 52, 0.1);
	}

	.reject-x {
		color: var(--color-error);
		font-size: 1.2rem;
		margin-left: 0.25rem;
	}

	.rule {
		padding: 0.75rem 1.25rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		font-size: 0.9rem;
		color: var(--color-fg);
	}

	.rule strong {
		color: var(--color-accent);
	}

	.equality {
		font-size: 1.1rem;
		color: var(--color-math);
		font-weight: 500;
	}
</style>
