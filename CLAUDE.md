# Garden - Project Documentation

> A garden where fine truths grow into something greater.

A visual learning platform with interactive D3.js animations, starting with Mathematics and expanding to other subjects.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| SvelteKit | Framework |
| MDsveX | .svx content files |
| remark-math@3 + rehype-katex-svelte | LaTeX rendering |
| D3.js | All animations |
| Tailwind CSS v4 | Styling |
| Gruvbox Dark | Theme |
| Iosevka | Font |

---

## Design Principles

1. **Zero hardcoding** - Everything configurable via config files or CSS variables
2. **Single source of truth** - Filesystem IS the curriculum
3. **Minimal** - Clean, no clutter, no emojis
4. **Unlimited nesting** - Recursive content structure
5. **Static pre-rendering** - Fast, hostable anywhere

---

## Project Structure

```
garden/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte              # Global layout
│   │   ├── +layout.ts                  # Prerender config
│   │   ├── +page.svelte                # Landing page (top-level subjects)
│   │   └── [...path]/
│   │       ├── +page.svelte            # Content renderer
│   │       └── +page.ts                # Load content + tree data
│   │
│   ├── lib/
│   │   ├── config/
│   │   │   └── site.ts                 # Site name, labels, separator
│   │   │
│   │   ├── content/
│   │   │   ├── loader.ts               # Glob-based content loading
│   │   │   ├── tree.ts                 # Build navigation tree from filesystem
│   │   │   ├── nav.ts                  # Breadcrumbs, siblings, helpers
│   │   │   └── animation-preprocessor.js  # Svelte preprocessor for ::animation syntax
│   │   │
│   │   └── components/
│   │       ├── Breadcrumbs.svelte      # garden > math > algebra > topic
│   │       ├── Prerequisites.svelte    # Shows required topics before content
│   │       ├── TreeView.svelte         # Recursive tree navigation
│   │       ├── Empty.svelte            # "coming soon" placeholder
│   │       ├── Navigation.svelte       # Prev/Next links
│   │       └── Animation.svelte        # Dynamic animation loader
│   │
│   ├── content/                        # ALL CONTENT LIVES HERE
│   │   └── 00-math/
│   │       ├── index.svx
│   │       └── 01-topic/
│   │           ├── index.svx
│   │           └── animations/         # Animations live with content
│   │               └── example.svelte
│   │
│   └── app.css                         # Theme (single source of truth)
│
├── svelte.config.js                    # Preprocessors + MDsveX config
├── vite.config.ts
└── package.json
```

---

## Content System

### Filesystem = Curriculum

The folder structure IS the curriculum. No separate curriculum definition file.

### Naming Convention

```
[order]-[slug].svx
[order]-[slug]/
```

- **Order**: Number prefix defines sequence (01-, 02-, 03-...)
- **Slug**: URL-friendly name, becomes the URL segment
- Number prefixes are stripped from URLs

### Examples

| File Path | URL |
|-----------|-----|
| `00-math/index.svx` | `/math` |
| `00-math/01-precalculus/index.svx` | `/math/precalculus` |
| `00-math/01-precalculus/01-algebra/01-real-numbers.svx` | `/math/precalculus/algebra/real-numbers` |
| `00-math/01-precalculus/01-algebra/02-equations.svx` | `/math/precalculus/algebra/equations` |

### index.svx Files

- **Optional** in any folder
- Should contain only frontmatter (title), no prose content
- Navigation tree provides the overview
- If absent, page shows tree or empty state

### SVX File Format

```svx
---
title: Equations and Inequalities
prerequisites:
  - math/precalculus/algebra/real-numbers
---

## Section Title

Content here. Standard markdown.

Inline math: $x^2 + y^2 = r^2$

Block math:
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

::number-line
```

Note: Animations use the `::animation-name` syntax (see Animations section).

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Overrides title derived from filename |
| `prerequisites` | string[] | No | Full paths to required topics |

### Prerequisites Format

Full paths from content root:
```yaml
prerequisites:
  - math/precalculus/algebra/real-numbers
  - math/precalculus/algebra/absolute-value
```

---

## Content Loading

### Glob-Based Loading

