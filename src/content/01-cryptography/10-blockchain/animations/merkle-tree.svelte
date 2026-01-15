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
  const height = 340;
  const maxStep = 5;

  // Tree layout (shifted down to avoid subtitle overlap)
  const levels = {
    tx: 310,
    leaf: 240,
    mid: 165,
    root: 90
  };

  const txX = [100, 220, 380, 500];

  const allElements = [
    'transactions', 'leaf-hashes', 'leaf-arrows',
    'mid-hashes', 'mid-arrows',
    'root-hash', 'root-arrows',
    'verify-highlight'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['transactions'],
    2: ['transactions', 'leaf-hashes', 'leaf-arrows'],
    3: ['transactions', 'leaf-hashes', 'leaf-arrows', 'mid-hashes', 'mid-arrows'],
    4: ['transactions', 'leaf-hashes', 'leaf-arrows', 'mid-hashes', 'mid-arrows', 'root-hash', 'root-arrows'],
    5: ['transactions', 'leaf-hashes', 'leaf-arrows', 'mid-hashes', 'mid-arrows', 'root-hash', 'root-arrows', 'verify-highlight']
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

    const labels = [
      '',
      'Step 1: Four transactions in a block',
      'Step 2: Hash each transaction',
      'Step 3: Hash pairs together',
      'Step 4: Hash again to get the Merkle root',
      'To verify Tx C: only need H(D), H(AB), and Root'
    ];
    svgEl.select('.step-label').text(labels[step] || '');

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(2000);
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
      aqua: '#8ec07c',
      orange: '#fe8019',
      green: '#b8bb26',
      purple: '#d3869b',
      yellow: s.getPropertyValue('--color-math').trim()
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '15px').attr('font-weight', 'bold')
      .text('Merkle Tree');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 48)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '12px')
      .text('');

    // Arrow marker
    svgEl.append('defs').append('marker').attr('id', 'merkle-arrow')
      .attr('markerWidth', 6).attr('markerHeight', 5).attr('refX', 5).attr('refY', 2.5).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 6 2.5, 0 5').attr('fill', colors.fgMuted);

    // === TRANSACTIONS ===
    const transactions = svgEl.append('g').attr('class', 'transactions').attr('opacity', 0);
    const txLabels = ['Tx A', 'Tx B', 'Tx C', 'Tx D'];

    txX.forEach((x, i) => {
      transactions.append('rect')
        .attr('x', x - 35).attr('y', levels.tx - 15)
        .attr('width', 70).attr('height', 30)
        .attr('rx', 5)
        .attr('fill', colors.bgCard)
        .attr('stroke', colors.purple)
        .attr('stroke-width', 2);
      transactions.append('text')
        .attr('x', x).attr('y', levels.tx + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.purple).attr('font-size', '12px').attr('font-weight', 'bold')
        .text(txLabels[i]);
    });

    // === LEAF HASHES ===
    const leafHashes = svgEl.append('g').attr('class', 'leaf-hashes').attr('opacity', 0);
    const leafLabels = ['H(A)', 'H(B)', 'H(C)', 'H(D)'];

    txX.forEach((x, i) => {
      leafHashes.append('rect')
        .attr('x', x - 30).attr('y', levels.leaf - 12)
        .attr('width', 60).attr('height', 24)
        .attr('rx', 4)
        .attr('fill', colors.bgCard)
        .attr('stroke', colors.aqua)
        .attr('stroke-width', 2);
      leafHashes.append('text')
        .attr('x', x).attr('y', levels.leaf + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.aqua).attr('font-size', '11px').attr('font-weight', 'bold')
        .text(leafLabels[i]);
    });

    // Arrows from tx to leaves
    const leafArrows = svgEl.append('g').attr('class', 'leaf-arrows').attr('opacity', 0);
    txX.forEach((x) => {
      leafArrows.append('line')
        .attr('x1', x).attr('y1', levels.tx - 18)
        .attr('x2', x).attr('y2', levels.leaf + 15)
        .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#merkle-arrow)');
    });

    // === MID LEVEL HASHES ===
    const midHashes = svgEl.append('g').attr('class', 'mid-hashes').attr('opacity', 0);
    const midX = [160, 440];
    const midLabels = ['H(AB)', 'H(CD)'];

    midX.forEach((x, i) => {
      midHashes.append('rect')
        .attr('x', x - 35).attr('y', levels.mid - 12)
        .attr('width', 70).attr('height', 24)
        .attr('rx', 4)
        .attr('fill', colors.bgCard)
        .attr('stroke', colors.orange)
        .attr('stroke-width', 2);
      midHashes.append('text')
        .attr('x', x).attr('y', levels.mid + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.orange).attr('font-size', '11px').attr('font-weight', 'bold')
        .text(midLabels[i]);
    });

    // Arrows from leaves to mid
    const midArrows = svgEl.append('g').attr('class', 'mid-arrows').attr('opacity', 0);
    // Left pair
    midArrows.append('line')
      .attr('x1', txX[0]).attr('y1', levels.leaf - 15)
      .attr('x2', midX[0] - 15).attr('y2', levels.mid + 15)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    midArrows.append('line')
      .attr('x1', txX[1]).attr('y1', levels.leaf - 15)
      .attr('x2', midX[0] + 15).attr('y2', levels.mid + 15)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    // Right pair
    midArrows.append('line')
      .attr('x1', txX[2]).attr('y1', levels.leaf - 15)
      .attr('x2', midX[1] - 15).attr('y2', levels.mid + 15)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    midArrows.append('line')
      .attr('x1', txX[3]).attr('y1', levels.leaf - 15)
      .attr('x2', midX[1] + 15).attr('y2', levels.mid + 15)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);

    // === ROOT HASH ===
    const rootHash = svgEl.append('g').attr('class', 'root-hash').attr('opacity', 0);
    const rootX = 300;

    rootHash.append('rect')
      .attr('x', rootX - 50).attr('y', levels.root - 15)
      .attr('width', 100).attr('height', 30)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 3);
    rootHash.append('text')
      .attr('x', rootX).attr('y', levels.root + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '12px').attr('font-weight', 'bold')
      .text('Root Hash');

    // Arrows from mid to root
    const rootArrows = svgEl.append('g').attr('class', 'root-arrows').attr('opacity', 0);
    rootArrows.append('line')
      .attr('x1', midX[0]).attr('y1', levels.mid - 15)
      .attr('x2', rootX - 20).attr('y2', levels.root + 18)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    rootArrows.append('line')
      .attr('x1', midX[1]).attr('y1', levels.mid - 15)
      .attr('x2', rootX + 20).attr('y2', levels.root + 18)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);

    // === VERIFICATION HIGHLIGHT ===
    const verifyHighlight = svgEl.append('g').attr('class', 'verify-highlight').attr('opacity', 0);

    // Highlight Tx C
    verifyHighlight.append('rect')
      .attr('x', txX[2] - 38).attr('y', levels.tx - 18)
      .attr('width', 76).attr('height', 36)
      .attr('rx', 7)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3);

    // Highlight H(D) - sibling
    verifyHighlight.append('rect')
      .attr('x', txX[3] - 33).attr('y', levels.leaf - 15)
      .attr('width', 66).attr('height', 30)
      .attr('rx', 6)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);
    verifyHighlight.append('text')
      .attr('x', txX[3]).attr('y', levels.leaf + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '9px')
      .text('need');

    // Highlight H(AB) - uncle
    verifyHighlight.append('rect')
      .attr('x', midX[0] - 38).attr('y', levels.mid - 15)
      .attr('width', 76).attr('height', 30)
      .attr('rx', 6)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);
    verifyHighlight.append('text')
      .attr('x', midX[0]).attr('y', levels.mid + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '9px')
      .text('need');

    // Highlight Root - compare
    verifyHighlight.append('rect')
      .attr('x', rootX - 53).attr('y', levels.root - 18)
      .attr('width', 106).attr('height', 36)
      .attr('rx', 7)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);
    verifyHighlight.append('text')
      .attr('x', rootX).attr('y', levels.root - 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '9px')
      .text('compare');

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
