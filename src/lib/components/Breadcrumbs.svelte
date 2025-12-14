<script lang="ts">
	import GardenIcon from './GardenIcon.svelte';

	type Crumb = { path: string; title: string };
	let { crumbs }: { crumbs: Crumb[] } = $props();

	function truncate(text: string, max: number = 18): string {
		return text.length > max ? text.slice(0, max) + '...' : text;
	}
</script>

<nav class="bar">
	<div class="inner">
		<a href="/" class="item home">
			<GardenIcon size={32} />
		</a>

		{#each crumbs as crumb, i}
			<span class="sep">/</span>
			{#if i === crumbs.length - 1}
				<span class="item current">{truncate(crumb.title)}</span>
			{:else}
				<a href="/{crumb.path}" class="item">{truncate(crumb.title)}</a>
			{/if}
		{/each}
	</div>
</nav>

<style>
	.bar {
		background: #0d0e0f;
		padding: 0.4rem 1rem;
		font-size: 0.8rem;
		border-bottom: 1px solid #282828;
	}

	.inner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.sep {
		color: #504945;
	}

	.item {
		color: #83a598;
		transition: color 0.1s ease;
	}

	.item:hover {
		color: #8ec07c;
	}

	.item.home {
		display: flex;
		align-items: center;
	}

	.item.home:hover {
		color: #fb4934;
	}

	.item.current {
		color: #fabd2f;
	}
</style>
