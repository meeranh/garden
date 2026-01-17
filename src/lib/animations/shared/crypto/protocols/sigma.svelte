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
  const maxStep = 6;

  const aliceX = 100;
  const bobX = 600;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'SIGMA: SIGn-and-MAc - adds MAC to bind identity to session',
    'Alice sends gᵃ to Bob',
    'Bob sends gᵇ to Alice, both derive K_enc and K_mac',
    'Bob sends encrypted identity + signature + MAC',
    'Alice verifies, sends her encrypted identity + signature + MAC',
    'Bob verifies Alice\'s signature and MAC',
    'Session-bound authenticated key exchange complete!'
  ];

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    const msg1 = svgEl.select('.msg1');
    const msg2 = svgEl.select('.msg2');
    const keysAlice = svgEl.select('.keys-alice');
    const keysBob = svgEl.select('.keys-bob');
    const msg3 = svgEl.select('.msg3');
    const msg4 = svgEl.select('.msg4');
    const verifyAlice = svgEl.select('.verify-alice');
    const verifyBob = svgEl.select('.verify-bob');
    const finalNote = svgEl.select('.final-note');

    switch(step) {
      case 0:
        msg1.attr('opacity', 0).attr('transform', `translate(${aliceX + 70}, 130)`);
        msg2.attr('opacity', 0).attr('transform', `translate(${bobX - 70}, 175)`);
        keysAlice.attr('opacity', 0);
        keysBob.attr('opacity', 0);
        msg3.attr('opacity', 0).attr('transform', `translate(${bobX - 70}, 275)`);
        msg4.attr('opacity', 0).attr('transform', `translate(${aliceX + 70}, 335)`);
        verifyAlice.attr('opacity', 0);
        verifyBob.attr('opacity', 0);
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
        await sleep(1100);
        if (!isPlaying && currentStep !== 2) return;
        keysAlice.transition().duration(400).attr('opacity', 1);
        keysBob.transition().duration(400).attr('opacity', 1);
        break;

      case 3:
        msg3.attr('opacity', 1)
          .transition().duration(1000).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${aliceX + 70}, 275)`);
        break;

      case 4:
        verifyAlice.transition().duration(400).attr('opacity', 1);
        await sleep(600);
        if (!isPlaying && currentStep !== 4) return;
        msg4.attr('opacity', 1)
          .transition().duration(1000).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${bobX - 150}, 335)`);
        break;

      case 5:
        verifyBob.transition().duration(400).attr('opacity', 1);
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
  function applyFinalState() {
    svgEl.select('.step-label').text(stepLabels[maxStep]);
    svgEl.select('.msg1').attr('opacity', 1).attr('transform', `translate(${bobX - 150}, 130)`);
    svgEl.select('.msg2').attr('opacity', 1).attr('transform', `translate(${aliceX + 70}, 175)`);
    svgEl.select('.keys-alice').attr('opacity', 1);
    svgEl.select('.keys-bob').attr('opacity', 1);
    svgEl.select('.msg3').attr('opacity', 1).attr('transform', `translate(${aliceX + 70}, 275)`);
    svgEl.select('.msg4').attr('opacity', 1).attr('transform', `translate(${bobX - 150}, 335)`);
    svgEl.select('.verify-alice').attr('opacity', 1);
    svgEl.select('.verify-bob').attr('opacity', 1);
    svgEl.select('.final-note').attr('opacity', 1);
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
      .text('SIGMA Protocol');

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

    // Key indicators (K_enc and K_mac)
    const keysAlice = svgEl.append('g')
      .attr('class', 'keys-alice')
      .attr('opacity', 0);

    keysAlice.append('rect')
      .attr('x', aliceX - 40).attr('y', 205)
      .attr('width', 80).attr('height', 42)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    keysAlice.append('text')
      .attr('x', aliceX).attr('y', 222)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('K_enc');

    keysAlice.append('text')
      .attr('x', aliceX).attr('y', 240)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('K_mac');

    const keysBob = svgEl.append('g')
      .attr('class', 'keys-bob')
      .attr('opacity', 0);

    keysBob.append('rect')
      .attr('x', bobX - 40).attr('y', 205)
      .attr('width', 80).attr('height', 42)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    keysBob.append('text')
      .attr('x', bobX).attr('y', 222)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('K_enc');

    keysBob.append('text')
      .attr('x', bobX).attr('y', 240)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('K_mac');

    // Message 3: Bob's encrypted package (Bob to Alice)
    const msg3 = svgEl.append('g')
      .attr('class', 'msg3')
      .attr('opacity', 0)
      .attr('transform', `translate(${bobX - 70}, 275)`);

    msg3.append('rect')
      .attr('x', -155).attr('y', -14)
      .attr('width', 155).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2);

    msg3.append('text')
      .attr('x', -78).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('← E(ID_B), Sig_B, MAC_B');

    // Message 4: Alice's encrypted package (Alice to Bob)
    const msg4 = svgEl.append('g')
      .attr('class', 'msg4')
      .attr('opacity', 0)
      .attr('transform', `translate(${aliceX + 70}, 335)`);

    msg4.append('rect')
      .attr('x', 0).attr('y', -14)
      .attr('width', 155).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2);

    msg4.append('text')
      .attr('x', 78).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('E(ID_A), Sig_A, MAC_A →');

    // Verify indicators (positioned below key boxes)
    svgEl.append('text')
      .attr('class', 'verify-alice')
      .attr('x', aliceX).attr('y', 258)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('✓ Valid');

    svgEl.append('text')
      .attr('class', 'verify-bob')
      .attr('x', bobX).attr('y', 318)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('✓ Valid');

    // Final note
    const finalNote = svgEl.append('g')
      .attr('class', 'final-note')
      .attr('opacity', 0);

    finalNote.append('rect')
      .attr('x', width/2 - 180).attr('y', 375)
      .attr('width', 360).attr('height', 30)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);

    finalNote.append('text')
      .attr('x', width/2).attr('y', 395)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('MAC binds identity to THIS session (prevents replay)');

    // Legend (bottom-left corner)
    const legend = svgEl.append('g').attr('transform', 'translate(10, 305)');

    legend.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', 150).attr('height', 110)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1);

    legend.append('text')
      .attr('x', 10).attr('y', 18)
      .attr('fill', colors.purple)
      .attr('font-size', '12px')
      .text('gᵃ = Alice DH value');

    legend.append('text')
      .attr('x', 10).attr('y', 38)
      .attr('fill', colors.aqua)
      .attr('font-size', '12px')
      .text('gᵇ = Bob DH value');

    legend.append('text')
      .attr('x', 10).attr('y', 58)
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .text('K_enc = encrypt key');

    legend.append('text')
      .attr('x', 10).attr('y', 78)
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .text('K_mac = MAC key');

    legend.append('text')
      .attr('x', 10).attr('y', 98)
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .text('E, Sig, MAC = payload');

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
