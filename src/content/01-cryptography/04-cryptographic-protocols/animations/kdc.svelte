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
  const height = 420;
  const maxStep = 5;

  // Layout: KDC on top, Alice bottom-left, Bob bottom-right
  const kdcX = 350;
  const kdcY = 120;
  const aliceX = 140;
  const aliceY = 330;
  const bobX = 560;
  const bobY = 330;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'Alice and Bob each share a secret key with the KDC',
    'Alice asks KDC for a session key to talk to Bob',
    'KDC generates a fresh session key Kₛ',
    'KDC sends Kₛ to Alice, encrypted with her key',
    'KDC sends Kₛ to Bob, encrypted with his key',
    'Alice and Bob now share Kₛ for secure communication'
  ];

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    const request = svgEl.select('.request');
    const sessionKey = svgEl.select('.session-key');
    const toAlice = svgEl.select('.to-alice');
    const toBob = svgEl.select('.to-bob');
    const keyAlice = svgEl.select('.key-alice');
    const keyBob = svgEl.select('.key-bob');
    const channel = svgEl.select('.channel');
    const channelKey = svgEl.select('.channel-key');

    switch(step) {
      case 0:
        request.attr('opacity', 0);
        sessionKey.attr('opacity', 0);
        toAlice.attr('opacity', 0).attr('transform', `translate(${kdcX - 80}, ${kdcY + 60})`);
        toBob.attr('opacity', 0).attr('transform', `translate(${kdcX + 80}, ${kdcY + 60})`);
        keyAlice.attr('opacity', 0);
        keyBob.attr('opacity', 0);
        channel.attr('opacity', 0);
        channelKey.attr('opacity', 0);
        break;

      case 1:
        request.attr('opacity', 1)
          .attr('transform', `translate(${aliceX + 50}, ${aliceY - 80})`)
          .transition().duration(900).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${kdcX - 80}, ${kdcY + 60})`);
        break;

      case 2:
        request.transition().duration(300).attr('opacity', 0);
        await sleep(300);
        if (!isPlaying && currentStep !== 2) return;
        sessionKey.transition().duration(500).attr('opacity', 1);
        break;

      case 3:
        toAlice.attr('opacity', 1)
          .transition().duration(900).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${aliceX + 50}, ${aliceY - 80})`);
        break;

      case 4:
        toBob.attr('opacity', 1)
          .transition().duration(900).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${bobX - 50}, ${bobY - 80})`);
        break;

      case 5:
        toAlice.transition().duration(300).attr('opacity', 0);
        toBob.transition().duration(300).attr('opacity', 0);
        await sleep(300);
        if (!isPlaying && currentStep !== 5) return;
        keyAlice.transition().duration(400).attr('opacity', 1);
        keyBob.transition().duration(400).attr('opacity', 1);
        await sleep(500);
        if (!isPlaying && currentStep !== 5) return;
        channel.transition().duration(500).attr('opacity', 1);
        channelKey.transition().duration(500).attr('opacity', 1);
        break;
    }

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      await animateStep(i);
      await sleep(1500);
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) { currentStep++; animateStep(currentStep); } }
  function prev() { pause(); if (currentStep > 0) { currentStep--; animateStep(currentStep); } }
  function applyFinalState() {
    svgEl.select('.step-label').text(stepLabels[maxStep]);
    svgEl.select('.request').attr('opacity', 0);
    svgEl.select('.session-key').attr('opacity', 1);
    svgEl.select('.to-alice').attr('opacity', 0);
    svgEl.select('.to-bob').attr('opacity', 0);
    svgEl.select('.key-alice').attr('opacity', 1);
    svgEl.select('.key-bob').attr('opacity', 1);
    svgEl.select('.channel').attr('opacity', 1);
    svgEl.select('.channel-key').attr('opacity', 1);
    currentStep = maxStep;
  }
  function skip() { pause(); applyFinalState(); }
  function replay() { pause(); currentStep = 0; animateStep(0); isPlaying = true; runAnimation(); }
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
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Key Distribution Center');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // KDC (top center) - larger box
    svgEl.append('rect')
      .attr('x', kdcX - 55).attr('y', kdcY - 30)
      .attr('width', 110).attr('height', 60)
      .attr('rx', 8)
      .attr('fill', colors.blue)
      .attr('opacity', 0.25);

    svgEl.append('text')
      .attr('x', kdcX).attr('y', kdcY + 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.blue)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('KDC');

    // Alice (bottom left)
    svgEl.append('circle')
      .attr('cx', aliceX).attr('cy', aliceY)
      .attr('r', 35)
      .attr('fill', colors.purple)
      .attr('opacity', 0.25);

    svgEl.append('text')
      .attr('x', aliceX).attr('y', aliceY + 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('Alice');

    // Bob (bottom right)
    svgEl.append('circle')
      .attr('cx', bobX).attr('cy', bobY)
      .attr('r', 35)
      .attr('fill', colors.aqua)
      .attr('opacity', 0.25);

    svgEl.append('text')
      .attr('x', bobX).attr('y', bobY + 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('Bob');

    // Dashed line: Alice to KDC
    svgEl.append('line')
      .attr('x1', aliceX + 30).attr('y1', aliceY - 30)
      .attr('x2', kdcX - 45).attr('y2', kdcY + 30)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '8,4')
      .attr('opacity', 0.5);

    // Kₐ label - positioned along the line
    svgEl.append('text')
      .attr('x', aliceX + 55).attr('y', aliceY - 65)
      .attr('fill', colors.purple)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('Kₐ');

    // Dashed line: Bob to KDC
    svgEl.append('line')
      .attr('x1', bobX - 30).attr('y1', bobY - 30)
      .attr('x2', kdcX + 45).attr('y2', kdcY + 30)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '8,4')
      .attr('opacity', 0.5);

    // Kᵦ label - positioned along the line
    svgEl.append('text')
      .attr('x', bobX - 70).attr('y', bobY - 65)
      .attr('fill', colors.aqua)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('Kᵦ');

    // Request message (Alice to KDC)
    const request = svgEl.append('g')
      .attr('class', 'request')
      .attr('opacity', 0)
      .attr('transform', `translate(${aliceX + 50}, ${aliceY - 80})`);

    request.append('rect')
      .attr('x', -55).attr('y', -15)
      .attr('width', 110).attr('height', 30)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);

    request.append('text')
      .attr('x', 0).attr('y', 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('"Talk to Bob"');

    // Session key generated at KDC
    const sessionKey = svgEl.append('g')
      .attr('class', 'session-key')
      .attr('opacity', 0);

    sessionKey.append('rect')
      .attr('x', kdcX - 35).attr('y', kdcY + 40)
      .attr('width', 70).attr('height', 32)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    sessionKey.append('text')
      .attr('x', kdcX).attr('y', kdcY + 62)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Kₛ');

    // Message to Alice: encrypted session key
    const toAlice = svgEl.append('g')
      .attr('class', 'to-alice')
      .attr('opacity', 0)
      .attr('transform', `translate(${kdcX - 80}, ${kdcY + 60})`);

    toAlice.append('rect')
      .attr('x', -45).attr('y', -15)
      .attr('width', 90).attr('height', 30)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2);

    toAlice.append('text')
      .attr('x', 0).attr('y', 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Eₐ(Kₛ)');

    // Message to Bob: encrypted session key
    const toBob = svgEl.append('g')
      .attr('class', 'to-bob')
      .attr('opacity', 0)
      .attr('transform', `translate(${kdcX + 80}, ${kdcY + 60})`);

    toBob.append('rect')
      .attr('x', -45).attr('y', -15)
      .attr('width', 90).attr('height', 30)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2);

    toBob.append('text')
      .attr('x', 0).attr('y', 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Eᵦ(Kₛ)');

    // Session key stored at Alice (left side)
    const keyAlice = svgEl.append('g')
      .attr('class', 'key-alice')
      .attr('opacity', 0);

    keyAlice.append('rect')
      .attr('x', aliceX - 85).attr('y', aliceY - 18)
      .attr('width', 45).attr('height', 36)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    keyAlice.append('text')
      .attr('x', aliceX - 62).attr('y', aliceY + 7)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Kₛ');

    // Session key stored at Bob (right side)
    const keyBob = svgEl.append('g')
      .attr('class', 'key-bob')
      .attr('opacity', 0);

    keyBob.append('rect')
      .attr('x', bobX + 40).attr('y', bobY - 18)
      .attr('width', 45).attr('height', 36)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    keyBob.append('text')
      .attr('x', bobX + 62).attr('y', bobY + 7)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Kₛ');

    // Secure channel between Alice and Bob
    svgEl.append('line')
      .attr('class', 'channel')
      .attr('x1', aliceX + 40).attr('y1', aliceY)
      .attr('x2', bobX - 40).attr('y2', bobY)
      .attr('stroke', colors.green)
      .attr('stroke-width', 4)
      .attr('opacity', 0);

    // Channel key label
    const channelKey = svgEl.append('g')
      .attr('class', 'channel-key')
      .attr('opacity', 0);

    channelKey.append('rect')
      .attr('x', (aliceX + bobX) / 2 - 60).attr('y', aliceY + 15)
      .attr('width', 120).attr('height', 32)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);

    channelKey.append('text')
      .attr('x', (aliceX + bobX) / 2).attr('y', aliceY + 37)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('Secured with Kₛ');

    // Legend (top right corner)
    const legend = svgEl.append('g').attr('transform', `translate(${width - 145}, 70)`);

    legend.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', 138).attr('height', 95)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1);

    legend.append('text')
      .attr('x', 10).attr('y', 20)
      .attr('fill', colors.purple)
      .attr('font-size', '12px')
      .text('Kₐ = Alice\'s key');

    legend.append('text')
      .attr('x', 10).attr('y', 42)
      .attr('fill', colors.aqua)
      .attr('font-size', '12px')
      .text('Kᵦ = Bob\'s key');

    legend.append('text')
      .attr('x', 10).attr('y', 64)
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .text('Kₛ = session key');

    legend.append('text')
      .attr('x', 10).attr('y', 86)
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .text('Eₓ = encrypt with Kₓ');

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
