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

  const maxStep = 2;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  let xScale: d3.ScaleLinear<number, number>;
  let yScale: d3.ScaleLinear<number, number>;
  let lineGenerator: d3.Line<[number, number]>;

  function getParabolaData(hShift: number): [number, number][] {
    const data: [number, number][] = [];
    for (let x = -5; x <= 5; x += 0.1) {
      const y = (x - hShift) * (x - hShift);
      data.push([x, y]);
    }
    return data;
  }

  function applyStep(step: number) {
    currentStep = step;

    svgEl.select('.original').attr('opacity', 1);
    svgEl.select('.label-original').attr('opacity', 1);

    svgEl.select('.shifted-right').attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.label-right').attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.shifted-left').attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.label-left').attr('opacity', step >= 2 ? 1 : 0);

    if (step >= 1) {
      svgEl.select('.shifted-right').attr('d', lineGenerator(getParabolaData(2)));
    }
    if (step >= 2) {
      svgEl.select('.shifted-left').attr('d', lineGenerator(getParabolaData(-2)));
    }
  }

  async function runAnimation() {
    if (!isPlaying) return;

    // Step 0: Original
    currentStep = 0;
    applyStep(0);
    await sleep(800);
    if (!isPlaying) return;

    // Step 1: Shift right (f(x - 2))
    currentStep = 1;
    svgEl.select('.shifted-right')
      .attr('opacity', 1)
      .attr('d', lineGenerator(getParabolaData(0)));

    svgEl.select('.shifted-right')
      .transition()
      .duration(800)
      .attr('d', lineGenerator(getParabolaData(2)));

    svgEl.select('.label-right')
      .attr('opacity', 0)
      .transition()
      .delay(600)
      .duration(300)
      .attr('opacity', 1);

    await sleep(1200);
    if (!isPlaying) return;

    // Step 2: Shift left (f(x + 2))
    currentStep = 2;
    svgEl.select('.shifted-left')
      .attr('opacity', 1)
      .attr('d', lineGenerator(getParabolaData(0)));

    svgEl.select('.shifted-left')
      .transition()
      .duration(800)
      .attr('d', lineGenerator(getParabolaData(-2)));

    svgEl.select('.label-left')
      .attr('opacity', 0)
      .transition()
      .delay(600)
      .duration(300)
      .attr('opacity', 1);

    await sleep(1000);
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
    const margin = { top: 25, right: 30, bottom: 40, left: 30 };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    xScale = d3.scaleLinear()
      .domain([-5, 5])
      .range([margin.left, width - margin.right]);

    yScale = d3.scaleLinear()
      .domain([-0.5, 5])
      .range([height - margin.bottom, margin.top]);

    lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveNatural);

    // Axes
    svgEl.append('line')
      .attr('x1', margin.left).attr('y1', yScale(0))
      .attr('x2', width - margin.right).attr('y2', yScale(0))
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    svgEl.append('line')
      .attr('x1', xScale(0)).attr('y1', height - margin.bottom)
      .attr('x2', xScale(0)).attr('y2', margin.top)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Original parabola
    svgEl.append('path')
      .datum(getParabolaData(0))
      .attr('class', 'original')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 2);

    svgEl.append('text')
      .attr('class', 'label-original')
      .attr('x', xScale(0))
      .attr('y', height - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('f(x) = x²');

    // Shifted right (f(x - 2))
    svgEl.append('path')
      .datum(getParabolaData(2))
      .attr('class', 'shifted-right')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'label-right')
      .attr('x', xScale(2))
      .attr('y', height - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.accent)
      .attr('font-size', '12px')
      .attr('opacity', 0)
      .text('f(x − 2)');

    // Shifted left (f(x + 2))
    svgEl.append('path')
      .datum(getParabolaData(-2))
      .attr('class', 'shifted-left')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'label-left')
      .attr('x', xScale(-2))
      .attr('y', height - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .attr('opacity', 0)
      .text('f(x + 2)');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 420px; }
</style>
