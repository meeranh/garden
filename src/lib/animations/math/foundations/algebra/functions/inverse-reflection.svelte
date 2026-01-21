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

    // Show/hide based on step
    svgEl.select('.line-yx').attr('opacity', step >= 0 ? 1 : 0);
    svgEl.select('.f-curve').attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.f-label').attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.finv-curve').attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.finv-label').attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.points-group').attr('opacity', step >= 3 ? 1 : 0);
    svgEl.select('.reflection-line').attr('opacity', step >= 4 ? 1 : 0);

    // Reset stroke-dashoffset for visible paths
    if (step >= 1) {
      const fPath = svgEl.select('.f-curve').node() as SVGPathElement;
      if (fPath) {
        const len = fPath.getTotalLength();
        svgEl.select('.f-curve')
          .attr('stroke-dasharray', len)
          .attr('stroke-dashoffset', 0);
      }
    }
    if (step >= 2) {
      const finvPath = svgEl.select('.finv-curve').node() as SVGPathElement;
      if (finvPath) {
        const len = finvPath.getTotalLength();
        svgEl.select('.finv-curve')
          .attr('stroke-dasharray', len)
          .attr('stroke-dashoffset', 0);
      }
    }
  }

  async function runAnimation() {
    if (!isPlaying) return;

    // Step 0: axes and y=x line visible
    currentStep = 0;
    svgEl.select('.line-yx').attr('opacity', 1);
    svgEl.select('.f-curve').attr('opacity', 0);
    svgEl.select('.f-label').attr('opacity', 0);
    svgEl.select('.finv-curve').attr('opacity', 0);
    svgEl.select('.finv-label').attr('opacity', 0);
    svgEl.select('.points-group').attr('opacity', 0);
    svgEl.select('.reflection-line').attr('opacity', 0);

    await sleep(800);
    if (!isPlaying) return;

    // Step 1: Draw f(x) = x²
    currentStep = 1;
    const fPath = svgEl.select('.f-curve').node() as SVGPathElement;
    const fLen = fPath.getTotalLength();

    svgEl.select('.f-curve')
      .attr('opacity', 1)
      .attr('stroke-dasharray', fLen)
      .attr('stroke-dashoffset', fLen)
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    svgEl.select('.f-label')
      .attr('opacity', 0)
      .transition()
      .delay(800)
      .duration(300)
      .attr('opacity', 1);

    await sleep(1400);
    if (!isPlaying) return;

    // Step 2: Draw f⁻¹(x) = √x
    currentStep = 2;
    const finvPath = svgEl.select('.finv-curve').node() as SVGPathElement;
    const finvLen = finvPath.getTotalLength();

    svgEl.select('.finv-curve')
      .attr('opacity', 1)
      .attr('stroke-dasharray', finvLen)
      .attr('stroke-dashoffset', finvLen)
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    svgEl.select('.finv-label')
      .attr('opacity', 0)
      .transition()
      .delay(800)
      .duration(300)
      .attr('opacity', 1);

    await sleep(1400);
    if (!isPlaying) return;

    // Step 3: Show points
    currentStep = 3;
    svgEl.select('.points-group')
      .attr('opacity', 0)
      .transition()
      .duration(400)
      .attr('opacity', 1);

    await sleep(800);
    if (!isPlaying) return;

    // Step 4: Show reflection line
    currentStep = 4;
    svgEl.select('.reflection-line')
      .attr('opacity', 0)
      .transition()
      .duration(400)
      .attr('opacity', 1);

    await sleep(500);
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
    const height = 340;
    const margin = { top: 30, right: 30, bottom: 30, left: 30 };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([-1, 5])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-1, 5])
      .range([height - margin.bottom, margin.top]);

    // Axes
    svgEl.append('line')
      .attr('x1', margin.left).attr('y1', yScale(0))
      .attr('x2', width - margin.right).attr('y2', yScale(0))
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    svgEl.append('line')
      .attr('x1', xScale(0)).attr('y1', height - margin.bottom)
      .attr('x2', xScale(0)).attr('y2', margin.top)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

    // Line y = x (dashed)
    const lineYX: [number, number][] = [];
    for (let t = -0.5; t <= 4.8; t += 0.1) {
      lineYX.push([t, t]);
    }

    svgEl.append('path')
      .datum(lineYX)
      .attr('class', 'line-yx')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('x', xScale(4.2)).attr('y', yScale(4.5))
      .attr('fill', colors.muted)
      .attr('font-size', '13px')
      .attr('class', 'line-yx')
      .attr('opacity', 0)
      .text('y = x');

    // Function f(x) = x² (for x >= 0)
    const fData: [number, number][] = [];
    for (let x = 0; x <= 2.2; x += 0.05) {
      const y = x * x;
      if (y <= 5) {
        fData.push([x, y]);
      }
    }

    svgEl.append('path')
      .datum(fData)
      .attr('class', 'f-curve')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'f-label')
      .attr('x', xScale(2.3)).attr('y', yScale(4.8))
      .attr('fill', colors.accent)
      .attr('font-size', '13px')
      .attr('opacity', 0)
      .text('f(x) = x²');

    // Inverse f⁻¹(x) = √x
    const fInvData: [number, number][] = [];
    for (let x = 0; x <= 5; x += 0.05) {
      const y = Math.sqrt(x);
      fInvData.push([x, y]);
    }

    svgEl.append('path')
      .datum(fInvData)
      .attr('class', 'finv-curve')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'finv-label')
      .attr('x', xScale(4.1)).attr('y', yScale(2.3))
      .attr('fill', colors.yellow)
      .attr('font-size', '13px')
      .attr('opacity', 0)
      .text('f⁻¹(x) = √x');

    // Points group
    const pointsGroup = svgEl.append('g').attr('class', 'points-group').attr('opacity', 0);

    const px = 1.5;
    const py = px * px;

    // Point (a, b) on f
    pointsGroup.append('circle')
      .attr('cx', xScale(px)).attr('cy', yScale(py))
      .attr('r', 5)
      .attr('fill', colors.accent);

    pointsGroup.append('text')
      .attr('x', xScale(px) - 8).attr('y', yScale(py) - 10)
      .attr('text-anchor', 'end')
      .attr('fill', colors.accent)
      .attr('font-size', '12px')
      .text('(a, b)');

    // Point (b, a) on f⁻¹
    pointsGroup.append('circle')
      .attr('cx', xScale(py)).attr('cy', yScale(px))
      .attr('r', 5)
      .attr('fill', colors.yellow);

    pointsGroup.append('text')
      .attr('x', xScale(py) + 8).attr('y', yScale(px) + 4)
      .attr('text-anchor', 'start')
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .text('(b, a)');

    // Reflection line connecting points
    svgEl.append('line')
      .attr('class', 'reflection-line')
      .attr('x1', xScale(px)).attr('y1', yScale(py))
      .attr('x2', xScale(py)).attr('y2', yScale(px))
      .attr('stroke', colors.fg)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0);

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 400px; }
</style>
