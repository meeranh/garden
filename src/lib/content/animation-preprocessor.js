import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Svelte preprocessor for ::animation-name syntax
 *
 * Transforms ::animation-name into <Animation path="..." />
 * and injects the import statement.
 *
 * Supports two syntaxes:
 *   ::animation-name           → local ./animations/animation-name.svelte
 *   ::@category/path/name      → shared src/lib/animations/category/path/name.svelte
 *
 * Runs BEFORE mdsvex, so we have access to the actual filename.
 */
export function animationPreprocessor() {
	return {
		name: 'animation-preprocessor',
		markup({ content, filename }) {
			// Only process .svx files
			if (!filename?.endsWith('.svx')) return;

			// Extract directory path relative to src/content
			// e.g., /home/.../src/content/00-math/01-precalculus/01-algebra/index.svx
			// becomes: 00-math/01-precalculus/01-algebra
			const dirMatch = filename.match(/src\/content\/(.+)\//);
			const contentDir = dirMatch ? dirMatch[1] : '';

			// Find all ::name or ::@path/name patterns (must be on their own line)
			// Supports: ::name, ::@category/name, ::@category/sub/name, etc.
			const animationRegex = /^::(@?[a-z][a-z0-9-/]*)$/gm;
			let hasAnimations = false;
			const errors = [];

			let newContent = content.replace(animationRegex, (match, path) => {
				let animationPath;
				let fullPath;

				if (path.startsWith('@')) {
					// Shared animation: ::@category/name → src/lib/animations/category/name.svelte
					const sharedPath = path.slice(1); // Remove @
					animationPath = `@${sharedPath}`;
					fullPath = resolve('src/lib/animations', sharedPath + '.svelte');
				} else {
					// Local animation: ::name → src/content/{dir}/animations/name.svelte
					animationPath = `${contentDir}/animations/${path}`;
					fullPath = resolve('src/content', contentDir, 'animations', path + '.svelte');
				}

				// Validate animation exists
				if (!existsSync(fullPath)) {
					errors.push(`Animation not found: ::${path}\n  Expected: ${fullPath}\n  In: ${filename}`);
					return match; // Keep original to not break further processing
				}

				hasAnimations = true;
				return `<Animation path="${animationPath}" />`;
			});

			// Throw if any animations are missing
			if (errors.length > 0) {
				throw new Error('Missing animations:\n\n' + errors.join('\n\n'));
			}

			// If no animations found, return unchanged
			if (!hasAnimations) return;

			// Inject import after frontmatter
			const importStatement = `\n<script>\nimport Animation from '$lib/components/Animation.svelte';\n</script>\n`;

			// Find end of frontmatter (second ---)
			const frontmatterEndIndex = newContent.indexOf('---', 3);
			if (frontmatterEndIndex !== -1) {
				const insertPosition = frontmatterEndIndex + 3;
				newContent =
					newContent.slice(0, insertPosition) +
					importStatement +
					newContent.slice(insertPosition);
			} else {
				// No frontmatter, prepend import
				newContent = importStatement + newContent;
			}

			return { code: newContent };
		}
	};
}

export default animationPreprocessor;
