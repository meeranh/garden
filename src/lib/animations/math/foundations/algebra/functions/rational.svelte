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

    const xScale = d3.scaleLinear().domain([-4, 4]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-4, 4]).range([height - margin.bottom, margin.top]);

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveNatural);

    // 1/x data (split into two branches)
    function getRationalData(branch: 'positive' | 'negative'): [number, number][] {
      const data: [number, number][] = [];
      if (branch === 'positive') {
        for (let x = 0.25; x <= 4; x += 0.05) {
          data.push([x, 1 / x]);
        }
      } else {
        for (let x = -4; x <= -0.25; x += 0.05) {
          data.push([x, 1 / x]);
        }
      }
      return data;
    }

    // Axes (these ARE the asymptotes!)
    const xAxis = svgEl.append('line')
      .attr('x1', margin.left).attr('y1', yScale(0))
      .attr('x2', width - margin.right).attr('y2', yScale(0))
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    const yAxis = svgEl.append('line')
      .attr('x1', xScale(0)).attr('y1', height - margin.bottom)
      .attr('x2', xScale(0)).attr('y2', margin.top)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Curves (two branches)
    const curvePos = svgEl.append('path')
      .datum(getRationalData('positive'))
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    const curveNeg = svgEl.append('path')
      .datum(getRationalData('negative'))
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Labels
    svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(2))
      .attr('fill', colors.accent)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('f(x) = 1/x');

    // Asymptote labels (initially hidden)
    const vAsymLabel = svgEl.append('text')
      .attr('x', xScale(0) + 8)
      .attr('y', margin.top + 15)
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .attr('opacity', 0)
      .text('vertical');

    const hAsymLabel = svgEl.append('text')
      .attr('x', width - margin.right - 60)
      .attr('y', yScale(0) - 8)
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .attr('opacity', 0)
      .text('horizontal');

    // Tracing dot
    const dot = svgEl.append('circle')
      .attr('r', 6)
      .attr('fill', colors.yellow)
      .attr('opacity', 0);

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        // Trace along positive branch (approaching vertical asymptote)
        dot.attr('opacity', 1);
        for (let x = 3; x >= 0.3; x -= 0.05) {
          if (!animationRunning) return;
          dot.attr('cx', xScale(x)).attr('cy', yScale(1 / x));
          await sleep(30);
        }

        // Highlight vertical asymptote
        yAxis.attr('stroke', colors.yellow).attr('stroke-width', 2).attr('stroke-dasharray', '5,5');
        vAsymLabel.attr('opacity', 1);
        await sleep(1200);
        if (!animationRunning) return;

        // Jump to negative branch
        dot.attr('cx', xScale(-0.3)).attr('cy', yScale(1 / -0.3));
        await sleep(300);

        // Trace away from vertical asymptote
        for (let x = -0.3; x >= -3; x -= 0.05) {
          if (!animationRunning) return;
          dot.attr('cx', xScale(x)).attr('cy', yScale(1 / x));
          await sleep(30);
        }

        // Highlight horizontal asymptote
        yAxis.attr('stroke', colors.muted).attr('stroke-width', 1).attr('stroke-dasharray', 'none');
        vAsymLabel.attr('opacity', 0);
        xAxis.attr('stroke', colors.yellow).attr('stroke-width', 2).attr('stroke-dasharray', '5,5');
        hAsymLabel.attr('opacity', 1);
        await sleep(1200);
        if (!animationRunning) return;

        // Reset
        xAxis.attr('stroke', colors.muted).attr('stroke-width', 1).attr('stroke-dasharray', 'none');
        hAsymLabel.attr('opacity', 0);
        dot.attr('opacity', 0);
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
