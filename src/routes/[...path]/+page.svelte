<script lang="ts">
	import { site } from '$lib/config/site';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Prerequisites from '$lib/components/Prerequisites.svelte';
	import TreeView from '$lib/components/TreeView.svelte';
	import Empty from '$lib/components/Empty.svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.node.title} - {site.name}</title>
</svelte:head>

<main class="page">
	<Breadcrumbs crumbs={data.breadcrumbs} />

	<header>
		<h1>{data.node.title}</h1>
		<div class="divider"></div>
	</header>

	{#if data.node.prerequisites.length > 0}
		<Prerequisites paths={data.node.prerequisites} />
	{/if}

	{#if data.hasContent && data.content}
		<article class="content">
			<data.content />
		</article>
	{/if}

	{#if data.node.children.length > 0}
		<TreeView nodes={data.node.children} />
	{:else if !data.hasContent}
		<Empty />
	{/if}

	<Navigation prev={data.prev} next={data.next} />
</main>

<style>
	.page {
		min-height: 100vh;
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 3rem 1.5rem;
	}

	header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}

	.divider {
		height: 1px;
		background: var(--color-border);
	}

	.content {
		line-height: 1.7;
	}

	.content :global(h2) {
		font-size: 1.125rem;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	.content :global(h3) {
		font-size: 1rem;
		color: var(--color-fg-muted);
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}

	.content :global(p) {
		margin-bottom: 1rem;
		color: var(--color-fg-muted);
	}

	.content :global(strong) {
		color: var(--color-fg);
	}

	.content :global(a) {
		color: var(--color-accent);
	}

	.content :global(code) {
		background: var(--color-bg-card);
		padding: 0.125rem 0.375rem;
		font-size: 0.875em;
	}

	.content :global(pre) {
		background: var(--color-bg-card);
		padding: 1rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	.content :global(ul),
	.content :global(ol) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
		color: var(--color-fg-muted);
	}

	.content :global(li) {
		margin-bottom: 0.5rem;
	}
</style>
