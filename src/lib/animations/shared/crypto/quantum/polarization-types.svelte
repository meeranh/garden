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
  let animationFrames: number[] = [];
  let colors: Record<string, string>;

  const width = 500;
  const height = 380;
  const maxStep = 3;
  const centerX = width / 2;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    animationFrames.forEach(cancelAnimationFrame);
    animationFrames = [];
  }

  const stepLabels = [
    'Polarization = the direction light oscillates as it travels',
    'Vertical polarization: oscillates up and down ↕',
    'Horizontal polarization: oscillates left and right ↔',
    'Diagonal polarization: oscillates at 45° ⤢'
  ];

  let phase = 0;

  function animateOscillation() {
    phase += 0.1;
    const offset = Math.sin(phase) * 25;

    // Vertical oscillation
    if (currentStep >= 1) {
      svgEl.select('.v-indicator')
        .attr('y1', 90 - offset)
        .attr('y2', 90 + offset);
    }
    // Horizontal oscillation
    if (currentStep >= 2) {
      svgEl.select('.h-indicator')
        .attr('x1', centerX - offset)
        .attr('x2', centerX + offset);
    }
    // Diagonal oscillation
    if (currentStep >= 3) {
      const diagOffset = offset * 0.7;
      svgEl.select('.d-indicator')
        .attr('x1', centerX - diagOffset)
        .attr('y1', 290 + diagOffset)
        .attr('x2', centerX + diagOffset)
        .attr('y2', 290 - diagOffset);
    }

    const frame = requestAnimationFrame(animateOscillation);
    animationFrames.push(frame);
  }

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    switch(step) {
      case 0:
        svgEl.select('.pol-vertical').attr('opacity', 0);
        svgEl.select('.pol-horizontal').attr('opacity', 0);
        svgEl.select('.pol-diagonal').attr('opacity', 0);
        break;
      case 1:
        svgEl.select('.pol-vertical').transition().duration(400).attr('opacity', 1);
        break;
      case 2:
        svgEl.select('.pol-horizontal').transition().duration(400).attr('opacity', 1);
        break;
      case 3:
        svgEl.select('.pol-diagonal').transition().duration(400).attr('opacity', 1);
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
    svgEl.select('.pol-vertical').attr('opacity', 1);
    svgEl.select('.pol-horizontal').attr('opacity', 1);
    svgEl.select('.pol-diagonal').attr('opacity', 1);
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
      .attr('x', centerX).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .text(stepLabels[0]);

    // Three polarization examples stacked vertically
    const rowY = [90, 190, 290];
    const polColors = [colors.blue, colors.orange, colors.green];
    const labels = ['Vertical ↕', 'Horizontal ↔', 'Diagonal ⤢'];
    const classes = ['pol-vertical', 'pol-horizontal', 'pol-diagonal'];

    // Draw each polarization type
    for (let i = 0; i < 3; i++) {
      const g = svgEl.append('g')
        .attr('class', classes[i])
        .attr('opacity', 0);

      // Circle representing light beam cross-section
      g.append('circle')
        .attr('cx', centerX)
        .attr('cy', rowY[i])
        .attr('r', 35)
        .attr('fill', 'none')
        .attr('stroke', colors.fgMuted)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');

      // Label
      g.append('text')
        .attr('x', centerX - 120)
        .attr('y', rowY[i] + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', polColors[i])
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(labels[i]);

      // Description
      const descriptions = [
        'oscillates ↑↓',
        'oscillates ←→',
        'oscillates ↗↙'
      ];
      g.append('text')
        .attr('x', centerX + 120)
        .attr('y', rowY[i] + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.fgMuted)
        .attr('font-size', '12px')
        .text(descriptions[i]);
    }

    // Oscillation indicators (animated lines)
    // Vertical
    svgEl.select('.pol-vertical').append('line')
      .attr('class', 'v-indicator')
      .attr('x1', centerX).attr('y1', 65)
      .attr('x2', centerX).attr('y2', 115)
      .attr('stroke', colors.blue)
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round');

    // Horizontal
    svgEl.select('.pol-horizontal').append('line')
      .attr('class', 'h-indicator')
      .attr('x1', centerX - 25).attr('y1', 190)
      .attr('x2', centerX + 25).attr('y2', 190)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round');

    // Diagonal
    svgEl.select('.pol-diagonal').append('line')
      .attr('class', 'd-indicator')
      .attr('x1', centerX - 18).attr('y1', 308)
      .attr('x2', centerX + 18).attr('y2', 272)
      .attr('stroke', colors.green)
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round');

    // Start oscillation animation
    animateOscillation();

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
