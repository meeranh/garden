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

  const width = 580;
  const height = 420;
  const maxStep = 5;

  const stepLabels = [
    'Alice wants to send a secret message to Bob',
    'Step 1: Generate a random session key',
    'Step 2: Encrypt message with session key (AES)',
    'Step 3: Encrypt session key with Bob\'s public key (RSA)',
    'Step 4: Combine into PGP message',
    'PGP message ready to send!'
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function showStep(step: number, animate: boolean = true) {
    if (!svgEl) return;
    const duration = animate ? 500 : 0;

    svgEl.select('.step-label').text(stepLabels[step]);

    // Step 0: Show message
    svgEl.select('.message')
      .transition().duration(duration)
      .attr('opacity', step >= 0 ? 1 : 0);

    // Step 1: Show session key and Bob's key
    svgEl.select('.session-key')
      .transition().duration(duration)
      .attr('opacity', step >= 1 ? 1 : 0);

    svgEl.select('.bob-key')
      .transition().duration(duration)
      .attr('opacity', step >= 1 ? 1 : 0);

    // Step 2: AES encryption
    svgEl.select('.aes-flow')
      .transition().duration(duration)
      .attr('opacity', step >= 2 ? 1 : 0);

    svgEl.select('.enc-message')
      .transition().duration(duration)
      .attr('opacity', step >= 2 ? 1 : 0);

    // Step 3: RSA encryption
    svgEl.select('.rsa-flow')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

    svgEl.select('.enc-key')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

    // Step 4: Final combination
    svgEl.select('.combine-flow')
      .transition().duration(duration)
      .attr('opacity', step >= 4 ? 1 : 0);

    svgEl.select('.pgp-message')
      .transition().duration(duration)
      .attr('opacity', step >= 4 ? 1 : 0);

    // Step 5: Highlight final
    svgEl.select('.pgp-message rect')
      .transition().duration(duration)
      .attr('stroke-width', step >= 5 ? 3 : 2);

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
    svgEl.select('.message').attr('opacity', 1);
    svgEl.select('.session-key').attr('opacity', 1);
    svgEl.select('.bob-key').attr('opacity', 1);
    svgEl.select('.aes-flow').attr('opacity', 1);
    svgEl.select('.enc-message').attr('opacity', 1);
    svgEl.select('.rsa-flow').attr('opacity', 1);
    svgEl.select('.enc-key').attr('opacity', 1);
    svgEl.select('.combine-flow').attr('opacity', 1);
    svgEl.select('.pgp-message').attr('opacity', 1);
    svgEl.select('.pgp-message rect').attr('stroke-width', 3);
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

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('PGP Hybrid Encryption');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '12px')
      .text(stepLabels[0]);

    // Tree layout positions
    const row1Y = 70;   // Inputs
    const row2Y = 165;  // Encryption ops
    const row3Y = 260;  // Encrypted outputs
    const row4Y = 355;  // Final PGP message

    const leftX = 100;
    const centerX = width / 2;
    const rightX = width - 100;

    const boxW = 110;
    const boxH = 40;
    const opBoxW = 80;
    const opBoxH = 45;

    // Arrow marker
    svgEl.append('defs')
      .append('marker')
      .attr('id', 'arrow-hybrid')
      .attr('markerWidth', 8)
      .attr('markerHeight', 6)
      .attr('refX', 7)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 8 3, 0 6')
      .attr('fill', colors.fgMuted);

    // === ROW 1: Inputs ===

    // Message (left)
    const message = svgEl.append('g').attr('class', 'message').attr('opacity', 0);
    message.append('rect')
      .attr('x', leftX - boxW/2).attr('y', row1Y - boxH/2)
      .attr('width', boxW).attr('height', boxH)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.blue)
      .attr('stroke-width', 2)
      .attr('rx', 6);
    message.append('text')
      .attr('x', leftX).attr('y', row1Y + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.blue)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Message');

    // Session Key (center)
    const sessionKey = svgEl.append('g').attr('class', 'session-key').attr('opacity', 0);
    sessionKey.append('rect')
      .attr('x', centerX - boxW/2).attr('y', row1Y - boxH/2)
      .attr('width', boxW).attr('height', boxH)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2)
      .attr('rx', 6);
    sessionKey.append('text')
      .attr('x', centerX).attr('y', row1Y + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Session Key');

    // Bob's Public Key (right)
    const bobKey = svgEl.append('g').attr('class', 'bob-key').attr('opacity', 0);
    bobKey.append('rect')
      .attr('x', rightX - boxW/2).attr('y', row1Y - boxH/2)
      .attr('width', boxW).attr('height', boxH)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2)
      .attr('rx', 6);
    bobKey.append('text')
      .attr('x', rightX).attr('y', row1Y + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Bob\'s Pub Key');

    // === ROW 2: Encryption operations ===

    const aesX = (leftX + centerX) / 2;
    const rsaX = (centerX + rightX) / 2;

    // AES flow (arrows + box)
    const aesFlow = svgEl.append('g').attr('class', 'aes-flow').attr('opacity', 0);

    // Arrow from Message to AES
    aesFlow.append('line')
      .attr('x1', leftX).attr('y1', row1Y + boxH/2)
      .attr('x2', aesX - 15).attr('y2', row2Y - opBoxH/2)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-hybrid)');

    // Arrow from Session Key to AES
    aesFlow.append('line')
      .attr('x1', centerX - 20).attr('y1', row1Y + boxH/2)
      .attr('x2', aesX + 15).attr('y2', row2Y - opBoxH/2)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-hybrid)');

    // AES box
    aesFlow.append('rect')
      .attr('x', aesX - opBoxW/2).attr('y', row2Y - opBoxH/2)
      .attr('width', opBoxW).attr('height', opBoxH)
      .attr('fill', colors.green)
      .attr('opacity', 0.2)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2)
      .attr('rx', 6);
    aesFlow.append('text')
      .attr('x', aesX).attr('y', row2Y - 3)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('AES');
    aesFlow.append('text')
      .attr('x', aesX).attr('y', row2Y + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '10px')
      .text('(fast)');

    // RSA flow (arrows + box)
    const rsaFlow = svgEl.append('g').attr('class', 'rsa-flow').attr('opacity', 0);

    // Arrow from Session Key to RSA
    rsaFlow.append('line')
      .attr('x1', centerX + 20).attr('y1', row1Y + boxH/2)
      .attr('x2', rsaX - 15).attr('y2', row2Y - opBoxH/2)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-hybrid)');

    // Arrow from Bob's Key to RSA
    rsaFlow.append('line')
      .attr('x1', rightX).attr('y1', row1Y + boxH/2)
      .attr('x2', rsaX + 15).attr('y2', row2Y - opBoxH/2)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-hybrid)');

    // RSA box
    rsaFlow.append('rect')
      .attr('x', rsaX - opBoxW/2).attr('y', row2Y - opBoxH/2)
      .attr('width', opBoxW).attr('height', opBoxH)
      .attr('fill', colors.yellow)
      .attr('opacity', 0.2)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2)
      .attr('rx', 6);
    rsaFlow.append('text')
      .attr('x', rsaX).attr('y', row2Y - 3)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('RSA');
    rsaFlow.append('text')
      .attr('x', rsaX).attr('y', row2Y + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '10px')
      .text('(slow)');

    // === ROW 3: Encrypted outputs ===

    // Encrypted Message (arrow + box)
    const encMessage = svgEl.append('g').attr('class', 'enc-message').attr('opacity', 0);
    encMessage.append('line')
      .attr('x1', aesX).attr('y1', row2Y + opBoxH/2)
      .attr('x2', aesX).attr('y2', row3Y - boxH/2 - 5)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-hybrid)');
    encMessage.append('rect')
      .attr('x', aesX - boxW/2).attr('y', row3Y - boxH/2)
      .attr('width', boxW).attr('height', boxH)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2)
      .attr('rx', 6);
    encMessage.append('text')
      .attr('x', aesX).attr('y', row3Y)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Encrypted Msg');
    encMessage.append('text')
      .attr('x', aesX).attr('y', row3Y + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '9px')
      .text('(large)');

    // Encrypted Key (arrow + box)
    const encKey = svgEl.append('g').attr('class', 'enc-key').attr('opacity', 0);
    encKey.append('line')
      .attr('x1', rsaX).attr('y1', row2Y + opBoxH/2)
      .attr('x2', rsaX).attr('y2', row3Y - boxH/2 - 5)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-hybrid)');
    encKey.append('rect')
      .attr('x', rsaX - boxW/2).attr('y', row3Y - boxH/2)
      .attr('width', boxW).attr('height', boxH)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2)
      .attr('rx', 6);
    encKey.append('text')
      .attr('x', rsaX).attr('y', row3Y)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Encrypted Key');
    encKey.append('text')
      .attr('x', rsaX).attr('y', row3Y + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '9px')
      .text('(small)');

    // === ROW 4: Final PGP Message ===

    // Combine flow (arrows)
    const combineFlow = svgEl.append('g').attr('class', 'combine-flow').attr('opacity', 0);
    combineFlow.append('line')
      .attr('x1', aesX).attr('y1', row3Y + boxH/2)
      .attr('x2', centerX - 30).attr('y2', row4Y - boxH/2 - 5)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-hybrid)');
    combineFlow.append('line')
      .attr('x1', rsaX).attr('y1', row3Y + boxH/2)
      .attr('x2', centerX + 30).attr('y2', row4Y - boxH/2 - 5)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-hybrid)');

    // PGP Message box
    const pgpMessage = svgEl.append('g').attr('class', 'pgp-message').attr('opacity', 0);
    pgpMessage.append('rect')
      .attr('x', centerX - 75).attr('y', row4Y - boxH/2)
      .attr('width', 150).attr('height', boxH)
      .attr('fill', colors.green)
      .attr('opacity', 0.15)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2)
      .attr('rx', 6);
    pgpMessage.append('text')
      .attr('x', centerX).attr('y', row4Y + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('PGP Message');

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
    max-height: 420px;
  }
</style>
