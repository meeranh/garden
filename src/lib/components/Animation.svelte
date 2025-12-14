<script lang="ts">
	import { onMount } from 'svelte';
	import AnimationWrapper, { type AnimationController } from './AnimationWrapper.svelte';

	let { name, dir, ...props }: { name: string; dir: string; [key: string]: unknown } = $props();

	// Glob all animation components at build time
	const modules = import.meta.glob<{ default: typeof import('svelte').SvelteComponent }>(
		'/src/content/**/animations/*.svelte'
	);

	let Component: typeof import('svelte').SvelteComponent | null = $state(null);
	let error: string | null = $state(null);

	onMount(async () => {
		// Direct path lookup - no URL matching needed
		const path = `/src/content/${dir}/animations/${name}.svelte`;

		if (modules[path]) {
			try {
				const module = await modules[path]();
				Component = module.default;
			} catch {
				error = `Failed to load: ${name}`;
			}
		} else {
			error = `Not found: ${name}`;
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
