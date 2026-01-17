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

  const width = 600;
  const height = 300;
  const maxStep = 7;

  const aliceX = 80;
  const eveX = 300;
  const bobX = 520;
  const channelY = 130;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'What happens when Eve eavesdrops?',
    'Alice sends a photon: Standard filter, bit 1 (→)',
    'Eve intercepts! She must guess the filter...',
    'Eve guesses Diagonal (wrong!) and measures',
    'Wrong filter disturbs the photon!',
    'Eve forwards corrupted photon to Bob',
    'Bob uses Standard (correct!) but gets wrong value',
    'Errors detected → Eve is caught!'
  ];

  function getFilterLine(filter: string, x: number, y: number) {
    if (filter === 'std') {
      return { x1: x, y1: y - 18, x2: x, y2: y + 18 };
    } else {
      return { x1: x - 13, y1: y + 13, x2: x + 13, y2: y - 13 };
    }
  }

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    switch(step) {
      case 0:
        // Reset
        svgEl.select('.photon').attr('cx', aliceX + 60).attr('opacity', 0).attr('fill', colors.yellow);
        svgEl.select('.photon-pol').attr('x', aliceX + 60).text('→').attr('opacity', 0).attr('fill', colors.bg);
        svgEl.select('.alice-filter-line').attr('opacity', 0);
        svgEl.select('.alice-filter-label').attr('opacity', 0);
        svgEl.select('.eve-filter-line').attr('opacity', 0);
        svgEl.select('.eve-filter-label').attr('opacity', 0);
        svgEl.select('.bob-filter-line').attr('opacity', 0);
        svgEl.select('.bob-filter-label').attr('opacity', 0);
        svgEl.select('.disturb-ring').attr('opacity', 0).attr('r', 0);
        svgEl.select('.result-box').attr('opacity', 0);
        break;

      case 1:
        // Alice sends
        const af = getFilterLine('std', aliceX + 45, channelY);
        svgEl.select('.alice-filter-line')
          .attr('x1', af.x1).attr('y1', af.y1)
          .attr('x2', af.x2).attr('y2', af.y2)
          .attr('stroke', colors.blue)
          .attr('opacity', 1);
        svgEl.select('.alice-filter-label').text('Standard').attr('opacity', 1);
        svgEl.select('.photon').attr('opacity', 1);
        svgEl.select('.photon-pol').attr('opacity', 1);
        break;

      case 2:
        // Photon travels to Eve
        svgEl.select('.photon')
          .transition().duration(1000).ease(d3.easeLinear)
          .attr('cx', eveX - 30);
        svgEl.select('.photon-pol')
          .transition().duration(1000).ease(d3.easeLinear)
          .attr('x', eveX - 30);
        break;

      case 3:
        // Eve measures with wrong filter
        const ef = getFilterLine('diag', eveX, channelY);
        svgEl.select('.eve-filter-line')
          .attr('x1', ef.x1).attr('y1', ef.y1)
          .attr('x2', ef.x2).attr('y2', ef.y2)
          .attr('stroke', colors.red)
          .attr('opacity', 1);
        svgEl.select('.eve-filter-label').text('Diagonal').attr('opacity', 1);

        svgEl.select('.photon')
          .transition().duration(400).ease(d3.easeLinear)
          .attr('cx', eveX);
        svgEl.select('.photon-pol')
          .transition().duration(400).ease(d3.easeLinear)
          .attr('x', eveX);
        break;

      case 4:
        // Disturbance!
        svgEl.select('.disturb-ring')
          .attr('cx', eveX).attr('cy', channelY)
          .attr('r', 0).attr('opacity', 0.9)
          .transition().duration(600)
          .attr('r', 50)
          .attr('opacity', 0);

        await sleep(300);
        if (!isPlaying && currentStep !== 4) return;

        svgEl.select('.photon')
          .transition().duration(300)
          .attr('fill', colors.red);
        svgEl.select('.photon-pol')
          .text('?')
          .attr('fill', '#1d2021');
        break;

      case 5:
        // Eve forwards
        svgEl.select('.photon')
          .transition().duration(1000).ease(d3.easeLinear)
          .attr('cx', bobX - 60);
        svgEl.select('.photon-pol')
          .transition().duration(1000).ease(d3.easeLinear)
          .attr('x', bobX - 60);
        break;

      case 6:
        // Bob measures
        const bf = getFilterLine('std', bobX - 45, channelY);
        svgEl.select('.bob-filter-line')
          .attr('x1', bf.x1).attr('y1', bf.y1)
          .attr('x2', bf.x2).attr('y2', bf.y2)
          .attr('stroke', colors.green)
          .attr('opacity', 1);
        svgEl.select('.bob-filter-label').text('Standard').attr('opacity', 1);

        await sleep(500);
        if (!isPlaying && currentStep !== 6) return;

        svgEl.select('.photon').attr('opacity', 0);
        svgEl.select('.photon-pol').attr('opacity', 0);

        svgEl.select('.result-box').attr('opacity', 1);
        svgEl.select('.result-title').text('Bob measures:').attr('fill', colors.fg);
        svgEl.select('.result-line1').text('Expected: 1 (horizontal →)').attr('fill', colors.fgMuted);
        svgEl.select('.result-line2').text('Got: 0 (wrong!)').attr('fill', colors.red);
        break;

      case 7:
        // Eve detected
        svgEl.select('.result-title').text('⚠ EAVESDROPPER DETECTED').attr('fill', colors.red);
        svgEl.select('.result-line1').text('Filters matched but values differ!').attr('fill', colors.fgMuted);
        svgEl.select('.result-line2').text('Key exchange aborted.').attr('fill', colors.red);
        break;
    }

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      await animateStep(i);
      await sleep(2000);
    }

    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) { currentStep++; animateStep(currentStep); } }
  function prev() { pause(); if (currentStep > 0) { currentStep--; animateStep(currentStep); } }

  function applyFinalState() {
    currentStep = maxStep;
    svgEl.select('.step-label').text(stepLabels[maxStep]);

    const af = getFilterLine('std', aliceX + 45, channelY);
    svgEl.select('.alice-filter-line')
      .attr('x1', af.x1).attr('y1', af.y1).attr('x2', af.x2).attr('y2', af.y2)
      .attr('stroke', colors.blue).attr('opacity', 1);
    svgEl.select('.alice-filter-label').text('Standard').attr('opacity', 1);

    const ef = getFilterLine('diag', eveX, channelY);
    svgEl.select('.eve-filter-line')
      .attr('x1', ef.x1).attr('y1', ef.y1).attr('x2', ef.x2).attr('y2', ef.y2)
      .attr('stroke', colors.red).attr('opacity', 1);
    svgEl.select('.eve-filter-label').text('Diagonal').attr('opacity', 1);

    const bf = getFilterLine('std', bobX - 45, channelY);
    svgEl.select('.bob-filter-line')
      .attr('x1', bf.x1).attr('y1', bf.y1).attr('x2', bf.x2).attr('y2', bf.y2)
      .attr('stroke', colors.green).attr('opacity', 1);
    svgEl.select('.bob-filter-label').text('Standard').attr('opacity', 1);

    svgEl.select('.photon').attr('opacity', 0);
    svgEl.select('.result-box').attr('opacity', 1);
    svgEl.select('.result-title').text('⚠ EAVESDROPPER DETECTED').attr('fill', colors.red);
    svgEl.select('.result-line1').text('Filters matched but values differ!').attr('fill', colors.fgMuted);
    svgEl.select('.result-line2').text('Key exchange aborted.').attr('fill', colors.red);
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
      red: '#fb4934',
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px');

    // Channel line
    svgEl.append('line')
      .attr('x1', aliceX + 60).attr('y1', channelY)
      .attr('x2', bobX - 60).attr('y2', channelY)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0.3);

    // Alice
    svgEl.append('text')
      .attr('x', aliceX + 25).attr('y', channelY - 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.blue)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Alice');

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
      .attr('x', aliceX + 45).attr('y', channelY + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.blue)
      .attr('font-size', '11px')
      .attr('opacity', 0);

    // Eve
    svgEl.append('text')
      .attr('x', eveX).attr('y', channelY - 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Eve');

    svgEl.append('rect')
      .attr('x', eveX - 15).attr('y', channelY - 25)
      .attr('width', 30).attr('height', 50)
      .attr('rx', 4)
      .attr('fill', 'none')
      .attr('stroke', colors.red)
      .attr('stroke-width', 2);

    svgEl.append('line')
      .attr('class', 'eve-filter-line')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'eve-filter-label')
      .attr('x', eveX).attr('y', channelY + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red)
      .attr('font-size', '11px')
      .attr('opacity', 0);

    // Bob
    svgEl.append('text')
      .attr('x', bobX - 25).attr('y', channelY - 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Bob');

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
      .attr('x', bobX - 45).attr('y', channelY + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '11px')
      .attr('opacity', 0);

    // Photon
    svgEl.append('circle')
      .attr('class', 'photon')
      .attr('cx', aliceX + 60)
      .attr('cy', channelY)
      .attr('r', 18)
      .attr('fill', colors.yellow)
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'photon-pol')
      .attr('x', aliceX + 60)
      .attr('y', channelY + 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0);

    // Disturb ring
    svgEl.append('circle')
      .attr('class', 'disturb-ring')
      .attr('cx', eveX)
      .attr('cy', channelY)
      .attr('r', 0)
      .attr('fill', 'none')
      .attr('stroke', colors.red)
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    // Result box
    const resultBox = svgEl.append('g')
      .attr('class', 'result-box')
      .attr('transform', `translate(${width / 2}, ${height - 55})`)
      .attr('opacity', 0);

    resultBox.append('rect')
      .attr('x', -140).attr('y', -35)
      .attr('width', 280).attr('height', 70)
      .attr('rx', 8)
      .attr('fill', colors.bg)
      .attr('stroke', colors.red)
      .attr('stroke-width', 2);

    resultBox.append('text')
      .attr('class', 'result-title')
      .attr('x', 0).attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold');

    resultBox.append('text')
      .attr('class', 'result-line1')
      .attr('x', 0).attr('y', 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px');

    resultBox.append('text')
      .attr('class', 'result-line2')
      .attr('x', 0).attr('y', 24)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

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
