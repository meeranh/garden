<script lang="ts">
	import { site } from '$lib/config/site';
	import { findNode } from '$lib/content/nav';

	let { paths }: { paths: string[] } = $props();

	const topics = $derived(
		paths
			.map((p) => {
				const node = findNode(p);
				return node ? { path: p, title: node.title } : null;
			})
			.filter((t): t is { path: string; title: string } => t !== null)
	);
</script>

{#if topics.length > 0}
	<aside class="prerequisites">
		<p class="label">{site.labels.prerequisites}</p>
		<ul>
			{#each topics as topic}
				<li>
					<a href="/{topic.path}">{topic.title}</a>
				</li>
			{/each}
		</ul>
	</aside>
{/if}

<style>
	.prerequisites {
		border: 1px solid var(--color-border);
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.label {
		color: var(--color-fg-muted);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		margin: 0.25rem 0;
	}

	a {
		color: var(--color-accent);
		transition: opacity var(--transition-fast);
	}

	a:hover {
		opacity: 0.8;
	}
</style>
