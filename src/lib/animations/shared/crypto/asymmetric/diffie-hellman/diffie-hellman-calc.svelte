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

  const width = 560;
  const height = 440;
  const maxStep = 6;

  const aliceX = 140;
  const bobX = 420;

  // Row Y positions (with proper spacing)
  const row1Y = 20;   // Public params
  const row2Y = 85;   // Alice/Bob labels
  const row3Y = 125;  // Secret values
  const row4Y = 170;  // Calc boxes
  const row5Y = 215;  // Public values (A=8, B=19)
  const row6Y = 265;  // Exchange line
  const row7Y = 285;  // Got values
  const row8Y = 335;  // Final calc
  const row9Y = 380;  // Final keys

  const allElements = [
    'public-params', 'alice-label', 'bob-label',
    'alice-secret', 'bob-secret',
    'alice-calc', 'alice-public', 'bob-calc', 'bob-public',
    'exchange-section', 'alice-got-b', 'bob-got-a',
    'alice-final-calc', 'alice-key', 'bob-final-calc', 'bob-key', 'same-key'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['public-params', 'alice-label', 'bob-label'],
    2: ['public-params', 'alice-label', 'bob-label', 'alice-secret', 'alice-calc', 'alice-public'],
    3: ['public-params', 'alice-label', 'bob-label', 'alice-secret', 'alice-calc', 'alice-public', 'bob-secret', 'bob-calc', 'bob-public'],
    4: ['public-params', 'alice-label', 'bob-label', 'alice-secret', 'alice-calc', 'alice-public', 'bob-secret', 'bob-calc', 'bob-public', 'exchange-section', 'alice-got-b', 'bob-got-a'],
    5: ['public-params', 'alice-label', 'bob-label', 'alice-secret', 'alice-calc', 'alice-public', 'bob-secret', 'bob-calc', 'bob-public', 'exchange-section', 'alice-got-b', 'bob-got-a', 'alice-final-calc', 'alice-key'],
    6: ['public-params', 'alice-label', 'bob-label', 'alice-secret', 'alice-calc', 'alice-public', 'bob-secret', 'bob-calc', 'bob-public', 'exchange-section', 'alice-got-b', 'bob-got-a', 'alice-final-calc', 'alice-key', 'bob-final-calc', 'bob-key', 'same-key']
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
    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    // Step 1: Public params
    if (currentStep <= 1) {
      applyStep(1);
      await sleep(1500);
      if (!isPlaying) return;
    }

    // Step 2: Alice's calculation
    if (currentStep <= 2) {
      applyStep(2);
      await sleep(1800);
      if (!isPlaying) return;
    }

    // Step 3: Bob's calculation
    if (currentStep <= 3) {
      applyStep(3);
      await sleep(1800);
      if (!isPlaying) return;
    }

    // Step 4: Exchange
    if (currentStep <= 4) {
      currentStep = 4;
      svgEl.select('.exchange-section').transition().duration(300).attr('opacity', 1);

      // Animate exchange
      const particleA = svgEl.select('.particle-a');
      const particleB = svgEl.select('.particle-b');
      particleA.attr('cx', aliceX).attr('opacity', 0.9);
      particleB.attr('cx', bobX).attr('opacity', 0.9);
      particleA.transition().duration(1000).ease(d3.easeCubicInOut).attr('cx', bobX);
      particleB.transition().duration(1000).ease(d3.easeCubicInOut).attr('cx', aliceX);
      await sleep(1100);
      if (!isPlaying) return;
      particleA.attr('opacity', 0);
      particleB.attr('opacity', 0);

      svgEl.select('.alice-got-b').transition().duration(300).attr('opacity', 1);
      svgEl.select('.bob-got-a').transition().duration(300).attr('opacity', 1);
      await sleep(1200);
      if (!isPlaying) return;
    }

    // Step 5: Alice computes K
    if (currentStep <= 5) {
      applyStep(5);
      await sleep(1500);
      if (!isPlaying) return;
    }

    // Step 6: Bob computes K - same!
    if (currentStep <= 6) {
      applyStep(6);
      // Pulse final keys
      svgEl.select('.alice-key rect')
        .transition().duration(200).attr('stroke-width', 4)
        .transition().duration(200).attr('stroke-width', 2);
      svgEl.select('.bob-key rect')
        .transition().duration(200).attr('stroke-width', 4)
        .transition().duration(200).attr('stroke-width', 2);
      await sleep(500);
    }

    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() {
    pause();
    svgEl.selectAll('.particle-a, .particle-b').attr('opacity', 0);
    applyStep(0);
    currentStep = 0;
    isPlaying = true;
    runAnimation();
  }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      bgCard: s.getPropertyValue('--color-bg-card').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      red: '#fb4934',
      blue: '#83a598',
      purple: '#d3869b'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const centerX = width / 2;

    // Particles for exchange
    svgEl.append('circle').attr('class', 'particle-a').attr('cy', row6Y).attr('r', 12)
      .attr('fill', colors.red).attr('opacity', 0);
    svgEl.append('circle').attr('class', 'particle-b').attr('cy', row6Y).attr('r', 12)
      .attr('fill', colors.blue).attr('opacity', 0);

    // === Public Parameters ===
    const publicParams = svgEl.append('g').attr('class', 'public-params').attr('opacity', 0);
    publicParams.append('rect').attr('x', centerX - 100).attr('y', row1Y).attr('width', 200).attr('height', 40).attr('rx', 5)
      .attr('fill', colors.yellow).attr('fill-opacity', 0.2).attr('stroke', colors.yellow).attr('stroke-width', 2);
    publicParams.append('text').attr('x', centerX).attr('y', row1Y + 17).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('PUBLIC PARAMETERS');
    publicParams.append('text').attr('x', centerX).attr('y', row1Y + 33).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '13px').attr('font-weight', 'bold').text('g = 5,  p = 23');

    // === Alice & Bob Labels ===
    const aliceLabel = svgEl.append('g').attr('class', 'alice-label').attr('opacity', 0);
    aliceLabel.append('circle').attr('cx', aliceX).attr('cy', row2Y).attr('r', 18)
      .attr('fill', colors.bgCard).attr('stroke', colors.red).attr('stroke-width', 2);
    aliceLabel.append('text').attr('x', aliceX).attr('y', row2Y + 5).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '11px').attr('font-weight', 'bold').text('Alice');

    const bobLabel = svgEl.append('g').attr('class', 'bob-label').attr('opacity', 0);
    bobLabel.append('circle').attr('cx', bobX).attr('cy', row2Y).attr('r', 18)
      .attr('fill', colors.bgCard).attr('stroke', colors.blue).attr('stroke-width', 2);
    bobLabel.append('text').attr('x', bobX).attr('y', row2Y + 5).attr('text-anchor', 'middle')
      .attr('fill', colors.blue).attr('font-size', '11px').attr('font-weight', 'bold').text('Bob');

    // === Secret Values ===
    const aliceSecret = svgEl.append('g').attr('class', 'alice-secret').attr('opacity', 0);
    aliceSecret.append('rect').attr('x', aliceX - 40).attr('y', row3Y).attr('width', 80).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.red).attr('fill-opacity', 0.3).attr('stroke', colors.red).attr('stroke-width', 2);
    aliceSecret.append('text').attr('x', aliceX).attr('y', row3Y + 13).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '9px').text('secret');
    aliceSecret.append('text').attr('x', aliceX).attr('y', row3Y + 23).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '11px').attr('font-weight', 'bold').text('a = 6');

    const bobSecret = svgEl.append('g').attr('class', 'bob-secret').attr('opacity', 0);
    bobSecret.append('rect').attr('x', bobX - 40).attr('y', row3Y).attr('width', 80).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.blue).attr('fill-opacity', 0.3).attr('stroke', colors.blue).attr('stroke-width', 2);
    bobSecret.append('text').attr('x', bobX).attr('y', row3Y + 13).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '9px').text('secret');
    bobSecret.append('text').attr('x', bobX).attr('y', row3Y + 23).attr('text-anchor', 'middle')
      .attr('fill', colors.blue).attr('font-size', '11px').attr('font-weight', 'bold').text('b = 15');

    // === Compute Public Values ===
    const aliceCalc = svgEl.append('g').attr('class', 'alice-calc').attr('opacity', 0);
    aliceCalc.append('rect').attr('x', aliceX - 50).attr('y', row4Y).attr('width', 100).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted).attr('stroke-width', 1);
    aliceCalc.append('text').attr('x', aliceX).attr('y', row4Y + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('A = 5\u2076 mod 23');

    const alicePublic = svgEl.append('g').attr('class', 'alice-public').attr('opacity', 0);
    alicePublic.append('rect').attr('x', aliceX - 30).attr('y', row5Y).attr('width', 60).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.red).attr('fill-opacity', 0.5).attr('stroke', colors.red).attr('stroke-width', 2);
    alicePublic.append('text').attr('x', aliceX).attr('y', row5Y + 19).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '12px').attr('font-weight', 'bold').text('A = 8');

    const bobCalc = svgEl.append('g').attr('class', 'bob-calc').attr('opacity', 0);
    bobCalc.append('rect').attr('x', bobX - 55).attr('y', row4Y).attr('width', 110).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted).attr('stroke-width', 1);
    bobCalc.append('text').attr('x', bobX).attr('y', row4Y + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('B = 5\u00B9\u2075 mod 23');

    const bobPublic = svgEl.append('g').attr('class', 'bob-public').attr('opacity', 0);
    bobPublic.append('rect').attr('x', bobX - 35).attr('y', row5Y).attr('width', 70).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.blue).attr('fill-opacity', 0.5).attr('stroke', colors.blue).attr('stroke-width', 2);
    bobPublic.append('text').attr('x', bobX).attr('y', row5Y + 19).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '12px').attr('font-weight', 'bold').text('B = 19');

    // === Exchange ===
    const exchangeSection = svgEl.append('g').attr('class', 'exchange-section').attr('opacity', 0);
    exchangeSection.append('line').attr('x1', aliceX + 35).attr('y1', row6Y).attr('x2', bobX - 40).attr('y2', row6Y)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 2);
    exchangeSection.append('text').attr('x', centerX).attr('y', row6Y - 5).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '9px').text('EXCHANGE');

    const aliceGotB = svgEl.append('g').attr('class', 'alice-got-b').attr('opacity', 0);
    aliceGotB.append('rect').attr('x', aliceX - 35).attr('y', row7Y).attr('width', 70).attr('height', 24).attr('rx', 3)
      .attr('fill', colors.blue).attr('fill-opacity', 0.4).attr('stroke', colors.blue).attr('stroke-width', 1);
    aliceGotB.append('text').attr('x', aliceX).attr('y', row7Y + 16).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('got B=19');

    const bobGotA = svgEl.append('g').attr('class', 'bob-got-a').attr('opacity', 0);
    bobGotA.append('rect').attr('x', bobX - 35).attr('y', row7Y).attr('width', 70).attr('height', 24).attr('rx', 3)
      .attr('fill', colors.red).attr('fill-opacity', 0.4).attr('stroke', colors.red).attr('stroke-width', 1);
    bobGotA.append('text').attr('x', bobX).attr('y', row7Y + 16).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('got A=8');

    // === Compute Shared Key ===
    const aliceFinalCalc = svgEl.append('g').attr('class', 'alice-final-calc').attr('opacity', 0);
    aliceFinalCalc.append('rect').attr('x', aliceX - 55).attr('y', row8Y).attr('width', 110).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted).attr('stroke-width', 1);
    aliceFinalCalc.append('text').attr('x', aliceX).attr('y', row8Y + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('K = 19\u2076 mod 23');

    const aliceKey = svgEl.append('g').attr('class', 'alice-key').attr('opacity', 0);
    aliceKey.append('rect').attr('x', aliceX - 30).attr('y', row9Y).attr('width', 60).attr('height', 32).attr('rx', 5)
      .attr('fill', colors.purple).attr('fill-opacity', 0.5).attr('stroke', colors.purple).attr('stroke-width', 2);
    aliceKey.append('text').attr('x', aliceX).attr('y', row9Y + 21).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '14px').attr('font-weight', 'bold').text('K = 2');

    const bobFinalCalc = svgEl.append('g').attr('class', 'bob-final-calc').attr('opacity', 0);
    bobFinalCalc.append('rect').attr('x', bobX - 55).attr('y', row8Y).attr('width', 110).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted).attr('stroke-width', 1);
    bobFinalCalc.append('text').attr('x', bobX).attr('y', row8Y + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('K = 8\u00B9\u2075 mod 23');

    const bobKey = svgEl.append('g').attr('class', 'bob-key').attr('opacity', 0);
    bobKey.append('rect').attr('x', bobX - 30).attr('y', row9Y).attr('width', 60).attr('height', 32).attr('rx', 5)
      .attr('fill', colors.purple).attr('fill-opacity', 0.5).attr('stroke', colors.purple).attr('stroke-width', 2);
    bobKey.append('text').attr('x', bobX).attr('y', row9Y + 21).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '14px').attr('font-weight', 'bold').text('K = 2');

    // Same key indicator
    const sameKey = svgEl.append('g').attr('class', 'same-key').attr('opacity', 0);
    sameKey.append('line').attr('x1', aliceX + 35).attr('y1', row9Y + 16).attr('x2', bobX - 35).attr('y2', row9Y + 16)
      .attr('stroke', colors.purple).attr('stroke-width', 3).attr('stroke-dasharray', '8,4');
    sameKey.append('rect').attr('x', centerX - 35).attr('y', row9Y + 4).attr('width', 70).attr('height', 24).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.purple).attr('stroke-width', 2);
    sameKey.append('text').attr('x', centerX).attr('y', row9Y + 20).attr('text-anchor', 'middle')
      .attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold').text('SAME!');

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
    max-height: 440px;
  }
</style>
