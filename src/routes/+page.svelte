<script lang="ts">
	import { site } from '$lib/config/site';
	import { tree } from '$lib/content/tree';
	import GardenIcon from '$lib/components/GardenIcon.svelte';
</script>

<svelte:head>
	<title>{site.name}</title>
	<meta name="description" content={site.description} />
</svelte:head>

<main class="landing">
	<header>
		<div class="icon">
			<GardenIcon size={128} />
		</div>
		<h1>{site.name}</h1>
		<p class="description">{site.description}</p>
	</header>

	<nav class="subjects">
		{#each tree.children.filter((s) => !s.ignored) as subject}
			<a href="/{subject.path}" class="subject">
				<span class="title">{subject.title}</span>
			</a>
		{/each}
	</nav>
</main>

<style>
	.landing {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.icon {
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.description {
		color: var(--color-fg-muted);
		font-size: 0.875rem;
	}

	.subjects {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.subject {
		padding: 1rem 2rem;
		border: 1px solid var(--color-border);
		color: var(--color-fg);
		transition:
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.subject:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
