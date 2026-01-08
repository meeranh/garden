<script lang="ts">
	import type { TreeNode } from '$lib/content/tree';
	import TreeView from './TreeView.svelte';

	let { nodes, depth = 0, parentNum = '' }: { nodes: TreeNode[]; depth?: number; parentNum?: string } = $props();

	function getNum(index: number): string {
		return parentNum ? `${parentNum}.${index + 1}` : `${index + 1}`;
	}
</script>

{#if nodes.length > 0}
	<div class="tree depth-{depth}">
		{#each nodes as node, i}
			{@const num = getNum(i)}
			<div class="item">
				<a href="/{node.path}" class="link">
					<span class="num">{num}</span>
					<span class="title">{node.title}</span>
				</a>
				{#if node.children.length > 0}
					<TreeView nodes={node.children} depth={depth + 1} parentNum={num} />
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.tree {
		margin: 0;
		padding: 0;
	}

	.item {
		margin: 0;
	}

	.link {
		display: inline-flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.35rem 0;
		transition: all 0.15s ease;
	}

	.num {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		font-weight: 600;
		min-width: 2rem;
		text-align: right;
	}

	.title {
		color: #ebdbb2;
	}

	.link:hover .title {
		color: var(--color-accent);
	}

	/* Level 0: Sections */
	.depth-0 {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.depth-0 > .item > .link {
		padding: 0.5rem 0;
	}

	.depth-0 > .item > .link .num {
		color: #fabd2f;
		font-size: 0.85rem;
		min-width: 1.5rem;
	}

	.depth-0 > .item > .link .title {
		font-size: 1.05rem;
		font-weight: 600;
	}

	.depth-0 > .item > .link:hover .num {
		color: #fabd2f;
	}

	/* Level 1: Subsections */
	.depth-1 {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.5rem;
		margin-left: 2.25rem;
	}

	.depth-1 > .item > .link .num {
		color: #b8bb26;
		min-width: 2rem;
	}

	.depth-1 > .item > .link .title {
		font-size: 0.9rem;
		color: #d5c4a1;
	}

	.depth-1 > .item > .link:hover .num {
		color: #b8bb26;
	}

	/* Level 2+: Topics */
	.depth-2 {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-top: 0.25rem;
		margin-left: 2.75rem;
	}

	.depth-2 > .item > .link .num {
		color: #83a598;
		font-size: 0.7rem;
		min-width: 2.75rem;
	}

	.depth-2 > .item > .link .title {
		font-size: 0.85rem;
		color: #bdae93;
	}

	.depth-2 > .item > .link:hover .num {
		color: #83a598;
	}

	/* Deeper levels */
	:global(.tree .depth-3),
	:global(.tree .depth-4),
	:global(.tree .depth-5) {
		margin-left: 3.5rem;
		margin-top: 0.15rem;
	}

	:global(.tree .depth-3 > .item > .link .num),
	:global(.tree .depth-4 > .item > .link .num),
	:global(.tree .depth-5 > .item > .link .num) {
		min-width: 3.5rem;
		color: #d3869b;
		font-size: 0.65rem;
	}

	:global(.tree .depth-3 > .item > .link .title),
	:global(.tree .depth-4 > .item > .link .title),
	:global(.tree .depth-5 > .item > .link .title) {
		font-size: 0.8rem;
		color: #a89984;
	}
</style>
