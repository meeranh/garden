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

// Get previous and next for navigation (includes parent-child relationships)
export function getSiblings(path: string): { prev?: TreeNode; next?: TreeNode } {
	const segments = path.split('/').filter(Boolean);
	if (segments.length === 0) return {};

	const node = findNode(path);
	if (!node) return {};

	// Get parent path
	const parentPath = segments.slice(0, -1).join('/');
	const parent = findNode(parentPath);
	if (!parent) return {};

	const currentSlug = segments[segments.length - 1];
	const siblings = parent.children.filter((s) => !s.ignored);
	const currentIndex = siblings.findIndex((s) => s.slug === currentSlug);

	if (currentIndex === -1) return {};

	let prev: TreeNode | undefined =
		currentIndex > 0 ? siblings[currentIndex - 1] : undefined;
	let next: TreeNode | undefined =
		currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : undefined;

	// If node has content AND children, "next" should be first non-ignored child
	if (node.hasContent && node.children.length > 0) {
		const visibleChildren = node.children.filter((c) => !c.ignored);
		if (visibleChildren.length > 0) {
			next = visibleChildren[0];
		}
	}

	// If no prev sibling and parent has content, "prev" should be parent
	if (!prev && parent.hasContent) {
		prev = parent;
	}

	return { prev, next };
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
