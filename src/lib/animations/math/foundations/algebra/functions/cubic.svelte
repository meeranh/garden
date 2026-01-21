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
    const margin = { top: 20, right: 90, bottom: 20, left: 35 };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const xScale = d3.scaleLinear().domain([-2.5, 2.5]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-3, 3]).range([height - margin.bottom, margin.top]);

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveNatural);

    // Cubic with adjustable "wiggle": f(x) = x³ - bx
    // b controls whether it has turning points
    function getCubicData(b: number): [number, number][] {
      const data: [number, number][] = [];
      for (let x = -2.5; x <= 2.5; x += 0.05) {
        const y = x * x * x - b * x;
        data.push([x, y]);
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

    // Animated cubic
    const curve = svgEl.append('path')
      .datum(getCubicData(0))
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Turning point markers
    const tp1 = svgEl.append('circle').attr('r', 5).attr('fill', colors.yellow).attr('opacity', 0);
    const tp2 = svgEl.append('circle').attr('r', 5).attr('fill', colors.yellow).attr('opacity', 0);

    // Labels
    const funcLabel = svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(1.5))
      .attr('fill', colors.accent)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('x³');

    svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(0.5))
      .attr('fill', colors.muted)
      .attr('font-size', '11px')
      .text('degree 3');

    const tpLabel = svgEl.append('text')
      .attr('x', width - margin.right + 10)
      .attr('y', yScale(-0.5))
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .attr('opacity', 0)
      .text('2 turning pts');

    function updateTurningPoints(b: number) {
      if (b > 0) {
        // Turning points at x = ±√(b/3)
        const xTp = Math.sqrt(b / 3);
        const yTp1 = xTp * xTp * xTp - b * xTp;
        const yTp2 = -xTp * xTp * xTp + b * xTp;
        tp1.attr('cx', xScale(xTp)).attr('cy', yScale(yTp1)).attr('opacity', 1);
        tp2.attr('cx', xScale(-xTp)).attr('cy', yScale(yTp2)).attr('opacity', 1);
        tpLabel.attr('opacity', 1);
      } else {
        tp1.attr('opacity', 0);
        tp2.attr('opacity', 0);
        tpLabel.attr('opacity', 0);
      }
    }

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        // Start with pure x³ (no turning points)
        await sleep(1000);
        if (!animationRunning) return;

        // Add turning points (b = 0 to 3)
        for (let b = 0; b <= 3; b += 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getCubicData(b)));
          if (b > 0) {
            funcLabel.text(`x³ − ${b.toFixed(1)}x`);
          }
          updateTurningPoints(b);
          await sleep(30);
        }

        await sleep(1000);
        if (!animationRunning) return;

        // Back to x³
        for (let b = 3; b >= 0; b -= 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getCubicData(b)));
          if (b > 0.1) {
            funcLabel.text(`x³ − ${b.toFixed(1)}x`);
          } else {
            funcLabel.text('x³');
          }
          updateTurningPoints(b);
          await sleep(30);
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
