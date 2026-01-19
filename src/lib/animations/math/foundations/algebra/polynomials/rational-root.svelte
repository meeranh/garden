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

  const maxStep = 5;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    currentStep = step;
    svgEl.select('.setup').transition().duration(300).attr('opacity', 1);
    svgEl.select('.step1').transition().duration(300).attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.step2').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.step3').transition().duration(300).attr('opacity', step >= 3 ? 1 : 0);
    svgEl.select('.step4').transition().duration(300).attr('opacity', step >= 4 ? 1 : 0);
    svgEl.select('.step5').transition().duration(300).attr('opacity', step >= 5 ? 1 : 0);
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(2000);
      if (!isPlaying) return;
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() { pause(); currentStep = 0; applyStep(0); isPlaying = true; runAnimation(); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      accent: s.getPropertyValue('--color-accent').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      muted: s.getPropertyValue('--color-fg-muted').trim(),
    };

    svgEl = d3.select(svg).attr('viewBox', '0 0 480 280');

    // Setup: Show the polynomial
    const setup = svgEl.append('g').attr('class', 'setup');
    setup.append('text')
      .attr('x', 240).attr('y', 35)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '20px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('2x³ − 3x² − 8x + 12');

    // Step 1: Highlight leading coefficient and constant
    const step1 = svgEl.append('g').attr('class', 'step1').attr('opacity', 0);

    // Leading coefficient box around "2"
    step1.append('rect')
      .attr('x', 150).attr('y', 14)
      .attr('width', 15).attr('height', 28)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2)
      .attr('rx', 4);
    step1.append('text')
      .attr('x', 175).attr('y', 70)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.accent)
      .attr('font-size', '14px')
      .text('leading: 2');

    // Constant box around "12"
    step1.append('rect')
      .attr('x', 305).attr('y', 14)
      .attr('width', 26).attr('height', 28)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2)
      .attr('rx', 4);
    step1.append('text')
      .attr('x', 308).attr('y', 70)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .text('constant: 12');

    // Step 2: List factors
    const step2 = svgEl.append('g').attr('class', 'step2').attr('opacity', 0);
    step2.append('text')
      .attr('x', 240).attr('y', 110)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .text('Factors of 12: 1, 2, 3, 4, 6, 12');
    step2.append('text')
      .attr('x', 240).attr('y', 135)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .text('Factors of 2: 1, 2');

    // Step 3: Form possible roots
    const step3 = svgEl.append('g').attr('class', 'step3').attr('opacity', 0);
    step3.append('text')
      .attr('x', 240).attr('y', 170)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.accent)
      .attr('font-size', '14px')
      .text('Possible roots = ± (factors of 12) / (factors of 2)');
    step3.append('text')
      .attr('x', 240).attr('y', 195)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '15px')
      .text('±1, ±2, ±3, ±4, ±6, ±12, ±½, ±³⁄₂');

    // Step 4: Test x = 2
    const step4 = svgEl.append('g').attr('class', 'step4').attr('opacity', 0);
    step4.append('text')
      .attr('x', 240).attr('y', 230)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .text('Try x = 2:  2(8) − 3(4) − 8(2) + 12');

    // Step 5: Result
    const step5 = svgEl.append('g').attr('class', 'step5').attr('opacity', 0);
    step5.append('text')
      .attr('x', 240).attr('y', 260)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '18px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('= 16 − 12 − 16 + 12 = 0    →  x = 2 is a root');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 480px; }
</style>
