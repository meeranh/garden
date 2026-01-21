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

  function applyStep(step: number) {
    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    isPlaying = false;
  }

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
    const margin = { top: 20, right: 70, bottom: 20, left: 35 };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const xScale = d3.scaleLinear()
      .domain([-3, 3])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-0.5, 5])
      .range([height - margin.bottom, margin.top]);

    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveNatural);

    // For horizontal stretch f(bx), we scale x by 1/b to show the visual effect
    // When b > 1, graph compresses (narrower)
    // When b < 1, graph stretches (wider)
    function getParabolaData(b: number): [number, number][] {
      const data: [number, number][] = [];
      for (let x = -3; x <= 3; x += 0.05) {
        // f(bx) = (bx)² - points at x show value that was at bx
        const y = (b * x) * (b * x);
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

    // Reference line at y = 1
    svgEl.append('line')
      .attr('x1', margin.left).attr('y1', yScale(1))
      .attr('x2', width - margin.right).attr('y2', yScale(1))
      .attr('stroke', colors.muted).attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    // Original parabola (static, muted)
    svgEl.append('path')
      .datum(getParabolaData(1))
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    svgEl.append('text')
      .attr('x', width - margin.right + 8)
      .attr('y', yScale(1.2))
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('f(x) = x²');

    // Width markers on original (at y=1, x=±1)
    svgEl.append('circle')
      .attr('cx', xScale(1)).attr('cy', yScale(1))
      .attr('r', 4).attr('fill', colors.muted);
    svgEl.append('circle')
      .attr('cx', xScale(-1)).attr('cy', yScale(1))
      .attr('r', 4).attr('fill', colors.muted);

    // Animated curve
    const curve = svgEl.append('path')
      .datum(getParabolaData(1))
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Animated width markers (at y=1, x=±1/b)
    const leftMarker = svgEl.append('circle')
      .attr('cx', xScale(-1)).attr('cy', yScale(1))
      .attr('r', 5).attr('fill', colors.accent);
    const rightMarker = svgEl.append('circle')
      .attr('cx', xScale(1)).attr('cy', yScale(1))
      .attr('r', 5).attr('fill', colors.accent);

    // Width indicator line
    const widthLine = svgEl.append('line')
      .attr('x1', xScale(-1)).attr('y1', yScale(1))
      .attr('x2', xScale(1)).attr('y2', yScale(1))
      .attr('stroke', colors.accent).attr('stroke-width', 2);

    // Label
    svgEl.append('text')
      .attr('x', width - margin.right + 8)
      .attr('y', yScale(2.5))
      .attr('fill', colors.accent)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('f(bx)');

    // Scale indicator
    const scaleLabel = svgEl.append('text')
      .attr('x', width - margin.right + 8)
      .attr('y', yScale(3.5))
      .attr('fill', colors.accent)
      .attr('font-size', '12px')
      .text('b = 1');

    // Width label (below x-axis, to the right)
    const widthLabel = svgEl.append('text')
      .attr('x', xScale(1.8))
      .attr('y', yScale(-0.3))
      .attr('fill', colors.accent)
      .attr('font-size', '11px')
      .text('width = 2');

    function updateMarkers(b: number, color: string) {
      const xPos = 1 / b; // Where y=1 on the transformed curve
      leftMarker.attr('cx', xScale(-xPos)).attr('fill', color);
      rightMarker.attr('cx', xScale(xPos)).attr('fill', color);
      widthLine.attr('x1', xScale(-xPos)).attr('x2', xScale(xPos)).attr('stroke', color);
      widthLabel.attr('fill', color).text(`width = ${(2 * xPos).toFixed(1)}`);
    }

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        // Compress (b = 1 to 2) - graph gets narrower
        for (let b = 1; b <= 2; b += 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getParabolaData(b)));
          scaleLabel.text(`b = ${b.toFixed(1)}`);
          updateMarkers(b, colors.accent);
          await sleep(30);
        }

        await sleep(800);
        if (!animationRunning) return;

        // Stretch (b = 2 to 0.5) - graph gets wider
        curve.attr('stroke', colors.yellow);
        for (let b = 2; b >= 0.5; b -= 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getParabolaData(b)));
          scaleLabel.text(`b = ${b.toFixed(1)}`).attr('fill', colors.yellow);
          updateMarkers(b, colors.yellow);
          await sleep(30);
        }

        await sleep(800);
        if (!animationRunning) return;

        // Back to 1
        curve.attr('stroke', colors.accent);
        for (let b = 0.5; b <= 1; b += 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getParabolaData(b)));
          scaleLabel.text(`b = ${b.toFixed(1)}`).attr('fill', colors.accent);
          updateMarkers(b, colors.accent);
          await sleep(30);
        }

        await sleep(1000);
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
