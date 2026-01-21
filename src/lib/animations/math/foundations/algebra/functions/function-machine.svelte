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

    // Step visibility
    svgEl.select('.machine').transition().duration(300).attr('opacity', 1);
    svgEl.select('.input-1').transition().duration(300).attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.output-1').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.input-2').transition().duration(300).attr('opacity', step >= 3 ? 1 : 0);
    svgEl.select('.output-2').transition().duration(300).attr('opacity', step >= 4 ? 1 : 0);
    svgEl.select('.same-note').transition().duration(300).attr('opacity', step >= 5 ? 1 : 0);
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1200);
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

    svgEl = d3.select(svg).attr('viewBox', '0 0 500 280');

    // Machine box
    const machine = svgEl.append('g').attr('class', 'machine');

    machine.append('rect')
      .attr('x', 175).attr('y', 80)
      .attr('width', 150).attr('height', 100)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 3)
      .attr('rx', 10);

    machine.append('text')
      .attr('x', 250).attr('y', 125)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('f(x) = x²');

    machine.append('text')
      .attr('x', 250).attr('y', 150)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '13px')
      .text('Function');

    // Input arrow
    machine.append('line')
      .attr('x1', 80).attr('y1', 130)
      .attr('x2', 170).attr('y2', 130)
      .attr('stroke', colors.muted)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    machine.append('text')
      .attr('x', 125).attr('y', 115)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('input');

    // Output arrow
    machine.append('line')
      .attr('x1', 330).attr('y1', 130)
      .attr('x2', 420).attr('y2', 130)
      .attr('stroke', colors.muted)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    machine.append('text')
      .attr('x', 375).attr('y', 115)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('output');

    // Arrow marker
    svgEl.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 7)
      .attr('refX', 9)
      .attr('refY', 3.5)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', colors.muted);

    // Input 1: 3
    const input1 = svgEl.append('g').attr('class', 'input-1').attr('opacity', 0);
    input1.append('circle')
      .attr('cx', 50).attr('cy', 130)
      .attr('r', 25)
      .attr('fill', colors.accent);
    input1.append('text')
      .attr('x', 50).attr('y', 136)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('3');

    // Output 1: 9
    const output1 = svgEl.append('g').attr('class', 'output-1').attr('opacity', 0);
    output1.append('circle')
      .attr('cx', 450).attr('cy', 130)
      .attr('r', 25)
      .attr('fill', colors.yellow);
    output1.append('text')
      .attr('x', 450).attr('y', 136)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('9');

    // Input 2: 3 again (below)
    const input2 = svgEl.append('g').attr('class', 'input-2').attr('opacity', 0);
    input2.append('circle')
      .attr('cx', 50).attr('cy', 220)
      .attr('r', 25)
      .attr('fill', colors.accent);
    input2.append('text')
      .attr('x', 50).attr('y', 226)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('3');
    input2.append('text')
      .attr('x', 50).attr('y', 260)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('same input');

    // Output 2: 9 again
    const output2 = svgEl.append('g').attr('class', 'output-2').attr('opacity', 0);
    output2.append('circle')
      .attr('cx', 450).attr('cy', 220)
      .attr('r', 25)
      .attr('fill', colors.yellow);
    output2.append('text')
      .attr('x', 450).attr('y', 226)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('9');
    output2.append('text')
      .attr('x', 450).attr('y', 260)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('same output');

    // Connecting arrows for second row
    input2.append('path')
      .attr('d', 'M 75 220 Q 125 220 175 180')
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    output2.append('path')
      .attr('d', 'M 330 180 Q 375 220 425 220')
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    // Same note
    const sameNote = svgEl.append('g').attr('class', 'same-note').attr('opacity', 0);
    sameNote.append('text')
      .attr('x', 250).attr('y', 250)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .text('Same input always gives same output');

    // Title
    svgEl.append('text')
      .attr('x', 250).attr('y', 35)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .text('A function is like a machine');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 500px; }
</style>
