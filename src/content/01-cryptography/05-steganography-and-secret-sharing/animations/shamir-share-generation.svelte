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

  const width = 650;
  const height = 320;
  const maxStep = 4;

  // Polynomial: f(x) = 42 + 7x (secret = 42, random coefficient = 7)
  const secret = 42;
  const coef = 7;
  const f = (x: number) => secret + coef * x;

  // Players and their shares
  const players = [
    { id: 1, x: 1, y: f(1), color: '#d3869b' },
    { id: 2, x: 2, y: f(2), color: '#8ec07c' },
    { id: 3, x: 3, y: f(3), color: '#83a598' }
  ];

  const stepLabels = [
    'Secret S = 42 is the y-intercept (where line crosses y-axis)',
    'Build polynomial: f(x) = 42 + 7x',
    'Evaluate at x = 1: Player 1 gets (1, 49)',
    'Evaluate at x = 2, 3: Players get their shares',
    'Each player holds one point. Secret is hidden at f(0).'
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function showStep(step: number, animate: boolean = true) {
    if (!svgEl) return;
    const duration = animate ? 500 : 0;

    svgEl.select('.step-label').text(stepLabels[step]);

    // Step 0: Show secret point
    svgEl.select('.secret-point')
      .transition().duration(duration)
      .attr('opacity', step >= 0 ? 1 : 0);

    // Step 1: Show polynomial line
    svgEl.select('.polynomial-line')
      .transition().duration(duration)
      .attr('opacity', step >= 1 ? 1 : 0);

    svgEl.select('.formula')
      .transition().duration(duration)
      .attr('opacity', step >= 1 ? 1 : 0);

    // Step 2: Show first player point
    svgEl.select('.player-1')
      .transition().duration(duration)
      .attr('opacity', step >= 2 ? 1 : 0);

    // Step 3: Show remaining player points
    svgEl.select('.player-2')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

    svgEl.select('.player-3')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

    // Step 4: Show share labels
    svgEl.select('.share-labels')
      .transition().duration(duration)
      .attr('opacity', step >= 4 ? 1 : 0);

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      showStep(i, true);
      await sleep(1800);
      if (!isPlaying) return;
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) showStep(currentStep + 1, true); }
  function prev() { pause(); if (currentStep > 0) showStep(currentStep - 1, true); }
  function applyFinalState() {
    svgEl.select('.step-label').text(stepLabels[maxStep]);
    svgEl.select('.secret-point').attr('opacity', 1);
    svgEl.select('.polynomial-line').attr('opacity', 1);
    svgEl.select('.formula').attr('opacity', 1);
    svgEl.select('.player-1').attr('opacity', 1);
    svgEl.select('.player-2').attr('opacity', 1);
    svgEl.select('.player-3').attr('opacity', 1);
    svgEl.select('.share-labels').attr('opacity', 1);
    currentStep = maxStep;
  }
  function skip() { pause(); applyFinalState(); }
  function replay() { pause(); currentStep = 0; showStep(0, false); isPlaying = true; runAnimation(); }
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
      purple: '#d3869b',
      green: '#b8bb26',
      blue: '#83a598'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Graph area
    const graphLeft = 80;
    const graphRight = 400;
    const graphTop = 60;
    const graphBottom = 260;
    const graphWidth = graphRight - graphLeft;
    const graphHeight = graphBottom - graphTop;

    // Scales
    const xScale = d3.scaleLinear().domain([0, 4]).range([graphLeft, graphRight]);
    const yScale = d3.scaleLinear().domain([0, 80]).range([graphBottom, graphTop]);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Share Generation');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', height - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // Axes
    svgEl.append('line')
      .attr('x1', graphLeft).attr('y1', graphBottom)
      .attr('x2', graphRight).attr('y2', graphBottom)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1);

    svgEl.append('line')
      .attr('x1', graphLeft).attr('y1', graphTop)
      .attr('x2', graphLeft).attr('y2', graphBottom)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1);

    // Axis labels
    svgEl.append('text')
      .attr('x', graphRight + 10).attr('y', graphBottom + 5)
      .attr('fill', colors.fgMuted)
      .attr('font-size', '12px')
      .text('x');

    svgEl.append('text')
      .attr('x', graphLeft - 5).attr('y', graphTop - 10)
      .attr('fill', colors.fgMuted)
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .text('f(x)');

    // X-axis ticks
    [1, 2, 3].forEach(x => {
      svgEl.append('text')
        .attr('x', xScale(x)).attr('y', graphBottom + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.fgMuted)
        .attr('font-size', '11px')
        .text(x);
    });

    // Polynomial line
    const lineData = d3.range(0, 4.1, 0.1).map(x => ({ x, y: f(x) }));
    const line = d3.line<{x: number, y: number}>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

    svgEl.append('path')
      .attr('class', 'polynomial-line')
      .attr('d', line(lineData))
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0);

    // Formula box
    const formula = svgEl.append('g')
      .attr('class', 'formula')
      .attr('opacity', 0);

    formula.append('rect')
      .attr('x', 430).attr('y', 55)
      .attr('width', 180).attr('height', 35)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 1.5)
      .attr('rx', 4);

    formula.append('text')
      .attr('x', 520).attr('y', 78)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('f(x) = 42 + 7x');

    // Secret point at (0, 42)
    const secretPt = svgEl.append('g')
      .attr('class', 'secret-point')
      .attr('opacity', 0);

    secretPt.append('circle')
      .attr('cx', xScale(0)).attr('cy', yScale(secret))
      .attr('r', 8)
      .attr('fill', colors.orange)
      .attr('stroke', colors.bg)
      .attr('stroke-width', 2);

    secretPt.append('text')
      .attr('x', xScale(0) - 15).attr('y', yScale(secret) + 5)
      .attr('text-anchor', 'end')
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('S = 42');

    // Player points
    players.forEach((p, i) => {
      const playerG = svgEl.append('g')
        .attr('class', `player-${p.id}`)
        .attr('opacity', 0);

      playerG.append('circle')
        .attr('cx', xScale(p.x)).attr('cy', yScale(p.y))
        .attr('r', 7)
        .attr('fill', p.color)
        .attr('stroke', colors.bg)
        .attr('stroke-width', 2);

      playerG.append('text')
        .attr('x', xScale(p.x)).attr('y', yScale(p.y) - 12)
        .attr('text-anchor', 'middle')
        .attr('fill', p.color)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(`(${p.x}, ${p.y})`);
    });

    // Share labels (right side)
    const shareLabels = svgEl.append('g')
      .attr('class', 'share-labels')
      .attr('opacity', 0);

    players.forEach((p, i) => {
      const y = 130 + i * 45;

      shareLabels.append('rect')
        .attr('x', 430).attr('y', y - 15)
        .attr('width', 180).attr('height', 35)
        .attr('fill', colors.bgCard)
        .attr('stroke', p.color)
        .attr('stroke-width', 1.5)
        .attr('rx', 4);

      shareLabels.append('text')
        .attr('x', 520).attr('y', y + 8)
        .attr('text-anchor', 'middle')
        .attr('fill', p.color)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`Player ${p.id}: (${p.x}, ${p.y})`);
    });

    // Show initial state
    showStep(0, false);

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
    max-height: 320px;
  }
</style>
