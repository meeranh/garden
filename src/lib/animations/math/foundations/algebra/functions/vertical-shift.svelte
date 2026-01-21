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

  function getParabolaData(vShift: number): [number, number][] {
    const data: [number, number][] = [];
    for (let x = -2.5; x <= 2.5; x += 0.1) {
      const y = x * x + vShift;
      data.push([x, y]);
    }
    return data;
  }

  function applyStep(step: number) {
    currentStep = step;

    svgEl.select('.original').attr('opacity', 1);
    svgEl.select('.label-original').attr('opacity', 1);

    svgEl.select('.shifted-up').attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.label-up').attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.shifted-down').attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.label-down').attr('opacity', step >= 2 ? 1 : 0);

    if (step >= 1) {
      svgEl.select('.shifted-up').attr('d', lineGenerator(getParabolaData(2)));
    }
    if (step >= 2) {
      svgEl.select('.shifted-down').attr('d', lineGenerator(getParabolaData(-2)));
    }
  }

  async function runAnimation() {
    if (!isPlaying) return;

    // Step 0: Original
    currentStep = 0;
    applyStep(0);
    await sleep(800);
    if (!isPlaying) return;

    // Step 1: Shift up
    currentStep = 1;
    svgEl.select('.shifted-up')
      .attr('opacity', 1)
      .attr('d', lineGenerator(getParabolaData(0)));

    svgEl.select('.shifted-up')
      .transition()
      .duration(800)
      .attr('d', lineGenerator(getParabolaData(2)));

    svgEl.select('.label-up')
      .attr('opacity', 0)
      .transition()
      .delay(600)
      .duration(300)
      .attr('opacity', 1);

    await sleep(1200);
    if (!isPlaying) return;

    // Step 2: Shift down
    currentStep = 2;
    svgEl.select('.shifted-down')
      .attr('opacity', 1)
      .attr('d', lineGenerator(getParabolaData(0)));

    svgEl.select('.shifted-down')
      .transition()
      .duration(800)
      .attr('d', lineGenerator(getParabolaData(-2)));

    svgEl.select('.label-down')
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

    const width = 400;
    const height = 300;
    const margin = { top: 25, right: 90, bottom: 25, left: 35 };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    xScale = d3.scaleLinear()
      .domain([-3.5, 3.5])
      .range([margin.left, width - margin.right]);

    yScale = d3.scaleLinear()
      .domain([-3, 5])
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
      .attr('x', width - margin.right + 8)
      .attr('y', yScale(1))
      .attr('fill', colors.muted)
      .attr('font-size', '13px')
      .text('f(x) = x²');

    // Shifted up
    svgEl.append('path')
      .datum(getParabolaData(2))
      .attr('class', 'shifted-up')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'label-up')
      .attr('x', width - margin.right + 8)
      .attr('y', yScale(3))
      .attr('fill', colors.accent)
      .attr('font-size', '13px')
      .attr('opacity', 0)
      .text('f(x) + 2');

    // Shifted down
    svgEl.append('path')
      .datum(getParabolaData(-2))
      .attr('class', 'shifted-down')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'label-down')
      .attr('x', width - margin.right + 8)
      .attr('y', yScale(-1))
      .attr('fill', colors.yellow)
      .attr('font-size', '13px')
      .attr('opacity', 0)
      .text('f(x) − 2');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 400px; }
</style>
