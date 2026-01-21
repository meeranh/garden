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

    function getParabolaData(vScale: number): [number, number][] {
      const data: [number, number][] = [];
      for (let x = -2.5; x <= 2.5; x += 0.05) {
        const y = vScale * x * x;
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

    // Reference vertical line at x = 1
    svgEl.append('line')
      .attr('x1', xScale(1)).attr('y1', yScale(0))
      .attr('x2', xScale(1)).attr('y2', margin.top)
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

    // Height marker on original (at x=1, y=1)
    svgEl.append('circle')
      .attr('cx', xScale(1)).attr('cy', yScale(1))
      .attr('r', 4).attr('fill', colors.muted);

    // Animated curve
    const curve = svgEl.append('path')
      .datum(getParabolaData(1))
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Animated height marker (at x=1, y=a*1)
    const heightMarker = svgEl.append('circle')
      .attr('cx', xScale(1)).attr('cy', yScale(1))
      .attr('r', 5).attr('fill', colors.accent);

    // Height indicator line (from x-axis to marker)
    const heightLine = svgEl.append('line')
      .attr('x1', xScale(1)).attr('y1', yScale(0))
      .attr('x2', xScale(1)).attr('y2', yScale(1))
      .attr('stroke', colors.accent).attr('stroke-width', 2);

    // Label
    svgEl.append('text')
      .attr('x', width - margin.right + 8)
      .attr('y', yScale(2.5))
      .attr('fill', colors.accent)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('a·f(x)');

    // Scale indicator
    const scaleLabel = svgEl.append('text')
      .attr('x', width - margin.right + 8)
      .attr('y', yScale(3.5))
      .attr('fill', colors.accent)
      .attr('font-size', '12px')
      .text('a = 1');

    // Height label
    const heightLabel = svgEl.append('text')
      .attr('x', xScale(1) + 10)
      .attr('y', yScale(0.5))
      .attr('fill', colors.accent)
      .attr('font-size', '11px')
      .text('height = 1.0');

    function updateMarkers(a: number, color: string) {
      const yPos = a * 1; // Height at x=1 is a * 1² = a
      heightMarker.attr('cy', yScale(yPos)).attr('fill', color);
      heightLine.attr('y2', yScale(yPos)).attr('stroke', color);
      heightLabel.attr('y', yScale(yPos / 2)).attr('fill', color).text(`height = ${yPos.toFixed(1)}`);
    }

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        // Stretch (a = 1 to 2)
        for (let a = 1; a <= 2; a += 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getParabolaData(a)));
          scaleLabel.text(`a = ${a.toFixed(1)}`);
          updateMarkers(a, colors.accent);
          await sleep(30);
        }

        await sleep(800);
        if (!animationRunning) return;

        // Compress (a = 2 to 0.5)
        curve.attr('stroke', colors.yellow);
        for (let a = 2; a >= 0.5; a -= 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getParabolaData(a)));
          scaleLabel.text(`a = ${a.toFixed(1)}`).attr('fill', colors.yellow);
          updateMarkers(a, colors.yellow);
          await sleep(30);
        }

        await sleep(800);
        if (!animationRunning) return;

        // Back to 1
        curve.attr('stroke', colors.accent);
        for (let a = 0.5; a <= 1; a += 0.05) {
          if (!animationRunning) return;
          curve.attr('d', lineGenerator(getParabolaData(a)));
          scaleLabel.text(`a = ${a.toFixed(1)}`).attr('fill', colors.accent);
          updateMarkers(a, colors.accent);
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
