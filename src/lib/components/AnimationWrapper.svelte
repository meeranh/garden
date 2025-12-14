<script lang="ts" module>
	export interface AnimationController {
		play: () => void;
		pause: () => void;
		next: () => void;
		prev: () => void;
		skip: () => void;
		replay: () => void;
		getState: () => { isPlaying: boolean; currentStep: number; totalSteps: number };
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	let {
		children
	}: {
		children: Snippet<[{ register: (controller: AnimationController) => void }]>;
	} = $props();

	let container: HTMLDivElement;
	let controller: AnimationController | null = $state(null);
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let totalSteps = $state(0);
	let hasAutoPlayed = $state(false);

	function register(ctrl: AnimationController) {
		controller = ctrl;
		updateState();
	}

	function updateState() {
		if (!controller) return;
		const state = controller.getState();
		isPlaying = state.isPlaying;
		currentStep = state.currentStep;
		totalSteps = state.totalSteps;
	}

	// Poll state every 100ms
	$effect(() => {
		if (!controller) return;
		const interval = setInterval(updateState, 100);
		return () => clearInterval(interval);
	});

	// Intersection Observer for auto-play
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && controller && !hasAutoPlayed) {
						hasAutoPlayed = true;
						controller.play();
					}
				});
			},
			{ threshold: 0.3 }
		);

		observer.observe(container);

		return () => observer.disconnect();
	});

	const isAtStart = $derived(currentStep === 0);
	const isAtEnd = $derived(currentStep >= totalSteps);
	const progress = $derived(totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0);
</script>

<div class="animation-container" bind:this={container}>
	<div class="animation-content">
		{@render children({ register })}
	</div>

	{#if controller}
		<div class="controls">
			<!-- Left: Step navigation -->
			<div class="controls-left">
				<button
					class="btn icon"
					onclick={() => controller?.prev()}
					disabled={isAtStart}
					title="Previous step"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M15 18l-6-6 6-6" />
					</svg>
				</button>

				<button
					class="btn primary"
					onclick={() => (isPlaying ? controller?.pause() : controller?.play())}
					title={isPlaying ? 'Pause' : 'Play'}
				>
					{#if isPlaying}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<rect x="6" y="4" width="4" height="16" />
							<rect x="14" y="4" width="4" height="16" />
						</svg>
					{:else}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5,3 19,12 5,21" />
						</svg>
					{/if}
				</button>

				<button
					class="btn icon"
					onclick={() => controller?.next()}
					disabled={isAtEnd}
					title="Next step"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18l6-6-6-6" />
					</svg>
				</button>
			</div>

			<!-- Middle: Progress -->
			<div class="controls-middle">
				<span class="step-label">{currentStep}/{totalSteps}</span>
				<div class="progress-track">
					<div class="progress-fill" style="width: {progress}%"></div>
				</div>
			</div>

			<!-- Right: Quick actions -->
			<div class="controls-right">
				<button
					class="btn text"
					onclick={() => controller?.skip()}
					disabled={isAtEnd}
					title="Skip to end"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="5,4 15,12 5,20" fill="currentColor" />
						<line x1="19" y1="5" x2="19" y2="19" />
					</svg>
					<span>skip</span>
				</button>

				<button
					class="btn text"
					onclick={() => controller?.replay()}
					title="Replay from start"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M1 4v6h6" />
						<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
					</svg>
					<span>replay</span>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.animation-container {
		border: 1px solid var(--color-border);
		border-radius: 6px;
		overflow: hidden;
		margin: 1.5rem 0;
	}

	.animation-content {
		padding: 1rem;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-top: 1px dashed var(--color-border);
		background: var(--color-bg-card);
	}

	.controls-left,
	.controls-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.controls-middle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
		font-family: inherit;
		font-size: 0.8rem;
	}

	.btn.icon {
		width: 32px;
		height: 32px;
		background: var(--color-bg);
		color: var(--color-fg-muted);
		border-radius: 4px;
	}

	.btn.icon:hover:not(:disabled) {
		background: var(--color-border);
		color: var(--color-fg);
	}

	.btn.primary {
		width: 36px;
		height: 32px;
		background: var(--color-accent);
		color: var(--color-bg);
		border-radius: 4px;
	}

	.btn.primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn.text {
		background: transparent;
		color: var(--color-fg-muted);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.btn.text:hover:not(:disabled) {
		background: var(--color-bg);
		color: var(--color-fg);
	}

	.btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.step-label {
		font-size: 0.75rem;
		color: var(--color-fg-muted);
		font-variant-numeric: tabular-nums;
		min-width: 3rem;
		text-align: center;
	}

	.progress-track {
		width: 80px;
		height: 4px;
		background: var(--color-border);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-accent);
		transition: width 0.2s ease;
	}

	@media (max-width: 500px) {
		.controls {
			flex-wrap: wrap;
			justify-content: center;
		}

		.controls-right {
			width: 100%;
			justify-content: center;
			padding-top: 0.5rem;
			border-top: 1px dashed var(--color-border);
			margin-top: 0.5rem;
		}
	}
</style>
