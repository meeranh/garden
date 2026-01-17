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

  const width = 600;
  const height = 400;
  const maxStep = 6;

  // Curve: y² = x³ + 7
  const a = 0, b = 7;
  const xCusp = -Math.cbrt(b);
  const centerX = 200;
  const centerY = 200;
  const scale = 25;

  function curveY(x: number): number {
    const ySquared = x * x * x + a * x + b;
    return ySquared >= 0 ? Math.sqrt(ySquared) : 0;
  }

  function toSvg(x: number, y: number): { sx: number; sy: number } {
    return { sx: centerX + x * scale, sy: centerY - y * scale };
  }

  // Points chosen for good visual spread
  const P = { x: -1.8, y: curveY(-1.8) };
  const Q = { x: 0.1, y: curveY(0.1) };

  // Line through P and Q
  const m = (Q.y - P.y) / (Q.x - P.x);
  const c = P.y - m * P.x;

  // Third intersection using Vieta's formulas
  const Rprime_x = m * m - P.x - Q.x;
  const Rprime_y = m * Rprime_x + c;
  const Rprime = { x: Rprime_x, y: Rprime_y };
  const R = { x: Rprime.x, y: -Rprime.y };

  const allElements = ['axes', 'curve-upper', 'curve-lower', 'point-p', 'point-q', 'line-pq', 'point-rprime', 'reflect-line', 'point-r', 'result'];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['axes', 'curve-upper', 'curve-lower'],
    2: ['axes', 'curve-upper', 'curve-lower', 'point-p'],
    3: ['axes', 'curve-upper', 'curve-lower', 'point-p', 'point-q'],
    4: ['axes', 'curve-upper', 'curve-lower', 'point-p', 'point-q', 'line-pq', 'point-rprime'],
    5: ['axes', 'curve-upper', 'curve-lower', 'point-p', 'point-q', 'line-pq', 'point-rprime', 'reflect-line', 'point-r'],
    6: ['axes', 'curve-upper', 'curve-lower', 'point-p', 'point-q', 'line-pq', 'point-rprime', 'reflect-line', 'point-r', 'result']
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
      orange: '#fe8019',
      blue: '#83a598',
      purple: '#d3869b',
      green: '#b8bb26',
      red: '#fb4934'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Axes
    const axes = svgEl.append('g').attr('class', 'axes').attr('opacity', 0);
    axes.append('line').attr('x1', 30).attr('y1', centerY).attr('x2', width - 30).attr('y2', centerY)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    axes.append('line').attr('x1', centerX).attr('y1', 30).attr('x2', centerX).attr('y2', height - 30)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);

    // Generate curve
    const curvePointsUpper: [number, number][] = [];
    const curvePointsLower: [number, number][] = [];
    const cuspSvg = toSvg(xCusp, 0);
    curvePointsUpper.push([cuspSvg.sx, cuspSvg.sy]);
    curvePointsLower.push([cuspSvg.sx, cuspSvg.sy]);

    for (let x = xCusp + 0.02; x <= 10; x += 0.03) {
      const y = curveY(x);
      const svgUpper = toSvg(x, y);
      const svgLower = toSvg(x, -y);
      if (svgUpper.sx < width - 30 && svgUpper.sy > 30 && svgLower.sy < height - 30) {
        curvePointsUpper.push([svgUpper.sx, svgUpper.sy]);
        curvePointsLower.push([svgLower.sx, svgLower.sy]);
      }
    }

    const line = d3.line<[number, number]>().curve(d3.curveBasis);
    svgEl.append('path').attr('class', 'curve-upper').attr('d', line(curvePointsUpper))
      .attr('fill', 'none').attr('stroke', colors.aqua).attr('stroke-width', 2.5).attr('opacity', 0);
    svgEl.append('path').attr('class', 'curve-lower').attr('d', line(curvePointsLower))
      .attr('fill', 'none').attr('stroke', colors.aqua).attr('stroke-width', 2.5).attr('opacity', 0);

    // Point P
    const pSvg = toSvg(P.x, P.y);
    const pointP = svgEl.append('g').attr('class', 'point-p').attr('opacity', 0);
    pointP.append('circle').attr('cx', pSvg.sx).attr('cy', pSvg.sy).attr('r', 10)
      .attr('fill', colors.orange).attr('stroke', colors.fg).attr('stroke-width', 2);
    pointP.append('text').attr('x', pSvg.sx - 20).attr('y', pSvg.sy - 12)
      .attr('fill', colors.orange).attr('font-size', '16px').attr('font-weight', 'bold').text('P');

    // Point Q
    const qSvg = toSvg(Q.x, Q.y);
    const pointQ = svgEl.append('g').attr('class', 'point-q').attr('opacity', 0);
    pointQ.append('circle').attr('cx', qSvg.sx).attr('cy', qSvg.sy).attr('r', 10)
      .attr('fill', colors.blue).attr('stroke', colors.fg).attr('stroke-width', 2);
    pointQ.append('text').attr('x', qSvg.sx + 15).attr('y', qSvg.sy - 12)
      .attr('fill', colors.blue).attr('font-size', '16px').attr('font-weight', 'bold').text('Q');

    // Line through P and Q
    const lineExtend = 0.5;
    const lineStartX = P.x - lineExtend;
    const lineEndX = Rprime.x + lineExtend;
    const lineStart = toSvg(lineStartX, m * lineStartX + c);
    const lineEnd = toSvg(lineEndX, m * lineEndX + c);

    svgEl.append('line').attr('class', 'line-pq')
      .attr('x1', lineStart.sx).attr('y1', lineStart.sy)
      .attr('x2', lineEnd.sx).attr('y2', lineEnd.sy)
      .attr('stroke', colors.yellow).attr('stroke-width', 2).attr('opacity', 0);

    // Point R' (intersection)
    const rpSvg = toSvg(Rprime.x, Rprime.y);
    const pointRprime = svgEl.append('g').attr('class', 'point-rprime').attr('opacity', 0);
    pointRprime.append('circle').attr('cx', rpSvg.sx).attr('cy', rpSvg.sy).attr('r', 8)
      .attr('fill', colors.purple).attr('stroke', colors.fg).attr('stroke-width', 2);
    pointRprime.append('text').attr('x', rpSvg.sx + 12).attr('y', rpSvg.sy - 10)
      .attr('fill', colors.purple).attr('font-size', '14px').attr('font-weight', 'bold').text("R'");

    // Reflection line
    const rSvg = toSvg(R.x, R.y);
    svgEl.append('line').attr('class', 'reflect-line')
      .attr('x1', rpSvg.sx).attr('y1', rpSvg.sy)
      .attr('x2', rSvg.sx).attr('y2', rSvg.sy)
      .attr('stroke', colors.red).attr('stroke-width', 2).attr('stroke-dasharray', '6,4').attr('opacity', 0);

    // Point R (result)
    const pointR = svgEl.append('g').attr('class', 'point-r').attr('opacity', 0);
    pointR.append('circle').attr('cx', rSvg.sx).attr('cy', rSvg.sy).attr('r', 12)
      .attr('fill', colors.green).attr('stroke', colors.fg).attr('stroke-width', 2);
    pointR.append('text').attr('x', rSvg.sx + 18).attr('y', rSvg.sy + 5)
      .attr('fill', colors.green).attr('font-size', '16px').attr('font-weight', 'bold').text('R');

    // Result box
    const result = svgEl.append('g').attr('class', 'result').attr('opacity', 0);
    result.append('rect').attr('x', 430).attr('y', 20).attr('width', 140).attr('height', 40).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.green).attr('stroke-width', 2);
    result.append('text').attr('x', 500).attr('y', 47).attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '16px').attr('font-weight', 'bold').text('R = P + Q');

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
    max-height: 400px;
  }
</style>
