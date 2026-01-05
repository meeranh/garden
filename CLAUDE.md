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

### Usage
`::animation-name` loads `animations/animation-name.svelte` from same directory.

### Template

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

  let { register }: { register?: (controller: AnimationController) => void } = $props();
  let svg: SVGSVGElement;
  let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let isPlaying = $state(false);
  let currentStep = $state(0);
  let timeouts: ReturnType<typeof setTimeout>[] = [];

  const maxStep = 4;
  const allElements = ['element-a', 'element-b', 'arrow'];  // All animatable elements

  // Step -> which elements are visible (cumulative, for next/prev)
  const stepVisibility: Record<number, string[]> = {
    0: ['element-a'],
    1: ['element-a', 'element-b'],
    2: ['element-a', 'element-b', 'arrow'],
  };

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    const visible = stepVisibility[step] || [];
    allElements.forEach((el) => {
      svgEl.select(`.${el}`).transition().duration(300).attr('opacity', visible.includes(el) ? 1 : 0);
    });
    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;  // Early exit check
      currentStep = i;
      // D3 transitions here...
      svgEl.select('.element-a').transition().duration(400).attr('opacity', 1);
      await sleep(1500);
      if (!isPlaying) return;  // Check after every sleep!
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() { pause(); currentStep = 0; isPlaying = true; runAnimation(); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  onMount(() => {
    svgEl = d3.select(svg).attr('viewBox', '0 0 500 300');
    // Create elements with class matching allElements, start hidden
    svgEl.append('rect').attr('class', 'element-a').attr('opacity', 0)/*...*/;
    svgEl.append('rect').attr('class', 'element-b').attr('opacity', 0)/*...*/;
    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: #1d2021; border-radius: 0.5rem; }
</style>
```

### Key Points

1. **`stepVisibility`** - Map step number to list of ALL visible element classes
2. **`allElements`** - Array of all element class names (must match what you create)
3. **`applyStep(n)`** - Shows/hides elements for step n (makes next/prev work)
4. **Early exit** - Check `if (!isPlaying) return` after every `await sleep()`
5. **Elements start hidden** - Create with `.attr('opacity', 0)`

### Colors (fetch from CSS variables in onMount)
```javascript
let colors: Record<string, string>;

onMount(() => {
  const s = getComputedStyle(document.documentElement);
  colors = {
    bg: s.getPropertyValue('--color-bg').trim(),
    fg: s.getPropertyValue('--color-fg').trim(),
    fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
    accent: s.getPropertyValue('--color-accent').trim(),
    yellow: s.getPropertyValue('--color-math').trim(),
    border: s.getPropertyValue('--color-border').trim(),
  };
  // ... rest of onMount
});
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
