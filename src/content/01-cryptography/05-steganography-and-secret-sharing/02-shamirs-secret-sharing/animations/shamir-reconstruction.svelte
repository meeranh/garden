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

  // Polynomial: f(x) = 42 + 7x (secret = 42)
  const secret = 42;
  const coef = 7;
  const f = (x: number) => secret + coef * x;

  // Two players combine their shares
  const shares = [
    { id: 1, x: 1, y: f(1), color: '#d3869b' },
    { id: 2, x: 2, y: f(2), color: '#8ec07c' }
  ];

  const stepLabels = [
    'Two players combine their shares',
    'Plot the points: (1, 49) and (2, 56)',
    'Only ONE line passes through both points',
    'Interpolate to find f(0) = 42',
    'Secret recovered! S = 42'
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function showStep(step: number, animate: boolean = true) {
    if (!svgEl) return;
    const duration = animate ? 500 : 0;

    svgEl.select('.step-label').text(stepLabels[step]);

    // Step 0: Show share boxes
    svgEl.select('.share-boxes')
      .transition().duration(duration)
      .attr('opacity', step >= 0 ? 1 : 0);

    // Step 1: Show points on graph
    svgEl.select('.points')
      .transition().duration(duration)
      .attr('opacity', step >= 1 ? 1 : 0);

    // Step 2: Show the line
    svgEl.select('.polynomial-line')
      .transition().duration(duration)
      .attr('opacity', step >= 2 ? 1 : 0);

    // Step 3: Show secret point and arrow
    svgEl.select('.secret-reveal')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

    // Step 4: Show success box
    svgEl.select('.success-box')
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
    svgEl.select('.share-boxes').attr('opacity', 1);
    svgEl.select('.points').attr('opacity', 1);
    svgEl.select('.polynomial-line').attr('opacity', 1);
    svgEl.select('.secret-reveal').attr('opacity', 1);
    svgEl.select('.success-box').attr('opacity', 1);
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
    const graphLeft = 180;
    const graphRight = 500;
    const graphTop = 60;
    const graphBottom = 250;

    // Scales
    const xScale = d3.scaleLinear().domain([0, 3]).range([graphLeft, graphRight]);
    const yScale = d3.scaleLinear().domain([0, 70]).range([graphBottom, graphTop]);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Secret Reconstruction');

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

    // X-axis ticks
    [0, 1, 2].forEach(x => {
      svgEl.append('text')
        .attr('x', xScale(x)).attr('y', graphBottom + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.fgMuted)
        .attr('font-size', '11px')
        .text(x);
    });

    // Share boxes (left side)
    const shareBoxes = svgEl.append('g')
      .attr('class', 'share-boxes')
      .attr('opacity', 0);

    shares.forEach((sh, i) => {
      const y = 38 + i * 40;

      shareBoxes.append('rect')
        .attr('x', 15).attr('y', y - 15)
        .attr('width', 140).attr('height', 35)
        .attr('fill', colors.bgCard)
        .attr('stroke', sh.color)
        .attr('stroke-width', 1.5)
        .attr('rx', 4);

      shareBoxes.append('text')
        .attr('x', 85).attr('y', y + 8)
        .attr('text-anchor', 'middle')
        .attr('fill', sh.color)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`Player ${sh.id}: (${sh.x}, ${sh.y})`);
    });

    // Points on graph
    const points = svgEl.append('g')
      .attr('class', 'points')
      .attr('opacity', 0);

    shares.forEach(sh => {
      points.append('circle')
        .attr('cx', xScale(sh.x)).attr('cy', yScale(sh.y))
        .attr('r', 8)
        .attr('fill', sh.color)
        .attr('stroke', colors.bg)
        .attr('stroke-width', 2);

      points.append('text')
        .attr('x', xScale(sh.x) + 12).attr('y', yScale(sh.y) - 8)
        .attr('fill', sh.color)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(`(${sh.x}, ${sh.y})`);
    });

    // Polynomial line
    const lineData = d3.range(0, 3.1, 0.1).map(x => ({ x, y: f(x) }));
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

    // Secret reveal (point at x=0 and arrow)
    const secretReveal = svgEl.append('g')
      .attr('class', 'secret-reveal')
      .attr('opacity', 0);

    // Dashed line from y-axis to secret point
    secretReveal.append('line')
      .attr('x1', graphLeft - 30).attr('y1', yScale(secret))
      .attr('x2', xScale(0)).attr('y2', yScale(secret))
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3');

    // Secret point
    secretReveal.append('circle')
      .attr('cx', xScale(0)).attr('cy', yScale(secret))
      .attr('r', 9)
      .attr('fill', colors.orange)
      .attr('stroke', colors.bg)
      .attr('stroke-width', 2);

    // f(0) label
    secretReveal.append('text')
      .attr('x', xScale(0)).attr('y', yScale(secret) - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('f(0) = 42');

    // Success box (right side)
    const successBox = svgEl.append('g')
      .attr('class', 'success-box')
      .attr('opacity', 0);

    successBox.append('rect')
      .attr('x', 520).attr('y', 100)
      .attr('width', 115).attr('height', 70)
      .attr('fill', colors.green)
      .attr('opacity', 0.15)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2)
      .attr('rx', 6);

    successBox.append('text')
      .attr('x', 577).attr('y', 128)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '12px')
      .text('Secret');

    successBox.append('text')
      .attr('x', 577).attr('y', 155)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '22px')
      .attr('font-weight', 'bold')
      .text('S = 42');

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
