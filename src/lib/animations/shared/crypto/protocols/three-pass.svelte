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
  const height = 380;
  const maxStep = 8;

  // Positions
  const aliceX = 130;
  const bobX = 570;
  const centerY = 215;
  const boxSize = 70;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'Alice has a secret message for Bob',
    'Alice locks the box with her padlock',
    'Pass 1: Alice sends the locked box to Bob',
    'Bob adds his own padlock to the box',
    'Pass 2: Bob sends the double-locked box back',
    'Alice removes her padlock',
    'Pass 3: Alice sends the box (only Bob\'s lock remains)',
    'Bob removes his padlock',
    'Bob reads the secret message!'
  ];

  async function animateStep(step: number) {
    const pkg = svgEl.select('.package');
    const aliceLock = svgEl.select('.alice-lock');
    const bobLock = svgEl.select('.bob-lock');
    const messageHidden = svgEl.select('.message-hidden');
    const messageRevealed = svgEl.select('.message-revealed');
    const successMsg = svgEl.select('.success-message');

    // Update step label
    svgEl.select('.step-label').text(stepLabels[step]);

    switch(step) {
      case 0:
        // Initial state - box at Alice, message visible, no locks
        pkg.attr('transform', `translate(${aliceX}, ${centerY})`);
        aliceLock.attr('opacity', 0);
        bobLock.attr('opacity', 0);
        messageHidden.attr('opacity', 0);
        messageRevealed.attr('opacity', 1);
        successMsg.attr('opacity', 0);
        break;

      case 1:
        // Alice adds her lock - message gets hidden
        messageRevealed.transition().duration(300).attr('opacity', 0);
        await sleep(300);
        if (!isPlaying && currentStep !== 1) return;
        messageHidden.transition().duration(200).attr('opacity', 1);
        aliceLock.transition().duration(500).attr('opacity', 1);
        break;

      case 2:
        // Pass 1: Box moves to Bob (with Alice's lock)
        pkg.transition().duration(1500).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${bobX}, ${centerY})`);
        break;

      case 3:
        // Bob adds his lock
        bobLock.transition().duration(500).attr('opacity', 1);
        break;

      case 4:
        // Pass 2: Box moves back to Alice (with both locks)
        pkg.transition().duration(1500).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${aliceX}, ${centerY})`);
        break;

      case 5:
        // Alice removes her lock
        aliceLock.transition().duration(500).attr('opacity', 0);
        break;

      case 6:
        // Pass 3: Box moves to Bob (only Bob's lock)
        pkg.transition().duration(1500).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${bobX}, ${centerY})`);
        break;

      case 7:
        // Bob removes his lock
        bobLock.transition().duration(500).attr('opacity', 0);
        await sleep(300);
        if (!isPlaying && currentStep !== 7) return;
        messageHidden.transition().duration(200).attr('opacity', 0);
        break;

      case 8:
        // Message revealed!
        messageRevealed.transition().duration(500).attr('opacity', 1);
        await sleep(300);
        if (!isPlaying && currentStep !== 8) return;
        successMsg.transition().duration(400).attr('opacity', 1);
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
    svgEl.select('.package').attr('transform', `translate(${bobX}, ${centerY})`);
    svgEl.select('.alice-lock').attr('opacity', 0);
    svgEl.select('.bob-lock').attr('opacity', 0);
    svgEl.select('.message-hidden').attr('opacity', 0);
    svgEl.select('.message-revealed').attr('opacity', 1);
    svgEl.select('.success-message').attr('opacity', 1);
    currentStep = maxStep;
  }
  function skip() { pause(); applyFinalState(); }
  function replay() { pause(); currentStep = 0; animateStep(0); isPlaying = true; runAnimation(); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  // Draw a padlock shape
  function drawPadlock(parent: d3.Selection<SVGGElement, unknown, null, undefined>, color: string) {
    // Lock body
    parent.append('rect')
      .attr('x', -12).attr('y', 0)
      .attr('width', 24).attr('height', 20)
      .attr('rx', 4)
      .attr('fill', color);

    // Lock shackle (the curved part)
    parent.append('path')
      .attr('d', 'M-6,0 L-6,-8 A6,6 0 0,1 6,-8 L6,0')
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round');

    // Keyhole
    parent.append('circle')
      .attr('cx', 0).attr('cy', 8)
      .attr('r', 3)
      .attr('fill', colors.bg);
    parent.append('rect')
      .attr('x', -1.5).attr('y', 8)
      .attr('width', 3).attr('height', 6)
      .attr('fill', colors.bg);
  }

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
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Three-Pass Protocol');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // Alice avatar
    svgEl.append('circle')
      .attr('cx', aliceX).attr('cy', 95)
      .attr('r', 28)
      .attr('fill', colors.purple)
      .attr('opacity', 0.25);
    svgEl.append('text')
      .attr('x', aliceX).attr('y', 100)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Alice');

    // Bob avatar
    svgEl.append('circle')
      .attr('cx', bobX).attr('cy', 95)
      .attr('r', 28)
      .attr('fill', colors.aqua)
      .attr('opacity', 0.25);
    svgEl.append('text')
      .attr('x', bobX).attr('y', 100)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Bob');

    // Channel/path indicator
    svgEl.append('line')
      .attr('x1', aliceX + 50).attr('y1', centerY)
      .attr('x2', bobX - 50).attr('y2', centerY)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '10,6')
      .attr('opacity', 0.3);

    // Arrow indicators on channel
    svgEl.append('text')
      .attr('x', width/2).attr('y', centerY - 50)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '20px')
      .attr('opacity', 0.4)
      .text('⟷');

    // ===== THE PACKAGE (box + padlocks that move together) =====
    const pkg = svgEl.append('g')
      .attr('class', 'package')
      .attr('transform', `translate(${aliceX}, ${centerY})`);

    // The box
    pkg.append('rect')
      .attr('x', -boxSize/2).attr('y', -boxSize/2)
      .attr('width', boxSize).attr('height', boxSize)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fg)
      .attr('stroke-width', 3);

    // Question marks when locked
    pkg.append('text')
      .attr('class', 'message-hidden')
      .attr('x', 0).attr('y', 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '20px')
      .attr('opacity', 0)
      .text('???');

    // Actual message when visible
    pkg.append('text')
      .attr('class', 'message-revealed')
      .attr('x', 0).attr('y', 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('SECRET');

    // Alice's padlock (positioned on top-left of box)
    const aliceLockG = pkg.append('g')
      .attr('class', 'alice-lock')
      .attr('transform', `translate(-18, ${-boxSize/2 - 18})`)
      .attr('opacity', 0);
    drawPadlock(aliceLockG, colors.purple);

    // Bob's padlock (positioned on top-right of box)
    const bobLockG = pkg.append('g')
      .attr('class', 'bob-lock')
      .attr('transform', `translate(18, ${-boxSize/2 - 18})`)
      .attr('opacity', 0);
    drawPadlock(bobLockG, colors.aqua);

    // Success message
    svgEl.append('text')
      .attr('class', 'success-message')
      .attr('x', bobX).attr('y', centerY + 70)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('✓ Message received!');

    // Legend at bottom
    const legendY = 310;
    svgEl.append('rect')
      .attr('x', width/2 - 150).attr('y', legendY)
      .attr('width', 300).attr('height', 55)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-opacity', 0.5);

    svgEl.append('text')
      .attr('x', width/2).attr('y', legendY + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Padlocks');

    // Alice's lock in legend
    const aliceLegend = svgEl.append('g')
      .attr('transform', `translate(${width/2 - 80}, ${legendY + 38})`);
    aliceLegend.append('rect')
      .attr('x', -10).attr('y', -8)
      .attr('width', 16).attr('height', 12)
      .attr('rx', 2)
      .attr('fill', colors.purple);
    aliceLegend.append('text')
      .attr('x', 15).attr('y', 4)
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text("Alice's");

    // Bob's lock in legend
    const bobLegend = svgEl.append('g')
      .attr('transform', `translate(${width/2 + 40}, ${legendY + 38})`);
    bobLegend.append('rect')
      .attr('x', -10).attr('y', -8)
      .attr('width', 16).attr('height', 12)
      .attr('rx', 2)
      .attr('fill', colors.aqua);
    bobLegend.append('text')
      .attr('x', 15).attr('y', 4)
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text("Bob's");

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
