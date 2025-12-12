/**
 * Svelte preprocessor for ::animation-name syntax
 *
 * Transforms ::number-line into <Animation name="number-line" dir="..." />
 * and injects the import statement.
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
			const dir = dirMatch ? dirMatch[1] : '';

			// Find all ::name patterns (must be on their own line)
			const animationRegex = /^::([a-z][a-z0-9-]*)$/gm;
			let hasAnimations = false;

			let newContent = content.replace(animationRegex, (_, name) => {
				hasAnimations = true;
				return `<Animation name="${name}" dir="${dir}" />`;
			});

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
