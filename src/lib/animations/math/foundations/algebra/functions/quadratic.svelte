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
    const height = 260;
    const margin = { top: 20, right: 80, bottom: 20, left: 35 };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const xScale = d3.scaleLinear().domain([-3, 3]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-4, 4]).range([height - margin.bottom, margin.top]);

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveNatural);

    function getParabolaData(a: number): [number, number][] {
      const data: [number, number][] = [];
      for (let x = -3; x <= 3; x += 0.05) {
        data.push([x, a * x * x]);
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

    // Vertex marker
    const vertex = svgEl.append('circle')
      .attr('cx', xScale(0))
      .attr('cy', yScale(0))
      .attr('r', 5)
      .attr('fill', colors.accent);

    // Animated parabola
    const curve = svgEl.append('path')
      .datum(getParabolaData(1))
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Labels
    const aLabel = svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(2))
      .attr('fill', colors.accent)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('a = 1.0');

    svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(1))
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('f(x) = ax²');

    const dirLabel = svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(0))
      .attr('fill', colors.accent)
      .attr('font-size', '11px')
      .text('opens up');

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        // a from 1 to 2 (steeper)
        for (let a = 1; a <= 2; a += 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getParabolaData(a)));
          aLabel.text(`a = ${a.toFixed(1)}`);
          await sleep(40);
        }

        await sleep(600);
        if (!animationRunning) return;

        // a from 2 to -2 (flip)
        for (let a = 2; a >= -2; a -= 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getParabolaData(a)));
          aLabel.text(`a = ${a.toFixed(1)}`);
          if (a < 0) {
            curve.attr('stroke', colors.yellow);
            aLabel.attr('fill', colors.yellow);
            vertex.attr('fill', colors.yellow);
            dirLabel.text('opens down').attr('fill', colors.yellow);
          }
          await sleep(25);
        }

        await sleep(600);
        if (!animationRunning) return;

        // a from -2 to 1 (back)
        for (let a = -2; a <= 1; a += 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getParabolaData(a)));
          aLabel.text(`a = ${a.toFixed(1)}`);
          if (a >= 0) {
            curve.attr('stroke', colors.accent);
            aLabel.attr('fill', colors.accent);
            vertex.attr('fill', colors.accent);
            dirLabel.text('opens up').attr('fill', colors.accent);
          }
          await sleep(25);
        }

        await sleep(800);
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
