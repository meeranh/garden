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

  // Elements we'll update dynamically
  let dValueText: d3.Selection<SVGTextElement, unknown, null, undefined>;
  let calcText: d3.Selection<SVGTextElement, unknown, null, undefined>;
  let resultText: d3.Selection<SVGTextElement, unknown, null, undefined>;
  let statusIcon: d3.Selection<SVGTextElement, unknown, null, undefined>;
  let foundBox: d3.Selection<SVGGElement, unknown, null, undefined>;

  const width = 500;
  const height = 200;
  const maxStep = 5;

  const allElements = ['title', 'd-label', 'd-value', 'calc', 'result', 'status', 'found-box'];

  const stepVisibility: Record<number, string[]> = {
    0: ['title', 'd-label', 'd-value', 'calc', 'result', 'status'],
    1: ['title', 'd-label', 'd-value', 'calc', 'result', 'status'],
    2: ['title', 'd-label', 'd-value', 'calc', 'result', 'status'],
    3: ['title', 'd-label', 'd-value', 'calc', 'result', 'status'],
    4: ['title', 'd-label', 'd-value', 'calc', 'result', 'status'],
    5: ['title', 'd-label', 'd-value', 'calc', 'result', 'status', 'found-box']
  };

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function showTrial(d: number, fast = false) {
    const product = 3 * d;
    const remainder = product % 40;
    const success = remainder === 1;

    dValueText.text(d);
    calcText.text(`3 × ${d} = ${product}`);
    resultText.text(`${product} mod 40 = ${remainder}`);
    statusIcon
      .text(success ? '✓' : '✗')
      .attr('fill', success ? colors.green : colors.red);

    if (!fast) {
      // Flash effect on d value
      dValueText
        .attr('fill', colors.yellow)
        .transition()
        .duration(300)
        .attr('fill', colors.fg);
    }
  }

  function applyStep(step: number) {
    const visible = stepVisibility[step] || [];
    allElements.forEach((el) => {
      svgEl.select(`.${el}`).transition().duration(300).attr('opacity', visible.includes(el) ? 1 : 0);
    });

    // Update display based on step
    if (step === 0) showTrial(1, true);
    else if (step === 1) showTrial(2, true);
    else if (step === 2) showTrial(3, true);
    else if (step === 3) showTrial(13, true);
    else if (step === 4 || step === 5) showTrial(27, true);

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    // Step 0: Try d=1
    if (currentStep <= 0) {
      currentStep = 0;
      showTrial(1);
      svgEl.select('.found-box').attr('opacity', 0);
      await sleep(1200);
      if (!isPlaying) return;
    }

    // Step 1: Try d=2
    if (currentStep <= 1) {
      currentStep = 1;
      showTrial(2);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 2: Try d=3
    if (currentStep <= 2) {
      currentStep = 2;
      showTrial(3);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 3: Fast forward through values
    if (currentStep <= 3) {
      currentStep = 3;
      const fastValues = [4, 5, 7, 9, 11, 13, 15, 18, 21, 24, 26];
      for (const d of fastValues) {
        if (!isPlaying) return;
        showTrial(d, true);
        await sleep(150);
      }
      if (!isPlaying) return;
    }

    // Step 4: Land on d=27
    if (currentStep <= 4) {
      currentStep = 4;
      showTrial(27);
      await sleep(800);
      if (!isPlaying) return;
    }

    // Step 5: Show found box
    if (currentStep <= 5) {
      currentStep = 5;
      foundBox.transition().duration(400).attr('opacity', 1);
      await sleep(500);
    }

    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() {
    pause();
    applyStep(0);
    currentStep = 0;
    isPlaying = true;
    runAnimation();
  }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      bgCard: s.getPropertyValue('--color-bg-card').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
      accent: s.getPropertyValue('--color-accent').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      border: s.getPropertyValue('--color-border').trim(),
      green: '#b8bb26',
      red: '#fb4934'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Title
    svgEl.append('text')
      .attr('class', 'title')
      .attr('x', width / 2).attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text('Finding d where 3 × d mod 40 = 1');

    // D value display
    svgEl.append('text')
      .attr('class', 'd-label')
      .attr('x', 80).attr('y', 90)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '14px')
      .text('try d =');

    dValueText = svgEl.append('text')
      .attr('class', 'd-value')
      .attr('x', 140).attr('y', 90)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .text('1');

    // Calculation
    calcText = svgEl.append('text')
      .attr('class', 'calc')
      .attr('x', 250).attr('y', 90)
      .attr('text-anchor', 'start')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .text('3 × 1 = 3');

    // Result
    resultText = svgEl.append('text')
      .attr('class', 'result')
      .attr('x', 250).attr('y', 120)
      .attr('text-anchor', 'start')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '14px')
      .text('3 mod 40 = 3');

    // Status icon
    statusIcon = svgEl.append('text')
      .attr('class', 'status')
      .attr('x', 430).attr('y', 105)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red)
      .attr('font-size', '28px')
      .text('✗');

    // Found box
    foundBox = svgEl.append('g')
      .attr('class', 'found-box')
      .attr('opacity', 0);

    foundBox.append('rect')
      .attr('x', 140).attr('y', 145)
      .attr('width', 220).attr('height', 40)
      .attr('rx', 6)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);

    foundBox.append('text')
      .attr('x', 250).attr('y', 172)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text('Found! d = 27');

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram {
    display: block;
    margin: 0 auto;
    background: var(--color-bg);
    border-radius: 0.5rem;
    max-height: 200px;
  }
</style>
