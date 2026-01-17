import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Svelte preprocessor for ::animation syntax
 *
 * Transforms ::path/name into <Animation path="..." />
 * Animations live in src/lib/animations/
 */
export function animationPreprocessor() {
	return {
		name: 'animation-preprocessor',
		markup({ content, filename }) {
			if (!filename?.endsWith('.svx')) return;

			const animationRegex = /^::([a-z][a-z0-9-/]*)$/gm;
			let hasAnimations = false;
			const errors = [];

			let newContent = content.replace(animationRegex, (match, path) => {
				const fullPath = resolve('src/lib/animations', path + '.svelte');

				if (!existsSync(fullPath)) {
					errors.push(`Animation not found: ::${path}\n  Expected: ${fullPath}\n  In: ${filename}`);
					return match;
				}

				hasAnimations = true;
				return `<Animation path="${path}" />`;
			});

			if (errors.length > 0) {
				throw new Error('Missing animations:\n\n' + errors.join('\n\n'));
			}

			if (!hasAnimations) return;

			const importStatement = `\n<script>\nimport Animation from '$lib/components/Animation.svelte';\n</script>\n`;

			const frontmatterEndIndex = newContent.indexOf('---', 3);
			if (frontmatterEndIndex !== -1) {
				const insertPosition = frontmatterEndIndex + 3;
				newContent =
					newContent.slice(0, insertPosition) +
					importStatement +
					newContent.slice(insertPosition);
			} else {
				newContent = importStatement + newContent;
			}

			return { code: newContent };
		}
	};
}

export default animationPreprocessor;
