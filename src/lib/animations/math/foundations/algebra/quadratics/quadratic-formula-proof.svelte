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

  const maxStep = 7;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    currentStep = step;
    for (let i = 0; i <= maxStep; i++) {
      svgEl.select(`.step${i}`).transition().duration(300).attr('opacity', step >= i ? 1 : 0);
    }
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(2500);
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

    svgEl = d3.select(svg).attr('viewBox', '0 0 500 380');

    const startY = 35;
    const lineH = 45;

    // Step 0: Start
    const step0 = svgEl.append('g').attr('class', 'step0');
    step0.append('text').attr('x', 30).attr('y', startY)
      .attr('fill', colors.muted).attr('font-size', '14px').text('Start:');
    step0.append('text').attr('x', 250).attr('y', startY).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif')
      .text('ax² + bx + c = 0');

    // Step 1: Divide by a
    const step1 = svgEl.append('g').attr('class', 'step1').attr('opacity', 0);
    step1.append('text').attr('x', 30).attr('y', startY + lineH)
      .attr('fill', colors.muted).attr('font-size', '14px').text('÷ a:');
    step1.append('text').attr('x', 250).attr('y', startY + lineH).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif')
      .text('x² + (b/a)x + c/a = 0');

    // Step 2: Move constant
    const step2 = svgEl.append('g').attr('class', 'step2').attr('opacity', 0);
    step2.append('text').attr('x', 30).attr('y', startY + lineH * 2)
      .attr('fill', colors.muted).attr('font-size', '14px').text('Move c/a:');
    step2.append('text').attr('x', 250).attr('y', startY + lineH * 2).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif')
      .text('x² + (b/a)x = −c/a');

    // Step 3: Add (b/2a)²
    const step3 = svgEl.append('g').attr('class', 'step3').attr('opacity', 0);
    step3.append('text').attr('x', 30).attr('y', startY + lineH * 3)
      .attr('fill', colors.muted).attr('font-size', '14px').text('Add (b/2a)²:');
    step3.append('text').attr('x', 250).attr('y', startY + lineH * 3).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif')
      .text('x² + (b/a)x + b²/4a² = −c/a + b²/4a²');

    // Step 4: Perfect square
    const step4 = svgEl.append('g').attr('class', 'step4').attr('opacity', 0);
    step4.append('text').attr('x', 30).attr('y', startY + lineH * 4)
      .attr('fill', colors.muted).attr('font-size', '14px').text('Factor:');
    step4.append('text').attr('x', 250).attr('y', startY + lineH * 4).attr('text-anchor', 'middle')
      .attr('fill', colors.accent).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif')
      .text('(x + b/2a)² = (b² − 4ac) / 4a²');

    // Step 5: Square root
    const step5 = svgEl.append('g').attr('class', 'step5').attr('opacity', 0);
    step5.append('text').attr('x', 30).attr('y', startY + lineH * 5)
      .attr('fill', colors.muted).attr('font-size', '14px').text('√ both sides:');
    step5.append('text').attr('x', 250).attr('y', startY + lineH * 5).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif')
      .text('x + b/2a = ± √(b² − 4ac) / 2a');

    // Step 6: Solve for x
    const step6 = svgEl.append('g').attr('class', 'step6').attr('opacity', 0);
    step6.append('text').attr('x', 30).attr('y', startY + lineH * 6)
      .attr('fill', colors.muted).attr('font-size', '14px').text('Solve:');
    step6.append('text').attr('x', 250).attr('y', startY + lineH * 6).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif')
      .text('x = (−b ± √(b² − 4ac)) / 2a');

    // Step 7: Final boxed result
    const step7 = svgEl.append('g').attr('class', 'step7').attr('opacity', 0);
    step7.append('rect')
      .attr('x', 100).attr('y', startY + lineH * 7 - 25)
      .attr('width', 300).attr('height', 40)
      .attr('fill', 'none').attr('stroke', colors.yellow).attr('stroke-width', 2).attr('rx', 6);
    step7.append('text').attr('x', 250).attr('y', startY + lineH * 7).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '22px').attr('font-family', 'KaTeX_Main, serif')
      .text('x = (−b ± √(b² − 4ac)) / 2a');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 500px; }
</style>
