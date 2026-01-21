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

  const maxStep = 4;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    currentStep = step;

    svgEl.select('.axes').transition().duration(300).attr('opacity', 1);
    svgEl.select('.curve').transition().duration(300).attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.domain-hl').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.range-hl').transition().duration(300).attr('opacity', step >= 3 ? 1 : 0);
    svgEl.select('.labels').transition().duration(300).attr('opacity', step >= 4 ? 1 : 0);
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1400);
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

    const width = 480;
    const height = 250;
    const margin = { top: 40, right: 25, bottom: 45, left: 55 };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([-1, 9])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-0.5, 3.5])
      .range([height - margin.bottom, margin.top]);

    // Axes group
    const axes = svgEl.append('g').attr('class', 'axes');

    // X-axis (no 0 label - we'll add one shared 0 at origin)
    const xAxis = d3.axisBottom(xScale)
      .tickValues([2, 4, 6, 8])
      .tickSize(5);

    axes.append('g')
      .attr('transform', `translate(0, ${yScale(0)})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', colors.muted))
      .call(g => g.selectAll('.tick line').attr('stroke', colors.muted))
      .call(g => g.selectAll('.tick text').attr('fill', colors.muted).attr('font-size', '11px'));

    // Y-axis (no 0 label)
    const yAxis = d3.axisLeft(yScale)
      .tickValues([1, 2, 3])
      .tickSize(5);

    axes.append('g')
      .attr('transform', `translate(${xScale(0)}, 0)`)
      .call(yAxis)
      .call(g => g.select('.domain').attr('stroke', colors.muted))
      .call(g => g.selectAll('.tick line').attr('stroke', colors.muted))
      .call(g => g.selectAll('.tick text').attr('fill', colors.muted).attr('font-size', '11px'));

    // Single 0 label at origin (bottom-left of intersection)
    axes.append('text')
      .attr('x', xScale(0) - 8)
      .attr('y', yScale(0) + 14)
      .attr('fill', colors.muted)
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .text('0');

    // Axis labels
    axes.append('text')
      .attr('x', width - margin.right + 15)
      .attr('y', yScale(0) + 4)
      .attr('fill', colors.muted)
      .attr('font-size', '14px')
      .text('x');

    axes.append('text')
      .attr('x', xScale(0) - 5)
      .attr('y', margin.top - 10)
      .attr('fill', colors.muted)
      .attr('font-size', '14px')
      .text('y');

    // Title
    axes.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .text('f(x) = √x');

    // Generate √x curve points (only for x ≥ 0)
    const curveData: [number, number][] = [];
    for (let x = 0; x <= 9; x += 0.05) {
      curveData.push([x, Math.sqrt(x)]);
    }

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveNatural);

    // Curve
    const curve = svgEl.append('g').attr('class', 'curve').attr('opacity', 0);

    curve.append('path')
      .datum(curveData)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.fg)
      .attr('stroke-width', 2.5);

    // Starting point at origin
    curve.append('circle')
      .attr('cx', xScale(0))
      .attr('cy', yScale(0))
      .attr('r', 4)
      .attr('fill', colors.fg);

    // Domain highlight - colored segment below x-axis from 0 to right
    const domainHL = svgEl.append('g').attr('class', 'domain-hl').attr('opacity', 0);
    const domainY = yScale(0) + 25;

    // Filled dot at x=0 (included)
    domainHL.append('circle')
      .attr('cx', xScale(0))
      .attr('cy', domainY)
      .attr('r', 4)
      .attr('fill', colors.accent);

    // Line from dot to arrow
    domainHL.append('line')
      .attr('x1', xScale(0) + 4)
      .attr('y1', domainY)
      .attr('x2', xScale(8.3))
      .attr('y2', domainY)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Arrowhead
    domainHL.append('polygon')
      .attr('points', `${xScale(8.8)},${domainY} ${xScale(8.3)},${domainY - 4} ${xScale(8.3)},${domainY + 4}`)
      .attr('fill', colors.accent);

    // "Domain: x ≥ 0" label
    domainHL.append('text')
      .attr('x', xScale(4))
      .attr('y', domainY + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.accent)
      .attr('font-size', '12px')
      .text('Domain: x ≥ 0');

    // Range highlight - colored segment beside y-axis from 0 upward
    const rangeHL = svgEl.append('g').attr('class', 'range-hl').attr('opacity', 0);
    const rangeX = xScale(0) - 35;

    // Filled dot at y=0 (included)
    rangeHL.append('circle')
      .attr('cx', rangeX)
      .attr('cy', yScale(0))
      .attr('r', 4)
      .attr('fill', colors.yellow);

    // Line from dot going up
    rangeHL.append('line')
      .attr('x1', rangeX)
      .attr('y1', yScale(0) - 4)
      .attr('x2', rangeX)
      .attr('y2', yScale(3) + 6)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2.5);

    // Arrowhead
    rangeHL.append('polygon')
      .attr('points', `${rangeX},${yScale(3.2)} ${rangeX - 4},${yScale(3) + 6} ${rangeX + 4},${yScale(3) + 6}`)
      .attr('fill', colors.yellow);

    // "Range: y ≥ 0" label (rotated, to the left of arrow)
    rangeHL.append('text')
      .attr('x', rangeX - 12)
      .attr('y', yScale(1.5))
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .attr('transform', `rotate(-90, ${rangeX - 12}, ${yScale(1.5)})`)
      .text('Range: y ≥ 0');

    // Labels explaining why - positioned in upper right
    const labels = svgEl.append('g').attr('class', 'labels').attr('opacity', 0);

    labels.append('text')
      .attr('x', xScale(5.5))
      .attr('y', margin.top + 10)
      .attr('text-anchor', 'start')
      .attr('fill', colors.muted)
      .attr('font-size', '11px')
      .attr('font-style', 'italic')
      .text("Can't take √ of negatives,");

    labels.append('text')
      .attr('x', xScale(5.5))
      .attr('y', margin.top + 24)
      .attr('text-anchor', 'start')
      .attr('fill', colors.muted)
      .attr('font-size', '11px')
      .attr('font-style', 'italic')
      .text('so x must be ≥ 0');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 700px; }
</style>
