<script lang="ts">
	import type { TreeNode } from '$lib/content/tree';

	let { prev, next }: { prev?: TreeNode; next?: TreeNode } = $props();
</script>

{#if prev || next}
	<nav class="navigation">
		{#if prev}
			<a href="/{prev.path}" class="prev">
				<span class="arrow">&larr;</span>
				<span class="title">{prev.title}</span>
			</a>
		{:else}
			<span></span>
		{/if}

		{#if next}
			<a href="/{next.path}" class="next">
				<span class="title">{next.title}</span>
				<span class="arrow">&rarr;</span>
			</a>
		{/if}
	</nav>
{/if}

<style>
	.navigation {
		display: flex;
		justify-content: space-between;
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--color-border);
	}

	a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-fg-muted);
		transition: color var(--transition-fast);
	}

	a:hover {
		color: var(--color-accent);
	}

	.next {
		margin-left: auto;
	}
</style>
