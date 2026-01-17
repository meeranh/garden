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

  const width = 550;
  const height = 380;
  const maxStep = 8;

  const aliceX = 90;
  const bobX = 460;
  const channelY = 120;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  // Sequence of exchanges: [aliceFilter, aliceBit, bobFilter]
  // filter: 'std' or 'diag', bit: 0 or 1
  const exchanges = [
    { alice: 'std', bit: 1, bob: 'std' },   // Match → keep
    { alice: 'diag', bit: 0, bob: 'std' },  // Mismatch → discard
    { alice: 'std', bit: 0, bob: 'std' },   // Match → keep
    { alice: 'diag', bit: 1, bob: 'diag' }, // Match → keep
  ];

  const polarizations: Record<string, Record<number, string>> = {
    std: { 0: '↑', 1: '→' },
    diag: { 0: '↗', 1: '↘' }
  };

  let keyBits: (number | null)[] = [];

  function getFilterLine(filter: string, x: number, y: number) {
    if (filter === 'std') {
      return { x1: x, y1: y - 18, x2: x, y2: y + 18 };
    } else {
      return { x1: x - 13, y1: y + 13, x2: x + 13, y2: y - 13 };
    }
  }

  function drawExchangeState(exchIdx: number, phase: 'prepare' | 'send' | 'receive' | 'result') {
    const exch = exchanges[exchIdx];
    const pol = polarizations[exch.alice][exch.bit];
    const match = exch.alice === exch.bob;

    // Alice filter
    const af = getFilterLine(exch.alice, aliceX + 45, channelY);
    svgEl.select('.alice-filter-line')
      .attr('x1', af.x1).attr('y1', af.y1)
      .attr('x2', af.x2).attr('y2', af.y2)
      .attr('stroke', colors.blue)
      .attr('opacity', 1);
    svgEl.select('.alice-filter-label')
      .text(exch.alice === 'std' ? 'Standard' : 'Diagonal')
      .attr('opacity', 1);

    if (phase === 'prepare') {
      svgEl.select('.photon').attr('cx', aliceX + 80).attr('opacity', 1);
      svgEl.select('.photon-pol').attr('x', aliceX + 80).text(pol).attr('opacity', 1);
      svgEl.select('.bob-filter-line').attr('opacity', 0);
      svgEl.select('.bob-filter-label').attr('opacity', 0);
      svgEl.select('.result-text').attr('opacity', 0);
    }

    if (phase === 'send') {
      svgEl.select('.photon')
        .transition().duration(1200).ease(d3.easeLinear)
        .attr('cx', bobX - 80);
      svgEl.select('.photon-pol')
        .transition().duration(1200).ease(d3.easeLinear)
        .attr('x', bobX - 80);
    }

    if (phase === 'receive') {
      const bf = getFilterLine(exch.bob, bobX - 45, channelY);
      svgEl.select('.bob-filter-line')
        .attr('x1', bf.x1).attr('y1', bf.y1)
        .attr('x2', bf.x2).attr('y2', bf.y2)
        .attr('stroke', colors.green)
        .attr('opacity', 1);
      svgEl.select('.bob-filter-label')
        .text(exch.bob === 'std' ? 'Standard' : 'Diagonal')
        .attr('opacity', 1);
    }

    if (phase === 'result') {
      svgEl.select('.photon').attr('opacity', 0);
      svgEl.select('.photon-pol').attr('opacity', 0);

      if (match) {
        svgEl.select('.result-text')
          .attr('fill', colors.green)
          .text(`✓ Filters match! Keep bit: ${exch.bit}`)
          .attr('opacity', 1);
        keyBits.push(exch.bit);
      } else {
        svgEl.select('.result-text')
          .attr('fill', colors.orange)
          .text('✗ Filters differ. Discard.')
          .attr('opacity', 1);
        keyBits.push(null);
      }
      updateKeyDisplay();
    }
  }

  function updateKeyDisplay() {
    keyBits.forEach((bit, i) => {
      const el = svgEl.select(`.key-slot-${i}`);
      if (bit !== null) {
        el.select('rect').attr('stroke', colors.green).attr('opacity', 1);
        el.select('text').text(String(bit)).attr('fill', colors.green).attr('opacity', 1);
      } else if (keyBits[i] === null && i < keyBits.length) {
        el.select('rect').attr('stroke', colors.fgMuted).attr('opacity', 0.3);
        el.select('text').text('✗').attr('fill', colors.fgMuted).attr('opacity', 0.5);
      }
    });
  }

  async function animateStep(step: number) {
    const labels = [
      'Alice and Bob want to create a shared secret key.',
      'Alice picks Standard filter, sends bit 1 (→)',
      'Bob picks Standard filter (match!)',
      'Alice picks Diagonal filter, sends bit 0 (↗)',
      'Bob picks Standard filter (mismatch)',
      'Alice picks Standard filter, sends bit 0 (↑)',
      'Bob picks Standard filter (match!)',
      'After comparing filters, they keep the matching bits.',
      'Shared secret key: 1, 0'
    ];

    svgEl.select('.step-label').text(labels[step]);

    switch(step) {
      case 0:
        keyBits = [];
        svgEl.selectAll('.key-slot rect').attr('stroke', colors.fgMuted).attr('opacity', 0.3);
        svgEl.selectAll('.key-slot text').text('').attr('opacity', 0);
        svgEl.select('.photon').attr('opacity', 0);
        svgEl.select('.photon-pol').attr('opacity', 0);
        svgEl.select('.alice-filter-line').attr('opacity', 0);
        svgEl.select('.alice-filter-label').attr('opacity', 0);
        svgEl.select('.bob-filter-line').attr('opacity', 0);
        svgEl.select('.bob-filter-label').attr('opacity', 0);
        svgEl.select('.result-text').attr('opacity', 0);
        svgEl.select('.final-key').attr('opacity', 0);
        break;

      case 1:
        drawExchangeState(0, 'prepare');
        await sleep(600);
        if (!isPlaying && currentStep !== 1) return;
        drawExchangeState(0, 'send');
        break;

      case 2:
        drawExchangeState(0, 'receive');
        await sleep(600);
        if (!isPlaying && currentStep !== 2) return;
        drawExchangeState(0, 'result');
        break;

      case 3:
        drawExchangeState(1, 'prepare');
        await sleep(600);
        if (!isPlaying && currentStep !== 3) return;
        drawExchangeState(1, 'send');
        break;

      case 4:
        drawExchangeState(1, 'receive');
        await sleep(600);
        if (!isPlaying && currentStep !== 4) return;
        drawExchangeState(1, 'result');
        break;

      case 5:
        drawExchangeState(2, 'prepare');
        await sleep(600);
        if (!isPlaying && currentStep !== 5) return;
        drawExchangeState(2, 'send');
        break;

      case 6:
        drawExchangeState(2, 'receive');
        await sleep(600);
        if (!isPlaying && currentStep !== 6) return;
        drawExchangeState(2, 'result');
        break;

      case 7:
        // Show final exchange quickly
        drawExchangeState(3, 'prepare');
        await sleep(400);
        if (!isPlaying && currentStep !== 7) return;
        drawExchangeState(3, 'send');
        await sleep(1300);
        if (!isPlaying && currentStep !== 7) return;
        drawExchangeState(3, 'receive');
        await sleep(400);
        if (!isPlaying && currentStep !== 7) return;
        drawExchangeState(3, 'result');
        break;

      case 8:
        svgEl.select('.alice-filter-line').attr('opacity', 0);
        svgEl.select('.alice-filter-label').attr('opacity', 0);
        svgEl.select('.bob-filter-line').attr('opacity', 0);
        svgEl.select('.bob-filter-label').attr('opacity', 0);
        svgEl.select('.result-text').attr('opacity', 0);
        svgEl.select('.final-key').attr('opacity', 1);
        break;
    }

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      await animateStep(i);
      await sleep(1800);
    }

    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) { currentStep++; animateStep(currentStep); } }
  function prev() { pause(); if (currentStep > 0) { currentStep--; animateStep(currentStep); } }

  function applyFinalState() {
    currentStep = maxStep;
    keyBits = [1, null, 0, 1];
    updateKeyDisplay();
    svgEl.select('.step-label').text('Shared secret key: 1, 0, 1');
    svgEl.select('.photon').attr('opacity', 0);
    svgEl.select('.alice-filter-line').attr('opacity', 0);
    svgEl.select('.alice-filter-label').attr('opacity', 0);
    svgEl.select('.bob-filter-line').attr('opacity', 0);
    svgEl.select('.bob-filter-label').attr('opacity', 0);
    svgEl.select('.result-text').attr('opacity', 0);
    svgEl.select('.final-key').attr('opacity', 1);
  }

  function skip() { pause(); applyFinalState(); }
  function replay() {
    pause();
    currentStep = 0;
    animateStep(0);
    isPlaying = true;
    runAnimation();
  }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      blue: '#83a598',
      orange: '#fe8019',
      green: '#b8bb26',
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px');

    // Alice
    svgEl.append('text')
      .attr('x', aliceX).attr('y', channelY - 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.blue)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Alice');

    // Alice's filter box
    svgEl.append('rect')
      .attr('x', aliceX + 30).attr('y', channelY - 25)
      .attr('width', 30).attr('height', 50)
      .attr('rx', 4)
      .attr('fill', 'none')
      .attr('stroke', colors.blue)
      .attr('stroke-width', 2);

    svgEl.append('line')
      .attr('class', 'alice-filter-line')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'alice-filter-label')
      .attr('x', aliceX + 45).attr('y', channelY + 45)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.blue)
      .attr('font-size', '11px')
      .attr('opacity', 0);

    // Channel
    svgEl.append('line')
      .attr('x1', aliceX + 70).attr('y1', channelY)
      .attr('x2', bobX - 70).attr('y2', channelY)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0.3);

    // Bob
    svgEl.append('text')
      .attr('x', bobX).attr('y', channelY - 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Bob');

    // Bob's filter box
    svgEl.append('rect')
      .attr('x', bobX - 60).attr('y', channelY - 25)
      .attr('width', 30).attr('height', 50)
      .attr('rx', 4)
      .attr('fill', 'none')
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);

    svgEl.append('line')
      .attr('class', 'bob-filter-line')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'bob-filter-label')
      .attr('x', bobX - 45).attr('y', channelY + 45)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '11px')
      .attr('opacity', 0);

    // Photon
    svgEl.append('circle')
      .attr('class', 'photon')
      .attr('cx', aliceX + 80)
      .attr('cy', channelY)
      .attr('r', 20)
      .attr('fill', colors.yellow)
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'photon-pol')
      .attr('x', aliceX + 80)
      .attr('y', channelY + 7)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '22px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0);

    // Result text
    svgEl.append('text')
      .attr('class', 'result-text')
      .attr('x', width / 2).attr('y', channelY + 80)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0);

    // Key display
    const keyY = 250;
    svgEl.append('text')
      .attr('x', width / 2).attr('y', keyY - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '12px')
      .text('Key bits:');

    for (let i = 0; i < 4; i++) {
      const g = svgEl.append('g')
        .attr('class', `key-slot key-slot-${i}`)
        .attr('transform', `translate(${width/2 - 95 + i * 50}, ${keyY})`);

      g.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', 40).attr('height', 40)
        .attr('rx', 6)
        .attr('fill', 'none')
        .attr('stroke', colors.fgMuted)
        .attr('stroke-width', 2)
        .attr('opacity', 0.3);

      g.append('text')
        .attr('x', 20).attr('y', 28)
        .attr('text-anchor', 'middle')
        .attr('font-size', '20px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0);
    }

    // Final key
    const finalKey = svgEl.append('g')
      .attr('class', 'final-key')
      .attr('transform', `translate(${width / 2}, ${keyY + 85})`)
      .attr('opacity', 0);

    finalKey.append('rect')
      .attr('x', -90).attr('y', -18)
      .attr('width', 180).attr('height', 36)
      .attr('rx', 8)
      .attr('fill', colors.bg)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);

    finalKey.append('text')
      .attr('x', 0).attr('y', 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('Shared Key: 1, 0, 1');

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
  }
</style>
