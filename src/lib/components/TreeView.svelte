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
			{#if depth === 0}
				<div class="section-card">
					<a href="/{node.path}" class="section-header">
						<span class="section-num">{num}</span>
						<span class="section-title">{node.title}</span>
						<span class="section-arrow">→</span>
					</a>
					{#if node.children.length > 0}
						<div class="section-content">
							<TreeView nodes={node.children} depth={depth + 1} parentNum={num} />
						</div>
					{/if}
				</div>
			{:else if depth === 1}
				<div class="subsection">
					<a href="/{node.path}" class="subsection-link">
						<span class="subsection-num">{num}</span>
						{node.title}
					</a>
					{#if node.children.length > 0}
						<TreeView nodes={node.children} depth={depth + 1} parentNum={num} />
					{/if}
				</div>
			{:else}
				<a href="/{node.path}" class="topic-link">
					<span class="topic-num">{num}</span>
					{node.title}
				</a>
				{#if node.children.length > 0}
					<TreeView nodes={node.children} depth={depth + 1} parentNum={num} />
				{/if}
			{/if}
		{/each}
	</div>
{/if}

<style>
	.tree {
		margin: 0;
		padding: 0;
	}

	/* Level 0: Section Cards */
	.depth-0 {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section-card {
		background: linear-gradient(135deg, rgba(40, 40, 40, 0.4) 0%, rgba(30, 30, 30, 0.2) 100%);
		border: 1px solid #3c3836;
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.section-card:hover {
		border-color: #504945;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: rgba(60, 56, 54, 0.3);
		border-bottom: 1px solid #3c3836;
		transition: all 0.2s ease;
	}

	.section-header:hover {
		background: rgba(80, 73, 69, 0.4);
	}

	.section-num {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		font-weight: 700;
		color: #1d2021;
		background: #fabd2f;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		letter-spacing: 0.05em;
	}

	.section-title {
		flex: 1;
		font-size: 1rem;
		font-weight: 600;
		color: #ebdbb2;
	}

	.section-arrow {
		color: #665c54;
		transition: all 0.2s ease;
	}

	.section-header:hover .section-arrow {
		color: #fabd2f;
		transform: translateX(4px);
	}

	.section-content {
		padding: 0.75rem 1.25rem 1rem;
	}

	/* Level 1: Subsections */
	.depth-1 {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.subsection {
		position: relative;
		padding-left: 1rem;
		border-left: 2px solid #3c3836;
	}

	.subsection-link {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.4rem 0.75rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: #ebdbb2;
		border-radius: 4px;
		transition: all 0.15s ease;
	}

	.subsection-num {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		color: #b8bb26;
		min-width: 2rem;
	}

	.subsection-link:hover {
		color: #8ec07c;
		background: rgba(142, 192, 124, 0.1);
	}

	/* Level 2+: Topics */
	.depth-2 {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-top: 0.25rem;
		margin-left: 0.5rem;
		padding-left: 0.75rem;
		border-left: 1px solid #504945;
	}

	.topic-link {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
		color: #d5c4a1;
		border-radius: 3px;
		transition: all 0.15s ease;
	}

	.topic-num {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.7rem;
		color: #83a598;
		min-width: 2.5rem;
	}

	.topic-link:hover {
		color: #83a598;
		background: rgba(131, 165, 152, 0.1);
	}

	/* Deeper levels */
	:global(.tree .depth-3),
	:global(.tree .depth-4),
	:global(.tree .depth-5) {
		margin-left: 0.5rem;
		padding-left: 0.5rem;
		border-left: 1px solid #3c3836;
	}
</style>