```typescript
// src/lib/content/loader.ts

const modules = import.meta.glob('/src/content/**/*.svx', {
  eager: true,
  import: 'default'
});

const metadata = import.meta.glob('/src/content/**/*.svx', {
  eager: true,
  import: 'metadata'
});
```

### Path Transformation

```typescript
function fileToUrl(file: string): string {
  return file
    .replace('/src/content/', '')
    .replace('.svx', '')
    .split('/')
    .map(seg => seg.replace(/^\d+-/, ''))  // Strip number prefixes
    .filter(seg => seg !== 'index')         // Remove index
    .join('/');
}
```

### Order Extraction

```typescript
function extractOrder(segment: string): number {
  const match = segment.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : 0;
}
```

---

## Navigation Tree

### TreeNode Type

```typescript
// src/lib/content/tree.ts

export interface TreeNode {
  slug: string;           // e.g., "real-numbers"
  path: string;           // e.g., "math/precalculus/algebra/real-numbers"
  title: string;          // e.g., "Real Numbers"
  order: number;          // e.g., 1
  hasContent: boolean;    // true if .svx exists
  children: TreeNode[];
  prerequisites: string[];
}
```

### Tree Building

Tree is built at load time by scanning all glob-imported content files and constructing the hierarchy from paths.

### Sorting

```typescript
function sortTree(node: TreeNode) {
  node.children.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);  // Secondary sort
  });
  node.children.forEach(sortTree);
}
```

### Navigation Helpers

```typescript
// src/lib/content/nav.ts

// Find node by path
function findNode(path: string): TreeNode | null

// Get breadcrumb trail
function getBreadcrumbs(path: string): { path: string; title: string }[]

// Get prev/next siblings
function getSiblings(path: string): { prev?: TreeNode; next?: TreeNode }

// Get all paths (for pre-rendering)
function getAllPaths(): string[]
```

---

## Configuration

### Site Config

```typescript
// src/lib/config/site.ts

export const site = {
  name: 'garden',
  description: 'A garden where fine truths grow into something greater.',
  separator: '›',

  labels: {
    empty: 'coming soon',
    prerequisites: 'prerequisites',
    topics: 'topics'
  }
} as const;
```

### Theme (CSS Variables)

```css
/* src/app.css */
@import 'tailwindcss';

@theme {
  --color-bg: #1d2021;
  --color-bg-card: #282828;
  --color-fg: #ebdbb2;
  --color-fg-muted: #a89984;
  --color-border: #3c3836;
  --color-accent: #8ec07c;
  --color-math: #fabd2f;
  --color-error: #fb4934;

  --font-mono: 'Iosevka', monospace;
  --max-width: 42rem;
  --transition-fast: 100ms;
}

html {
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-mono);
  font-size: 20px;
}
```

Tailwind v4 automatically creates utilities from `@theme` block.

---

## Components

### Breadcrumbs

Windows Explorer style navigation:

```
garden › math › precalculus › algebra › equations
```

- Each segment clickable except current (last)
- Uses separator from config
- No emojis, no icons

```svelte
<!-- src/lib/components/Breadcrumbs.svelte -->
<script lang="ts">
  import { site } from '$lib/config/site';

  type Crumb = { path: string; title: string };
  let { crumbs }: { crumbs: Crumb[] } = $props();
</script>

<nav class="breadcrumbs">
  <a href="/" class="crumb">{site.name}</a>

  {#each crumbs as crumb, i}
    <span class="separator">{site.separator}</span>

    {#if i === crumbs.length - 1}
      <span class="crumb current">{crumb.title}</span>
    {:else}
      <a href="/{crumb.path}" class="crumb">{crumb.title}</a>
    {/if}
  {/each}
</nav>

<style>
  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .crumb {
    color: var(--color-fg-muted);
    transition: color var(--transition-fast);
  }

  .crumb:hover {
    color: var(--color-accent);
  }

  .crumb.current {
    color: var(--color-fg);
  }

  .separator {
    color: var(--color-fg-muted);
    opacity: 0.5;
    user-select: none;
  }
</style>
```

### Prerequisites

