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
  const maxStep = 6;

  const allElements = [
    'block-data', 'nonce-box', 'hash-arrow', 'hash-output',
    'attempt-1', 'attempt-2', 'attempt-3', 'success', 'success-label'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['block-data'],
    2: ['block-data', 'nonce-box'],
    3: ['block-data', 'nonce-box', 'hash-arrow', 'hash-output', 'attempt-1'],
    4: ['block-data', 'nonce-box', 'hash-arrow', 'hash-output', 'attempt-2'],
    5: ['block-data', 'nonce-box', 'hash-arrow', 'hash-output', 'attempt-3'],
    6: ['block-data', 'nonce-box', 'hash-arrow', 'hash-output', 'success', 'success-label']
  };

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    const visible = stepVisibility[step] || [];
    allElements.forEach((el) => {
      svgEl.select(`.${el}`).transition().duration(300).attr('opacity', visible.includes(el) ? 1 : 0);
    });

    // Update nonce and hash values (index matches step number)
    const nonceValues = ['', '', '1', '2', '3', '74839201', '74839201'];
    const hashValues = ['', '', 'f7a2c9e8d1b3...', '8b4e2f1a9c7d...', 'a1d8c3b7e9f2...', '000000a8f3b2...', '000000a8f3b2...'];

    if (step >= 2) {
      svgEl.select('.nonce-value').text(nonceValues[step] || '');
    }
    if (step >= 3) {
      svgEl.select('.hash-value').text(hashValues[step] || '');

      // Color the hash - red for failures, green for success
      const isSuccess = step === 6;
      svgEl.select('.hash-value')
        .transition().duration(300)
        .attr('fill', isSuccess ? colors.green : colors.red);

      svgEl.select('.hash-box')
        .transition().duration(300)
        .attr('stroke', isSuccess ? colors.green : colors.red);
    }

    const labels = [
      '',
      'Block data: transactions, prev hash, timestamp',
      'Add a random number called "nonce"',
      'Try nonce = 1... hash doesn\'t start with zeros ✗',
      'Try nonce = 2... still no zeros ✗',
      'Try nonce = 3... nope ✗',
      'Try nonce = 74839201... Found it! ✓'
    ];
    svgEl.select('.step-label').text(labels[step] || '');

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      const delay = i >= 3 && i <= 5 ? 1200 : 1800;
      await sleep(delay);
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
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '16px').attr('font-weight', 'bold')
      .text('Proof of Work Mining');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 52)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '12px')
      .text('');

    // Target requirement box
    svgEl.append('rect')
      .attr('x', 380).attr('y', 70)
      .attr('width', 200).attr('height', 35)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 1.5);
    svgEl.append('text')
      .attr('x', 480).attr('y', 84)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '10px').attr('font-weight', 'bold')
      .text('Target: Hash must start');
    svgEl.append('text')
      .attr('x', 480).attr('y', 97)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '10px').attr('font-weight', 'bold')
      .text('with 6 zeros');

    // Block data box
    const blockData = svgEl.append('g').attr('class', 'block-data').attr('opacity', 0);
    blockData.append('rect')
      .attr('x', 40).attr('y', 120)
      .attr('width', 180).attr('height', 100)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2);
    blockData.append('text')
      .attr('x', 130).attr('y', 145)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '12px').attr('font-weight', 'bold')
      .text('Block Data');
    blockData.append('text')
      .attr('x', 55).attr('y', 168)
      .attr('fill', colors.fgMuted).attr('font-size', '10px')
      .text('Transactions...');
    blockData.append('text')
      .attr('x', 55).attr('y', 185)
      .attr('fill', colors.fgMuted).attr('font-size', '10px')
      .text('Prev: a3f2b8c...');
    blockData.append('text')
      .attr('x', 55).attr('y', 202)
      .attr('fill', colors.fgMuted).attr('font-size', '10px')
      .text('Time: 2024-01-15');

    // Nonce box
    const nonceBox = svgEl.append('g').attr('class', 'nonce-box').attr('opacity', 0);
    nonceBox.append('rect')
      .attr('x', 40).attr('y', 235)
      .attr('width', 180).attr('height', 40)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);
    nonceBox.append('text')
      .attr('x', 55).attr('y', 260)
      .attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold')
      .text('Nonce:');
    nonceBox.append('text')
      .attr('class', 'nonce-value')
      .attr('x', 110).attr('y', 260)
      .attr('fill', colors.fg).attr('font-size', '11px').attr('font-family', 'monospace')
      .text('');

    // Hash arrow
    const hashArrow = svgEl.append('g').attr('class', 'hash-arrow').attr('opacity', 0);
    hashArrow.append('text')
      .attr('x', 300).attr('y', 175)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '11px')
      .text('SHA-256');
    hashArrow.append('path')
      .attr('d', 'M240,190 L360,190')
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#hash-arrow)');

    // Arrow marker
    svgEl.append('defs').append('marker').attr('id', 'hash-arrow')
      .attr('markerWidth', 10).attr('markerHeight', 7).attr('refX', 9).attr('refY', 3.5).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 10 3.5, 0 7').attr('fill', colors.fgMuted);

    // Hash output box
    const hashOutput = svgEl.append('g').attr('class', 'hash-output').attr('opacity', 0);
    hashOutput.append('rect')
      .attr('class', 'hash-box')
      .attr('x', 380).attr('y', 160)
      .attr('width', 180).attr('height', 60)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.red)
      .attr('stroke-width', 2);
    hashOutput.append('text')
      .attr('x', 470).attr('y', 182)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '10px')
      .text('Output Hash:');
    hashOutput.append('text')
      .attr('class', 'hash-value')
      .attr('x', 470).attr('y', 202)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '12px').attr('font-family', 'monospace')
      .text('');

    // Attempt indicators
    const attemptY = 290;

    const attempt1 = svgEl.append('g').attr('class', 'attempt-1').attr('opacity', 0);
    attempt1.append('circle').attr('cx', 390).attr('cy', attemptY).attr('r', 8).attr('fill', colors.red);
    attempt1.append('text').attr('x', 405).attr('y', attemptY + 4).attr('fill', colors.fgMuted).attr('font-size', '10px').text('nonce=1');

    const attempt2 = svgEl.append('g').attr('class', 'attempt-2').attr('opacity', 0);
    attempt2.append('circle').attr('cx', 390).attr('cy', attemptY).attr('r', 8).attr('fill', colors.red);
    attempt2.append('circle').attr('cx', 470).attr('cy', attemptY).attr('r', 8).attr('fill', colors.red);
    attempt2.append('text').attr('x', 405).attr('y', attemptY + 4).attr('fill', colors.fgMuted).attr('font-size', '10px').text('nonce=1');
    attempt2.append('text').attr('x', 485).attr('y', attemptY + 4).attr('fill', colors.fgMuted).attr('font-size', '10px').text('nonce=2');

    const attempt3 = svgEl.append('g').attr('class', 'attempt-3').attr('opacity', 0);
    attempt3.append('circle').attr('cx', 390).attr('cy', attemptY).attr('r', 8).attr('fill', colors.red);
    attempt3.append('circle').attr('cx', 455).attr('cy', attemptY).attr('r', 8).attr('fill', colors.red);
    attempt3.append('circle').attr('cx', 520).attr('cy', attemptY).attr('r', 8).attr('fill', colors.red);
    attempt3.append('text').attr('x', 395).attr('y', attemptY + 4).attr('fill', colors.fgMuted).attr('font-size', '9px').text('1');
    attempt3.append('text').attr('x', 460).attr('y', attemptY + 4).attr('fill', colors.fgMuted).attr('font-size', '9px').text('2');
    attempt3.append('text').attr('x', 525).attr('y', attemptY + 4).attr('fill', colors.fgMuted).attr('font-size', '9px').text('3');
    attempt3.append('text').attr('x', 555).attr('y', attemptY + 4).attr('fill', colors.fgMuted).attr('font-size', '10px').text('...');

    // Success indicator
    const success = svgEl.append('g').attr('class', 'success').attr('opacity', 0);
    success.append('circle').attr('cx', 470).attr('cy', attemptY).attr('r', 12).attr('fill', colors.green);
    success.append('text').attr('x', 470).attr('y', attemptY + 4).attr('text-anchor', 'middle').attr('fill', colors.bg).attr('font-size', '12px').attr('font-weight', 'bold').text('✓');

    const successLabel = svgEl.append('g').attr('class', 'success-label').attr('opacity', 0);
    successLabel.append('rect')
      .attr('x', 320).attr('y', 250)
      .attr('width', 240).attr('height', 28)
      .attr('rx', 5)
      .attr('fill', colors.green);
    successLabel.append('text')
      .attr('x', 440).attr('y', 268)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg).attr('font-size', '11px').attr('font-weight', 'bold')
      .text('Block mined! Broadcast to network.');

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
