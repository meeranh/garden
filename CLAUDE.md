# Garden - Learning Platform

A learning platform built with SvelteKit, featuring interactive animations and LaTeX rendering.

## Communicating With Me

When explaining things in the terminal:
- **Use simple language** - Same style as the content. Clear, direct, no jargon.
- **No LaTeX in terminal** - My terminal doesn't render it. Write `x^2` not `$x^2$`, use words like "for all" instead of `\forall`.

---

## Content Philosophy

**Teach simply, not simplistically.** We explain complex ideas through:

1. **Start concrete** - Begin with intuition, examples, or "why does this matter?"
2. **Build incrementally** - Each section adds one idea, separated by `---` breaks
3. **Show, then formalize** - Practical examples first, formal definitions after understanding exists
4. **Use animations for insight** - Not decorations, but tools to make abstract ideas tangible

Content reads like a conversation, not a textbook. Short paragraphs. Clear language. No fluff.

---

## Writing Content (.svx files)

### File Location
```
src/content/00-subject/00-section/01-topic-name.svx
```
- Numeric prefixes (`00-`, `01-`) control ordering
- Kebab-case names become URL slugs

### Structure
```markdown
---
title: Topic Name
prerequisites:
  - subject/section/previous-topic
---

## Start With Why

Explain why this matters. What problem does it solve?

---

## Build the Idea

Use `---` to create visual breaks between sections (like slides).

> Blockquotes highlight key insights or definitions.

---

## Add Examples

| Case | Result |
|------|--------|
| A    | X      |
| B    | Y      |

---

## Then Formalize

Give the precise definition or formal statement.
```

### Flow Pattern
Each topic follows: **Why?** → **What is it?** → **Examples** → **Formal definition** → **Summary**

Adapt this pattern to fit the subject - not every topic needs all sections.

---

## LaTeX

**Inline:** `$x^2$` renders within text

**Display:** `$$\frac{a}{b}$$` renders centered on its own line

### Common Symbols
```
Logic:      \neg \land \lor \to \leftrightarrow \forall \exists
Sets:       \in \notin \subseteq \subset \cup \cap \setminus \emptyset
Numbers:    \mathbb{N} \mathbb{Z} \mathbb{Q} \mathbb{R}
Formatting: \frac{a}{b}  x^2  a_{ij}  \ldots  \text{words}
Set-builder: \{x \mid x > 0\}
```

---

## Animations

### Including in Content
```markdown
::animation-name
```
This loads `animations/animation-name.svelte` from the same directory.

### Creating an Animation

Place in `animations/` subdirectory alongside content:
```
00-topic/
├── 01-lesson.svx
└── animations/
    └── my-animation.svelte
```

### Animation Template
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

  let { register }: { register?: (controller: AnimationController) => void } = $props();

  let currentStep = $state(0);
  let isPlaying = $state(false);
  let animationTimer: ReturnType<typeof setTimeout> | null = null;

  const totalSteps = 5;
  const maxStep = totalSteps - 1;

  // Compute what to display based on current step
  let display = $derived.by(() => {
    if (currentStep === 0) return { title: 'Step 1', /* ... */ };
    if (currentStep === 1) return { title: 'Step 2', /* ... */ };
    // ...
  });

  // Required controller methods
  function play() {
    if (isPlaying) return;
    isPlaying = true;
    scheduleNext();
  }

  function pause() {
    isPlaying = false;
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }

  function next() { if (currentStep < maxStep) currentStep++; }
  function prev() { if (currentStep > 0) currentStep--; }
  function skip() { pause(); currentStep = maxStep; }
  function replay() { pause(); currentStep = 0; play(); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  function scheduleNext() {
    if (!isPlaying) return;
    animationTimer = setTimeout(() => {
      if (!isPlaying) return;
      if (currentStep < maxStep) {
        currentStep++;
        scheduleNext();
      } else {
        isPlaying = false;
      }
    }, 1500); // ms per step
  }

  onMount(() => register?.({ play, pause, next, prev, skip, replay, getState }));
  onDestroy(() => pause());
</script>

<div class="container">
  <div class="title">{display.title}</div>
  <!-- Animation content here -->
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
  }

  .title {
    color: var(--color-fg);
  }
</style>
```

### Animation Principles

1. **Actual motion** - Elements should move, appear, transform. Not static diagrams flipping between states.
2. **CSS transitions** - Add `transition: all 0.3s ease` to elements that change
3. **Step-driven state** - Use `$derived.by()` to compute display from `currentStep`
4. **Progressive reveal** - Each step adds one piece of understanding

### Colors (never hardcode)
```css
var(--color-bg)        /* #1d2021 - dark background */
var(--color-bg-card)   /* #282828 - elevated surfaces */
var(--color-fg)        /* #fbf1c7 - primary text */
var(--color-fg-muted)  /* #d5c4a1 - secondary text */
var(--color-border)    /* #3c3836 - borders */
var(--color-accent)    /* #8ec07c - green, positive states */
var(--color-math)      /* #fabd2f - yellow, equations */
var(--color-error)     /* #fb4934 - red, invalid states */
```

### SVG Animation Pattern
```svelte
<svg viewBox="0 0 300 150">
  <circle
    cx={position.x}
    cy={position.y}
    r="18"
    class="element"
    class:active={display.isActive}
  />

  {#each display.arrows as arrow}
    <line x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2} class="arrow" />
  {/each}
</svg>

<style>
  .element {
    fill: var(--color-bg-card);
    stroke: var(--color-fg-muted);
    transition: all 0.3s ease;
  }

  .element.active {
    stroke: var(--color-accent);
  }

  .arrow {
    stroke: var(--color-accent);
    stroke-width: 2;
    transition: all 0.3s ease;
  }
</style>
```

---

## Quick Reference

| Task | How |
|------|-----|
| New lesson | Create `XX-name.svx` with frontmatter |
| Section break | `---` on its own line |
| Key insight | `> Blockquote text` |
| Inline math | `$x^2$` |
| Display math | `$$\frac{a}{b}$$` |
| Include animation | `::animation-name` |
| Link prerequisite | Add to `prerequisites:` in frontmatter |

---

## Build & Dev

```bash
bun dev      # Development server
bun build    # Static build to /build
bun check    # TypeScript checking
```

---

## Git Commits

Use semantic commit messages:
- `content:` for content changes (lessons, animations)
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code restructuring
- `style:` for styling changes
- `docs:` for documentation
