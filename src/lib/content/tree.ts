import { getAllFiles, fileToUrl, extractOrder, slugToTitle, metadata } from './loader';

export interface TreeNode {
	slug: string;
	path: string;
	title: string;
	order: number;
	hasContent: boolean;
	children: TreeNode[];
	prerequisites: string[];
}

// Build tree from globbed files
function buildTree(): TreeNode {
	const root: TreeNode = {
		slug: '',
		path: '',
		title: 'root',
		order: 0,
		hasContent: false,
		children: [],
		prerequisites: []
	};

	const files = getAllFiles();

	for (const file of files) {
		const urlPath = fileToUrl(file);
		const segments = urlPath.split('/').filter(Boolean);
		const fileMeta = (metadata[file] as { title?: string; prerequisites?: string[] }) || {};

		// Get order from original file path
		const fileSegments = file
			.replace('/src/content/', '')
			.replace('.svx', '')
			.split('/')
			.filter((s) => s !== 'index');

		let current = root;

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const originalSegment = fileSegments[i] || segment;
			const order = extractOrder(originalSegment);

			let child = current.children.find((c) => c.slug === segment);

			if (!child) {
				child = {
					slug: segment,
					path: segments.slice(0, i + 1).join('/'),
					title: slugToTitle(segment),
					order,
					hasContent: false,
					children: [],
					prerequisites: []
				};
				current.children.push(child);
			}

			// If this is the last segment, this file provides content for this node
			if (i === segments.length - 1) {
				child.hasContent = true;
				if (fileMeta.title) {
					child.title = fileMeta.title;
				}
				if (fileMeta.prerequisites) {
					child.prerequisites = fileMeta.prerequisites;
				}
			}

			current = child;
		}
	}

	sortTree(root);
	return root;
}

// Sort tree nodes by order, then alphabetically
function sortTree(node: TreeNode): void {
	node.children.sort((a, b) => {
		if (a.order !== b.order) return a.order - b.order;
		return a.title.localeCompare(b.title);
	});
	node.children.forEach(sortTree);
}

// Export the built tree
export const tree = buildTree();
