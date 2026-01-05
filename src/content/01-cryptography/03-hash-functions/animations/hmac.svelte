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

  const width = 720;
  const height = 440;
  const maxStep = 6;

  const allElements = [
    'inputs', 'pad-key', 'pad-arrow',
    'xor-ops', 'xor-arrows',
    'inner-hash', 'inner-arrows',
    'outer-hash', 'outer-arrows',
    'final-mac'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['inputs'],
    2: ['inputs', 'pad-key', 'pad-arrow'],
    3: ['inputs', 'pad-key', 'pad-arrow', 'xor-ops', 'xor-arrows'],
    4: ['inputs', 'pad-key', 'pad-arrow', 'xor-ops', 'xor-arrows', 'inner-hash', 'inner-arrows'],
    5: ['inputs', 'pad-key', 'pad-arrow', 'xor-ops', 'xor-arrows', 'inner-hash', 'inner-arrows', 'outer-hash', 'outer-arrows'],
    6: ['inputs', 'pad-key', 'pad-arrow', 'xor-ops', 'xor-arrows', 'inner-hash', 'inner-arrows', 'outer-hash', 'outer-arrows', 'final-mac']
  };

  const stepLabels = [
    '',
    'Step 1: Inputs',
    'Step 2: Pad key to block size',
    'Step 3: XOR with ipad and opad',
    'Step 4: Inner hash',
    'Step 5: Outer hash',
    'HMAC complete!'
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
    svgEl.append('defs').append('marker').attr('id', 'hmac-arrow')
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
      .text('HMAC Construction');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 52)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text('');

    // Legend (top right)
    const legendX = 590;
    const legendY = 70;
    svgEl.append('rect')
      .attr('x', legendX).attr('y', legendY)
      .attr('width', 115).attr('height', 105)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-opacity', 0.5);
    svgEl.append('text')
      .attr('x', legendX + 57).attr('y', legendY + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Legend');

    const legendItems = [
      { color: colors.purple, text: 'K = Key' },
      { color: colors.aqua, text: 'm = Message' },
      { color: colors.orange, text: 'ipad = 0x36...' },
      { color: colors.yellow, text: 'opad = 0x5c...' },
      { color: colors.fg, text: '|| = concat' }
    ];
    legendItems.forEach((item, i) => {
      svgEl.append('circle')
        .attr('cx', legendX + 12).attr('cy', legendY + 38 + i * 14)
        .attr('r', 4)
        .attr('fill', item.color);
      svgEl.append('text')
        .attr('x', legendX + 22).attr('y', legendY + 42 + i * 14)
        .attr('fill', colors.fgMuted)
        .attr('font-size', '10px')
        .text(item.text);
    });

    // ========== LAYOUT POSITIONS ==========
    // Key column on left, hash flow in center, message on right

    const keyX = 100, keyY = 80;
    const padX = 100, padY = 140;
    const ipadX = 60, ipadY = 200;   // Under left side of pad
    const opadX = 120, opadY = 260;  // Under right side of pad

    const flowX = 360;
    const concat1Y = 250;
    const hash1Y = 305;
    const innerY = 360;

    const msgX = 520, msgY = 80;

    const concat2X = 540;
    const hash2Y = 410;

    // Helper functions
    function drawBox(
      parent: d3.Selection<SVGGElement, unknown, null, undefined>,
      x: number, y: number, w: number, h: number,
      text: string, stroke: string, fill = colors.bgCard, fontSize = '12px'
    ) {
      parent.append('rect')
        .attr('x', x - w/2).attr('y', y - h/2)
        .attr('width', w).attr('height', h)
        .attr('rx', 5)
        .attr('fill', fill)
        .attr('stroke', stroke)
        .attr('stroke-width', 2);
      parent.append('text')
        .attr('x', x).attr('y', y + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', fill === colors.bgCard ? stroke : colors.bg)
        .attr('font-size', fontSize)
        .attr('font-weight', 'bold')
        .text(text);
    }

    function drawLine(
      parent: d3.Selection<SVGGElement, unknown, null, undefined>,
      points: [number, number][],
      hasArrow = true
    ) {
      const line = d3.line<[number, number]>().x(d => d[0]).y(d => d[1]);
      parent.append('path')
        .attr('d', line(points))
        .attr('fill', 'none')
        .attr('stroke', colors.fgMuted)
        .attr('stroke-width', 1.5)
        .attr('marker-end', hasArrow ? 'url(#hmac-arrow)' : null);
    }

    // ========== INPUTS ==========
    const inputs = svgEl.append('g').attr('class', 'inputs').attr('opacity', 0);
    drawBox(inputs, keyX, keyY, 70, 30, 'Key (K)', colors.purple);
    drawBox(inputs, msgX, msgY, 100, 30, 'Message (m)', colors.aqua);

    // ========== PADDED KEY ==========
    const padKey = svgEl.append('g').attr('class', 'pad-key').attr('opacity', 0);
    drawBox(padKey, padX, padY, 90, 30, 'Padded K', colors.purple);

    const padArrow = svgEl.append('g').attr('class', 'pad-arrow').attr('opacity', 0);
    // Key to Pad: straight down
    drawLine(padArrow, [[keyX, keyY + 17], [keyX, padY - 17]]);

    // ========== XOR OPERATIONS ==========
    const xorOps = svgEl.append('g').attr('class', 'xor-ops').attr('opacity', 0);
    drawBox(xorOps, ipadX, ipadY, 75, 32, 'K\u2295ipad', colors.orange);
    drawBox(xorOps, opadX, opadY, 75, 32, 'K\u2295opad', colors.yellow);

    const xorArrows = svgEl.append('g').attr('class', 'xor-arrows').attr('opacity', 0);
    // Pad to ipad: straight down from left side of pad
    drawLine(xorArrows, [[ipadX, padY + 17], [ipadX, ipadY - 18]]);
    // Pad to opad: straight down from right side of pad
    drawLine(xorArrows, [[opadX, padY + 17], [opadX, opadY - 18]]);

    // ========== INNER HASH ==========
    const innerHash = svgEl.append('g').attr('class', 'inner-hash').attr('opacity', 0);
    drawBox(innerHash, flowX, concat1Y, 140, 32, '(K\u2295ipad) || m', colors.fg);
    drawBox(innerHash, flowX, hash1Y, 65, 30, 'Hash', colors.orange, colors.orange);
    drawBox(innerHash, flowX, innerY, 90, 30, 'inner hash', colors.orange);

    const innerArrows = svgEl.append('g').attr('class', 'inner-arrows').attr('opacity', 0);

    // ipad to concat: right then down (L-shape)
    drawLine(innerArrows, [
      [ipadX + 40, ipadY],
      [flowX - 40, ipadY],
      [flowX - 40, concat1Y - 18]
    ]);

    // Message to concat: down then left (L-shape)
    drawLine(innerArrows, [
      [msgX, msgY + 17],
      [msgX, concat1Y - 50],
      [flowX + 40, concat1Y - 50],
      [flowX + 40, concat1Y - 18]
    ]);

    // Concat to Hash: straight down
    drawLine(innerArrows, [[flowX, concat1Y + 18], [flowX, hash1Y - 17]]);

    // Hash to inner: straight down
    drawLine(innerArrows, [[flowX, hash1Y + 17], [flowX, innerY - 17]]);

    // ========== OUTER HASH ==========
    const outerHash = svgEl.append('g').attr('class', 'outer-hash').attr('opacity', 0);
    drawBox(outerHash, concat2X, innerY, 145, 32, '(K\u2295opad) || inner', colors.fg);
    drawBox(outerHash, concat2X, hash2Y, 65, 30, 'Hash', colors.yellow, colors.yellow);

    const outerArrows = svgEl.append('g').attr('class', 'outer-arrows').attr('opacity', 0);

    // opad to concat2: down, right, up into bottom of concat2
    drawLine(outerArrows, [
      [opadX, opadY + 18],
      [opadX, hash2Y + 10],
      [concat2X - 40, hash2Y + 10],
      [concat2X - 40, innerY + 18]
    ]);

    // inner to concat2: straight right
    drawLine(outerArrows, [
      [flowX + 47, innerY],
      [concat2X - 75, innerY]
    ]);

    // Concat2 to Hash2: straight down
    drawLine(outerArrows, [[concat2X, innerY + 18], [concat2X, hash2Y - 17]]);

    // ========== FINAL HMAC ==========
    const finalMac = svgEl.append('g').attr('class', 'final-mac').attr('opacity', 0);
    const hmacX = concat2X + 95;
    drawBox(finalMac, hmacX, hash2Y, 75, 34, 'HMAC', colors.green, colors.bgCard, '14px');
    drawLine(finalMac, [[concat2X + 35, hash2Y], [hmacX - 40, hash2Y]]);

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
    max-height: 440px;
  }
</style>
