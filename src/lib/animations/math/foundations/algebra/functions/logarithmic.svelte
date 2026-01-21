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
  let animationRunning = true;

  const maxStep = 0;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) { currentStep = step; }
  async function runAnimation() { if (!isPlaying) return; isPlaying = false; }
  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() { pause(); currentStep = 0; applyStep(0); }
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

    const width = 380;
    const height = 280;
    const margin = { top: 20, right: 80, bottom: 20, left: 35 };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const xScale = d3.scaleLinear().domain([-1, 8]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-3, 3]).range([height - margin.bottom, margin.top]);

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveNatural);

    function getLogData(): [number, number][] {
      const data: [number, number][] = [];
      for (let x = 0.1; x <= 8; x += 0.05) {
        data.push([x, Math.log2(x)]);
      }
      return data;
    }

    function getExpData(): [number, number][] {
      const data: [number, number][] = [];
      for (let y = -3; y <= 3; y += 0.05) {
        const x = Math.pow(2, y);
        if (x <= 8) data.push([x, y]);
      }
      return data;
    }

    // Axes
    svgEl.append('line')
      .attr('x1', margin.left).attr('y1', yScale(0))
      .attr('x2', width - margin.right).attr('y2', yScale(0))
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    svgEl.append('line')
      .attr('x1', xScale(0)).attr('y1', height - margin.bottom)
      .attr('x2', xScale(0)).attr('y2', margin.top)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Vertical asymptote at x = 0
    svgEl.append('line')
      .attr('x1', xScale(0)).attr('y1', height - margin.bottom)
      .attr('x2', xScale(0)).attr('y2', margin.top)
      .attr('stroke', colors.yellow).attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    svgEl.append('text')
      .attr('x', xScale(0) + 5)
      .attr('y', margin.top + 15)
      .attr('fill', colors.yellow)
      .attr('font-size', '10px')
      .text('x = 0');

    // Reference point (1, 0)
    svgEl.append('circle')
      .attr('cx', xScale(1)).attr('cy', yScale(0))
      .attr('r', 4).attr('fill', colors.muted);

    // y = x line for reflection reference (hidden initially)
    const reflectionLine = svgEl.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(0))
      .attr('x2', xScale(3)).attr('y2', yScale(3))
      .attr('stroke', colors.muted).attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0);

    // Exponential curve (for comparison)
    const expCurve = svgEl.append('path')
      .datum(getExpData())
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0);

    // Log curve
    const logCurve = svgEl.append('path')
      .datum(getLogData())
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Tracing dot
    const dot = svgEl.append('circle')
      .attr('r', 5)
      .attr('fill', colors.accent)
      .attr('opacity', 0);

    // Labels
    svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(1.5))
      .attr('fill', colors.accent)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('log₂(x)');

    const expLabel = svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(0.5))
      .attr('fill', colors.muted)
      .attr('font-size', '11px')
      .attr('opacity', 0)
      .text('2ˣ (inverse)');

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        // Trace log curve
        dot.attr('opacity', 1);
        for (let x = 0.2; x <= 7; x += 0.1) {
          if (!animationRunning) return;
          dot.attr('cx', xScale(x)).attr('cy', yScale(Math.log2(x))).attr('fill', colors.accent);
          await sleep(40);
        }

        await sleep(600);
        if (!animationRunning) return;

        // Show exponential as inverse
        expCurve.attr('opacity', 1);
        expLabel.attr('opacity', 1);
        reflectionLine.attr('opacity', 1);

        await sleep(1500);
        if (!animationRunning) return;

        // Trace both showing reflection
        for (let t = -2; t <= 2.5; t += 0.05) {
          if (!animationRunning) return;
          // Point on exponential: (2^t, t)
          const expX = Math.pow(2, t);
          const expY = t;
          // Same point reflected to log: (t, 2^t) -> but we show log₂
          dot.attr('cx', xScale(expX)).attr('cy', yScale(expY));
          await sleep(30);
        }

        await sleep(800);
        if (!animationRunning) return;

        // Hide comparison
        expCurve.attr('opacity', 0);
        expLabel.attr('opacity', 0);
        reflectionLine.attr('opacity', 0);
        dot.attr('opacity', 0);

        await sleep(500);
      }
    }

    animate();
    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => { animationRunning = false; clearTimeouts(); });
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 380px; }
</style>
