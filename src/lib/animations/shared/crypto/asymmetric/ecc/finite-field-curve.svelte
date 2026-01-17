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
  const height = 360;
  const maxStep = 3;

  // Smooth curve parameters
  const a = 0, b = 7;
  const curveXCusp = -Math.cbrt(b);
  const curveCenterX = 150;
  const curveCenterY = 180;
  const curveScale = 25;

  function curveY(x: number): number {
    const ySquared = x * x * x + a * x + b;
    return ySquared >= 0 ? Math.sqrt(ySquared) : 0;
  }

  function toCurveSvg(x: number, y: number): { sx: number; sy: number } {
    return { sx: curveCenterX + x * curveScale, sy: curveCenterY - y * curveScale };
  }

  // Finite field points for y² = x³ + 7 mod 23
  const p = 23;
  const finitePoints = [
    { x: 1, y: 10 }, { x: 1, y: 13 },
    { x: 4, y: 5 }, { x: 4, y: 18 },
    { x: 6, y: 4 }, { x: 6, y: 19 },
    { x: 8, y: 6 }, { x: 8, y: 17 },
    { x: 9, y: 0 },
    { x: 10, y: 8 }, { x: 10, y: 15 },
    { x: 11, y: 2 }, { x: 11, y: 21 },
    { x: 15, y: 1 }, { x: 15, y: 22 },
    { x: 16, y: 3 }, { x: 16, y: 20 },
    { x: 19, y: 9 }, { x: 19, y: 14 },
    { x: 20, y: 7 }, { x: 20, y: 16 },
    { x: 22, y: 11 }, { x: 22, y: 12 }
  ];

  // Finite field grid parameters
  const gridLeft = 340;
  const gridTop = 40;
  const gridSize = 280;
  const cellSize = gridSize / p;

  function toGridSvg(x: number, y: number): { sx: number; sy: number } {
    return {
      sx: gridLeft + (x + 0.5) * cellSize,
      sy: gridTop + gridSize - (y + 0.5) * cellSize
    };
  }

  const allElements = ['curve-group', 'grid-group', 'points-group', 'labels'];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['curve-group', 'labels'],
    2: ['curve-group', 'grid-group', 'labels'],
    3: ['grid-group', 'points-group', 'labels']
  };

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    const visible = stepVisibility[step] || [];

    // Handle curve fade
    svgEl.select('.curve-group').transition().duration(500)
      .attr('opacity', visible.includes('curve-group') ? 1 : 0);

    // Handle grid
    svgEl.select('.grid-group').transition().duration(500)
      .attr('opacity', visible.includes('grid-group') ? 1 : 0);

    // Handle points with staggered animation
    if (visible.includes('points-group')) {
      svgEl.selectAll('.finite-point').each(function(_, i) {
        d3.select(this).transition().delay(i * 30).duration(300)
          .attr('opacity', 1)
          .attr('r', 6);
      });
    } else {
      svgEl.selectAll('.finite-point').transition().duration(300)
        .attr('opacity', 0)
        .attr('r', 0);
    }

    // Labels
    svgEl.select('.labels').transition().duration(400)
      .attr('opacity', visible.includes('labels') ? 1 : 0);

    // Update label text based on step
    if (step <= 2) {
      svgEl.select('.curve-label').transition().duration(300).attr('opacity', 1);
      svgEl.select('.finite-label').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
    } else {
      svgEl.select('.curve-label').transition().duration(300).attr('opacity', 0);
      svgEl.select('.finite-label').transition().duration(300).attr('opacity', 1);
    }

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1500);
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
      purple: '#d3869b'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // === SMOOTH CURVE GROUP ===
    const curveGroup = svgEl.append('g').attr('class', 'curve-group').attr('opacity', 0);

    // Axes for smooth curve
    curveGroup.append('line')
      .attr('x1', 20).attr('y1', curveCenterY)
      .attr('x2', 280).attr('y2', curveCenterY)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1);
    curveGroup.append('line')
      .attr('x1', curveCenterX).attr('y1', 30)
      .attr('x2', curveCenterX).attr('y2', 330)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1);

    // Generate smooth curve
    const curvePointsUpper: [number, number][] = [];
    const curvePointsLower: [number, number][] = [];
    const cuspSvg = toCurveSvg(curveXCusp, 0);
    curvePointsUpper.push([cuspSvg.sx, cuspSvg.sy]);
    curvePointsLower.push([cuspSvg.sx, cuspSvg.sy]);

    for (let x = curveXCusp + 0.02; x <= 6; x += 0.03) {
      const y = curveY(x);
      const svgUpper = toCurveSvg(x, y);
      const svgLower = toCurveSvg(x, -y);
      if (svgUpper.sx < 280 && svgUpper.sy > 30 && svgLower.sy < 330) {
        curvePointsUpper.push([svgUpper.sx, svgUpper.sy]);
        curvePointsLower.push([svgLower.sx, svgLower.sy]);
      }
    }

    const line = d3.line<[number, number]>().curve(d3.curveBasis);
    curveGroup.append('path').attr('d', line(curvePointsUpper))
      .attr('fill', 'none').attr('stroke', colors.aqua).attr('stroke-width', 3);
    curveGroup.append('path').attr('d', line(curvePointsLower))
      .attr('fill', 'none').attr('stroke', colors.aqua).attr('stroke-width', 3);

    // Add some points on the smooth curve
    const smoothPoints = [
      { x: -1.2, label: 'P' },
      { x: 0.5, label: 'Q' },
      { x: 2.5, label: '' }
    ];
    smoothPoints.forEach((pt, i) => {
      const y = curveY(pt.x);
      const pos = toCurveSvg(pt.x, y);
      curveGroup.append('circle')
        .attr('cx', pos.sx).attr('cy', pos.sy)
        .attr('r', 7)
        .attr('fill', i < 2 ? colors.orange : colors.purple)
        .attr('stroke', colors.fg).attr('stroke-width', 1.5);
      if (pt.label) {
        curveGroup.append('text')
          .attr('x', pos.sx + 10).attr('y', pos.sy - 8)
          .attr('fill', colors.orange).attr('font-size', '12px').attr('font-weight', 'bold')
          .text(pt.label);
      }
    });

    // === FINITE FIELD GRID GROUP ===
    const gridGroup = svgEl.append('g').attr('class', 'grid-group').attr('opacity', 0);

    // Grid background
    gridGroup.append('rect')
      .attr('x', gridLeft).attr('y', gridTop)
      .attr('width', gridSize).attr('height', gridSize)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted).attr('stroke-width', 1);

    // Grid lines (sparse - every 5)
    for (let i = 5; i < p; i += 5) {
      const xPos = gridLeft + i * cellSize;
      const yPos = gridTop + gridSize - i * cellSize;
      gridGroup.append('line')
        .attr('x1', xPos).attr('y1', gridTop)
        .attr('x2', xPos).attr('y2', gridTop + gridSize)
        .attr('stroke', colors.fgMuted).attr('stroke-opacity', 0.3).attr('stroke-width', 0.5);
      gridGroup.append('line')
        .attr('x1', gridLeft).attr('y1', yPos)
        .attr('x2', gridLeft + gridSize).attr('y2', yPos)
        .attr('stroke', colors.fgMuted).attr('stroke-opacity', 0.3).attr('stroke-width', 0.5);
    }

    // Axis labels
    gridGroup.append('text')
      .attr('x', gridLeft + gridSize + 8).attr('y', gridTop + gridSize + 4)
      .attr('fill', colors.fgMuted).attr('font-size', '12px').text('x');
    gridGroup.append('text')
      .attr('x', gridLeft - 4).attr('y', gridTop - 8)
      .attr('fill', colors.fgMuted).attr('font-size', '12px').text('y');
    gridGroup.append('text')
      .attr('x', gridLeft - 5).attr('y', gridTop + gridSize + 15)
      .attr('fill', colors.fgMuted).attr('font-size', '10px').text('0');
    gridGroup.append('text')
      .attr('x', gridLeft + gridSize - 10).attr('y', gridTop + gridSize + 15)
      .attr('fill', colors.fgMuted).attr('font-size', '10px').text(String(p - 1));

    // === FINITE POINTS GROUP ===
    const pointsGroup = svgEl.append('g').attr('class', 'points-group');

    finitePoints.forEach((pt) => {
      const pos = toGridSvg(pt.x, pt.y);
      pointsGroup.append('circle')
        .attr('class', 'finite-point')
        .attr('cx', pos.sx).attr('cy', pos.sy)
        .attr('r', 0)
        .attr('fill', colors.orange)
        .attr('opacity', 0);
    });

    // === LABELS ===
    const labels = svgEl.append('g').attr('class', 'labels').attr('opacity', 0);

    labels.append('text')
      .attr('class', 'curve-label')
      .attr('x', 150).attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '14px').attr('font-weight', 'bold')
      .text('y² = x³ + 7');

    labels.append('text')
      .attr('class', 'finite-label')
      .attr('x', gridLeft + gridSize / 2).attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '14px').attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('y² = x³ + 7 (mod 23)');

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
    max-height: 360px;
  }
</style>
