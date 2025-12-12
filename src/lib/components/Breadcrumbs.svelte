<script lang="ts">
	import { site } from '$lib/config/site';

	type Crumb = { path: string; title: string };
	let { crumbs }: { crumbs: Crumb[] } = $props();
</script>

<nav class="breadcrumbs">
	<a href="/" class="crumb">{site.name}</a>

	{#each crumbs as crumb, i}
		<span class="separator">{site.separator}</span>

		{#if i === crumbs.length - 1}
			<span class="crumb current">{crumb.title}</span>
		{:else}
			<a href="/{crumb.path}" class="crumb">{crumb.title}</a>
		{/if}
	{/each}
</nav>

<style>
	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.crumb {
		color: var(--color-fg-muted);
		transition: color var(--transition-fast);
	}

	.crumb:hover {
		color: var(--color-accent);
	}

	.crumb.current {
		color: var(--color-fg);
	}

	.separator {
		color: var(--color-fg-muted);
		opacity: 0.5;
		user-select: none;
	}
</style>
