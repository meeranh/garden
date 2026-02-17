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

    const xScale = d3.scaleLinear().domain([-0.5, 8]).range([margin.left, width - margin.right]);
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
      .attr('stroke', colors.yellow).attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    svgEl.append('text')
      .attr('x', xScale(0) + 8)
      .attr('y', height - margin.bottom - 10)
      .attr('fill', colors.yellow)
      .attr('font-size', '10px')
      .text('x = 0');

    // Key points
    // (1, 0) - log(1) = 0
    svgEl.append('circle')
      .attr('cx', xScale(1)).attr('cy', yScale(0))
      .attr('r', 4).attr('fill', colors.muted);

    // (2, 1) - log₂(2) = 1
    svgEl.append('circle')
      .attr('cx', xScale(2)).attr('cy', yScale(1))
      .attr('r', 4).attr('fill', colors.muted);

    // (4, 2) - log₂(4) = 2
    svgEl.append('circle')
      .attr('cx', xScale(4)).attr('cy', yScale(2))
      .attr('r', 4).attr('fill', colors.muted);

    // Log curve
    const logCurve = svgEl.append('path')
      .datum(getLogData())
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Tracing dot
    const dot = svgEl.append('circle')
      .attr('r', 6)
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

    // Value label (top of graph)
    const valueLabel = svgEl.append('text')
      .attr('x', margin.left + 50)
      .attr('y', margin.top + 20)
      .attr('fill', colors.accent)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0);

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        dot.attr('opacity', 1);
        valueLabel.attr('opacity', 1);

        // Trace the curve, showing key values
        for (let x = 0.25; x <= 7; x += 0.08) {
          if (!animationRunning) return;
          const y = Math.log2(x);
          dot.attr('cx', xScale(x)).attr('cy', yScale(y));

          // Show value at key points
          if (Math.abs(x - 1) < 0.1) {
            valueLabel.text('log₂(1) = 0');
          } else if (Math.abs(x - 2) < 0.1) {
            valueLabel.text('log₂(2) = 1');
          } else if (Math.abs(x - 4) < 0.15) {
            valueLabel.text('log₂(4) = 2');
          } else {
            valueLabel.text(`log₂(${x.toFixed(1)}) = ${y.toFixed(1)}`);
          }
          await sleep(50);
        }

        await sleep(1000);
        if (!animationRunning) return;

        dot.attr('opacity', 0);
        valueLabel.attr('opacity', 0);

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
