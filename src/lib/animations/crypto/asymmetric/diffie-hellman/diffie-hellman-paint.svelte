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

  // Paint colors (these are fixed for the analogy)
  const paint = {
    public: '#fabd2f',      // Yellow - public color
    aliceSecret: '#fb4934', // Red - Alice's secret
    bobSecret: '#83a598',   // Blue - Bob's secret
    aliceMix: '#fe8019',    // Orange (yellow + red)
    bobMix: '#8ec07c',      // Green (yellow + blue)
    shared: '#d3869b'       // Purple - final shared color
  };

  const width = 560;
  const height = 480;
  const maxStep = 6;

  const aliceX = 140;
  const bobX = 420;

  const allElements = [
    'alice-label', 'bob-label', 'public-color',
    'alice-secret', 'bob-secret',
    'alice-mix', 'bob-mix', 'alice-mixed-result', 'bob-mixed-result',
    'exchange-section', 'alice-received', 'bob-received',
    'final-mix-section', 'alice-final', 'bob-final', 'same-indicator'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['alice-label', 'bob-label', 'public-color'],
    2: ['alice-label', 'bob-label', 'public-color', 'alice-secret', 'bob-secret'],
    3: ['alice-label', 'bob-label', 'public-color', 'alice-secret', 'bob-secret', 'alice-mix', 'bob-mix', 'alice-mixed-result', 'bob-mixed-result'],
    4: ['alice-label', 'bob-label', 'public-color', 'alice-secret', 'bob-secret', 'alice-mix', 'bob-mix', 'alice-mixed-result', 'bob-mixed-result', 'exchange-section', 'alice-received', 'bob-received'],
    5: ['alice-label', 'bob-label', 'public-color', 'alice-secret', 'bob-secret', 'alice-mix', 'bob-mix', 'alice-mixed-result', 'bob-mixed-result', 'exchange-section', 'alice-received', 'bob-received', 'final-mix-section', 'alice-final', 'bob-final'],
    6: ['alice-label', 'bob-label', 'public-color', 'alice-secret', 'bob-secret', 'alice-mix', 'bob-mix', 'alice-mixed-result', 'bob-mixed-result', 'exchange-section', 'alice-received', 'bob-received', 'final-mix-section', 'alice-final', 'bob-final', 'same-indicator']
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

    // Step 1: Show labels and public color
    if (currentStep <= 1) {
      applyStep(1);
      await sleep(1500);
      if (!isPlaying) return;
    }

    // Step 2: Show secret colors
    if (currentStep <= 2) {
      applyStep(2);
      await sleep(1500);
      if (!isPlaying) return;
    }

    // Step 3: Mix colors
    if (currentStep <= 3) {
      applyStep(3);
      await sleep(1500);
      if (!isPlaying) return;
    }

    // Step 4: Exchange
    if (currentStep <= 4) {
      currentStep = 4;
      svgEl.select('.exchange-section').transition().duration(300).attr('opacity', 1);

      // Animate exchange particles
      const particleA = svgEl.select('.exchange-particle-a');
      const particleB = svgEl.select('.exchange-particle-b');
      particleA.attr('cx', aliceX).attr('opacity', 0.9);
      particleB.attr('cx', bobX).attr('opacity', 0.9);
      particleA.transition().duration(1000).ease(d3.easeCubicInOut).attr('cx', bobX);
      particleB.transition().duration(1000).ease(d3.easeCubicInOut).attr('cx', aliceX);
      await sleep(1100);
      if (!isPlaying) return;
      particleA.attr('opacity', 0);
      particleB.attr('opacity', 0);

      svgEl.select('.alice-received').transition().duration(300).attr('opacity', 1);
      svgEl.select('.bob-received').transition().duration(300).attr('opacity', 1);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 5: Final mix
    if (currentStep <= 5) {
      applyStep(5);
      await sleep(1500);
      if (!isPlaying) return;
    }

    // Step 6: Same!
    if (currentStep <= 6) {
      applyStep(6);
      // Pulse the final colors
      svgEl.select('.alice-final rect')
        .transition().duration(200).attr('stroke-width', 4)
        .transition().duration(200).attr('stroke-width', 2);
      svgEl.select('.bob-final rect')
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
    svgEl.selectAll('.exchange-particle-a, .exchange-particle-b').attr('opacity', 0);
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
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const centerX = width / 2;
    const row1Y = 50;   // Labels & Public color
    const row2Y = 110;  // Secret colors
    const row3Y = 185;  // Mix operation
    const row4Y = 280;  // Exchange
    const row5Y = 360;  // Final mix
    const row6Y = 430;  // Final shared color

    // === Particles (created first for z-order) ===
    svgEl.append('circle').attr('class', 'exchange-particle-a').attr('cy', row4Y + 15).attr('r', 10)
      .attr('fill', paint.aliceMix).attr('opacity', 0);
    svgEl.append('circle').attr('class', 'exchange-particle-b').attr('cy', row4Y + 15).attr('r', 10)
      .attr('fill', paint.bobMix).attr('opacity', 0);

    // === ROW 1: Labels & Public Color ===

    // Alice label
    const aliceLabel = svgEl.append('g').attr('class', 'alice-label').attr('opacity', 0);
    aliceLabel.append('circle').attr('cx', aliceX).attr('cy', row1Y).attr('r', 20)
      .attr('fill', colors.bgCard).attr('stroke', paint.aliceSecret).attr('stroke-width', 2);
    aliceLabel.append('text').attr('x', aliceX).attr('y', row1Y + 5).attr('text-anchor', 'middle')
      .attr('fill', paint.aliceSecret).attr('font-size', '12px').attr('font-weight', 'bold').text('Alice');

    // Bob label
    const bobLabel = svgEl.append('g').attr('class', 'bob-label').attr('opacity', 0);
    bobLabel.append('circle').attr('cx', bobX).attr('cy', row1Y).attr('r', 20)
      .attr('fill', colors.bgCard).attr('stroke', paint.bobSecret).attr('stroke-width', 2);
    bobLabel.append('text').attr('x', bobX).attr('y', row1Y + 5).attr('text-anchor', 'middle')
      .attr('fill', paint.bobSecret).attr('font-size', '12px').attr('font-weight', 'bold').text('Bob');

    // Public color (center)
    const publicColor = svgEl.append('g').attr('class', 'public-color').attr('opacity', 0);
    publicColor.append('rect').attr('x', centerX - 50).attr('y', row1Y - 20).attr('width', 100).attr('height', 40).attr('rx', 6)
      .attr('fill', paint.public).attr('fill-opacity', 0.4).attr('stroke', paint.public).attr('stroke-width', 2);
    publicColor.append('text').attr('x', centerX).attr('y', row1Y + 5).attr('text-anchor', 'middle')
      .attr('fill', paint.public).attr('font-size', '12px').attr('font-weight', 'bold').text('PUBLIC');

    // === ROW 2: Secret Colors ===

    // Alice's secret
    const aliceSecret = svgEl.append('g').attr('class', 'alice-secret').attr('opacity', 0);
    aliceSecret.append('rect').attr('x', aliceX - 40).attr('y', row2Y - 5).attr('width', 80).attr('height', 45).attr('rx', 6)
      .attr('fill', paint.aliceSecret).attr('fill-opacity', 0.5).attr('stroke', paint.aliceSecret).attr('stroke-width', 2);
    aliceSecret.append('text').attr('x', aliceX).attr('y', row2Y + 13).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('SECRET');
    aliceSecret.append('text').attr('x', aliceX).attr('y', row2Y + 32).attr('text-anchor', 'middle')
      .attr('fill', paint.aliceSecret).attr('font-size', '14px').attr('font-weight', 'bold').text('a');

    // Bob's secret
    const bobSecret = svgEl.append('g').attr('class', 'bob-secret').attr('opacity', 0);
    bobSecret.append('rect').attr('x', bobX - 40).attr('y', row2Y - 5).attr('width', 80).attr('height', 45).attr('rx', 6)
      .attr('fill', paint.bobSecret).attr('fill-opacity', 0.5).attr('stroke', paint.bobSecret).attr('stroke-width', 2);
    bobSecret.append('text').attr('x', bobX).attr('y', row2Y + 13).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('SECRET');
    bobSecret.append('text').attr('x', bobX).attr('y', row2Y + 32).attr('text-anchor', 'middle')
      .attr('fill', paint.bobSecret).attr('font-size', '14px').attr('font-weight', 'bold').text('b');

    // === ROW 3: Mix Operation ===

    // Down arrows
    svgEl.append('text').attr('x', aliceX).attr('y', row3Y - 15).attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '18px').text('+');
    svgEl.append('text').attr('x', bobX).attr('y', row3Y - 15).attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '18px').text('+');

    // Alice mix box
    const aliceMix = svgEl.append('g').attr('class', 'alice-mix').attr('opacity', 0);
    aliceMix.append('rect').attr('x', aliceX - 50).attr('y', row3Y).attr('width', 100).attr('height', 45).attr('rx', 6)
      .attr('fill', colors.bgCard).attr('stroke', paint.aliceMix).attr('stroke-width', 2);
    aliceMix.append('text').attr('x', aliceX).attr('y', row3Y + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('MIX');
    aliceMix.append('text').attr('x', aliceX).attr('y', row3Y + 35).attr('text-anchor', 'middle')
      .attr('fill', paint.public).attr('font-size', '10px').text('public + a');

    // Bob mix box
    const bobMix = svgEl.append('g').attr('class', 'bob-mix').attr('opacity', 0);
    bobMix.append('rect').attr('x', bobX - 50).attr('y', row3Y).attr('width', 100).attr('height', 45).attr('rx', 6)
      .attr('fill', colors.bgCard).attr('stroke', paint.bobMix).attr('stroke-width', 2);
    bobMix.append('text').attr('x', bobX).attr('y', row3Y + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('MIX');
    bobMix.append('text').attr('x', bobX).attr('y', row3Y + 35).attr('text-anchor', 'middle')
      .attr('fill', paint.public).attr('font-size', '10px').text('public + b');

    // Mixed results
    const aliceMixedResult = svgEl.append('g').attr('class', 'alice-mixed-result').attr('opacity', 0);
    aliceMixedResult.append('rect').attr('x', aliceX - 35).attr('y', row3Y + 55).attr('width', 70).attr('height', 35).attr('rx', 5)
      .attr('fill', paint.aliceMix).attr('fill-opacity', 0.6).attr('stroke', paint.aliceMix).attr('stroke-width', 2);
    aliceMixedResult.append('text').attr('x', aliceX).attr('y', row3Y + 78).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '13px').attr('font-weight', 'bold').text('A');

    const bobMixedResult = svgEl.append('g').attr('class', 'bob-mixed-result').attr('opacity', 0);
    bobMixedResult.append('rect').attr('x', bobX - 35).attr('y', row3Y + 55).attr('width', 70).attr('height', 35).attr('rx', 5)
      .attr('fill', paint.bobMix).attr('fill-opacity', 0.6).attr('stroke', paint.bobMix).attr('stroke-width', 2);
    bobMixedResult.append('text').attr('x', bobX).attr('y', row3Y + 78).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '13px').attr('font-weight', 'bold').text('B');

    // === ROW 4: Exchange ===

    const exchangeSection = svgEl.append('g').attr('class', 'exchange-section').attr('opacity', 0);
    exchangeSection.append('line').attr('x1', aliceX + 40).attr('y1', row4Y + 8).attr('x2', bobX - 40).attr('y2', row4Y + 8)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 2);
    exchangeSection.append('line').attr('x1', bobX - 40).attr('y1', row4Y + 22).attr('x2', aliceX + 40).attr('y2', row4Y + 22)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 2);
    exchangeSection.append('text').attr('x', centerX).attr('y', row4Y + 19).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('EXCHANGE');

    // What each received
    const aliceReceived = svgEl.append('g').attr('class', 'alice-received').attr('opacity', 0);
    aliceReceived.append('rect').attr('x', aliceX - 35).attr('y', row4Y + 40).attr('width', 70).attr('height', 30).attr('rx', 5)
      .attr('fill', paint.bobMix).attr('fill-opacity', 0.6).attr('stroke', paint.bobMix).attr('stroke-width', 2);
    aliceReceived.append('text').attr('x', aliceX).attr('y', row4Y + 60).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '11px').text('got B');

    const bobReceived = svgEl.append('g').attr('class', 'bob-received').attr('opacity', 0);
    bobReceived.append('rect').attr('x', bobX - 35).attr('y', row4Y + 40).attr('width', 70).attr('height', 30).attr('rx', 5)
      .attr('fill', paint.aliceMix).attr('fill-opacity', 0.6).attr('stroke', paint.aliceMix).attr('stroke-width', 2);
    bobReceived.append('text').attr('x', bobX).attr('y', row4Y + 60).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '11px').text('got A');

    // === ROW 5: Final Mix ===

    const finalMixSection = svgEl.append('g').attr('class', 'final-mix-section').attr('opacity', 0);
    finalMixSection.append('text').attr('x', aliceX).attr('y', row5Y - 10).attr('text-anchor', 'middle')
      .attr('fill', paint.aliceSecret).attr('font-size', '11px').text('+ a');
    finalMixSection.append('text').attr('x', bobX).attr('y', row5Y - 10).attr('text-anchor', 'middle')
      .attr('fill', paint.bobSecret).attr('font-size', '11px').text('+ b');
    finalMixSection.append('rect').attr('x', aliceX - 40).attr('y', row5Y).attr('width', 80).attr('height', 40).attr('rx', 6)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted).attr('stroke-width', 1);
    finalMixSection.append('text').attr('x', aliceX).attr('y', row5Y + 25).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('B + a');
    finalMixSection.append('rect').attr('x', bobX - 40).attr('y', row5Y).attr('width', 80).attr('height', 40).attr('rx', 6)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted).attr('stroke-width', 1);
    finalMixSection.append('text').attr('x', bobX).attr('y', row5Y + 25).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('A + b');

    // === ROW 6: Final Shared Color ===

    const aliceFinal = svgEl.append('g').attr('class', 'alice-final').attr('opacity', 0);
    aliceFinal.append('rect').attr('x', aliceX - 35).attr('y', row6Y).attr('width', 70).attr('height', 35).attr('rx', 6)
      .attr('fill', paint.shared).attr('fill-opacity', 0.7).attr('stroke', paint.shared).attr('stroke-width', 2);
    aliceFinal.append('text').attr('x', aliceX).attr('y', row6Y + 23).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '13px').attr('font-weight', 'bold').text('K');

    const bobFinal = svgEl.append('g').attr('class', 'bob-final').attr('opacity', 0);
    bobFinal.append('rect').attr('x', bobX - 35).attr('y', row6Y).attr('width', 70).attr('height', 35).attr('rx', 6)
      .attr('fill', paint.shared).attr('fill-opacity', 0.7).attr('stroke', paint.shared).attr('stroke-width', 2);
    bobFinal.append('text').attr('x', bobX).attr('y', row6Y + 23).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '13px').attr('font-weight', 'bold').text('K');

    // Same indicator
    const sameIndicator = svgEl.append('g').attr('class', 'same-indicator').attr('opacity', 0);
    sameIndicator.append('line').attr('x1', aliceX + 40).attr('y1', row6Y + 17).attr('x2', bobX - 40).attr('y2', row6Y + 17)
      .attr('stroke', paint.shared).attr('stroke-width', 3).attr('stroke-dasharray', '8,4');
    sameIndicator.append('rect').attr('x', centerX - 40).attr('y', row6Y + 3).attr('width', 80).attr('height', 30).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', paint.shared).attr('stroke-width', 2);
    sameIndicator.append('text').attr('x', centerX).attr('y', row6Y + 23).attr('text-anchor', 'middle')
      .attr('fill', paint.shared).attr('font-size', '12px').attr('font-weight', 'bold').text('SAME!');

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
    max-height: 480px;
  }
</style>
