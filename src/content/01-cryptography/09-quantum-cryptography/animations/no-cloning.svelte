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

  const width = 500;
  const height = 250;
  const maxStep = 4;
  const centerX = width / 2;
  const centerY = 120;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'Eve intercepts a photon with unknown polarization',
    'She tries to copy it...',
    'Quantum mechanics forbids perfect copying!',
    'Her only option: measure (and disturb) the original',
    'Result: Eve cannot avoid detection'
  ];

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    switch(step) {
      case 0:
        // Reset - show photon
        svgEl.select('.photon')
          .attr('cx', centerX).attr('cy', centerY)
          .attr('opacity', 1).attr('fill', colors.yellow);
        svgEl.select('.photon-pol').attr('opacity', 1).text('?');
        svgEl.select('.copy-photon').attr('opacity', 0);
        svgEl.select('.copy-pol').attr('opacity', 0);
        svgEl.select('.block-x').attr('opacity', 0);
        svgEl.select('.arrow').attr('opacity', 0);
        svgEl.select('.result-text').attr('opacity', 0);
        svgEl.select('.eve-label').attr('opacity', 1);
        break;

      case 1:
        // Try to copy - show ghost copy appearing
        svgEl.select('.arrow').attr('opacity', 0.5);
        svgEl.select('.copy-photon')
          .attr('opacity', 0)
          .transition().duration(600)
          .attr('opacity', 0.5);
        svgEl.select('.copy-pol')
          .attr('opacity', 0)
          .transition().duration(600)
          .attr('opacity', 0.5);
        break;

      case 2:
        // Copy fails!
        svgEl.select('.block-x')
          .attr('opacity', 0)
          .transition().duration(300)
          .attr('opacity', 1);

        await sleep(400);
        if (!isPlaying && currentStep !== 2) return;

        svgEl.select('.copy-photon')
          .transition().duration(400)
          .attr('opacity', 0);
        svgEl.select('.copy-pol')
          .transition().duration(400)
          .attr('opacity', 0);
        svgEl.select('.arrow')
          .transition().duration(400)
          .attr('opacity', 0);
        break;

      case 3:
        // Must measure - photon disturbed
        svgEl.select('.block-x').attr('opacity', 0);
        svgEl.select('.photon')
          .transition().duration(500)
          .attr('fill', colors.red);
        svgEl.select('.photon-pol').text('!');
        svgEl.select('.result-text')
          .text('Measured → Disturbed')
          .attr('fill', colors.orange)
          .attr('opacity', 1);
        break;

      case 4:
        // Final
        svgEl.select('.result-text')
          .text('No way to copy → No undetected eavesdropping')
          .attr('fill', colors.green);
        break;
    }

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      await animateStep(i);
      await sleep(2200);
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
    svgEl.select('.photon').attr('opacity', 1).attr('fill', colors.red);
    svgEl.select('.photon-pol').attr('opacity', 1).text('!');
    svgEl.select('.copy-photon').attr('opacity', 0);
    svgEl.select('.block-x').attr('opacity', 0);
    svgEl.select('.arrow').attr('opacity', 0);
    svgEl.select('.result-text')
      .text('No way to copy → No undetected eavesdropping')
      .attr('fill', colors.green)
      .attr('opacity', 1);
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
      orange: '#fe8019',
      green: '#b8bb26',
      red: '#fb4934',
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', centerX).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px');

    // Eve label
    svgEl.append('text')
      .attr('class', 'eve-label')
      .attr('x', centerX).attr('y', centerY - 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Eve');

    // Original photon
    svgEl.append('circle')
      .attr('class', 'photon')
      .attr('cx', centerX).attr('cy', centerY)
      .attr('r', 28)
      .attr('fill', colors.yellow)
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'photon-pol')
      .attr('x', centerX).attr('y', centerY + 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '28px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0);

    // Arrow to copy
    svgEl.append('path')
      .attr('class', 'arrow')
      .attr('d', `M${centerX + 45},${centerY} L${centerX + 95},${centerY}`)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)')
      .attr('opacity', 0);

    // Arrowhead marker
    svgEl.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 7)
      .attr('refX', 9)
      .attr('refY', 3.5)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', colors.fgMuted);

    // Copy photon (ghost)
    svgEl.append('circle')
      .attr('class', 'copy-photon')
      .attr('cx', centerX + 120).attr('cy', centerY)
      .attr('r', 28)
      .attr('fill', colors.yellow)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'copy-pol')
      .attr('x', centerX + 120).attr('y', centerY + 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '28px')
      .attr('font-weight', 'bold')
      .text('?')
      .attr('opacity', 0);

    // Block X
    svgEl.append('text')
      .attr('class', 'block-x')
      .attr('x', centerX + 120).attr('y', centerY + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red)
      .attr('font-size', '50px')
      .attr('font-weight', 'bold')
      .text('✗')
      .attr('opacity', 0);

    // Result text
    svgEl.append('text')
      .attr('class', 'result-text')
      .attr('x', centerX).attr('y', height - 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0);

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
