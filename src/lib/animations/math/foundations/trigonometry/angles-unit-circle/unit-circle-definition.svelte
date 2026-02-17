<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

  let { register }: { register?: (controller: AnimationController) => void } = $props();
  let svg: SVGSVGElement;
  let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let timeouts: ReturnType<typeof setTimeout>[] = [];
  let colors: Record<string, string>;

  const maxStep = 2;
  let isPlaying = $state(false);
  let currentStep = $state(0);

  let elements: Record<string, d3.Selection<any, any, any, any>> = {};

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const width = 400;
  const height = 380;
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = 120;

  function applyStep(step: number) {
    currentStep = step;

    elements.axes?.attr('opacity', 0);
    elements.circle?.attr('opacity', 0);
    elements.centerDot?.attr('opacity', 0);
    elements.radiusLine?.attr('opacity', 0);
    elements.radiusLabel?.attr('opacity', 0);
    elements.equation?.attr('opacity', 0);
    elements.title?.attr('opacity', 1);

    if (step >= 0) {
      elements.title?.text('A circle centered at the origin');
      elements.axes?.attr('opacity', 1);
      elements.circle?.attr('opacity', 1);
      elements.centerDot?.attr('opacity', 1);
    }

    if (step >= 1) {
      elements.title?.text('With radius = 1');
      elements.radiusLine?.attr('opacity', 1);
      elements.radiusLabel?.attr('opacity', 1);
    }

    if (step >= 2) {
      elements.title?.text('This is the unit circle');
      elements.equation?.attr('opacity', 1);
    }
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
      .attr('fill', colors.fg).attr('font-size', '16px')
      .attr('text-anchor', 'middle');

    // Axes group
    elements.axes = svgEl.append('g').attr('opacity', 0);

    // X-axis
    elements.axes.append('line')
      .attr('x1', cx - radius - 30).attr('y1', cy)
      .attr('x2', cx + radius + 30).attr('y2', cy)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Y-axis
    elements.axes.append('line')
      .attr('x1', cx).attr('y1', cy + radius + 30)
      .attr('x2', cx).attr('y2', cy - radius - 30)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Axis labels
    elements.axes.append('text')
      .attr('x', cx + radius + 35).attr('y', cy + 5)
      .attr('fill', colors.muted).attr('font-size', '14px')
      .text('x');

    elements.axes.append('text')
      .attr('x', cx + 5).attr('y', cy - radius - 35)
      .attr('fill', colors.muted).attr('font-size', '14px')
      .text('y');

    // Tick marks at 1 and -1 on x-axis
    elements.axes.append('line')
      .attr('x1', cx + radius).attr('y1', cy - 5)
      .attr('x2', cx + radius).attr('y2', cy + 5)
      .attr('stroke', colors.muted);
    elements.axes.append('text')
      .attr('x', cx + radius + 12).attr('y', cy + 18)
      .attr('fill', colors.muted).attr('font-size', '12px')
      .text('1');

    elements.axes.append('line')
      .attr('x1', cx - radius).attr('y1', cy - 5)
      .attr('x2', cx - radius).attr('y2', cy + 5)
      .attr('stroke', colors.muted);
    elements.axes.append('text')
      .attr('x', cx - radius - 18).attr('y', cy + 18)
      .attr('fill', colors.muted).attr('font-size', '12px')
      .text('-1');

    // Tick marks at 1 and -1 on y-axis
    elements.axes.append('line')
      .attr('x1', cx - 5).attr('y1', cy - radius)
      .attr('x2', cx + 5).attr('y2', cy - radius)
      .attr('stroke', colors.muted);
    elements.axes.append('text')
      .attr('x', cx - 18).attr('y', cy - radius - 8)
      .attr('fill', colors.muted).attr('font-size', '12px')
      .text('1');

    elements.axes.append('line')
      .attr('x1', cx - 5).attr('y1', cy + radius)
      .attr('x2', cx + 5).attr('y2', cy + radius)
      .attr('stroke', colors.muted);
    elements.axes.append('text')
      .attr('x', cx - 18).attr('y', cy + radius + 15)
      .attr('fill', colors.muted).attr('font-size', '12px')
      .text('-1');

    // Circle
    elements.circle = svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0);

    // Center dot
    elements.centerDot = svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', 4)
      .attr('fill', colors.fg)
      .attr('opacity', 0);

    // Radius line
    elements.radiusLine = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + radius).attr('y2', cy)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    // Radius label
    elements.radiusLabel = svgEl.append('text')
      .attr('x', cx + radius / 2).attr('y', cy - 12)
      .attr('fill', colors.yellow)
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('1')
      .attr('opacity', 0);

    // Equation
    elements.equation = svgEl.append('text')
      .attr('x', cx).attr('y', height - 15)
      .attr('fill', colors.muted)
      .attr('font-size', '14px')
      .attr('text-anchor', 'middle')
      .text('x² + y² = 1')
      .attr('opacity', 0);

    applyStep(0);
    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 380px; }
</style>
