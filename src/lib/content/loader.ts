import type { Component } from 'svelte';

// Glob import all .svx files
const modules = import.meta.glob('/src/content/**/*.svx', {
	eager: true
});

const metadata = import.meta.glob('/src/content/**/*.svx', {
	eager: true,
	import: 'metadata'
});

// Import raw content to check for body content
const rawFiles = import.meta.glob('/src/content/**/*.svx', {
	eager: true,
	query: '?raw',
	import: 'default'
});

// Check if a file has body content (not just frontmatter)
function hasBodyContent(raw: string): boolean {
	// Match frontmatter block and capture everything after
	const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) return false;
	const body = match[1].trim();
	return body.length > 0;
}

export interface ContentData {
	component: Component;
	metadata: {
		title?: string;
		prerequisites?: string[];
	};
	hasBodyContent: boolean;
}

// Transform file path to URL path
export function fileToUrl(file: string): string {
	return file
		.replace('/src/content/', '')
		.replace('.svx', '')
		.split('/')
		.map((seg) => seg.replace(/^\d+-/, '')) // Strip number prefixes
		.filter((seg) => seg !== 'index') // Remove index
		.join('/');
}

// Extract order number from segment
export function extractOrder(segment: string): number {
	const match = segment.match(/^(\d+)-/);
	return match ? parseInt(match[1], 10) : 0;
}

// Convert slug to title (kebab-case to Title Case)
export function slugToTitle(slug: string): string {
	return slug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

// Build content map: URL path -> content data
const contentMap = new Map<string, ContentData>();

for (const [file, module] of Object.entries(modules)) {
	const urlPath = fileToUrl(file);
	const meta = (metadata[file] as { title?: string; prerequisites?: string[] }) || {};
	const raw = rawFiles[file] as string;

	contentMap.set(urlPath, {
		component: (module as { default: Component }).default,
		metadata: meta,
		hasBodyContent: hasBodyContent(raw)
	});
}

// Get content by URL path
export function getContent(path: string): ContentData | null {
	return contentMap.get(path) || null;
}

// Get all file paths (for tree building)
export function getAllFiles(): string[] {
	return Object.keys(modules);
}

// Export the raw modules for tree building
export { modules, metadata };
