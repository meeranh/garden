import { tree, type TreeNode } from './tree';

// Find a node by its path
export function findNode(path: string): TreeNode | null {
	if (!path) return tree;

	const segments = path.split('/').filter(Boolean);
	let current = tree;

	for (const segment of segments) {
		const child = current.children.find((c) => c.slug === segment);
		if (!child) return null;
		current = child;
	}

	return current;
}

// Get breadcrumb trail for a path
export function getBreadcrumbs(path: string): { path: string; title: string }[] {
	const crumbs: { path: string; title: string }[] = [];
	const segments = path.split('/').filter(Boolean);

	let currentPath = '';
	for (const segment of segments) {
		currentPath = currentPath ? `${currentPath}/${segment}` : segment;
		const node = findNode(currentPath);
		if (node) {
			crumbs.push({ path: currentPath, title: node.title });
		}
	}

	return crumbs;
}

// Get previous and next siblings for navigation
export function getSiblings(path: string): { prev?: TreeNode; next?: TreeNode } {
	const segments = path.split('/').filter(Boolean);
	if (segments.length === 0) return {};

	// Get parent path
	const parentPath = segments.slice(0, -1).join('/');
	const parent = findNode(parentPath);
	if (!parent) return {};

	const currentSlug = segments[segments.length - 1];
	const siblings = parent.children;
	const currentIndex = siblings.findIndex((s) => s.slug === currentSlug);

	if (currentIndex === -1) return {};

	return {
		prev: currentIndex > 0 ? siblings[currentIndex - 1] : undefined,
		next: currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : undefined
	};
}

// Get all paths for prerendering (flattened tree)
export function getAllPaths(): string[] {
	const paths: string[] = [];

	function traverse(node: TreeNode): void {
		if (node.path) {
			paths.push(node.path);
		}
		for (const child of node.children) {
			traverse(child);
		}
	}

	traverse(tree);
	return paths;
}
