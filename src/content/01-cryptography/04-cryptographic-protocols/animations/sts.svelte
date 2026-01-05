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
  const maxStep = 6;

  const aliceX = 100;
  const bobX = 600;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'STS: exchange DH values, then encrypt signatures with shared key',
    'Alice sends gᵃ to Bob',
    'Bob sends gᵇ to Alice',
    'Both compute shared secret K = gᵃᵇ',
    'Bob encrypts signature with K, sends to Alice',
    'Alice encrypts signature with K, sends to Bob',
    'Authenticated! Signatures hidden from eavesdroppers'
  ];

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    const msg1 = svgEl.select('.msg1');
    const msg2 = svgEl.select('.msg2');
    const keyAlice = svgEl.select('.key-alice');
    const keyBob = svgEl.select('.key-bob');
    const msg3 = svgEl.select('.msg3');
    const msg4 = svgEl.select('.msg4');
    const finalNote = svgEl.select('.final-note');

    switch(step) {
      case 0:
        msg1.attr('opacity', 0).attr('transform', `translate(${aliceX + 70}, 130)`);
        msg2.attr('opacity', 0).attr('transform', `translate(${bobX - 70}, 175)`);
        keyAlice.attr('opacity', 0);
        keyBob.attr('opacity', 0);
        msg3.attr('opacity', 0).attr('transform', `translate(${bobX - 70}, 255)`);
        msg4.attr('opacity', 0).attr('transform', `translate(${aliceX + 70}, 305)`);
        finalNote.attr('opacity', 0);
        break;

      case 1:
        msg1.attr('opacity', 1)
          .transition().duration(1000).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${bobX - 150}, 130)`);
        break;

      case 2:
        msg2.attr('opacity', 1)
          .transition().duration(1000).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${aliceX + 70}, 175)`);
        break;

      case 3:
        keyAlice.transition().duration(500).attr('opacity', 1);
        keyBob.transition().duration(500).attr('opacity', 1);
        break;

      case 4:
        msg3.attr('opacity', 1)
          .transition().duration(1000).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${aliceX + 70}, 255)`);
        break;

      case 5:
        msg4.attr('opacity', 1)
          .transition().duration(1000).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${bobX - 150}, 305)`);
        break;

      case 6:
        finalNote.transition().duration(500).attr('opacity', 1);
        break;
    }

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      await animateStep(i);
      await sleep(1400);
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
      .text('Station-to-Station (STS)');

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

    // Bob
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

    // Message 1: gᵃ (Alice to Bob)
    const msg1 = svgEl.append('g')
      .attr('class', 'msg1')
      .attr('opacity', 0)
      .attr('transform', `translate(${aliceX + 70}, 130)`);

    msg1.append('rect')
      .attr('x', 0).attr('y', -14)
      .attr('width', 80).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);

    msg1.append('text')
      .attr('x', 40).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('gᵃ →');

    // Message 2: gᵇ (Bob to Alice)
    const msg2 = svgEl.append('g')
      .attr('class', 'msg2')
      .attr('opacity', 0)
      .attr('transform', `translate(${bobX - 70}, 175)`);

    msg2.append('rect')
      .attr('x', -80).attr('y', -14)
      .attr('width', 80).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2);

    msg2.append('text')
      .attr('x', -40).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('← gᵇ');

    // Key computed indicators
    const keyAlice = svgEl.append('g')
      .attr('class', 'key-alice')
      .attr('opacity', 0);

    keyAlice.append('rect')
      .attr('x', aliceX - 35).attr('y', 205)
      .attr('width', 70).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    keyAlice.append('text')
      .attr('x', aliceX).attr('y', 224)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('K = gᵃᵇ');

    const keyBob = svgEl.append('g')
      .attr('class', 'key-bob')
      .attr('opacity', 0);

    keyBob.append('rect')
      .attr('x', bobX - 35).attr('y', 205)
      .attr('width', 70).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    keyBob.append('text')
      .attr('x', bobX).attr('y', 224)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('K = gᵃᵇ');

    // Message 3: Encrypted signature from Bob
    const msg3 = svgEl.append('g')
      .attr('class', 'msg3')
      .attr('opacity', 0)
      .attr('transform', `translate(${bobX - 70}, 255)`);

    msg3.append('rect')
      .attr('x', -110).attr('y', -14)
      .attr('width', 110).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2);

    msg3.append('text')
      .attr('x', -55).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('← E_k(Sig_B)');

    // Message 4: Encrypted signature from Alice
    const msg4 = svgEl.append('g')
      .attr('class', 'msg4')
      .attr('opacity', 0)
      .attr('transform', `translate(${aliceX + 70}, 305)`);

    msg4.append('rect')
      .attr('x', 0).attr('y', -14)
      .attr('width', 110).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2);

    msg4.append('text')
      .attr('x', 55).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('E_k(Sig_A) →');

    // Final note
    const finalNote = svgEl.append('g')
      .attr('class', 'final-note')
      .attr('opacity', 0);

    finalNote.append('rect')
      .attr('x', width/2 - 160).attr('y', 340)
      .attr('width', 320).attr('height', 30)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);

    finalNote.append('text')
      .attr('x', width/2).attr('y', 360)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Signatures encrypted - hidden from Eve!');

    // Legend (bottom-left corner)
    const legend = svgEl.append('g').attr('transform', 'translate(10, 280)');

    legend.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', 155).attr('height', 95)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1);

    legend.append('text')
      .attr('x', 10).attr('y', 20)
      .attr('fill', colors.purple)
      .attr('font-size', '12px')
      .text('gᵃ = Alice DH value');

    legend.append('text')
      .attr('x', 10).attr('y', 40)
      .attr('fill', colors.aqua)
      .attr('font-size', '12px')
      .text('gᵇ = Bob DH value');

    legend.append('text')
      .attr('x', 10).attr('y', 60)
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .text('K = shared secret');

    legend.append('text')
      .attr('x', 10).attr('y', 80)
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .text('E_k(Sig) = encrypted sig');

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
