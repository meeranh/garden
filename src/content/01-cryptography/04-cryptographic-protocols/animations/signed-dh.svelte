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
  const height = 350;
  const maxStep = 4;

  const aliceX = 100;
  const bobX = 600;
  const laneY = 200;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'Signed DH: sign DH values to prove identity',
    'Alice signs gᵃ and sends to Bob',
    'Bob verifies, signs gᵇ and sends to Alice',
    'Alice verifies Bob\'s signature',
    'Both compute shared secret K = gᵃᵇ'
  ];

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    const msgToRight = svgEl.select('.msg-to-right');
    const msgToLeft = svgEl.select('.msg-to-left');
    const sharedKey = svgEl.select('.shared-key');
    const verifyBob = svgEl.select('.verify-bob');
    const verifyAlice = svgEl.select('.verify-alice');

    switch(step) {
      case 0:
        msgToRight.attr('opacity', 0).attr('transform', `translate(${aliceX + 80}, ${laneY - 30})`);
        msgToLeft.attr('opacity', 0).attr('transform', `translate(${bobX - 80}, ${laneY + 30})`);
        sharedKey.attr('opacity', 0);
        verifyBob.attr('opacity', 0);
        verifyAlice.attr('opacity', 0);
        break;

      case 1:
        msgToRight.attr('opacity', 1)
          .transition().duration(1200).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${bobX - 160}, ${laneY - 30})`);
        break;

      case 2:
        verifyBob.transition().duration(400).attr('opacity', 1);
        await sleep(600);
        if (!isPlaying && currentStep !== 2) return;
        msgToLeft.attr('opacity', 1)
          .transition().duration(1200).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${aliceX + 80}, ${laneY + 30})`);
        break;

      case 3:
        verifyAlice.transition().duration(400).attr('opacity', 1);
        break;

      case 4:
        sharedKey.transition().duration(500).attr('opacity', 1);
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
  function skip() { pause(); animateStep(maxStep); }
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
      green: '#b8bb26'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Signed Diffie-Hellman');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // Alice
    svgEl.append('circle')
      .attr('cx', aliceX).attr('cy', 100)
      .attr('r', 30)
      .attr('fill', colors.purple)
      .attr('opacity', 0.25);
    svgEl.append('text')
      .attr('x', aliceX).attr('y', 105)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Alice');

    // Bob
    svgEl.append('circle')
      .attr('cx', bobX).attr('cy', 100)
      .attr('r', 30)
      .attr('fill', colors.aqua)
      .attr('opacity', 0.25);
    svgEl.append('text')
      .attr('x', bobX).attr('y', 105)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Bob');

    // Channel line
    svgEl.append('line')
      .attr('x1', aliceX + 50).attr('y1', laneY)
      .attr('x2', bobX - 50).attr('y2', laneY)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '8,4')
      .attr('opacity', 0.3);

    // Message to right (Alice's signed DH value)
    const msgRight = svgEl.append('g')
      .attr('class', 'msg-to-right')
      .attr('opacity', 0)
      .attr('transform', `translate(${aliceX + 80}, ${laneY - 30})`);

    msgRight.append('rect')
      .attr('x', 0).attr('y', -16)
      .attr('width', 130).attr('height', 32)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);

    msgRight.append('text')
      .attr('x', 65).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('gᵃ, Sig_A(gᵃ)');

    // Message to left (Bob's signed DH value)
    const msgLeft = svgEl.append('g')
      .attr('class', 'msg-to-left')
      .attr('opacity', 0)
      .attr('transform', `translate(${bobX - 80}, ${laneY + 30})`);

    msgLeft.append('rect')
      .attr('x', -130).attr('y', -16)
      .attr('width', 130).attr('height', 32)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2);

    msgLeft.append('text')
      .attr('x', -65).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('gᵇ, Sig_B(gᵇ)');

    // Verify indicators (positioned to the side, not on top)
    svgEl.append('text')
      .attr('class', 'verify-bob')
      .attr('x', bobX).attr('y', laneY - 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '10px')
      .attr('opacity', 0)
      .text('✓ Valid');

    svgEl.append('text')
      .attr('class', 'verify-alice')
      .attr('x', aliceX).attr('y', laneY + 75)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '10px')
      .attr('opacity', 0)
      .text('✓ Valid');

    // Shared key result
    const sharedKey = svgEl.append('g')
      .attr('class', 'shared-key')
      .attr('opacity', 0);

    sharedKey.append('rect')
      .attr('x', width/2 - 70).attr('y', 280)
      .attr('width', 140).attr('height', 45)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);

    sharedKey.append('text')
      .attr('x', width/2).attr('y', 300)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text('Shared Secret');

    sharedKey.append('text')
      .attr('x', width/2).attr('y', 318)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('K = gᵃᵇ');

    // Legend (bottom-left corner)
    const legend = svgEl.append('g').attr('transform', 'translate(10, 250)');

    legend.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', 145).attr('height', 95)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1);

    legend.append('text')
      .attr('x', 10).attr('y', 20)
      .attr('fill', colors.purple)
      .attr('font-size', '12px')
      .text('gᵃ, Sig_A = Alice');

    legend.append('text')
      .attr('x', 10).attr('y', 40)
      .attr('fill', colors.aqua)
      .attr('font-size', '12px')
      .text('gᵇ, Sig_B = Bob');

    legend.append('text')
      .attr('x', 10).attr('y', 60)
      .attr('fill', colors.green)
      .attr('font-size', '12px')
      .text('K = shared secret');

    legend.append('text')
      .attr('x', 10).attr('y', 80)
      .attr('fill', colors.fgMuted)
      .attr('font-size', '12px')
      .text('Sig = signature');

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
