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

  const maxStep = 6;

  // Compounding data: n, label, result
  const data = [
    { n: 1, label: 'Yearly', result: 2.0 },
    { n: 2, label: '6 months', result: 2.25 },
    { n: 4, label: 'Quarterly', result: 2.4414 },
    { n: 12, label: 'Monthly', result: 2.6130 },
    { n: 365, label: 'Daily', result: 2.7146 },
    { n: Infinity, label: 'Continuous', result: Math.E },
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    currentStep = step;

    svgEl.select('.setup').transition().duration(300).attr('opacity', 1);

    for (let i = 0; i < data.length; i++) {
      svgEl.select(`.bar-${i}`).transition().duration(400).attr('opacity', step >= i + 1 ? 1 : 0);
    }

    svgEl.select('.e-line').transition().duration(300).attr('opacity', step >= 6 ? 1 : 0);
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1200);
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

    svgEl = d3.select(svg).attr('viewBox', '0 0 480 360');

    const chartLeft = 120;
    const chartRight = 440;
    const chartWidth = chartRight - chartLeft;
    const barHeight = 28;
    const barGap = 8;
    const startY = 75;

    // Scale: 1.0 to 3.0 maps to chartLeft to chartRight
    const scale = (val: number) => chartLeft + ((val - 1.0) / 2.0) * chartWidth;

    // Setup: Title and axis
    const setup = svgEl.append('g').attr('class', 'setup');

    setup.append('text')
      .attr('x', 240).attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .text('$1 at 100% interest, compounded...');

    // Axis line
    setup.append('line')
      .attr('x1', chartLeft).attr('y1', startY + data.length * (barHeight + barGap) + 15)
      .attr('x2', chartRight).attr('y2', startY + data.length * (barHeight + barGap) + 15)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Axis labels
    [1.0, 1.5, 2.0, 2.5, 3.0].forEach(val => {
      setup.append('text')
        .attr('x', scale(val)).attr('y', startY + data.length * (barHeight + barGap) + 35)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.muted)
        .attr('font-size', '12px')
        .text(`$${val.toFixed(1)}`);
    });

    // $1 start line
    setup.append('line')
      .attr('x1', chartLeft).attr('y1', startY - 5)
      .attr('x2', chartLeft).attr('y2', startY + data.length * (barHeight + barGap) + 15)
      .attr('stroke', colors.muted).attr('stroke-width', 1).attr('stroke-dasharray', '4,4');

    // Create bars for each compounding frequency
    data.forEach((d, i) => {
      const g = svgEl.append('g').attr('class', `bar-${i}`).attr('opacity', 0);
      const y = startY + i * (barHeight + barGap);
      const barWidth = scale(d.result) - chartLeft;

      // Label on left
      g.append('text')
        .attr('x', chartLeft - 10).attr('y', y + barHeight / 2 + 5)
        .attr('text-anchor', 'end')
        .attr('fill', colors.fg)
        .attr('font-size', '13px')
        .text(d.label);

      // Bar
      g.append('rect')
        .attr('x', chartLeft).attr('y', y)
        .attr('width', barWidth).attr('height', barHeight)
        .attr('fill', i === data.length - 1 ? colors.yellow : colors.accent)
        .attr('rx', 3);

      // Value on bar
      g.append('text')
        .attr('x', chartLeft + barWidth - 8).attr('y', y + barHeight / 2 + 5)
        .attr('text-anchor', 'end')
        .attr('fill', colors.bg)
        .attr('font-size', '13px')
        .attr('font-weight', 'bold')
        .text(d.n === Infinity ? 'e ≈ 2.718...' : `$${d.result.toFixed(2)}`);
    });

    // e limit line (shown at the end)
    const eLine = svgEl.append('g').attr('class', 'e-line').attr('opacity', 0);

    eLine.append('line')
      .attr('x1', scale(Math.E)).attr('y1', startY - 10)
      .attr('x2', scale(Math.E)).attr('y2', startY + data.length * (barHeight + barGap) + 15)
      .attr('stroke', colors.yellow).attr('stroke-width', 2).attr('stroke-dasharray', '6,4');

    eLine.append('text')
      .attr('x', scale(Math.E)).attr('y', startY - 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('e ≈ 2.718');

    eLine.append('text')
      .attr('x', 240).attr('y', startY + data.length * (barHeight + barGap) + 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .text('No matter how often you compound, you never exceed e');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 480px; }
</style>
