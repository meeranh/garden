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

  const width = 750;
  const height = 380;
  const maxStep = 5;

  const allElements = [
    'blocks', 'iv',
    'chain1', 'result1',
    'chain2', 'result2',
    'chain3', 'mac-highlight'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['blocks', 'iv'],
    2: ['blocks', 'iv', 'chain1', 'result1'],
    3: ['blocks', 'iv', 'chain1', 'result1', 'chain2', 'result2'],
    4: ['blocks', 'iv', 'chain1', 'result1', 'chain2', 'result2', 'chain3'],
    5: ['blocks', 'iv', 'chain1', 'result1', 'chain2', 'result2', 'chain3', 'mac-highlight']
  };

  const stepLabels = [
    '',
    'Step 1: Message blocks and IV',
    'Step 2: First block encryption',
    'Step 3: Chain to second block',
    'Step 4: Chain to third block',
    'Final block C3 is the MAC!'
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    const visible = stepVisibility[step] || [];
    allElements.forEach((el) => {
      svgEl.select(`.${el}`).transition().duration(400).attr('opacity', visible.includes(el) ? 1 : 0);
    });
    svgEl.select('.step-label').text(stepLabels[step] || '');
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

    // Arrow marker
    svgEl.append('defs').append('marker').attr('id', 'cbc-arrow')
      .attr('markerWidth', 8).attr('markerHeight', 6)
      .attr('refX', 6).attr('refY', 3).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 8 3, 0 6').attr('fill', colors.fgMuted);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('CBC-MAC Construction');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 52)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text('');

    // Legend (top right)
    const legendX = 610;
    const legendY = 70;
    svgEl.append('rect')
      .attr('x', legendX).attr('y', legendY)
      .attr('width', 125).attr('height', 75)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-opacity', 0.5);
    svgEl.append('text')
      .attr('x', legendX + 62).attr('y', legendY + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Legend');

    const legendItems = [
      { color: colors.purple, text: 'B = Block' },
      { color: colors.orange, text: 'Encrypt(K, ...)' },
      { color: colors.aqua, text: 'C = Ciphertext' }
    ];
    legendItems.forEach((item, i) => {
      svgEl.append('circle')
        .attr('cx', legendX + 14).attr('cy', legendY + 38 + i * 16)
        .attr('r', 5)
        .attr('fill', item.color);
      svgEl.append('text')
        .attr('x', legendX + 26).attr('y', legendY + 42 + i * 16)
        .attr('fill', colors.fgMuted)
        .attr('font-size', '10px')
        .text(item.text);
    });

    // Layout
    const blockY = 100;
    const xorY = 175;
    const encY = 240;
    const resultY = 310;
    const col1 = 120;
    const col2 = 320;
    const col3 = 520;
    const colSpacing = 200;

    // Helper functions
    function drawBox(
      parent: d3.Selection<SVGGElement, unknown, null, undefined>,
      x: number, y: number, w: number, h: number,
      text: string, stroke: string, fill = colors.bgCard
    ) {
      parent.append('rect')
        .attr('x', x - w/2).attr('y', y - h/2)
        .attr('width', w).attr('height', h)
        .attr('rx', 5)
        .attr('fill', fill)
        .attr('stroke', stroke)
        .attr('stroke-width', 2);
      parent.append('text')
        .attr('x', x).attr('y', y + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', fill === colors.bgCard ? stroke : colors.bg)
        .attr('font-size', '13px')
        .attr('font-weight', 'bold')
        .text(text);
    }

    function drawXor(
      parent: d3.Selection<SVGGElement, unknown, null, undefined>,
      x: number, y: number
    ) {
      parent.append('circle')
        .attr('cx', x).attr('cy', y)
        .attr('r', 16)
        .attr('fill', colors.bgCard)
        .attr('stroke', colors.yellow)
        .attr('stroke-width', 2);
      parent.append('text')
        .attr('x', x).attr('y', y + 6)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.yellow)
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .text('\u2295');
    }

    function drawArrow(
      parent: d3.Selection<SVGGElement, unknown, null, undefined>,
      x1: number, y1: number, x2: number, y2: number
    ) {
      parent.append('line')
        .attr('x1', x1).attr('y1', y1)
        .attr('x2', x2).attr('y2', y2)
        .attr('stroke', colors.fgMuted)
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#cbc-arrow)');
    }

    // === MESSAGE BLOCKS ===
    const blocks = svgEl.append('g').attr('class', 'blocks').attr('opacity', 0);
    drawBox(blocks, col1, blockY, 60, 32, 'B1', colors.purple);
    drawBox(blocks, col2, blockY, 60, 32, 'B2', colors.purple);
    drawBox(blocks, col3, blockY, 60, 32, 'B3', colors.purple);

    // === IV ===
    const iv = svgEl.append('g').attr('class', 'iv').attr('opacity', 0);
    iv.append('rect')
      .attr('x', 20).attr('y', xorY - 16)
      .attr('width', 55).attr('height', 32)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2);
    iv.append('text')
      .attr('x', 47).attr('y', xorY + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('IV=0');

    // === CHAIN 1: B1 XOR IV -> Encrypt -> C1 ===
    const chain1 = svgEl.append('g').attr('class', 'chain1').attr('opacity', 0);

    // Arrow from B1 to XOR
    drawArrow(chain1, col1, blockY + 18, col1, xorY - 18);

    // XOR circle
    drawXor(chain1, col1, xorY);

    // Arrow from IV to XOR
    drawArrow(chain1, 77, xorY, col1 - 18, xorY);

    // Arrow from XOR to Encrypt
    drawArrow(chain1, col1, xorY + 18, col1, encY - 18);

    // Encrypt box
    drawBox(chain1, col1, encY, 70, 32, 'Encrypt', colors.orange, colors.orange);

    // Arrow from Encrypt to C1
    drawArrow(chain1, col1, encY + 18, col1, resultY - 18);

    const result1 = svgEl.append('g').attr('class', 'result1').attr('opacity', 0);
    drawBox(result1, col1, resultY, 50, 32, 'C1', colors.aqua);

    // === CHAIN 2: B2 XOR C1 -> Encrypt -> C2 ===
    const chain2 = svgEl.append('g').attr('class', 'chain2').attr('opacity', 0);

    // Arrow from B2 to XOR
    drawArrow(chain2, col2, blockY + 18, col2, xorY - 18);

    // XOR circle
    drawXor(chain2, col2, xorY);

    // Arrow from C1 to XOR (horizontal then up)
    chain2.append('line')
      .attr('x1', col1 + 27).attr('y1', resultY)
      .attr('x2', col2 - 50).attr('y2', resultY)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5);
    chain2.append('line')
      .attr('x1', col2 - 50).attr('y1', resultY)
      .attr('x2', col2 - 50).attr('y2', xorY)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5);
    drawArrow(chain2, col2 - 50, xorY, col2 - 18, xorY);

    // Arrow from XOR to Encrypt
    drawArrow(chain2, col2, xorY + 18, col2, encY - 18);

    // Encrypt box
    drawBox(chain2, col2, encY, 70, 32, 'Encrypt', colors.orange, colors.orange);

    // Arrow from Encrypt to C2
    drawArrow(chain2, col2, encY + 18, col2, resultY - 18);

    const result2 = svgEl.append('g').attr('class', 'result2').attr('opacity', 0);
    drawBox(result2, col2, resultY, 50, 32, 'C2', colors.aqua);

    // === CHAIN 3: B3 XOR C2 -> Encrypt -> C3 ===
    const chain3 = svgEl.append('g').attr('class', 'chain3').attr('opacity', 0);

    // Arrow from B3 to XOR
    drawArrow(chain3, col3, blockY + 18, col3, xorY - 18);

    // XOR circle
    drawXor(chain3, col3, xorY);

    // Arrow from C2 to XOR
    chain3.append('line')
      .attr('x1', col2 + 27).attr('y1', resultY)
      .attr('x2', col3 - 50).attr('y2', resultY)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5);
    chain3.append('line')
      .attr('x1', col3 - 50).attr('y1', resultY)
      .attr('x2', col3 - 50).attr('y2', xorY)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5);
    drawArrow(chain3, col3 - 50, xorY, col3 - 18, xorY);

    // Arrow from XOR to Encrypt
    drawArrow(chain3, col3, xorY + 18, col3, encY - 18);

    // Encrypt box
    drawBox(chain3, col3, encY, 70, 32, 'Encrypt', colors.orange, colors.orange);

    // Arrow from Encrypt to C3
    drawArrow(chain3, col3, encY + 18, col3, resultY - 18);

    // C3 result box
    chain3.append('rect')
      .attr('x', col3 - 25).attr('y', resultY - 16)
      .attr('width', 50).attr('height', 32)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2);
    chain3.append('text')
      .attr('x', col3).attr('y', resultY + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('C3');

    // === MAC HIGHLIGHT ===
    const macHighlight = svgEl.append('g').attr('class', 'mac-highlight').attr('opacity', 0);

    // Highlight around C3
    macHighlight.append('rect')
      .attr('x', col3 - 32).attr('y', resultY - 23)
      .attr('width', 64).attr('height', 46)
      .attr('rx', 8)
      .attr('fill', 'none')
      .attr('stroke', colors.green)
      .attr('stroke-width', 3);

    // MAC label
    macHighlight.append('text')
      .attr('x', col3).attr('y', resultY + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('= MAC');

    // Arrow pointing to C3
    macHighlight.append('line')
      .attr('x1', col3 + 45).attr('y1', resultY - 10)
      .attr('x2', col3 + 75).attr('y2', resultY - 30)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);
    macHighlight.append('text')
      .attr('x', col3 + 80).attr('y', resultY - 35)
      .attr('fill', colors.green)
      .attr('font-size', '11px')
      .text('Only keep this!');

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
