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
  const height = 380;
  const maxStep = 7;

  const allElements = ['goal', 'naive', 'smart-label', 'step-g', 'step-2g', 'step-4g', 'step-5g', 'comparison', 'security'];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['goal'],
    2: ['goal', 'naive'],
    3: ['goal', 'naive', 'smart-label', 'step-g'],
    4: ['goal', 'naive', 'smart-label', 'step-g', 'step-2g'],
    5: ['goal', 'naive', 'smart-label', 'step-g', 'step-2g', 'step-4g'],
    6: ['goal', 'naive', 'smart-label', 'step-g', 'step-2g', 'step-4g', 'step-5g', 'comparison'],
    7: ['goal', 'naive', 'smart-label', 'step-g', 'step-2g', 'step-4g', 'step-5g', 'comparison', 'security']
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
      purple: '#d3869b',
      green: '#b8bb26',
      red: '#fb4934'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Goal box
    const goal = svgEl.append('g').attr('class', 'goal').attr('opacity', 0);
    goal.append('rect').attr('x', 200).attr('y', 15).attr('width', 200).attr('height', 35).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.yellow).attr('stroke-width', 2);
    goal.append('text').attr('x', 300).attr('y', 40).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '16px').attr('font-weight', 'bold').text('Goal: Compute 5G');

    // Naive approach
    const naiveY = 75;
    const naive = svgEl.append('g').attr('class', 'naive').attr('opacity', 0);
    naive.append('text').attr('x', 30).attr('y', naiveY)
      .attr('fill', colors.red).attr('font-size', '12px').attr('font-weight', 'bold').text('Naive:');
    naive.append('text').attr('x', 80).attr('y', naiveY)
      .attr('fill', colors.fg).attr('font-size', '12px').text('G + G + G + G + G = 5G');
    naive.append('text').attr('x', 290).attr('y', naiveY)
      .attr('fill', colors.red).attr('font-size', '11px').text('(4 additions)');

    // Smart approach label
    const smartLabel = svgEl.append('g').attr('class', 'smart-label').attr('opacity', 0);
    smartLabel.append('text').attr('x', 30).attr('y', 115)
      .attr('fill', colors.green).attr('font-size', '12px').attr('font-weight', 'bold').text('Double-and-Add:');

    const smartStartX = 80;
    const stepSpacing = 130;
    const smartY = 165;

    // Step G
    const stepG = svgEl.append('g').attr('class', 'step-g').attr('opacity', 0);
    stepG.append('circle').attr('cx', smartStartX).attr('cy', smartY).attr('r', 25)
      .attr('fill', colors.aqua).attr('fill-opacity', 0.2).attr('stroke', colors.aqua).attr('stroke-width', 2);
    stepG.append('text').attr('x', smartStartX).attr('y', smartY + 6).attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '16px').attr('font-weight', 'bold').text('G');

    // Arrow marker
    svgEl.append('defs').append('marker').attr('id', 'arrow-scalar')
      .attr('markerWidth', 8).attr('markerHeight', 6).attr('refX', 7).attr('refY', 3).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 8 3, 0 6').attr('fill', colors.fg);

    // Step 2G
    const step2G = svgEl.append('g').attr('class', 'step-2g').attr('opacity', 0);
    step2G.append('path')
      .attr('d', `M${smartStartX + 30},${smartY} Q${smartStartX + 60},${smartY - 35} ${smartStartX + stepSpacing - 30},${smartY}`)
      .attr('fill', 'none').attr('stroke', colors.orange).attr('stroke-width', 2).attr('marker-end', 'url(#arrow-scalar)');
    step2G.append('text').attr('x', smartStartX + stepSpacing / 2).attr('y', smartY - 40).attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '11px').text('double');
    step2G.append('circle').attr('cx', smartStartX + stepSpacing).attr('cy', smartY).attr('r', 25)
      .attr('fill', colors.orange).attr('fill-opacity', 0.2).attr('stroke', colors.orange).attr('stroke-width', 2);
    step2G.append('text').attr('x', smartStartX + stepSpacing).attr('y', smartY + 6).attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '16px').attr('font-weight', 'bold').text('2G');

    // Step 4G
    const step4G = svgEl.append('g').attr('class', 'step-4g').attr('opacity', 0);
    step4G.append('path')
      .attr('d', `M${smartStartX + stepSpacing + 30},${smartY} Q${smartStartX + stepSpacing + 60},${smartY - 35} ${smartStartX + 2 * stepSpacing - 30},${smartY}`)
      .attr('fill', 'none').attr('stroke', colors.purple).attr('stroke-width', 2).attr('marker-end', 'url(#arrow-scalar)');
    step4G.append('text').attr('x', smartStartX + stepSpacing + stepSpacing / 2).attr('y', smartY - 40).attr('text-anchor', 'middle')
      .attr('fill', colors.purple).attr('font-size', '11px').text('double');
    step4G.append('circle').attr('cx', smartStartX + 2 * stepSpacing).attr('cy', smartY).attr('r', 25)
      .attr('fill', colors.purple).attr('fill-opacity', 0.2).attr('stroke', colors.purple).attr('stroke-width', 2);
    step4G.append('text').attr('x', smartStartX + 2 * stepSpacing).attr('y', smartY + 6).attr('text-anchor', 'middle')
      .attr('fill', colors.purple).attr('font-size', '16px').attr('font-weight', 'bold').text('4G');

    // Step 5G
    const step5G = svgEl.append('g').attr('class', 'step-5g').attr('opacity', 0);
    step5G.append('path')
      .attr('d', `M${smartStartX + 2 * stepSpacing + 30},${smartY} Q${smartStartX + 2 * stepSpacing + 55},${smartY - 30} ${smartStartX + 2.7 * stepSpacing - 30},${smartY}`)
      .attr('fill', 'none').attr('stroke', colors.green).attr('stroke-width', 2).attr('marker-end', 'url(#arrow-scalar)');
    step5G.append('text').attr('x', smartStartX + 2 * stepSpacing + 55).attr('y', smartY - 35).attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '11px').text('+ G');
    step5G.append('circle').attr('cx', smartStartX + 2.7 * stepSpacing).attr('cy', smartY).attr('r', 25)
      .attr('fill', colors.green).attr('fill-opacity', 0.2).attr('stroke', colors.green).attr('stroke-width', 2);
    step5G.append('text').attr('x', smartStartX + 2.7 * stepSpacing).attr('y', smartY + 6).attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '16px').attr('font-weight', 'bold').text('5G');

    // Comparison
    const comparison = svgEl.append('g').attr('class', 'comparison').attr('opacity', 0);
    comparison.append('rect').attr('x', 40).attr('y', 230).attr('width', 520).attr('height', 55).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted);
    comparison.append('text').attr('x', 300).attr('y', 252).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '12px').text('For k = 5: Naive needs 4 ops | Double-and-add needs 3 ops');
    comparison.append('text').attr('x', 300).attr('y', 275).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '12px').attr('font-weight', 'bold')
      .text('For k = 2^256: Naive = impossible | Double-and-add = ~256 ops');

    // Security note
    const security = svgEl.append('g').attr('class', 'security').attr('opacity', 0);
    security.append('rect').attr('x', 80).attr('y', 305).attr('width', 440).attr('height', 40).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.red).attr('stroke-width', 2);
    security.append('text').attr('x', 300).attr('y', 332).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '12px').attr('font-weight', 'bold')
      .text('ECDLP: Given G and kG, finding k is computationally infeasible');

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
    max-height: 380px;
  }
</style>