```svelte
<!-- src/lib/components/Prerequisites.svelte -->
<script lang="ts">
  import { site } from '$lib/config/site';
  import { findNode } from '$lib/content/nav';

  let { paths }: { paths: string[] } = $props();

  const topics = paths.map(p => {
    const node = findNode(p);
    return node ? { path: p, title: node.title } : null;
  }).filter(Boolean);
</script>

{#if topics.length > 0}
  <aside class="prerequisites">
    <p class="label">{site.labels.prerequisites}</p>
    <ul>
      {#each topics as topic}
        <li>
          <a href="/{topic.path}">{topic.title}</a>
        </li>
      {/each}
    </ul>
  </aside>
{/if}

<style>
  .prerequisites {
    border: 1px solid var(--color-border);
    padding: 1rem;
    margin-bottom: 2rem;
  }

  .label {
    color: var(--color-fg-muted);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin: 0.25rem 0;
  }

  a {
    color: var(--color-accent);
    transition: opacity var(--transition-fast);
  }

  a:hover {
    opacity: 0.8;
  }
</style>
```

### TreeView

Recursive tree navigation with dot-prefix for nested items:

```
Precalculus
  · Algebra
    · Real Numbers
    · Equations
  · Trigonometry
    · Unit Circle
Calculus
  · Limits
  · Derivatives
```

- Top level items: no prefix
- Nested items: `·` prefix via CSS `::before`
- All items are links
- Always expanded (no collapse state)

```svelte
<!-- src/lib/components/TreeView.svelte -->
<script lang="ts">
  import type { TreeNode } from '$lib/content/tree';
  import TreeView from './TreeView.svelte';

  let { nodes }: { nodes: TreeNode[] } = $props();
</script>

{#if nodes.length > 0}
  <ul class="tree">
    {#each nodes as node}
      <li>
        <a href="/{node.path}">{node.title}</a>
        {#if node.children.length > 0}
          <TreeView nodes={node.children} />
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .tree {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }

  :global(.tree .tree) {
    padding-left: 1rem;
  }

  :global(.tree .tree li)::before {
    content: '·';
    margin-right: 0.5rem;
    color: var(--color-fg-muted);
  }

  li {
    margin: 0.25rem 0;
  }

  a {
    color: var(--color-fg);
    transition: color var(--transition-fast);
  }

  a:hover {
    color: var(--color-accent);
  }
</style>
```

Note: Uses self-import (not deprecated `svelte:self`) and `:global()` for nested styles.

### Empty

```svelte
<!-- src/lib/components/Empty.svelte -->
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
```

### Navigation (Prev/Next)

```svelte
<!-- src/lib/components/Navigation.svelte -->
<script lang="ts">
  import type { TreeNode } from '$lib/content/tree';

  let { prev, next }: { prev?: TreeNode; next?: TreeNode } = $props();
</script>

{#if prev || next}
  <nav class="navigation">
    {#if prev}
      <a href="/{prev.path}" class="prev">
        <span class="arrow">←</span>
        <span class="title">{prev.title}</span>
      </a>
    {:else}
      <span></span>
    {/if}

    {#if next}
      <a href="/{next.path}" class="next">
        <span class="title">{next.title}</span>
        <span class="arrow">→</span>
      </a>
    {/if}
  </nav>
{/if}

<style>
  .navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border);
  }

  a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-fg-muted);
    transition: color var(--transition-fast);
  }

  a:hover {
    color: var(--color-accent);
  }

  .next {
    margin-left: auto;
  }
</style>
```

---

## Routes

### Landing Page

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { site } from '$lib/config/site';
  import { tree } from '$lib/content/tree';
</script>

<svelte:head>
  <title>{site.name}</title>
  <meta name="description" content={site.description} />
</svelte:head>

