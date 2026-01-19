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

  const maxStep = 3;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    currentStep = step;
    svgEl.select('.original').transition().duration(300).attr('opacity', 1);
    svgEl.select('.pattern').transition().duration(300).attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.arrow').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.factored').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.check').transition().duration(300).attr('opacity', step >= 3 ? 1 : 0);
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1500);
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
    };

    svgEl = d3.select(svg).attr('viewBox', '0 0 500 200');

    svgEl.append('text')
      .attr('class', 'original')
      .attr('x', 250).attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '24px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('x² + 6x + 9');

    const patternGroup = svgEl.append('g').attr('class', 'pattern').attr('opacity', 0);
    patternGroup.append('text')
      .attr('x', 250).attr('y', 75)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.accent)
      .attr('font-size', '18px')
      .text('x² + 2(3)x + 3²');
    patternGroup.append('text')
      .attr('x', 250).attr('y', 100)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .attr('opacity', 0.7)
      .text('a² + 2ab + b²  where a = x, b = 3');

    svgEl.append('text')
      .attr('class', 'arrow')
      .attr('x', 250).attr('y', 135)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '20px')
      .text('↓')
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'factored')
      .attr('x', 250).attr('y', 170)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '24px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('(x + 3)²')
      .attr('opacity', 0);

    svgEl.append('text')
      .attr('class', 'check')
      .attr('x', 340).attr('y', 170)
      .attr('fill', colors.yellow)
      .attr('font-size', '24px')
      .text('✓')
      .attr('opacity', 0);

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 500px; }
</style>
