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
  const height = 380;
  const maxStep = 3;

  const stepLabels = [
    'Dealer holds the secret S',
    'Dealer distributes shares to players',
    'Players hold their individual shares',
    'Combiner collects shares and reconstructs S'
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function showStep(step: number, animate: boolean = true) {
    if (!svgEl) return;
    const duration = animate ? 500 : 0;

    svgEl.select('.step-label').text(stepLabels[step]);

    // Step 0: Dealer visible
    svgEl.select('.dealer')
      .transition().duration(duration)
      .attr('opacity', step >= 0 ? 1 : 0);

    // Step 1: Lines to players
    svgEl.select('.dealer-lines')
      .transition().duration(duration)
      .attr('opacity', step >= 1 ? 1 : 0);

    // Step 2: Players visible
    svgEl.select('.players')
      .transition().duration(duration)
      .attr('opacity', step >= 2 ? 1 : 0);

    // Step 3: Lines to combiner + combiner
    svgEl.select('.combiner-lines')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

    svgEl.select('.combiner')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

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
    svgEl.select('.dealer').attr('opacity', 1);
    svgEl.select('.dealer-lines').attr('opacity', 1);
    svgEl.select('.players').attr('opacity', 1);
    svgEl.select('.combiner-lines').attr('opacity', 1);
    svgEl.select('.combiner').attr('opacity', 1);
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

    const nodeRadius = 22;

    // Positions
    const dealer = { x: width / 2, y: 70, label: 'D: S', color: colors.yellow };
    const players = [
      { x: 80, y: 190, label: 'P₁: s₁', color: colors.aqua },
      { x: 180, y: 215, label: 'P₂: s₂', color: colors.aqua },
      { x: 320, y: 215, label: 'P₃: s₃', color: colors.aqua },
      { x: 420, y: 190, label: 'P₄: s₄', color: colors.aqua }
    ];
    const combiner = { x: width / 2, y: 330, label: 'C: S', color: colors.green };

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('The Three Roles');

    // Legend (top left)
    const legend = svgEl.append('g').attr('transform', 'translate(12, 38)');
    const legendItems = [
      { label: 'D = Dealer', color: colors.yellow },
      { label: 'P = Player', color: colors.aqua },
      { label: 'C = Combiner', color: colors.green }
    ];
    legendItems.forEach((item, i) => {
      legend.append('text')
        .attr('x', 0).attr('y', i * 16)
        .attr('fill', item.color)
        .attr('font-size', '11px')
        .text(item.label);
    });

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // Arrow marker
    svgEl.append('defs')
      .append('marker')
      .attr('id', 'arrow-role')
      .attr('markerWidth', 10)
      .attr('markerHeight', 7)
      .attr('refX', 9)
      .attr('refY', 3.5)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', colors.fgMuted);

    // Dealer to players lines
    const dealerLines = svgEl.append('g')
      .attr('class', 'dealer-lines')
      .attr('opacity', 0);

    players.forEach(player => {
      dealerLines.append('line')
        .attr('x1', dealer.x).attr('y1', dealer.y + nodeRadius)
        .attr('x2', player.x).attr('y2', player.y - nodeRadius)
        .attr('stroke', colors.fgMuted)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3')
        .attr('marker-end', 'url(#arrow-role)');
    });

    // Players to combiner lines
    const combinerLines = svgEl.append('g')
      .attr('class', 'combiner-lines')
      .attr('opacity', 0);

    players.forEach(player => {
      combinerLines.append('line')
        .attr('x1', player.x).attr('y1', player.y + nodeRadius)
        .attr('x2', combiner.x).attr('y2', combiner.y - nodeRadius)
        .attr('stroke', colors.fgMuted)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3')
        .attr('marker-end', 'url(#arrow-role)');
    });

    // Dealer node
    const dealerG = svgEl.append('g')
      .attr('class', 'dealer')
      .attr('opacity', 0);

    dealerG.append('circle')
      .attr('cx', dealer.x).attr('cy', dealer.y)
      .attr('r', nodeRadius)
      .attr('fill', colors.bgCard)
      .attr('stroke', dealer.color)
      .attr('stroke-width', 3);

    dealerG.append('text')
      .attr('x', dealer.x).attr('y', dealer.y + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', dealer.color)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(dealer.label);

    // Player nodes
    const playersG = svgEl.append('g')
      .attr('class', 'players')
      .attr('opacity', 0);

    players.forEach(player => {
      playersG.append('circle')
        .attr('cx', player.x).attr('cy', player.y)
        .attr('r', nodeRadius)
        .attr('fill', colors.bgCard)
        .attr('stroke', player.color)
        .attr('stroke-width', 3);

      playersG.append('text')
        .attr('x', player.x).attr('y', player.y + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', player.color)
        .attr('font-size', '13px')
        .attr('font-weight', 'bold')
        .text(player.label);
    });

    // Combiner node
    const combinerG = svgEl.append('g')
      .attr('class', 'combiner')
      .attr('opacity', 0);

    combinerG.append('circle')
      .attr('cx', combiner.x).attr('cy', combiner.y)
      .attr('r', nodeRadius)
      .attr('fill', colors.bgCard)
      .attr('stroke', combiner.color)
      .attr('stroke-width', 3);

    combinerG.append('text')
      .attr('x', combiner.x).attr('y', combiner.y + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', combiner.color)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(combiner.label);

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
    max-height: 380px;
  }
</style>
