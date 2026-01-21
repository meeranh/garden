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

  const maxStep = 0;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
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

    const width = 420;
    const height = 280;
    const margin = { top: 55, right: 30, bottom: 35, left: 30 };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([-5, 5])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-1, 5])
      .range([height - margin.bottom, margin.top]);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Even Function: f(x) = x²');

    svgEl.append('text')
      .attr('x', width / 2).attr('y', 42)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .text('f(-x) = f(x)');

    // Axes
    svgEl.append('line')
      .attr('x1', margin.left).attr('y1', yScale(0))
      .attr('x2', width - margin.right).attr('y2', yScale(0))
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    svgEl.append('line')
      .attr('x1', xScale(0)).attr('y1', height - margin.bottom)
      .attr('x2', xScale(0)).attr('y2', margin.top)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Draw parabola: y = x²/5 (scaled to fit nicely)
    const curveData: [number, number][] = [];
    for (let x = -5; x <= 5; x += 0.1) {
      const y = x * x / 5;
      if (y <= 5) {
        curveData.push([x, y]);
      }
    }

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveNatural);

    svgEl.append('path')
      .datum(curveData)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Symmetric points at x = ±3
    const px = 3;
    const py = px * px / 5;

    // Point at (x, f(x))
    svgEl.append('circle')
      .attr('cx', xScale(px)).attr('cy', yScale(py))
      .attr('r', 6)
      .attr('fill', colors.yellow);

    svgEl.append('text')
      .attr('x', xScale(px) + 10).attr('y', yScale(py) + 4)
      .attr('text-anchor', 'start')
      .attr('fill', colors.yellow)
      .attr('font-size', '13px')
      .text('(x, f(x))');

    // Point at (-x, f(x))
    svgEl.append('circle')
      .attr('cx', xScale(-px)).attr('cy', yScale(py))
      .attr('r', 6)
      .attr('fill', colors.yellow);

    svgEl.append('text')
      .attr('x', xScale(-px) - 10).attr('y', yScale(py) + 4)
      .attr('text-anchor', 'end')
      .attr('fill', colors.yellow)
      .attr('font-size', '13px')
      .text('(-x, f(x))');

    // Horizontal dashed line connecting them
    svgEl.append('line')
      .attr('x1', xScale(-px)).attr('y1', yScale(py))
      .attr('x2', xScale(px)).attr('y2', yScale(py))
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');

    // Y-axis highlight (mirror line)
    svgEl.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(0))
      .attr('x2', xScale(0)).attr('y2', margin.top)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2)
      .attr('opacity', 0.5);

    // Bottom label
    svgEl.append('text')
      .attr('x', width / 2).attr('y', height - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('Symmetric about the y-axis');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 420px; }
</style>
