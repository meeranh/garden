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
      await sleep(1800);
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

    svgEl = d3.select(svg).attr('viewBox', '0 0 420 200');

    // Setup: Original expression (x² - 4) / (x + 2)
    const setup = svgEl.append('g').attr('class', 'setup');
    setup.append('text')
      .attr('x', 210).attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '22px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('x² − 4');
    setup.append('line')
      .attr('x1', 150).attr('y1', 50)
      .attr('x2', 270).attr('y2', 50)
      .attr('stroke', colors.fg).attr('stroke-width', 2);
    setup.append('text')
      .attr('x', 210).attr('y', 75)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '22px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('x + 2');

    // Step 1: Factor numerator
    const step1 = svgEl.append('g').attr('class', 'step1').attr('opacity', 0);
    step1.append('text')
      .attr('x', 320).attr('y', 40)
      .attr('text-anchor', 'start')
      .attr('fill', colors.accent)
      .attr('font-size', '14px')
      .text('← difference of squares');

    // Step 2: Show factored form
    const step2 = svgEl.append('g').attr('class', 'step2').attr('opacity', 0);
    step2.append('text')
      .attr('x', 210).attr('y', 115)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '22px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('(x + 2)(x − 2)');
    step2.append('line')
      .attr('x1', 120).attr('y1', 125)
      .attr('x2', 300).attr('y2', 125)
      .attr('stroke', colors.fg).attr('stroke-width', 2);
    step2.append('text')
      .attr('x', 210).attr('y', 150)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '22px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('(x + 2)');

    // Step 3: Strike through common factor
    const step3 = svgEl.append('g').attr('class', 'step3').attr('opacity', 0);
    step3.append('line')
      .attr('x1', 138).attr('y1', 122)
      .attr('x2', 200).attr('y2', 100)
      .attr('stroke', colors.accent).attr('stroke-width', 2);
    step3.append('line')
      .attr('x1', 168).attr('y1', 158)
      .attr('x2', 252).attr('y2', 138)
      .attr('stroke', colors.accent).attr('stroke-width', 2);
    step3.append('text')
      .attr('x', 320).attr('y', 130)
      .attr('text-anchor', 'start')
      .attr('fill', colors.accent)
      .attr('font-size', '14px')
      .text('← cancel');

    // Step 4: Result
    const step4 = svgEl.append('g').attr('class', 'step4').attr('opacity', 0);
    step4.append('text')
      .attr('x', 210).attr('y', 185)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '24px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('= x − 2');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 420px; }
</style>