<main class="landing">
  <header>
    <h1>{site.name}</h1>
    <p class="description">{site.description}</p>
  </header>

  <nav class="subjects">
    {#each tree.children as subject}
      <a href="/{subject.path}" class="subject">
        <span class="title">{subject.title}</span>
      </a>
    {/each}
  </nav>
</main>

<style>
  .landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .description {
    color: var(--color-fg-muted);
    font-size: 0.875rem;
  }

  .subjects {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .subject {
    padding: 1rem 2rem;
    border: 1px solid var(--color-border);
    color: var(--color-fg);
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .subject:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
</style>
```

### Content Page Loader

```typescript
// src/routes/[...path]/+page.ts

import { getContent } from '$lib/content/loader';
import { findNode, getBreadcrumbs, getSiblings, getAllPaths } from '$lib/content/nav';
import { error } from '@sveltejs/kit';

export const prerender = true;

export async function entries() {
  const paths = getAllPaths();
  return paths.map(path => ({ path }));
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
```

### Content Page

```svelte
<!-- src/routes/[...path]/+page.svelte -->
<script lang="ts">
  import { site } from '$lib/config/site';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import Prerequisites from '$lib/components/Prerequisites.svelte';
  import TreeView from '$lib/components/TreeView.svelte';
  import Empty from '$lib/components/Empty.svelte';
  import Navigation from '$lib/components/Navigation.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.node.title} - {site.name}</title>
</svelte:head>

<main class="page">
  <Breadcrumbs crumbs={data.breadcrumbs} />

  <header>
    <h1>{data.node.title}</h1>
    <div class="divider"></div>
  </header>

  {#if data.node.prerequisites.length > 0}
    <Prerequisites paths={data.node.prerequisites} />
  {/if}

  {#if data.hasContent}
    <article class="content">
      <data.content />
    </article>
  {/if}

  {#if data.node.children.length > 0}
    <TreeView nodes={data.node.children} />
  {:else if !data.hasContent}
    <Empty />
  {/if}

  <Navigation prev={data.prev} next={data.next} />
</main>

<style>
  .page {
    min-height: 100vh;
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 3rem 1.5rem;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .divider {
    height: 1px;
    background: var(--color-border);
  }

  .content {
    line-height: 1.7;
  }

  .content :global(h2) {
    font-size: 1.125rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  .content :global(h3) {
    font-size: 1rem;
    color: var(--color-fg-muted);
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .content :global(p) {
    margin-bottom: 1rem;
    color: var(--color-fg-muted);
  }

  .content :global(strong) {
    color: var(--color-fg);
  }

  .content :global(a) {
    color: var(--color-accent);
  }

  .content :global(code) {
    background: var(--color-bg-card);
    padding: 0.125rem 0.375rem;
    font-size: 0.875em;
  }

  .content :global(pre) {
    background: var(--color-bg-card);
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
</style>
```

---

## Math Rendering

Using remark-math@3 + rehype-katex-svelte for LaTeX (compatible with MDsveX's unified v9):

### SvelteKit Config

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import remarkMath from 'remark-math';
import rehypeKatexSvelte from 'rehype-katex-svelte';
import { animationPreprocessor } from './src/lib/content/animation-preprocessor.js';

const config = {
  extensions: ['.svelte', '.svx'],

  preprocess: [
    animationPreprocessor(),  // Must run before mdsvex
    vitePreprocess(),
    mdsvex({
      extensions: ['.svx'],
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatexSvelte]
    })
  ],

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null,
      precompress: false
    }),
    prerender: {
      handleHttpError: 'warn'
    }
  }
};

export default config;
```

Notes:
- `animationPreprocessor` runs before mdsvex to transform `::animation-name` syntax
- `rehype-katex-svelte` avoids Svelte template conflicts with LaTeX curly braces

### KaTeX CSS

Import in app.css or layout:
```css
@import 'katex/dist/katex.min.css';
```

Override math color:
```css
.katex {
  color: var(--color-math);
}
```

### Usage in .svx

```markdown
Inline: $x^2 + y^2 = r^2$

Block:
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

---

## Animations

Animations use D3.js and live alongside their content in `animations/` folders.

### Syntax

In any `.svx` file, use the `::animation-name` syntax on its own line:

```markdown
Some content explaining the concept...

::number-line

More content after the animation...
```

### How It Works

1. **Preprocessor** (`animation-preprocessor.js`) runs before MDsveX
2. Finds `::name` patterns and extracts the content directory from the filename
3. Transforms to `<Animation name="name" dir="00-math/01-topic" />`
4. Injects the import statement automatically

### File Structure

Animations live in an `animations/` folder next to the content:

```
src/content/00-math/01-precalculus/01-algebra/
├── index.svx           # Uses ::number-line
├── 01-real-numbers.svx
└── animations/
    └── number-line.svelte
```

### Animation Component Example

```svelte
<!-- animations/number-line.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let { min = -5, max = 5 }: { min?: number; max?: number } = $props();
  let container: HTMLDivElement;

  onMount(() => {
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 400 80');

    // D3 visualization code...
  });
</script>

<div bind:this={container} class="animation"></div>

<style>
  .animation {
    width: 100%;
    max-width: 400px;
    margin: 1.5rem auto;
  }
</style>
```

### Animation Colors

Reference CSS variables directly in D3:
```javascript
svg.append('circle')
  .style('fill', 'var(--color-accent)');
```

### The Animation Loader Component

`src/lib/components/Animation.svelte` handles dynamic loading:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let { name, dir, ...props }: { name: string; dir: string } = $props();

  const modules = import.meta.glob<{ default: typeof import('svelte').SvelteComponent }>(
    '/src/content/**/animations/*.svelte'
  );

  let Component = $state(null);
  let error = $state(null);

  onMount(async () => {
    const path = `/src/content/${dir}/animations/${name}.svelte`;
    if (modules[path]) {
      const module = await modules[path]();
      Component = module.default;
    } else {
      error = `Not found: ${name}`;
    }
  });
</script>

{#if error}
  <div class="animation-error">{error}</div>
{:else if Component}
  <Component {...props} />
{/if}
```

---

## Layout

### Global Layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css';
</script>

<slot />
```

### Page Layout (plainsight style)

- Max width: 42rem (var(--max-width))
- Padding: 1.5rem horizontal, 3rem vertical
- Centered with margin auto
- Sections separated by horizontal dividers
- Typography: monospace (Iosevka)

---

## Pre-rendering

All pages are statically generated at build time.

```typescript
// In +page.ts files
export const prerender = true;

export async function entries() {
  // Return all valid paths
}
```

Output to `build/` directory. Can be hosted on:
- GitHub Pages
- Netlify
- Vercel
- Any static host

---

## Dependencies

```json
{
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^6.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "d3": "^7.9.0",
    "katex": "^0.16.0",
    "mdsvex": "^0.12.0",
    "rehype-katex-svelte": "^1.2.0",
    "remark-math": "^3.0.0",
    "svelte": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^7.0.0"
  }
}
```

Note: `remark-math@3` is required for compatibility with MDsveX's unified v9 ecosystem.

---

## File Naming Conventions

### Content Files

```
[order]-[slug].svx
[order]-[slug]/
```

- Order: Sequential numbers (01, 02, 03...)
- Slug: lowercase, hyphen-separated
- Examples:
  - `01-real-numbers.svx`
  - `02-equations.svx`
  - `03-polynomials/`

### Component Files

- PascalCase: `Breadcrumbs.svelte`, `TreeView.svelte`
- Animation components: `[Topic]Animation.svelte`

### Config/Utility Files

- camelCase: `site.ts`, `loader.ts`, `tree.ts`

---

## Adding New Content

1. Create .svx file in appropriate location:
   ```
   src/content/00-math/01-precalculus/01-algebra/04-new-topic.svx
   ```

2. Add frontmatter:
   ```yaml
   ---
   title: Custom Title
   prerequisites:
     - math/precalculus/algebra/equations
   ---
   ```

3. Write content using markdown + LaTeX + animations:
   ```markdown
   ## Section Title

   Some explanation with $inline$ math and block math:
   $$x^2 + y^2 = r^2$$

   ::my-animation
   ```

4. If using animations, create the animation file:
   ```
   src/content/00-math/01-precalculus/01-algebra/animations/my-animation.svelte
   ```

5. Done. Rebuild to see changes.

---

## Validation (Build Time)

Consider adding build-time checks:
- Warn if prerequisite paths don't exist
- Warn if orphaned content (not in hierarchy)
- Check for duplicate order numbers in same folder

---

## Future Considerations

- Progress tracking (localStorage)
- Search functionality (Pagefind)
- Dark/light theme toggle (if needed)
- Mobile optimizations
- PWA support

---

## Reference: Plainsight Style

The design should match plainsight's "how it works" page:
- Clean, minimal layout
- Horizontal dividers between sections
- Monospace typography
- Muted colors for secondary text
- Accent color on hover/interaction
- No decorative elements
- Content-focused

