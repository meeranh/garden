# Garden - Learning Platform

A learning platform built with SvelteKit, featuring interactive animations and LaTeX rendering.

## Communicating With Me

When explaining things in the terminal:
- **Use simple language** - Same style as the content. Clear, direct, no jargon.
- **No LaTeX in terminal** - My terminal doesn't render it. Write `x^2` not `$x^2$`, use words like "for all" instead of `\forall`.

---

## Content Workflow

**Teach me first, then write the chapter.**

Before writing any content file, explain the concept to me in the terminal. Let me understand it, ask questions, and confirm I get it. Only then write the `.svx` file.

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

### Curriculum
Subject curricula are in the `curriculum/` folder. Check these to see what topics to cover next.

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

### Index Files
Index files (`index.svx`) should contain **only the title frontmatter**. No content.
```markdown
---
title: Section Name
---
```

### Writing Style
- **Never use em dashes** (—). Use "and", commas, or rephrase instead.
- **No "Quick Practice" or "Summary" sections.** The content should stand on its own.
- **Don't let examples break the flow.** One clear example per concept is enough. Too many examples interrupt the natural reading flow and make things harder to understand, not easier.
- **No trailing `---` at end of files.** The system adds this automatically.

---

## Formatting (Use Generously)

Formatting adds visual rhythm and emphasis. Use it liberally.

### Section Breaks (`---`)
Use `---` frequently to create "slide-like" breaks. Almost every few paragraphs:
```markdown
A set is a collection of distinct objects.

---

**Examples from everyday life:**

- A bag of marbles — that's a set of marbles
- Your playlist — that's a set of songs

---

## Next Section
```

### Bold (`**...**`)
Use for **key terms**, **emphasis**, and **labels**:
```markdown
A **set** is a collection of distinct objects.

The result is true only when **both** are true.

**Example:** Nuclear launch system

There are **five** basic connectives:
```

### Italics (`*...*`)
Use for *softer emphasis*, *asides*, and *contrast*:
```markdown
That's it. Not "maybe true" — it must be *definitively* one or the other.

Think of it like a checklist — *every item must be checked*.

A set cares about *what's in it*, not *how many times* you wrote it.

*This lets us focus on the structure, not the specific words.*
```

### Blockquotes (`>`)
Use for **definitions**, **key insights**, and **memorable takeaways**:
```markdown
> A **proposition** is a statement that is either **true** or **false**.

> **Key insight:** IF-THEN is only false when the condition happens but the result doesn't.

> This reads: "2 **is in** the set"

> **When you need more than just the previous value, use strong induction.**
```

### Tables
Use for comparisons, examples, and structured data:
```markdown
| Statement | True or False? |
|-----------|----------------|
| "The sky is blue" | True |
| "2 + 2 = 5" | False |
```

### Combining Formats
Layer emphasis for rhythm:
```markdown
> **Only the first row is true.** One officer alone cannot launch. *Both must act together.*

The symbol $\in$ means "is an element of" or "belongs to":

> This reads: "2 **is in** the set $\{1, 2, 3\}$"
```

### Formatting Patterns
- **Bold** = punch words, key terms, labels
- **Italics** = soft emphasis, qualifiers, asides
- **Blockquotes** = definitions, insights, takeaways
- **Tables** = comparisons, truth tables, examples
- **`---`** = visual breathing room (use often!)

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

1. **Use D3.js** for smooth animations and transitions
2. **Actual motion** - Elements should move, appear, transform. Not static diagrams flipping between states.
3. **Step-driven state** - Animate through steps with clear labels showing what's happening
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
