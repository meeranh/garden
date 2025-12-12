<script lang="ts">
	import { site } from '$lib/config/site';
</script>

<div class="empty">
	<p>{site.labels.empty}</p>
</div>

<style>
	.empty {
		text-align: center;
		padding: 4rem 0;
		color: var(--color-fg-muted);
	}
</style>
