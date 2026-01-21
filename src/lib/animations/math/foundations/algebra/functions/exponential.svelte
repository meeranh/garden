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

    const xScale = d3.scaleLinear().domain([-3, 3]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-0.5, 8]).range([height - margin.bottom, margin.top]);

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveNatural);

    function getExpData(base: number): [number, number][] {
      const data: [number, number][] = [];
      for (let x = -3; x <= 3; x += 0.05) {
        const y = Math.pow(base, x);
        if (y <= 8) data.push([x, y]);
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

    // Horizontal asymptote at y = 0
    svgEl.append('line')
      .attr('x1', margin.left).attr('y1', yScale(0))
      .attr('x2', width - margin.right).attr('y2', yScale(0))
      .attr('stroke', colors.yellow).attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    svgEl.append('text')
      .attr('x', margin.left + 5)
      .attr('y', yScale(0) + 15)
      .attr('fill', colors.yellow)
      .attr('font-size', '10px')
      .text('asymptote y = 0');

    // Reference point (0, 1)
    svgEl.append('circle')
      .attr('cx', xScale(0)).attr('cy', yScale(1))
      .attr('r', 4).attr('fill', colors.muted);

    // Animated curve
    const curve = svgEl.append('path')
      .datum(getExpData(2))
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Tracing dot
    const dot = svgEl.append('circle')
      .attr('r', 5)
      .attr('fill', colors.accent)
      .attr('cx', xScale(0))
      .attr('cy', yScale(1));

    // Labels
    const funcLabel = svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(5))
      .attr('fill', colors.accent)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('2ˣ');

    const typeLabel = svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(4))
      .attr('fill', colors.accent)
      .attr('font-size', '11px')
      .text('growth');

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        // Trace growth curve
        for (let x = -2; x <= 2.5; x += 0.05) {
          if (!animationRunning) return;
          const y = Math.pow(2, x);
          dot.attr('cx', xScale(x)).attr('cy', yScale(y));
          await sleep(30);
        }

        await sleep(800);
        if (!animationRunning) return;

        // Switch to decay (base < 1)
        curve.attr('stroke', colors.yellow);
        dot.attr('fill', colors.yellow);
        funcLabel.text('(½)ˣ').attr('fill', colors.yellow);
        typeLabel.text('decay').attr('fill', colors.yellow);
        curve.attr('d', lineGenerator(getExpData(0.5)));

        // Trace decay curve
        for (let x = -2; x <= 2.5; x += 0.05) {
          if (!animationRunning) return;
          const y = Math.pow(0.5, x);
          dot.attr('cx', xScale(x)).attr('cy', yScale(y));
          await sleep(30);
        }

        await sleep(800);
        if (!animationRunning) return;

        // Back to growth
        curve.attr('stroke', colors.accent);
        dot.attr('fill', colors.accent);
        funcLabel.text('2ˣ').attr('fill', colors.accent);
        typeLabel.text('growth').attr('fill', colors.accent);
        curve.attr('d', lineGenerator(getExpData(2)));
        dot.attr('cx', xScale(-2)).attr('cy', yScale(Math.pow(2, -2)));

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
