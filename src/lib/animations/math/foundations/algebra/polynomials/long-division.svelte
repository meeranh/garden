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
    svgEl.select('.setup').transition().duration(300).attr('opacity', 1);
    svgEl.select('.step1').transition().duration(300).attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.step2').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.step3').transition().duration(300).attr('opacity', step >= 3 ? 1 : 0);
    svgEl.select('.step4').transition().duration(300).attr('opacity', step >= 4 ? 1 : 0);
    svgEl.select('.step5').transition().duration(300).attr('opacity', step >= 5 ? 1 : 0);
    svgEl.select('.step6').transition().duration(300).attr('opacity', step >= 6 ? 1 : 0);
    svgEl.select('.result').transition().duration(300).attr('opacity', step >= 7 ? 1 : 0);
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

    svgEl = d3.select(svg).attr('viewBox', '0 0 480 310');

    // Column positions for alignment (right-aligned columns)
    const col = { x3: 150, x2: 205, x1: 270, x0: 330 };
    const baseY = 55;
    const lineH = 32;

    // Setup: divisor and dividend
    const setup = svgEl.append('g').attr('class', 'setup');

    // Divisor: x - 1
    setup.append('text')
      .attr('x', 65).attr('y', baseY + lineH)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '18px')
      .attr('font-family', 'KaTeX_Main, serif')
      .text('x − 1');

    // Division bracket
    setup.append('path')
      .attr('d', `M 105 ${baseY + lineH + 10} L 105 ${baseY} L 380 ${baseY}`)
      .attr('stroke', colors.fg)
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    // Dividend: x³ - 6x² + 11x - 6 (aligned by columns)
    setup.append('text').attr('x', col.x3).attr('y', baseY + lineH).attr('text-anchor', 'end')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x³');
    setup.append('text').attr('x', col.x2).attr('y', baseY + lineH).attr('text-anchor', 'end')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('− 6x²');
    setup.append('text').attr('x', col.x1).attr('y', baseY + lineH).attr('text-anchor', 'end')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('+ 11x');
    setup.append('text').attr('x', col.x0).attr('y', baseY + lineH).attr('text-anchor', 'end')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('− 6');

    // Step 1: Write x² on top
    const step1 = svgEl.append('g').attr('class', 'step1').attr('opacity', 0);
    step1.append('text').attr('x', col.x3).attr('y', baseY - 15).attr('text-anchor', 'end')
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x²');

    // Step 2: x³ - x² and subtraction line
    const step2 = svgEl.append('g').attr('class', 'step2').attr('opacity', 0);
    step2.append('text').attr('x', col.x3).attr('y', baseY + lineH * 2).attr('text-anchor', 'end')
      .attr('fill', colors.muted).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('x³');
    step2.append('text').attr('x', col.x2).attr('y', baseY + lineH * 2).attr('text-anchor', 'end')
      .attr('fill', colors.muted).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('− x²');
    step2.append('line')
      .attr('x1', 115).attr('y1', baseY + lineH * 2 + 8)
      .attr('x2', col.x2 + 5).attr('y2', baseY + lineH * 2 + 8)
      .attr('stroke', colors.fg).attr('stroke-width', 1);

    // Step 3: Result -5x² + 11x, write -5x on top
    const step3 = svgEl.append('g').attr('class', 'step3').attr('opacity', 0);
    step3.append('text').attr('x', col.x2).attr('y', baseY + lineH * 3).attr('text-anchor', 'end')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('−5x²');
    step3.append('text').attr('x', col.x1).attr('y', baseY + lineH * 3).attr('text-anchor', 'end')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('+ 11x');
    step3.append('text').attr('x', col.x2).attr('y', baseY - 15).attr('text-anchor', 'end')
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('− 5x');

    // Step 4: -5x² + 5x and subtraction line
    const step4 = svgEl.append('g').attr('class', 'step4').attr('opacity', 0);
    step4.append('text').attr('x', col.x2).attr('y', baseY + lineH * 4).attr('text-anchor', 'end')
      .attr('fill', colors.muted).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('−5x²');
    step4.append('text').attr('x', col.x1).attr('y', baseY + lineH * 4).attr('text-anchor', 'end')
      .attr('fill', colors.muted).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('+ 5x');
    step4.append('line')
      .attr('x1', col.x3 - 30).attr('y1', baseY + lineH * 4 + 8)
      .attr('x2', col.x1 + 5).attr('y2', baseY + lineH * 4 + 8)
      .attr('stroke', colors.fg).attr('stroke-width', 1);

    // Step 5: Result 6x - 6, write +6 on top
    const step5 = svgEl.append('g').attr('class', 'step5').attr('opacity', 0);
    step5.append('text').attr('x', col.x1).attr('y', baseY + lineH * 5).attr('text-anchor', 'end')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('6x');
    step5.append('text').attr('x', col.x0).attr('y', baseY + lineH * 5).attr('text-anchor', 'end')
      .attr('fill', colors.fg).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('− 6');
    step5.append('text').attr('x', col.x1).attr('y', baseY - 15).attr('text-anchor', 'end')
      .attr('fill', colors.accent).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('+ 6');

    // Step 6: 6x - 6 and subtraction line
    const step6 = svgEl.append('g').attr('class', 'step6').attr('opacity', 0);
    step6.append('text').attr('x', col.x1).attr('y', baseY + lineH * 6).attr('text-anchor', 'end')
      .attr('fill', colors.muted).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('6x');
    step6.append('text').attr('x', col.x0).attr('y', baseY + lineH * 6).attr('text-anchor', 'end')
      .attr('fill', colors.muted).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('− 6');
    step6.append('line')
      .attr('x1', col.x2 - 30).attr('y1', baseY + lineH * 6 + 8)
      .attr('x2', col.x0 + 5).attr('y2', baseY + lineH * 6 + 8)
      .attr('stroke', colors.fg).attr('stroke-width', 1);

    // Step 7: Remainder 0
    const result = svgEl.append('g').attr('class', 'result').attr('opacity', 0);
    result.append('text').attr('x', col.x0).attr('y', baseY + lineH * 7).attr('text-anchor', 'end')
      .attr('fill', colors.yellow).attr('font-size', '18px').attr('font-family', 'KaTeX_Main, serif').text('0');
    result.append('text').attr('x', col.x0 + 80).attr('y', baseY + lineH * 7).attr('text-anchor', 'start')
      .attr('fill', colors.fg).attr('font-size', '14px').text('remainder');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 480px; }
</style>
