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

  const width = 500;
  const height = 340;
  const maxStep = 3;

  // Curve: y² = x³ + 7
  const a = 0, b = 7;
  const centerX = 180;
  const centerY = 170;
  const scale = 22;

  function curveY(x: number): number {
    const ySquared = x * x * x + a * x + b;
    return ySquared >= 0 ? Math.sqrt(ySquared) : 0;
  }

  function toSvg(x: number, y: number): { sx: number; sy: number } {
    return { sx: centerX + x * scale, sy: centerY - y * scale };
  }

  const P = { x: 2, y: curveY(2) };

  const allElements = ['axes', 'curve-upper', 'curve-lower', 'equation', 'point-p', 'insight'];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['axes'],
    2: ['axes', 'curve-upper', 'curve-lower', 'equation'],
    3: ['axes', 'curve-upper', 'curve-lower', 'equation', 'point-p', 'insight']
  };

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    const visible = stepVisibility[step] || [];
    allElements.forEach((el) => {
      svgEl.select(`.${el}`).transition().duration(400).attr('opacity', visible.includes(el) ? 1 : 0);
    });
    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1200);
    }

    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() { pause(); applyStep(0); currentStep = 0; isPlaying = true; runAnimation(); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      bgCard: s.getPropertyValue('--color-bg-card').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      aqua: '#8ec07c',
      orange: '#fe8019'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Axes
    const axes = svgEl.append('g').attr('class', 'axes').attr('opacity', 0);
    axes.append('line').attr('x1', 30).attr('y1', centerY).attr('x2', width - 30).attr('y2', centerY)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    axes.append('line').attr('x1', centerX).attr('y1', 30).attr('x2', centerX).attr('y2', height - 50)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    axes.append('text').attr('x', width - 35).attr('y', centerY + 18).attr('fill', colors.fgMuted).attr('font-size', '12px').text('x');
    axes.append('text').attr('x', centerX + 8).attr('y', 40).attr('fill', colors.fgMuted).attr('font-size', '12px').text('y');

    // Generate curve points
    const xCusp = -Math.cbrt(b);
    const curvePointsUpper: [number, number][] = [];
    const curvePointsLower: [number, number][] = [];

    const cuspSvg = toSvg(xCusp, 0);
    curvePointsUpper.push([cuspSvg.sx, cuspSvg.sy]);
    curvePointsLower.push([cuspSvg.sx, cuspSvg.sy]);

    for (let x = xCusp + 0.02; x <= 8; x += 0.03) {
      const y = curveY(x);
      const svgUpper = toSvg(x, y);
      const svgLower = toSvg(x, -y);
      if (svgUpper.sx < width - 30 && svgUpper.sy > 30 && svgLower.sy < height - 50) {
        curvePointsUpper.push([svgUpper.sx, svgUpper.sy]);
        curvePointsLower.push([svgLower.sx, svgLower.sy]);
      }
    }

    const line = d3.line<[number, number]>().curve(d3.curveBasis);

    svgEl.append('path').attr('class', 'curve-upper').attr('d', line(curvePointsUpper))
      .attr('fill', 'none').attr('stroke', colors.aqua).attr('stroke-width', 3).attr('opacity', 0);
    svgEl.append('path').attr('class', 'curve-lower').attr('d', line(curvePointsLower))
      .attr('fill', 'none').attr('stroke', colors.aqua).attr('stroke-width', 3).attr('opacity', 0);

    // Equation
    const equation = svgEl.append('g').attr('class', 'equation').attr('opacity', 0);
    equation.append('rect').attr('x', 340).attr('y', 50).attr('width', 130).attr('height', 35).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.yellow).attr('stroke-width', 2);
    equation.append('text').attr('x', 405).attr('y', 73).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '14px').attr('font-family', 'monospace').text('y² = x³ + 7');

    // Point P
    const pSvg = toSvg(P.x, P.y);
    const pointP = svgEl.append('g').attr('class', 'point-p').attr('opacity', 0);
    pointP.append('circle').attr('cx', pSvg.sx).attr('cy', pSvg.sy).attr('r', 10)
      .attr('fill', colors.orange).attr('stroke', colors.fg).attr('stroke-width', 2);
    pointP.append('text').attr('x', pSvg.sx + 15).attr('y', pSvg.sy - 8)
      .attr('fill', colors.orange).attr('font-size', '16px').attr('font-weight', 'bold').text('P');

    // Insight
    const insight = svgEl.append('g').attr('class', 'insight').attr('opacity', 0);
    insight.append('rect').attr('x', 300).attr('y', height - 55).attr('width', 180).attr('height', 35).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted);
    insight.append('text').attr('x', 390).attr('y', height - 32).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '11px').text('Points can be "added"');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram {
    display: block;
    margin: 0 auto;
    background: var(--color-bg);
    border-radius: 0.5rem;
    max-height: 340px;
  }
</style>
