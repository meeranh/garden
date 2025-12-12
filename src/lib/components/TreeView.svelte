<script lang="ts">
	import type { TreeNode } from '$lib/content/tree';
	import TreeView from './TreeView.svelte';

	let { nodes }: { nodes: TreeNode[] } = $props();
</script>

{#if nodes.length > 0}
	<ul class="tree">
		{#each nodes as node}
			<li>
				<a href="/{node.path}">{node.title}</a>
				{#if node.children.length > 0}
					<TreeView nodes={node.children} />
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.tree {
		list-style: none;
		padding-left: 0;
		margin: 0;
	}

	:global(.tree .tree) {
		padding-left: 1rem;
	}

	:global(.tree .tree li)::before {
		content: '·';
		margin-right: 0.5rem;
		color: var(--color-fg-muted);
	}

	li {
		margin: 0.25rem 0;
	}

	a {
		color: var(--color-fg);
		transition: color var(--transition-fast);
	}

	a:hover {
		color: var(--color-accent);
	}
</style>
