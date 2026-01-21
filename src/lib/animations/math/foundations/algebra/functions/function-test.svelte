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

    svgEl.select('.left-side').transition().duration(300).attr('opacity', 1);
    svgEl.select('.right-side').transition().duration(300).attr('opacity', 1);

    svgEl.select('.left-arrows').transition().duration(300).attr('opacity', step >= 1 ? 1 : 0);
    svgEl.select('.right-arrows').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
    svgEl.select('.left-verdict').transition().duration(300).attr('opacity', step >= 3 ? 1 : 0);
    svgEl.select('.right-verdict').transition().duration(300).attr('opacity', step >= 4 ? 1 : 0);
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
      green: '#98971a',
      red: '#cc241d',
    };

    svgEl = d3.select(svg).attr('viewBox', '0 0 520 320');

    // Arrow marker
    svgEl.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('markerWidth', 10)
      .attr('markerHeight', 7)
      .attr('refX', 9)
      .attr('refY', 3.5)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', colors.accent);

    const leftX = 130;
    const rightX = 390;
    const inputY = [100, 150, 200];
    const outputY = [100, 150, 200];

    // Left side - IS a function
    const leftSide = svgEl.append('g').attr('class', 'left-side');

    leftSide.append('text')
      .attr('x', leftX).attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('Relation A');

    // Input column
    leftSide.append('text')
      .attr('x', 50).attr('y', 70)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('Input');

    [1, 2, 3].forEach((n, i) => {
      leftSide.append('circle')
        .attr('cx', 50).attr('cy', inputY[i])
        .attr('r', 22)
        .attr('fill', colors.accent);
      leftSide.append('text')
        .attr('x', 50).attr('y', inputY[i] + 6)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.bg)
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .text(n);
    });

    // Output column
    leftSide.append('text')
      .attr('x', 210).attr('y', 70)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('Output');

    ['a', 'b', 'c'].forEach((n, i) => {
      leftSide.append('circle')
        .attr('cx', 210).attr('cy', outputY[i])
        .attr('r', 22)
        .attr('fill', colors.yellow);
      leftSide.append('text')
        .attr('x', 210).attr('y', outputY[i] + 6)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.bg)
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .text(n);
    });

    // Left arrows - each input maps to exactly one output
    const leftArrows = svgEl.append('g').attr('class', 'left-arrows').attr('opacity', 0);
    leftArrows.append('line').attr('x1', 75).attr('y1', 100).attr('x2', 185).attr('y2', 100)
      .attr('stroke', colors.accent).attr('stroke-width', 2).attr('marker-end', 'url(#arrow)');
    leftArrows.append('line').attr('x1', 75).attr('y1', 150).attr('x2', 185).attr('y2', 150)
      .attr('stroke', colors.accent).attr('stroke-width', 2).attr('marker-end', 'url(#arrow)');
    leftArrows.append('line').attr('x1', 75).attr('y1', 200).attr('x2', 185).attr('y2', 150)
      .attr('stroke', colors.accent).attr('stroke-width', 2).attr('marker-end', 'url(#arrow)');

    // Left verdict
    const leftVerdict = svgEl.append('g').attr('class', 'left-verdict').attr('opacity', 0);
    leftVerdict.append('rect')
      .attr('x', 60).attr('y', 250)
      .attr('width', 140).attr('height', 36)
      .attr('fill', colors.green)
      .attr('rx', 5);
    leftVerdict.append('text')
      .attr('x', 130).attr('y', 274)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('IS a function');

    // Right side - NOT a function
    const rightSide = svgEl.append('g').attr('class', 'right-side');

    rightSide.append('text')
      .attr('x', rightX).attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('Relation B');

    // Input column
    rightSide.append('text')
      .attr('x', 310).attr('y', 70)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('Input');

    [1, 2, 3].forEach((n, i) => {
      rightSide.append('circle')
        .attr('cx', 310).attr('cy', inputY[i])
        .attr('r', 22)
        .attr('fill', colors.accent);
      rightSide.append('text')
        .attr('x', 310).attr('y', inputY[i] + 6)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.bg)
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .text(n);
    });

    // Output column
    rightSide.append('text')
      .attr('x', 470).attr('y', 70)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('Output');

    ['a', 'b', 'c'].forEach((n, i) => {
      rightSide.append('circle')
        .attr('cx', 470).attr('cy', outputY[i])
        .attr('r', 22)
        .attr('fill', colors.yellow);
      rightSide.append('text')
        .attr('x', 470).attr('y', outputY[i] + 6)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.bg)
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .text(n);
    });

    // Right arrows - input 1 maps to TWO outputs (not a function!)
    const rightArrows = svgEl.append('g').attr('class', 'right-arrows').attr('opacity', 0);
    rightArrows.append('line').attr('x1', 335).attr('y1', 100).attr('x2', 445).attr('y2', 100)
      .attr('stroke', colors.red).attr('stroke-width', 2).attr('marker-end', 'url(#arrow)');
    rightArrows.append('line').attr('x1', 335).attr('y1', 100).attr('x2', 445).attr('y2', 150)
      .attr('stroke', colors.red).attr('stroke-width', 2).attr('marker-end', 'url(#arrow)');
    rightArrows.append('line').attr('x1', 335).attr('y1', 150).attr('x2', 445).attr('y2', 200)
      .attr('stroke', colors.accent).attr('stroke-width', 2).attr('marker-end', 'url(#arrow)');


    // Right verdict
    const rightVerdict = svgEl.append('g').attr('class', 'right-verdict').attr('opacity', 0);
    rightVerdict.append('rect')
      .attr('x', 310).attr('y', 250)
      .attr('width', 160).attr('height', 36)
      .attr('fill', colors.red)
      .attr('rx', 5);
    rightVerdict.append('text')
      .attr('x', 390).attr('y', 274)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('NOT a function');

    // Divider
    svgEl.append('line')
      .attr('x1', 260).attr('y1', 50)
      .attr('x2', 260).attr('y2', 240)
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 520px; }
</style>
