<script lang="ts">
	import { onMount } from 'svelte';
	import AnimationWrapper, { type AnimationController } from './AnimationWrapper.svelte';

	let { path, ...props }: { path: string; [key: string]: unknown } = $props();

	const modules = import.meta.glob<{ default: typeof import('svelte').SvelteComponent }>(
		'/src/lib/animations/**/*.svelte'
	);

	let Component: typeof import('svelte').SvelteComponent | null = $state(null);
	let error: string | null = $state(null);

	onMount(async () => {
		const modulePath = `/src/lib/animations/${path}.svelte`;

		if (modules[modulePath]) {
			try {
				const module = await modules[modulePath]();
				Component = module.default;
			} catch {
				error = `Failed to load: ${path}`;
			}
		} else {
			error = `Not found: ${path}`;
		}
	});
</script>

{#if error}
	<div class="animation-error">{error}</div>
{:else if Component}
	<AnimationWrapper>
		{#snippet children({ register })}
			<Component {...props} {register} />
		{/snippet}
	</AnimationWrapper>
{:else}
	<div class="animation-loading"></div>
{/if}

<style>
	.animation-error {
		color: var(--color-error);
		font-size: 0.875rem;
		padding: 1rem;
		border: 1px solid var(--color-error);
		margin: 1rem 0;
	}

	.animation-loading {
		min-height: 100px;
	}
</style>
