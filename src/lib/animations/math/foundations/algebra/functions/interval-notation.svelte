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
  let colors: Record<string, string>;

  const maxStep = 5;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    currentStep = step;

    svgEl.select('.legend').transition().duration(300).attr('opacity', 1);
    svgEl.select('.interval-0').transition().duration(300).attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.interval-1').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.interval-2').transition().duration(300).attr('opacity', step >= 3 ? 1 : 0);
    svgEl.select('.interval-3').transition().duration(300).attr('opacity', step >= 4 ? 1 : 0);
    svgEl.select('.interval-4').transition().duration(300).attr('opacity', step >= 5 ? 1 : 0);
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1500);
      if (!isPlaying) return;
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() { pause(); currentStep = 0; applyStep(0); isPlaying = true; runAnimation(); }
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

    const width = 530;
    const height = 265;
    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const lineLeft = 120;
    const lineRight = 400;
    const lineWidth = lineRight - lineLeft;

    // Scale: maps value to x position (0-10 range for finite, extended for infinity)
    const toX = (val: number) => lineLeft + (val / 10) * lineWidth;

    // Intervals to show
    const intervals = [
      { left: 2, right: 5, leftIncl: true, rightIncl: true, label: '[2, 5]', meaning: '2 ≤ x ≤ 5' },
      { left: 2, right: 5, leftIncl: false, rightIncl: false, label: '(2, 5)', meaning: '2 < x < 5' },
      { left: 2, right: 5, leftIncl: true, rightIncl: false, label: '[2, 5)', meaning: '2 ≤ x < 5' },
      { left: -Infinity, right: 3, leftIncl: false, rightIncl: true, label: '(-∞, 3]', meaning: 'x ≤ 3' },
      { left: 0, right: Infinity, leftIncl: true, rightIncl: false, label: '[0, ∞)', meaning: 'x ≥ 0' },
    ];

    const rowHeight = 45;
    const startY = 55;

    // Legend at top (centered)
    const legend = svgEl.append('g').attr('class', 'legend');

    // Filled dot = included
    legend.append('circle')
      .attr('cx', 150).attr('cy', 20)
      .attr('r', 6)
      .attr('fill', colors.accent);

    legend.append('text')
      .attr('x', 165).attr('y', 24)
      .attr('fill', colors.fg)
      .attr('font-size', '12px')
      .text('= included');

    // Hollow dot = excluded
    legend.append('circle')
      .attr('cx', 280).attr('cy', 20)
      .attr('r', 6)
      .attr('fill', colors.bg)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 295).attr('y', 24)
      .attr('fill', colors.fg)
      .attr('font-size', '12px')
      .text('= excluded');

    // Draw each interval
    intervals.forEach((int, i) => {
      const g = svgEl.append('g').attr('class', `interval-${i}`).attr('opacity', 0);
      const y = startY + i * rowHeight;

      // Number line
      g.append('line')
        .attr('x1', lineLeft - 20).attr('y1', y)
        .attr('x2', lineRight + 20).attr('y2', y)
        .attr('stroke', colors.muted)
        .attr('stroke-width', 1);

      // Tick marks
      for (let v = 0; v <= 10; v += 2) {
        g.append('line')
          .attr('x1', toX(v)).attr('y1', y - 4)
          .attr('x2', toX(v)).attr('y2', y + 4)
          .attr('stroke', colors.muted)
          .attr('stroke-width', 1);

        g.append('text')
          .attr('x', toX(v)).attr('y', y + 16)
          .attr('text-anchor', 'middle')
          .attr('fill', colors.muted)
          .attr('font-size', '10px')
          .text(v);
      }

      // Highlighted segment
      const leftX = int.left === -Infinity ? lineLeft - 15 : toX(int.left);
      const rightX = int.right === Infinity ? lineRight + 15 : toX(int.right);

      g.append('line')
        .attr('x1', leftX).attr('y1', y)
        .attr('x2', rightX).attr('y2', y)
        .attr('stroke', colors.accent)
        .attr('stroke-width', 4);

      // Left endpoint (or arrow for -∞)
      if (int.left === -Infinity) {
        // Arrow pointing left
        g.append('polygon')
          .attr('points', `${lineLeft - 20},${y} ${lineLeft - 12},${y - 5} ${lineLeft - 12},${y + 5}`)
          .attr('fill', colors.accent);
      } else {
        g.append('circle')
          .attr('cx', toX(int.left)).attr('cy', y)
          .attr('r', 6)
          .attr('fill', int.leftIncl ? colors.accent : colors.bg)
          .attr('stroke', colors.accent)
          .attr('stroke-width', 2);
      }

      // Right endpoint (or arrow for ∞)
      if (int.right === Infinity) {
        // Arrow pointing right
        g.append('polygon')
          .attr('points', `${lineRight + 20},${y} ${lineRight + 12},${y - 5} ${lineRight + 12},${y + 5}`)
          .attr('fill', colors.accent);
      } else {
        g.append('circle')
          .attr('cx', toX(int.right)).attr('cy', y)
          .attr('r', 6)
          .attr('fill', int.rightIncl ? colors.accent : colors.bg)
          .attr('stroke', colors.accent)
          .attr('stroke-width', 2);
      }

      // Interval notation label (left side)
      g.append('text')
        .attr('x', 30).attr('y', y + 5)
        .attr('fill', colors.yellow)
        .attr('font-size', '15px')
        .attr('font-weight', 'bold')
        .text(int.label);

      // Meaning (right side)
      g.append('text')
        .attr('x', lineRight + 45).attr('y', y + 5)
        .attr('fill', colors.fg)
        .attr('font-size', '13px')
        .text(int.meaning);
    });

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 700px; }
</style>
