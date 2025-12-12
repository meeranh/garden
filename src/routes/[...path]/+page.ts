import { getContent } from '$lib/content/loader';
import { findNode, getBreadcrumbs, getSiblings, getAllPaths } from '$lib/content/nav';
import { error } from '@sveltejs/kit';

export const prerender = true;

export async function entries() {
	const paths = getAllPaths();
	return paths.map((path) => ({ path }));
}

export async function load({ params }) {
	const path = params.path || '';
	const node = findNode(path);

	if (!node) throw error(404);

	const contentData = getContent(path);
	const siblings = getSiblings(path);

	return {
		path,
		node,
		content: contentData?.component || null,
		hasContent: !!contentData,
		breadcrumbs: getBreadcrumbs(path),
		prev: siblings.prev,
		next: siblings.next
	};
}
