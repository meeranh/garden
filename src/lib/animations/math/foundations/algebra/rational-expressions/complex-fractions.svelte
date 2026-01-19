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

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      accent: s.getPropertyValue('--color-accent').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      muted: s.getPropertyValue('--color-fg-muted').trim(),
    };

    svgEl = d3.select(svg).attr('viewBox', '0 0 460 200');

    // Setup: Complex fraction (1/(x+1)) / (2/(x-1))
    const setup = svgEl.append('g').attr('class', 'setup');

    // Numerator fraction: 1/(x+1)
    setup.append('text').attr('x', 80).attr('y', 40).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('1');
    setup.append('line').attr('x1', 50).attr('y1', 50).attr('x2', 110).attr('y2', 50)
      .attr('stroke', colors.fg).attr('stroke-width', 1.5);
    setup.append('text').attr('x', 80).attr('y', 70).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x + 1');

    // Main fraction line
    setup.append('line').attr('x1', 30).attr('y1', 95).attr('x2', 130).attr('y2', 95)
      .attr('stroke', colors.fg).attr('stroke-width', 3);

    // Denominator fraction: 2/(x-1)
    setup.append('text').attr('x', 80).attr('y', 125).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('2');
    setup.append('line').attr('x1', 50).attr('y1', 135).attr('x2', 110).attr('y2', 135)
      .attr('stroke', colors.fg).attr('stroke-width', 1.5);
    setup.append('text').attr('x', 80).attr('y', 155).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x − 1');

    // Step 1: Rewrite as division
    const step1 = svgEl.append('g').attr('class', 'step1').attr('opacity', 0);
    step1.append('text').attr('x', 155).attr('y', 100).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').text('=');

    step1.append('text').attr('x', 200).attr('y', 85).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('1');
    step1.append('line').attr('x1', 170).attr('y1', 95).attr('x2', 230).attr('y2', 95)
      .attr('stroke', colors.fg).attr('stroke-width', 1.5);
    step1.append('text').attr('x', 200).attr('y', 115).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x + 1');

    step1.append('text').attr('x', 255).attr('y', 100).attr('text-anchor', 'middle')
      .attr('fill', colors.accent).attr('font-size', '20px').text('÷');

    step1.append('text').attr('x', 310).attr('y', 85).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('2');
    step1.append('line').attr('x1', 280).attr('y1', 95).attr('x2', 340).attr('y2', 95)
      .attr('stroke', colors.fg).attr('stroke-width', 1.5);
    step1.append('text').attr('x', 310).attr('y', 115).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x − 1');

    // Step 2: Flip and multiply label
    const step2 = svgEl.append('g').attr('class', 'step2').attr('opacity', 0);
    step2.append('text').attr('x', 400).attr('y', 100).attr('text-anchor', 'middle')
      .attr('fill', colors.accent).attr('font-size', '14px').text('flip & multiply');

    // Step 3: Show flipped
    const step3 = svgEl.append('g').attr('class', 'step3').attr('opacity', 0);
    step3.append('text').attr('x', 155).attr('y', 170).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').text('=');

    step3.append('text').attr('x', 200).attr('y', 155).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('1');
    step3.append('line').attr('x1', 170).attr('y1', 165).attr('x2', 230).attr('y2', 165)
      .attr('stroke', colors.fg).attr('stroke-width', 1.5);
    step3.append('text').attr('x', 200).attr('y', 185).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x + 1');

    step3.append('text').attr('x', 255).attr('y', 170).attr('text-anchor', 'middle')
      .attr('fill', colors.accent).attr('font-size', '20px').text('×');

    step3.append('text').attr('x', 310).attr('y', 155).attr('text-anchor', 'middle')
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x − 1');
    step3.append('line').attr('x1', 280).attr('y1', 165).attr('x2', 340).attr('y2', 165)
      .attr('stroke', colors.accent).attr('stroke-width', 1.5);
    step3.append('text').attr('x', 310).attr('y', 185).attr('text-anchor', 'middle')
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('2');

    // Step 4: Result
    const step4 = svgEl.append('g').attr('class', 'step4').attr('opacity', 0);
    step4.append('text').attr('x', 365).attr('y', 170).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '20px').text('=');
    step4.append('text').attr('x', 420).attr('y', 155).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x − 1');
    step4.append('line').attr('x1', 382).attr('y1', 165).attr('x2', 458).attr('y2', 165)
      .attr('stroke', colors.yellow).attr('stroke-width', 1.5);
    step4.append('text').attr('x', 420).attr('y', 185).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('2(x + 1)');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 460px; }
</style>
