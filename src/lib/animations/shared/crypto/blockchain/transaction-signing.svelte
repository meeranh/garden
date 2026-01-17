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
  const height = 300;
  const maxStep = 5;

  const allElements = [
    'transaction', 'private-key', 'sign-arrow', 'signature',
    'public-key', 'verify-arrow', 'verify-result'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['transaction'],
    2: ['transaction', 'private-key'],
    3: ['transaction', 'private-key', 'sign-arrow', 'signature'],
    4: ['transaction', 'private-key', 'sign-arrow', 'signature', 'public-key', 'verify-arrow'],
    5: ['transaction', 'private-key', 'sign-arrow', 'signature', 'public-key', 'verify-arrow', 'verify-result']
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
      'Alice creates a transaction: "Send 1 BTC to Bob"',
      'Alice uses her private key (secret!)',
      'She signs the transaction with ECDSA',
      'Anyone can verify with her public key',
      'Valid signature! Only Alice could have signed this.'
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
      red: '#fb4934',
      yellow: s.getPropertyValue('--color-math').trim(),
      purple: '#d3869b'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '15px').attr('font-weight', 'bold')
      .text('Digital Signature in Bitcoin');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 48)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '12px')
      .text('');

    const midY = 150;

    // Transaction box
    const transaction = svgEl.append('g').attr('class', 'transaction').attr('opacity', 0);
    transaction.append('rect')
      .attr('x', 30).attr('y', midY - 35)
      .attr('width', 140).attr('height', 70)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2);
    transaction.append('text')
      .attr('x', 100).attr('y', midY - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '11px').attr('font-weight', 'bold')
      .text('Transaction');
    transaction.append('text')
      .attr('x', 100).attr('y', midY + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px')
      .text('From: Alice');
    transaction.append('text')
      .attr('x', 100).attr('y', midY + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px')
      .text('To: Bob, 1 BTC');

    // Private key
    const privateKey = svgEl.append('g').attr('class', 'private-key').attr('opacity', 0);
    privateKey.append('rect')
      .attr('x', 60).attr('y', midY + 55)
      .attr('width', 80).attr('height', 35)
      .attr('rx', 5)
      .attr('fill', colors.red).attr('fill-opacity', 0.2)
      .attr('stroke', colors.red)
      .attr('stroke-width', 2);
    privateKey.append('text')
      .attr('x', 100).attr('y', midY + 70)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '9px').attr('font-weight', 'bold')
      .text('PRIVATE');
    privateKey.append('text')
      .attr('x', 100).attr('y', midY + 82)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '9px').attr('font-weight', 'bold')
      .text('KEY 🔑');

    // Sign arrow
    const signArrow = svgEl.append('g').attr('class', 'sign-arrow').attr('opacity', 0);
    signArrow.append('path')
      .attr('d', 'M175,' + midY + ' L270,' + midY)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrow-sign)');
    signArrow.append('text')
      .attr('x', 222).attr('y', midY - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '10px')
      .text('SIGN');

    // Arrow marker
    svgEl.append('defs').append('marker').attr('id', 'arrow-sign')
      .attr('markerWidth', 10).attr('markerHeight', 7).attr('refX', 9).attr('refY', 3.5).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 10 3.5, 0 7').attr('fill', colors.orange);

    // Signature
    const signature = svgEl.append('g').attr('class', 'signature').attr('opacity', 0);
    signature.append('rect')
      .attr('x', 280).attr('y', midY - 30)
      .attr('width', 100).attr('height', 60)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);
    signature.append('text')
      .attr('x', 330).attr('y', midY - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold')
      .text('Signature');
    signature.append('text')
      .attr('x', 330).attr('y', midY + 10)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '9px').attr('font-family', 'monospace')
      .text('r: 3a7f2b...');
    signature.append('text')
      .attr('x', 330).attr('y', midY + 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '9px').attr('font-family', 'monospace')
      .text('s: 8c4d1e...');

    // Public key
    const publicKey = svgEl.append('g').attr('class', 'public-key').attr('opacity', 0);
    publicKey.append('rect')
      .attr('x', 290).attr('y', midY + 55)
      .attr('width', 80).attr('height', 35)
      .attr('rx', 5)
      .attr('fill', colors.green).attr('fill-opacity', 0.2)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);
    publicKey.append('text')
      .attr('x', 330).attr('y', midY + 70)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '9px').attr('font-weight', 'bold')
      .text('PUBLIC');
    publicKey.append('text')
      .attr('x', 330).attr('y', midY + 82)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '9px').attr('font-weight', 'bold')
      .text('KEY 🔓');

    // Verify arrow
    const verifyArrow = svgEl.append('g').attr('class', 'verify-arrow').attr('opacity', 0);
    verifyArrow.append('path')
      .attr('d', 'M385,' + midY + ' L480,' + midY)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrow-verify)');
    verifyArrow.append('text')
      .attr('x', 432).attr('y', midY - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '10px')
      .text('VERIFY');

    svgEl.select('defs').append('marker').attr('id', 'arrow-verify')
      .attr('markerWidth', 10).attr('markerHeight', 7).attr('refX', 9).attr('refY', 3.5).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 10 3.5, 0 7').attr('fill', colors.green);

    // Verify result
    const verifyResult = svgEl.append('g').attr('class', 'verify-result').attr('opacity', 0);
    verifyResult.append('rect')
      .attr('x', 490).attr('y', midY - 30)
      .attr('width', 130).attr('height', 60)
      .attr('rx', 8)
      .attr('fill', colors.green).attr('fill-opacity', 0.15)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);
    verifyResult.append('text')
      .attr('x', 555).attr('y', midY - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '20px')
      .text('✓');
    verifyResult.append('text')
      .attr('x', 555).attr('y', midY + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '11px').attr('font-weight', 'bold')
      .text('VALID');

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
