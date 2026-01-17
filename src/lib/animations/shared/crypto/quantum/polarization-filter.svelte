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
  const height = 280;
  const maxStep = 4;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'A vertically polarized photon (↑) approaches a filter...',
    'Vertical filter: photon passes through unchanged ✓',
    'Reset: same photon, different filter...',
    'Diagonal filter (45°): 50% chance! If it passes, polarization changes to ↗',
    'The photon\'s original polarization is gone forever.'
  ];

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    const photonStart = 80;
    const filterX = 300;
    const photonEnd = 520;

    switch(step) {
      case 0:
        // Reset
        svgEl.select('.photon')
          .attr('cx', photonStart)
          .attr('opacity', 1);
        svgEl.select('.photon-label')
          .attr('x', photonStart)
          .attr('opacity', 1)
          .text('↑');
        svgEl.select('.filter-line')
          .attr('opacity', 0);
        svgEl.select('.result-text')
          .attr('opacity', 0);
        svgEl.select('.filter-label')
          .attr('opacity', 0);
        break;

      case 1:
        // Vertical filter - photon passes
        svgEl.select('.filter-line')
          .attr('x1', filterX).attr('y1', 100)
          .attr('x2', filterX).attr('y2', 180)
          .attr('stroke', colors.blue)
          .attr('opacity', 1);
        svgEl.select('.filter-label')
          .text('Vertical filter')
          .attr('fill', colors.blue)
          .attr('opacity', 1);

        // Move photon to filter
        svgEl.select('.photon')
          .transition().duration(800)
          .attr('cx', filterX - 30);
        svgEl.select('.photon-label')
          .transition().duration(800)
          .attr('x', filterX - 30);

        await sleep(1000);
        if (!isPlaying && currentStep !== 1) return;

        // Pass through
        svgEl.select('.photon')
          .transition().duration(800)
          .attr('cx', photonEnd);
        svgEl.select('.photon-label')
          .transition().duration(800)
          .attr('x', photonEnd);

        await sleep(900);
        if (!isPlaying && currentStep !== 1) return;

        svgEl.select('.result-text')
          .attr('opacity', 1)
          .attr('fill', colors.green)
          .text('✓ Passes through! Still ↑');
        break;

      case 2:
        // Reset for diagonal filter
        svgEl.select('.photon')
          .attr('cx', photonStart);
        svgEl.select('.photon-label')
          .attr('x', photonStart)
          .text('↑');
        svgEl.select('.result-text')
          .attr('opacity', 0);
        break;

      case 3:
        // Diagonal filter
        svgEl.select('.filter-line')
          .attr('x1', filterX - 30).attr('y1', 100)
          .attr('x2', filterX + 30).attr('y2', 180)
          .attr('stroke', colors.orange)
          .attr('opacity', 1);
        svgEl.select('.filter-label')
          .text('Diagonal filter (45°)')
          .attr('fill', colors.orange)
          .attr('opacity', 1);

        // Move photon to filter
        svgEl.select('.photon')
          .transition().duration(800)
          .attr('cx', filterX - 30);
        svgEl.select('.photon-label')
          .transition().duration(800)
          .attr('x', filterX - 30);

        await sleep(1000);
        if (!isPlaying && currentStep !== 3) return;

        // 50% chance - show it passing but changed
        svgEl.select('.result-text')
          .attr('opacity', 1)
          .attr('fill', colors.orange)
          .text('50% chance...');

        await sleep(800);
        if (!isPlaying && currentStep !== 3) return;

        // It passes but changes
        svgEl.select('.photon')
          .transition().duration(600)
          .attr('cx', photonEnd);
        svgEl.select('.photon-label')
          .text('↗')
          .transition().duration(600)
          .attr('x', photonEnd);

        await sleep(700);
        if (!isPlaying && currentStep !== 3) return;

        svgEl.select('.result-text')
          .text('Passed! But now it\'s ↗ (diagonal)');
        break;

      case 4:
        svgEl.select('.result-text')
          .attr('fill', colors.red)
          .text('Original ↑ polarization destroyed!');
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
    svgEl.select('.photon').attr('cx', 520).attr('opacity', 1);
    svgEl.select('.photon-label').attr('x', 520).text('↗').attr('opacity', 1);
    svgEl.select('.filter-line')
      .attr('x1', 270).attr('y1', 100)
      .attr('x2', 330).attr('y2', 180)
      .attr('stroke', colors.orange)
      .attr('opacity', 1);
    svgEl.select('.filter-label').text('Diagonal filter (45°)').attr('fill', colors.orange).attr('opacity', 1);
    svgEl.select('.result-text').attr('opacity', 1).attr('fill', colors.red).text('Original ↑ polarization destroyed!');
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
      .attr('font-size', '14px')
      .text(stepLabels[0]);

    // Light path
    svgEl.append('line')
      .attr('x1', 50).attr('y1', 140)
      .attr('x2', 550).attr('y2', 140)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.3);

    // Filter frame
    svgEl.append('rect')
      .attr('x', 285).attr('y', 90)
      .attr('width', 30).attr('height', 100)
      .attr('rx', 4)
      .attr('fill', 'none')
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2);

    // Filter orientation line
    svgEl.append('line')
      .attr('class', 'filter-line')
      .attr('stroke-width', 4)
      .attr('opacity', 0);

    // Filter label
    svgEl.append('text')
      .attr('class', 'filter-label')
      .attr('x', 300).attr('y', 210)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0);

    // Photon
    svgEl.append('circle')
      .attr('class', 'photon')
      .attr('cx', 80)
      .attr('cy', 140)
      .attr('r', 20)
      .attr('fill', colors.yellow);

    // Photon polarization label
    svgEl.append('text')
      .attr('class', 'photon-label')
      .attr('x', 80)
      .attr('y', 147)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('↑');

    // Result text
    svgEl.append('text')
      .attr('class', 'result-text')
      .attr('x', width / 2).attr('y', 250)
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
