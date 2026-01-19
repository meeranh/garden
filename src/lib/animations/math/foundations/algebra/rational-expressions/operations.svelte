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

  const maxStep = 4;

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

  // Helper to draw a fraction
  function drawFraction(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number, y: number,
    num: string, denom: string,
    color: string, lineWidth: number = 70
  ) {
    parent.append('text').attr('x', x).attr('y', y - 12).attr('text-anchor', 'middle')
      .attr('fill', color).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text(num);
    parent.append('line').attr('x1', x - lineWidth/2).attr('y1', y).attr('x2', x + lineWidth/2).attr('y2', y)
      .attr('stroke', color).attr('stroke-width', 2);
    parent.append('text').attr('x', x).attr('y', y + 22).attr('text-anchor', 'middle')
      .attr('fill', color).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text(denom);
  }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      accent: s.getPropertyValue('--color-accent').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      muted: s.getPropertyValue('--color-fg-muted').trim(),
    };

    svgEl = d3.select(svg).attr('viewBox', '0 0 420 240');

    const row1 = 45;
    const row2 = 115;
    const row3 = 190;

    // Setup: 1/(x+1) + 2/(x-1)
    const setup = svgEl.append('g').attr('class', 'setup');
    drawFraction(setup, 100, row1, '1', 'x + 1', colors.fg, 70);
    setup.append('text').attr('x', 165).attr('y', row1).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '22px').text('+');
    drawFraction(setup, 230, row1, '2', 'x − 1', colors.fg, 70);

    // Step 1: LCD label
    const step1 = svgEl.append('g').attr('class', 'step1').attr('opacity', 0);
    step1.append('text').attr('x', 300).attr('y', row1).attr('text-anchor', 'start')
      .attr('fill', colors.accent).attr('font-size', '14px').text('LCD: (x+1)(x−1)');

    // Step 2: Rewrite with common denominator
    const step2 = svgEl.append('g').attr('class', 'step2').attr('opacity', 0);
    drawFraction(step2, 100, row2, 'x − 1', '(x+1)(x−1)', colors.fg, 100);
    step2.append('text').attr('x', 180).attr('y', row2).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '22px').text('+');
    drawFraction(step2, 270, row2, '2(x + 1)', '(x+1)(x−1)', colors.fg, 100);

    // Step 3: Combine numerators
    const step3 = svgEl.append('g').attr('class', 'step3').attr('opacity', 0);
    drawFraction(step3, 165, row3, 'x − 1 + 2x + 2', '(x + 1)(x − 1)', colors.fg, 160);

    // Step 4: Final answer
    const step4 = svgEl.append('g').attr('class', 'step4').attr('opacity', 0);
    step4.append('text').attr('x', 280).attr('y', row3).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '22px').text('=');
    drawFraction(step4, 360, row3, '3x + 1', '(x+1)(x−1)', colors.yellow, 100);

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 420px; }
</style>
