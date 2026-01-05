<script lang="ts">
	import GardenIcon from './GardenIcon.svelte';

	type Crumb = { path: string; title: string };
	let { crumbs }: { crumbs: Crumb[] } = $props();
</script>

<nav class="bar">
	<div class="inner">
		<a href="/" class="item home">
			<GardenIcon size={28} />
		</a>

		{#each crumbs as crumb, i}
			<span class="sep">/</span>
			{#if i === crumbs.length - 1}
				<span class="item current">{crumb.title}</span>
			{:else}
				<a href="/{crumb.path}" class="item">{crumb.title}</a>
			{/if}
		{/each}
	</div>
</nav>

<style>
	.bar {
		background: #0d0e0f;
		padding: 0.25rem 1rem;
		font-size: 0.75rem;
		border-bottom: 1px solid #282828;
		height: 32px;
		display: flex;
		align-items: center;
	}

	.inner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		min-width: 0;
	}

	.sep {
		color: #504945;
		flex-shrink: 0;
	}

	.item {
		color: #83a598;
		transition: color 0.1s ease;
		flex: 0 1 auto;
		min-width: 30px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item:hover {
		color: #8ec07c;
	}

	.item.home {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		min-width: auto;
		line-height: 0;
		margin-top: -4px;
	}

	.item.home:hover {
		color: #fb4934;
	}

	.item.current {
		color: #fabd2f;
	}
</style>
