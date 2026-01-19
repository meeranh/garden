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

  const maxStep = 8;

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
    svgEl.select('.step6').transition().duration(300).attr('opacity', step >= 6 ? 1 : 0);
    svgEl.select('.step7').transition().duration(300).attr('opacity', step >= 7 ? 1 : 0);
    svgEl.select('.result').transition().duration(300).attr('opacity', step >= 8 ? 1 : 0);
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1400);
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

    const colW = 60;
    const baseX = 100;
    const row1 = 50;  // coefficients
    const row2 = 85;  // multiply results
    const row3 = 125; // final results

    // Setup: r value and coefficients
    const setup = svgEl.append('g').attr('class', 'setup');

    // r = 1 on the left
    setup.append('text')
      .attr('x', 45).attr('y', row1)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.accent)
      .attr('font-size', '20px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('1');

    // Vertical line
    setup.append('line')
      .attr('x1', 75).attr('y1', row1 - 25)
      .attr('x2', 75).attr('y2', row3 + 15)
      .attr('stroke', colors.fg).attr('stroke-width', 2);

    // Horizontal line under row 2
    setup.append('line')
      .attr('x1', 75).attr('y1', row2 + 18)
      .attr('x2', baseX + colW * 4 - 20).attr('y2', row2 + 18)
      .attr('stroke', colors.fg).attr('stroke-width', 2);

    // Coefficients: 1, -6, 11, -6
    setup.append('text').attr('x', baseX).attr('y', row1).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif').text('1');
    setup.append('text').attr('x', baseX + colW).attr('y', row1).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif').text('−6');
    setup.append('text').attr('x', baseX + colW * 2).attr('y', row1).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif').text('11');
    setup.append('text').attr('x', baseX + colW * 3).attr('y', row1).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif').text('−6');

    // Step 1: Bring down the 1
    const step1 = svgEl.append('g').attr('class', 'step1').attr('opacity', 0);
    step1.append('text').attr('x', baseX).attr('y', row3).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif').text('1');
    step1.append('path')
      .attr('d', `M ${baseX} ${row1 + 10} L ${baseX} ${row3 - 25}`)
      .attr('stroke', colors.muted).attr('stroke-width', 1).attr('stroke-dasharray', '4,3')
      .attr('marker-end', 'none');

    // Step 2: Multiply 1 × 1 = 1, show in row 2
    const step2 = svgEl.append('g').attr('class', 'step2').attr('opacity', 0);
    step2.append('text').attr('x', baseX + colW).attr('y', row2).attr('text-anchor', 'middle')
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('1');

    // Step 3: Add -6 + 1 = -5
    const step3 = svgEl.append('g').attr('class', 'step3').attr('opacity', 0);
    step3.append('text').attr('x', baseX + colW).attr('y', row3).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif').text('−5');

    // Step 4: Multiply -5 × 1 = -5, show in row 2
    const step4 = svgEl.append('g').attr('class', 'step4').attr('opacity', 0);
    step4.append('text').attr('x', baseX + colW * 2).attr('y', row2).attr('text-anchor', 'middle')
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('−5');

    // Step 5: Add 11 + (-5) = 6
    const step5 = svgEl.append('g').attr('class', 'step5').attr('opacity', 0);
    step5.append('text').attr('x', baseX + colW * 2).attr('y', row3).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif').text('6');

    // Step 6: Multiply 6 × 1 = 6, show in row 2
    const step6 = svgEl.append('g').attr('class', 'step6').attr('opacity', 0);
    step6.append('text').attr('x', baseX + colW * 3).attr('y', row2).attr('text-anchor', 'middle')
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('6');

    // Step 7: Add -6 + 6 = 0 (remainder)
    const step7 = svgEl.append('g').attr('class', 'step7').attr('opacity', 0);
    step7.append('text').attr('x', baseX + colW * 3).attr('y', row3).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '20px').attr('font-family', 'KaTeX_Main, serif').text('0');

    // Step 8: Show result interpretation
    const result = svgEl.append('g').attr('class', 'result').attr('opacity', 0);
    result.append('text').attr('x', 210).attr('y', 175).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '16px').attr('font-family', 'KaTeX_Main, serif')
      .text('x² − 5x + 6    remainder 0');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 420px; }
</style>
