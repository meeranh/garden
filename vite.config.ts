import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

function watchAnimations(): Plugin {
	return {
		name: 'watch-animations',
		configureServer(server) {
			server.watcher.on('add', (path) => {
				if (path.includes('animations') && path.endsWith('.svelte')) {
					// Invalidate all modules to force glob re-evaluation
					server.moduleGraph.invalidateAll();
					server.hot.send({ type: 'full-reload' });
				}
			});
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), watchAnimations(), sveltekit()]
});
