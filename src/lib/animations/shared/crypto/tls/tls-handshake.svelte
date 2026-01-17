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

  const width = 520;
  const height = 420;
  const maxStep = 5;

  const stepLabels = [
    'Client and Server ready to establish secure connection',
    'Step 1: Client Hello (supported versions, ciphers, random)',
    'Step 2: Server Hello (chosen cipher, certificate, random)',
    'Step 3: Client verifies certificate, sends encrypted pre-master secret',
    'Step 4: Both derive session keys, send Finished',
    'Secure channel established! All traffic now encrypted'
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function showStep(step: number, animate: boolean = true) {
    if (!svgEl) return;
    const duration = animate ? 500 : 0;

    svgEl.select('.step-label').text(stepLabels[step]);

    // Step 0: Just client and server
    svgEl.select('.client')
      .transition().duration(duration)
      .attr('opacity', step >= 0 ? 1 : 0);

    svgEl.select('.server')
      .transition().duration(duration)
      .attr('opacity', step >= 0 ? 1 : 0);

    // Step 1: Client Hello
    svgEl.select('.client-hello')
      .transition().duration(duration)
      .attr('opacity', step >= 1 ? 1 : 0);

    // Step 2: Server Hello
    svgEl.select('.server-hello')
      .transition().duration(duration)
      .attr('opacity', step >= 2 ? 1 : 0);

    // Step 3: Key Exchange
    svgEl.select('.key-exchange')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

    // Step 4: Finished
    svgEl.select('.finished')
      .transition().duration(duration)
      .attr('opacity', step >= 4 ? 1 : 0);

    // Step 5: Encrypted channel
    svgEl.select('.encrypted')
      .transition().duration(duration)
      .attr('opacity', step >= 5 ? 1 : 0);

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      showStep(i, true);
      await sleep(2000);
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
    svgEl.select('.client').attr('opacity', 1);
    svgEl.select('.server').attr('opacity', 1);
    svgEl.select('.client-hello').attr('opacity', 1);
    svgEl.select('.server-hello').attr('opacity', 1);
    svgEl.select('.key-exchange').attr('opacity', 1);
    svgEl.select('.finished').attr('opacity', 1);
    svgEl.select('.encrypted').attr('opacity', 1);
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

    const clientX = 80;
    const serverX = width - 80;
    const centerX = width / 2;

    // Title
    svgEl.append('text')
      .attr('x', centerX).attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('TLS Handshake');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', centerX).attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text(stepLabels[0]);

    // Arrow marker
    svgEl.append('defs')
      .append('marker')
      .attr('id', 'arrow-tls')
      .attr('markerWidth', 10)
      .attr('markerHeight', 7)
      .attr('refX', 9)
      .attr('refY', 3.5)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', colors.fgMuted);

    // Vertical lines for client and server
    const lineStartY = 70;
    const lineEndY = 360;

    // Client
    const client = svgEl.append('g').attr('class', 'client').attr('opacity', 0);

    client.append('rect')
      .attr('x', clientX - 40).attr('y', 45)
      .attr('width', 80).attr('height', 30)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.blue)
      .attr('stroke-width', 2)
      .attr('rx', 4);

    client.append('text')
      .attr('x', clientX).attr('y', 65)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.blue)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Client');

    client.append('line')
      .attr('x1', clientX).attr('y1', lineStartY + 10)
      .attr('x2', clientX).attr('y2', lineEndY)
      .attr('stroke', colors.blue)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');

    // Server
    const server = svgEl.append('g').attr('class', 'server').attr('opacity', 0);

    server.append('rect')
      .attr('x', serverX - 40).attr('y', 45)
      .attr('width', 80).attr('height', 30)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2)
      .attr('rx', 4);

    server.append('text')
      .attr('x', serverX).attr('y', 65)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Server');

    server.append('line')
      .attr('x1', serverX).attr('y1', lineStartY + 10)
      .attr('x2', serverX).attr('y2', lineEndY)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');

    // Message Y positions
    const msg1Y = 115;
    const msg2Y = 175;
    const msg3Y = 235;
    const msg4Y = 295;

    // Client Hello (client → server)
    const clientHello = svgEl.append('g').attr('class', 'client-hello').attr('opacity', 0);

    clientHello.append('line')
      .attr('x1', clientX + 5).attr('y1', msg1Y)
      .attr('x2', serverX - 5).attr('y2', msg1Y)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-tls)');

    clientHello.append('text')
      .attr('x', centerX).attr('y', msg1Y - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Client Hello');

    clientHello.append('text')
      .attr('x', centerX).attr('y', msg1Y + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '9px')
      .text('versions, ciphers, client_random');

    // Server Hello (server → client)
    const serverHello = svgEl.append('g').attr('class', 'server-hello').attr('opacity', 0);

    serverHello.append('line')
      .attr('x1', serverX - 5).attr('y1', msg2Y)
      .attr('x2', clientX + 5).attr('y2', msg2Y)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-tls)');

    serverHello.append('text')
      .attr('x', centerX).attr('y', msg2Y - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Server Hello + Certificate');

    serverHello.append('text')
      .attr('x', centerX).attr('y', msg2Y + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '9px')
      .text('chosen cipher, cert, server_random');

    // Key Exchange (client → server)
    const keyExchange = svgEl.append('g').attr('class', 'key-exchange').attr('opacity', 0);

    keyExchange.append('line')
      .attr('x1', clientX + 5).attr('y1', msg3Y)
      .attr('x2', serverX - 5).attr('y2', msg3Y)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-tls)');

    keyExchange.append('text')
      .attr('x', centerX).attr('y', msg3Y - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Key Exchange');

    keyExchange.append('text')
      .attr('x', centerX).attr('y', msg3Y + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '9px')
      .text('encrypted pre-master secret');

    // Finished (both ways)
    const finished = svgEl.append('g').attr('class', 'finished').attr('opacity', 0);

    // Client finished
    finished.append('line')
      .attr('x1', clientX + 5).attr('y1', msg4Y - 8)
      .attr('x2', serverX - 5).attr('y2', msg4Y - 8)
      .attr('stroke', colors.green)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-tls)');

    // Server finished
    finished.append('line')
      .attr('x1', serverX - 5).attr('y1', msg4Y + 8)
      .attr('x2', clientX + 5).attr('y2', msg4Y + 8)
      .attr('stroke', colors.green)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-tls)');

    finished.append('text')
      .attr('x', centerX).attr('y', msg4Y - 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Finished');

    finished.append('text')
      .attr('x', centerX).attr('y', msg4Y + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '9px')
      .text('verify handshake integrity');

    // Encrypted channel indicator
    const encrypted = svgEl.append('g').attr('class', 'encrypted').attr('opacity', 0);

    encrypted.append('rect')
      .attr('x', centerX - 70).attr('y', 340)
      .attr('width', 140).attr('height', 28)
      .attr('fill', colors.green)
      .attr('opacity', 0.15)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2)
      .attr('rx', 4);

    encrypted.append('text')
      .attr('x', centerX).attr('y', 358)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('🔒 Encrypted Channel');

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
