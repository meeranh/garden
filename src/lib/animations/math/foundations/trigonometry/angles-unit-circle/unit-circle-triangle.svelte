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

  const width = 440;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2 + 20;
  const radius = 120;
  const angle = 40;
  const angleRad = -angle * Math.PI / 180;
  const px = cx + radius * Math.cos(angleRad);
  const py = cy + radius * Math.sin(angleRad);

  function applyStep(step: number) {
    currentStep = step;

    Object.values(elements).forEach(el => el?.attr('opacity', 0));
    elements.axes?.attr('opacity', 1);
    elements.circle?.attr('opacity', 1);
    elements.title?.attr('opacity', 1);

    if (step >= 0) {
      elements.title?.text('Pick any point P on the circle');
      elements.point?.attr('opacity', 1);
      elements.radiusLine?.attr('opacity', 1);
      elements.pointLabel?.attr('opacity', 1);
    }

    if (step >= 1) {
      elements.title?.text('Drop a line to the x-axis');
      elements.point?.attr('opacity', 1);
      elements.radiusLine?.attr('opacity', 1);
      elements.pointLabel?.attr('opacity', 1);
      elements.vertLine?.attr('opacity', 1);
      elements.horizLine?.attr('opacity', 1);
      elements.rightAngle?.attr('opacity', 1);
    }

    if (step >= 2) {
      elements.title?.text('The hypotenuse = 1 (radius)');
      elements.point?.attr('opacity', 1);
      elements.radiusLine?.attr('opacity', 1);
      elements.vertLine?.attr('opacity', 1);
      elements.horizLine?.attr('opacity', 1);
      elements.rightAngle?.attr('opacity', 1);
      elements.hypLabel?.attr('opacity', 1);
      elements.angleArc?.attr('opacity', 1);
      elements.thetaLabel?.attr('opacity', 1);
    }

    if (step >= 3) {
      elements.title?.text('cos θ = adjacent/hypotenuse = x/1 = x');
      elements.point?.attr('opacity', 1);
      elements.radiusLine?.attr('opacity', 1);
      elements.vertLine?.attr('opacity', 1);
      elements.horizLine?.attr('opacity', 1);
      elements.rightAngle?.attr('opacity', 1);
      elements.hypLabel?.attr('opacity', 1);
      elements.angleArc?.attr('opacity', 1);
      elements.thetaLabel?.attr('opacity', 1);
      elements.xLabel?.attr('opacity', 1);
    }

    if (step >= 4) {
      elements.title?.text('sin θ = opposite/hypotenuse = y/1 = y');
      elements.point?.attr('opacity', 1);
      elements.radiusLine?.attr('opacity', 1);
      elements.vertLine?.attr('opacity', 1);
      elements.horizLine?.attr('opacity', 1);
      elements.rightAngle?.attr('opacity', 1);
      elements.hypLabel?.attr('opacity', 1);
      elements.angleArc?.attr('opacity', 1);
      elements.thetaLabel?.attr('opacity', 1);
      elements.xLabel?.attr('opacity', 1);
      elements.yLabel?.attr('opacity', 1);
      elements.conclusion?.attr('opacity', 1);
    }
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(2500);
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
    elements.axes = svgEl.append('g');
    elements.axes.append('line')
      .attr('x1', cx - radius - 20).attr('y1', cy)
      .attr('x2', cx + radius + 20).attr('y2', cy)
      .attr('stroke', colors.muted).attr('stroke-width', 1);
    elements.axes.append('line')
      .attr('x1', cx).attr('y1', cy + radius + 20)
      .attr('x2', cx).attr('y2', cy - radius - 20)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Circle
    elements.circle = svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', radius)
      .attr('fill', 'none').attr('stroke', colors.muted).attr('stroke-width', 1.5);

    // Radius line
    elements.radiusLine = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', px).attr('y2', py)
      .attr('stroke', colors.accent).attr('stroke-width', 3)
      .attr('opacity', 0);

    // Point P
    elements.point = svgEl.append('circle')
      .attr('cx', px).attr('cy', py).attr('r', 7)
      .attr('fill', colors.accent)
      .attr('opacity', 0);

    elements.pointLabel = svgEl.append('text')
      .attr('x', px + 12).attr('y', py - 8)
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-weight', 'bold')
      .text('P')
      .attr('opacity', 0);

    // Triangle sides
    elements.vertLine = svgEl.append('line')
      .attr('x1', px).attr('y1', py)
      .attr('x2', px).attr('y2', cy)
      .attr('stroke', colors.yellow).attr('stroke-width', 3)
      .attr('opacity', 0);

    elements.horizLine = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', px).attr('y2', cy)
      .attr('stroke', colors.yellow).attr('stroke-width', 3)
      .attr('opacity', 0);

    // Right angle marker
    const m = 12;
    elements.rightAngle = svgEl.append('path')
      .attr('d', `M ${px - m} ${cy} L ${px - m} ${cy - m} L ${px} ${cy - m}`)
      .attr('fill', 'none').attr('stroke', colors.muted).attr('stroke-width', 1.5)
      .attr('opacity', 0);

    // Hypotenuse label
    elements.hypLabel = svgEl.append('text')
      .attr('x', (cx + px) / 2 - 15).attr('y', (cy + py) / 2 - 8)
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-weight', 'bold')
      .text('1')
      .attr('opacity', 0);

    // Angle arc
    const arcGen = d3.arc<any>()
      .innerRadius(30).outerRadius(30)
      .startAngle(0).endAngle(angleRad);

    elements.angleArc = svgEl.append('path')
      .attr('transform', `translate(${cx}, ${cy}) rotate(90)`)
      .attr('d', arcGen({}))
      .attr('fill', 'none').attr('stroke', colors.fg).attr('stroke-width', 2)
      .attr('opacity', 0);

    elements.thetaLabel = svgEl.append('text')
      .attr('x', cx + 42).attr('y', cy - 10)
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-style', 'italic')
      .text('θ')
      .attr('opacity', 0);

    // x and y labels
    elements.xLabel = svgEl.append('text')
      .attr('x', (cx + px) / 2).attr('y', cy + 25)
      .attr('fill', colors.yellow).attr('font-size', '16px').attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('x = cos θ')
      .attr('opacity', 0);

    elements.yLabel = svgEl.append('text')
      .attr('x', px + 15).attr('y', (cy + py) / 2 + 5)
      .attr('fill', colors.yellow).attr('font-size', '16px').attr('font-weight', 'bold')
      .text('y = sin θ')
      .attr('opacity', 0);

    // Conclusion
    elements.conclusion = svgEl.append('text')
      .attr('x', cx).attr('y', height - 25)
      .attr('fill', colors.fg).attr('font-size', '16px').attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('So P = (cos θ, sin θ)')
      .attr('opacity', 0);

    applyStep(0);
    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 440px; }
</style>
