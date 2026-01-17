<script lang="ts">
	import { onMount } from 'svelte';
	import AnimationWrapper, { type AnimationController } from './AnimationWrapper.svelte';

	let { path, ...props }: { path: string; [key: string]: unknown } = $props();

	// Glob all animation components at build time
	const contentModules = import.meta.glob<{ default: typeof import('svelte').SvelteComponent }>(
		'/src/content/**/animations/*.svelte'
	);
	const sharedModules = import.meta.glob<{ default: typeof import('svelte').SvelteComponent }>(
		'/src/lib/animations/shared/**/*.svelte'
	);

	let Component: typeof import('svelte').SvelteComponent | null = $state(null);
	let error: string | null = $state(null);

	onMount(async () => {
		let modulePath: string;
		let modules: typeof contentModules;

		if (path.startsWith('@')) {
			// Shared animation: @category/name → /src/lib/animations/shared/category/name.svelte
			const sharedPath = path.slice(1);
			modulePath = `/src/lib/animations/shared/${sharedPath}.svelte`;
			modules = sharedModules;
		} else {
			// Local animation: dir/animations/name → /src/content/dir/animations/name.svelte
			modulePath = `/src/content/${path}.svelte`;
			modules = contentModules;
		}

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
