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
  const height = 320;
  const maxStep = 5;

  const blockWidth = 140;
  const blockHeight = 100;
  const blockY = 120;
  const blockSpacing = 180;
  const startX = 100;

  const allElements = [
    'block-1', 'block-2', 'block-3',
    'arrow-1-2', 'arrow-2-3',
    'tamper-highlight', 'broken-chain', 'tamper-label'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['block-1'],
    2: ['block-1', 'block-2', 'arrow-1-2'],
    3: ['block-1', 'block-2', 'block-3', 'arrow-1-2', 'arrow-2-3'],
    4: ['block-1', 'block-2', 'block-3', 'arrow-1-2', 'arrow-2-3', 'tamper-highlight', 'tamper-label'],
    5: ['block-1', 'block-2', 'block-3', 'arrow-1-2', 'arrow-2-3', 'tamper-highlight', 'broken-chain', 'tamper-label']
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
      'Block 1: The first block (genesis)',
      'Block 2: Contains hash of Block 1',
      'Block 3: Contains hash of Block 2',
      'What if someone tampers with Block 1?',
      'The chain breaks! Hash mismatch detected.'
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

  function drawBlock(parent: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, num: number, prevHash: string, hash: string) {
    // Block outline
    parent.append('rect')
      .attr('x', x).attr('y', blockY)
      .attr('width', blockWidth).attr('height', blockHeight)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2);

    // Block number header
    parent.append('rect')
      .attr('x', x).attr('y', blockY)
      .attr('width', blockWidth).attr('height', 24)
      .attr('rx', 8)
      .attr('fill', colors.aqua);
    parent.append('rect')
      .attr('x', x).attr('y', blockY + 16)
      .attr('width', blockWidth).attr('height', 8)
      .attr('fill', colors.aqua);

    parent.append('text')
      .attr('x', x + blockWidth / 2).attr('y', blockY + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg).attr('font-size', '12px').attr('font-weight', 'bold')
      .text(`Block ${num}`);

    // Data label
    parent.append('text')
      .attr('x', x + 10).attr('y', blockY + 42)
      .attr('fill', colors.fgMuted).attr('font-size', '10px')
      .text('Data:');
    parent.append('text')
      .attr('x', x + 45).attr('y', blockY + 42)
      .attr('fill', colors.fg).attr('font-size', '10px')
      .text('Transactions...');

    // Prev hash
    parent.append('text')
      .attr('x', x + 10).attr('y', blockY + 60)
      .attr('fill', colors.fgMuted).attr('font-size', '10px')
      .text('Prev:');
    parent.append('text')
      .attr('class', `prev-hash-${num}`)
      .attr('x', x + 45).attr('y', blockY + 60)
      .attr('fill', colors.orange).attr('font-size', '10px').attr('font-family', 'monospace')
      .text(prevHash);

    // This hash
    parent.append('text')
      .attr('x', x + 10).attr('y', blockY + 78)
      .attr('fill', colors.fgMuted).attr('font-size', '10px')
      .text('Hash:');
    parent.append('text')
      .attr('class', `hash-${num}`)
      .attr('x', x + 45).attr('y', blockY + 78)
      .attr('fill', colors.green).attr('font-size', '10px').attr('font-family', 'monospace')
      .text(hash);
  }

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
      red: '#fb4934',
      yellow: s.getPropertyValue('--color-math').trim()
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '16px').attr('font-weight', 'bold')
      .text('Hash Chain');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 52)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '13px')
      .text('');

    // Block 1
    const block1 = svgEl.append('g').attr('class', 'block-1').attr('opacity', 0);
    drawBlock(block1, startX, 1, '0000000', 'a3f2b8c');

    // Block 2
    const block2 = svgEl.append('g').attr('class', 'block-2').attr('opacity', 0);
    drawBlock(block2, startX + blockSpacing, 2, 'a3f2b8c', 'd7e9f1a');

    // Block 3
    const block3 = svgEl.append('g').attr('class', 'block-3').attr('opacity', 0);
    drawBlock(block3, startX + blockSpacing * 2, 3, 'd7e9f1a', 'c4b2e6d');

    // Arrows
    const arrow12 = svgEl.append('g').attr('class', 'arrow-1-2').attr('opacity', 0);
    arrow12.append('path')
      .attr('d', `M${startX + blockWidth + 5},${blockY + blockHeight / 2} L${startX + blockSpacing - 5},${blockY + blockHeight / 2}`)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrow-orange)');

    const arrow23 = svgEl.append('g').attr('class', 'arrow-2-3').attr('opacity', 0);
    arrow23.append('path')
      .attr('d', `M${startX + blockSpacing + blockWidth + 5},${blockY + blockHeight / 2} L${startX + blockSpacing * 2 - 5},${blockY + blockHeight / 2}`)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrow-orange)');

    // Arrow markers
    svgEl.append('defs').append('marker').attr('id', 'arrow-orange')
      .attr('markerWidth', 10).attr('markerHeight', 7).attr('refX', 9).attr('refY', 3.5).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 10 3.5, 0 7').attr('fill', colors.orange);

    // Tamper highlight on Block 1
    const tamperHighlight = svgEl.append('g').attr('class', 'tamper-highlight').attr('opacity', 0);
    tamperHighlight.append('rect')
      .attr('x', startX - 4).attr('y', blockY - 4)
      .attr('width', blockWidth + 8).attr('height', blockHeight + 8)
      .attr('rx', 10)
      .attr('fill', 'none')
      .attr('stroke', colors.red)
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,3');
    tamperHighlight.append('text')
      .attr('x', startX + blockWidth / 2).attr('y', blockY + blockHeight + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '11px').attr('font-weight', 'bold')
      .text('TAMPERED!');

    // Broken chain indicator
    const brokenChain = svgEl.append('g').attr('class', 'broken-chain').attr('opacity', 0);

    // X over the arrow
    const arrowMidX = startX + blockWidth + (blockSpacing - blockWidth) / 2 + 5;
    brokenChain.append('line')
      .attr('x1', arrowMidX - 12).attr('y1', blockY + blockHeight / 2 - 15)
      .attr('x2', arrowMidX + 12).attr('y2', blockY + blockHeight / 2 + 15)
      .attr('stroke', colors.red).attr('stroke-width', 4);
    brokenChain.append('line')
      .attr('x1', arrowMidX - 12).attr('y1', blockY + blockHeight / 2 + 15)
      .attr('x2', arrowMidX + 12).attr('y2', blockY + blockHeight / 2 - 15)
      .attr('stroke', colors.red).attr('stroke-width', 4);

    // Mismatch label on Block 2
    brokenChain.append('rect')
      .attr('x', startX + blockSpacing + 30).attr('y', blockY - 30)
      .attr('width', 85).attr('height', 22)
      .attr('rx', 4)
      .attr('fill', colors.red);
    brokenChain.append('text')
      .attr('x', startX + blockSpacing + 72).attr('y', blockY - 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff').attr('font-size', '10px').attr('font-weight', 'bold')
      .text('MISMATCH!');

    // Tamper explanation label
    const tamperLabel = svgEl.append('g').attr('class', 'tamper-label').attr('opacity', 0);
    tamperLabel.append('rect')
      .attr('x', 20).attr('y', 265)
      .attr('width', 280).attr('height', 40)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 1.5);
    tamperLabel.append('text')
      .attr('x', 30).attr('y', 282)
      .attr('fill', colors.fg).attr('font-size', '11px')
      .text('Block 1 hash changed → Block 2 prev hash');
    tamperLabel.append('text')
      .attr('x', 30).attr('y', 297)
      .attr('fill', colors.fg).attr('font-size', '11px')
      .text('no longer matches → tampering detected!');

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
    max-height: 350px;
  }
</style>
