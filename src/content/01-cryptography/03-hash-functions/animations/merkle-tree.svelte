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

  const width = 700;
  const height = 400;
  const maxStep = 6;

  // Tree layout (shifted down to avoid subtitle)
  const levels = {
    data: 360,
    leaf: 285,
    mid: 200,
    root: 115
  };

  const dataX = [130, 270, 430, 570];  // X positions for 4 data blocks

  const allElements = [
    'data-blocks', 'leaf-hashes', 'leaf-arrows',
    'mid-hashes', 'mid-arrows',
    'root-hash', 'root-arrows',
    'verify-path', 'verify-label'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['data-blocks'],
    2: ['data-blocks', 'leaf-hashes', 'leaf-arrows'],
    3: ['data-blocks', 'leaf-hashes', 'leaf-arrows', 'mid-hashes', 'mid-arrows'],
    4: ['data-blocks', 'leaf-hashes', 'leaf-arrows', 'mid-hashes', 'mid-arrows', 'root-hash', 'root-arrows'],
    5: ['data-blocks', 'leaf-hashes', 'leaf-arrows', 'mid-hashes', 'mid-arrows', 'root-hash', 'root-arrows', 'verify-path', 'verify-label'],
    6: ['data-blocks', 'leaf-hashes', 'leaf-arrows', 'mid-hashes', 'mid-arrows', 'root-hash', 'root-arrows', 'verify-path', 'verify-label']
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

    // Update step label
    const labels = [
      '',
      'Step 1: Data chunks',
      'Step 2: Hash each chunk',
      'Step 3: Pair and hash again',
      'Step 4: The Merkle root',
      'Verify chunk C with just 3 hashes!',
      'Verify chunk C with just 3 hashes!'
    ];
    svgEl.select('.step-label').text(labels[step] || '');

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1800);
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

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '16px').attr('font-weight', 'bold')
      .text('Merkle Tree');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '13px')
      .text('');

    // === DATA BLOCKS ===
    const dataBlocks = svgEl.append('g').attr('class', 'data-blocks').attr('opacity', 0);
    const dataLabels = ['Data A', 'Data B', 'Data C', 'Data D'];

    dataX.forEach((x, i) => {
      dataBlocks.append('rect')
        .attr('x', x - 45).attr('y', levels.data - 18)
        .attr('width', 90).attr('height', 36)
        .attr('rx', 5)
        .attr('fill', colors.bgCard)
        .attr('stroke', colors.purple)
        .attr('stroke-width', 2);
      dataBlocks.append('text')
        .attr('x', x).attr('y', levels.data + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.purple).attr('font-size', '13px').attr('font-weight', 'bold')
        .text(dataLabels[i]);
    });

    // === LEAF HASHES ===
    const leafHashes = svgEl.append('g').attr('class', 'leaf-hashes').attr('opacity', 0);
    const leafLabels = ['H(A)', 'H(B)', 'H(C)', 'H(D)'];

    dataX.forEach((x, i) => {
      leafHashes.append('rect')
        .attr('x', x - 35).attr('y', levels.leaf - 15)
        .attr('width', 70).attr('height', 30)
        .attr('rx', 5)
        .attr('fill', colors.bgCard)
        .attr('stroke', colors.aqua)
        .attr('stroke-width', 2);
      leafHashes.append('text')
        .attr('x', x).attr('y', levels.leaf + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.aqua).attr('font-size', '12px').attr('font-weight', 'bold')
        .text(leafLabels[i]);
    });

    // Arrows from data to leaves
    const leafArrows = svgEl.append('g').attr('class', 'leaf-arrows').attr('opacity', 0);
    dataX.forEach((x) => {
      leafArrows.append('line')
        .attr('x1', x).attr('y1', levels.data - 20)
        .attr('x2', x).attr('y2', levels.leaf + 18)
        .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#arrow)');
    });

    // Arrow marker
    svgEl.append('defs').append('marker').attr('id', 'arrow')
      .attr('markerWidth', 8).attr('markerHeight', 6).attr('refX', 6).attr('refY', 3).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 8 3, 0 6').attr('fill', colors.fgMuted);

    // === MID LEVEL HASHES ===
    const midHashes = svgEl.append('g').attr('class', 'mid-hashes').attr('opacity', 0);
    const midX = [200, 500];
    const midLabels = ['H(AB)', 'H(CD)'];

    midX.forEach((x, i) => {
      midHashes.append('rect')
        .attr('x', x - 40).attr('y', levels.mid - 15)
        .attr('width', 80).attr('height', 30)
        .attr('rx', 5)
        .attr('fill', colors.bgCard)
        .attr('stroke', colors.orange)
        .attr('stroke-width', 2);
      midHashes.append('text')
        .attr('x', x).attr('y', levels.mid + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.orange).attr('font-size', '12px').attr('font-weight', 'bold')
        .text(midLabels[i]);
    });

    // Arrows from leaves to mid
    const midArrows = svgEl.append('g').attr('class', 'mid-arrows').attr('opacity', 0);
    // Left pair
    midArrows.append('line')
      .attr('x1', dataX[0]).attr('y1', levels.leaf - 18)
      .attr('x2', midX[0] - 15).attr('y2', levels.mid + 18)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    midArrows.append('line')
      .attr('x1', dataX[1]).attr('y1', levels.leaf - 18)
      .attr('x2', midX[0] + 15).attr('y2', levels.mid + 18)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    // Right pair
    midArrows.append('line')
      .attr('x1', dataX[2]).attr('y1', levels.leaf - 18)
      .attr('x2', midX[1] - 15).attr('y2', levels.mid + 18)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    midArrows.append('line')
      .attr('x1', dataX[3]).attr('y1', levels.leaf - 18)
      .attr('x2', midX[1] + 15).attr('y2', levels.mid + 18)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);

    // === ROOT HASH ===
    const rootHash = svgEl.append('g').attr('class', 'root-hash').attr('opacity', 0);
    const rootX = 350;

    rootHash.append('rect')
      .attr('x', rootX - 55).attr('y', levels.root - 18)
      .attr('width', 110).attr('height', 36)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 3);
    rootHash.append('text')
      .attr('x', rootX).attr('y', levels.root + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '14px').attr('font-weight', 'bold')
      .text('Root Hash');

    // Arrows from mid to root
    const rootArrows = svgEl.append('g').attr('class', 'root-arrows').attr('opacity', 0);
    rootArrows.append('line')
      .attr('x1', midX[0]).attr('y1', levels.mid - 18)
      .attr('x2', rootX - 20).attr('y2', levels.root + 20)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);
    rootArrows.append('line')
      .attr('x1', midX[1]).attr('y1', levels.mid - 18)
      .attr('x2', rootX + 20).attr('y2', levels.root + 20)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5);

    // === VERIFICATION PATH ===
    const verifyPath = svgEl.append('g').attr('class', 'verify-path').attr('opacity', 0);

    // Highlight Data C
    verifyPath.append('rect')
      .attr('x', dataX[2] - 48).attr('y', levels.data - 21)
      .attr('width', 96).attr('height', 42)
      .attr('rx', 7)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3);

    // Highlight H(D) - needed sibling
    verifyPath.append('rect')
      .attr('x', dataX[3] - 38).attr('y', levels.leaf - 18)
      .attr('width', 76).attr('height', 36)
      .attr('rx', 7)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3);
    verifyPath.append('text')
      .attr('x', dataX[3]).attr('y', levels.leaf + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '10px')
      .text('need this');

    // Highlight H(AB) - needed sibling
    verifyPath.append('rect')
      .attr('x', midX[0] - 43).attr('y', levels.mid - 18)
      .attr('width', 86).attr('height', 36)
      .attr('rx', 7)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3);
    verifyPath.append('text')
      .attr('x', midX[0]).attr('y', levels.mid + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '10px')
      .text('need this');

    // Highlight Root - compare against
    verifyPath.append('rect')
      .attr('x', rootX - 58).attr('y', levels.root - 21)
      .attr('width', 116).attr('height', 42)
      .attr('rx', 7)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3);
    verifyPath.append('text')
      .attr('x', rootX).attr('y', levels.root - 30)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '10px')
      .text('compare');

    // Verification label (top left corner)
    const verifyLabel = svgEl.append('g').attr('class', 'verify-label').attr('opacity', 0);
    verifyLabel.append('rect')
      .attr('x', 15).attr('y', 70)
      .attr('width', 135).attr('height', 55)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);
    verifyLabel.append('text')
      .attr('x', 82).attr('y', 90)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '11px').attr('font-weight', 'bold')
      .text('To verify C:');
    verifyLabel.append('text')
      .attr('x', 82).attr('y', 107)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px')
      .text('Only need H(D),');
    verifyLabel.append('text')
      .attr('x', 82).attr('y', 120)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px')
      .text('H(AB), and Root');

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
