<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

  let { register }: { register?: (controller: AnimationController) => void } = $props();
  let svg: SVGSVGElement;
  let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let timeouts: ReturnType<typeof setTimeout>[] = [];
  let colors: Record<string, string>;

  const maxStep = 4;
  let isPlaying = $state(false);
  let currentStep = $state(0);

  let elements: Record<string, d3.Selection<any, any, any, any>> = {};

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const width = 420;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = 130;

  const keyPoints = [
    { angle: 0, coord: '(1, 0)', x: 1, y: 0 },
    { angle: 90, coord: '(0, 1)', x: 0, y: 1 },
    { angle: 180, coord: '(-1, 0)', x: -1, y: 0 },
    { angle: 270, coord: '(0, -1)', x: 0, y: -1 },
  ];

  function applyStep(step: number) {
    currentStep = step;

    elements.title?.attr('opacity', 1);

    // Hide all point elements
    for (let i = 0; i < 4; i++) {
      elements[`point${i}`]?.attr('opacity', 0);
      elements[`label${i}`]?.attr('opacity', 0);
      elements[`line${i}`]?.attr('opacity', 0);
    }

    if (step === 0) {
      elements.title?.text('Key points on the unit circle');
    }

    for (let i = 0; i < step && i < 4; i++) {
      elements[`point${i}`]?.attr('opacity', 1);
      elements[`label${i}`]?.attr('opacity', 1);
      elements[`line${i}`]?.attr('opacity', 1);
    }

    if (step === 1) elements.title?.text('At 0°: cos 0° = 1, sin 0° = 0');
    if (step === 2) elements.title?.text('At 90°: cos 90° = 0, sin 90° = 1');
    if (step === 3) elements.title?.text('At 180°: cos 180° = -1, sin 180° = 0');
    if (step === 4) elements.title?.text('At 270°: cos 270° = 0, sin 270° = -1');
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(2000);
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() { pause(); currentStep = 0; applyStep(0); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      accent: s.getPropertyValue('--color-accent').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      muted: s.getPropertyValue('--color-fg-muted').trim(),
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Title
    elements.title = svgEl.append('text')
      .attr('x', cx).attr('y', 30)
      .attr('fill', colors.fg).attr('font-size', '15px')
      .attr('text-anchor', 'middle');

    // Axes
    svgEl.append('line')
      .attr('x1', cx - radius - 25).attr('y1', cy)
      .attr('x2', cx + radius + 25).attr('y2', cy)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    svgEl.append('line')
      .attr('x1', cx).attr('y1', cy + radius + 25)
      .attr('x2', cx).attr('y2', cy - radius - 25)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Circle
    svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2);

    // Center
    svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', 3)
      .attr('fill', colors.muted);

    // Create key points
    keyPoints.forEach((p, i) => {
      const px = cx + p.x * radius;
      const py = cy - p.y * radius;

      // Line from center
      elements[`line${i}`] = svgEl.append('line')
        .attr('x1', cx).attr('y1', cy)
        .attr('x2', px).attr('y2', py)
        .attr('stroke', colors.yellow)
        .attr('stroke-width', 2)
        .attr('opacity', 0);

      // Point
      elements[`point${i}`] = svgEl.append('circle')
        .attr('cx', px).attr('cy', py)
        .attr('r', 8)
        .attr('fill', colors.yellow)
        .attr('opacity', 0);

      // Label - position based on which point
      let labelX = px;
      let labelY = py;
      let anchor = 'middle';

      if (p.x === 1) { labelX += 15; anchor = 'start'; }
      if (p.x === -1) { labelX -= 15; anchor = 'end'; }
      if (p.y === 1) { labelY -= 15; }
      if (p.y === -1) { labelY += 25; }

      elements[`label${i}`] = svgEl.append('text')
        .attr('x', labelX).attr('y', labelY)
        .attr('fill', colors.yellow)
        .attr('font-size', '15px')
        .attr('font-weight', 'bold')
        .attr('text-anchor', anchor)
        .text(p.coord)
        .attr('opacity', 0);
    });

    applyStep(0);
    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 420px; }
</style>
