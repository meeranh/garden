<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

  let { register }: { register?: (controller: AnimationController) => void } = $props();
  let svg: SVGSVGElement;
  let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let timeouts: ReturnType<typeof setTimeout>[] = [];
  let colors: Record<string, string>;
  let animationRunning = true;

  const maxStep = 0;
  let isPlaying = $state(false);
  let currentStep = $state(0);

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
    const height = 300;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 100;

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Axes
    svgEl.append('line')
      .attr('x1', 40).attr('y1', cy)
      .attr('x2', width - 40).attr('y2', cy)
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1);

    svgEl.append('line')
      .attr('x1', cx).attr('y1', height - 30)
      .attr('x2', cx).attr('y2', 30)
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1);

    // Axis labels
    svgEl.append('text')
      .attr('x', width - 35).attr('y', cy - 8)
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('x');

    svgEl.append('text')
      .attr('x', cx + 8).attr('y', 38)
      .attr('fill', colors.muted)
      .attr('font-size', '12px')
      .text('y');

    // Origin label
    const originLabel = svgEl.append('text')
      .attr('x', cx - 25).attr('y', cy + 20)
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .attr('opacity', 0)
      .text('vertex at origin');

    // Origin point
    const origin = svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy)
      .attr('r', 5)
      .attr('fill', colors.yellow)
      .attr('opacity', 0);

    // Initial side (on positive x-axis)
    const initialSide = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + radius).attr('y2', cy)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    const initialLabel = svgEl.append('text')
      .attr('x', cx + radius + 5).attr('y', cy + 20)
      .attr('fill', colors.accent)
      .attr('font-size', '11px')
      .attr('opacity', 0)
      .text('initial side on +x axis');

    // Arc
    const arcGenerator = d3.arc<{startAngle: number, endAngle: number}>()
      .innerRadius(35)
      .outerRadius(35)
      .startAngle(0);

    const arcPath = svgEl.append('path')
      .attr('transform', `translate(${cx}, ${cy}) rotate(90)`)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    // Terminal side
    const terminalSide = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    const terminalDot = svgEl.append('circle')
      .attr('r', 5)
      .attr('fill', colors.yellow)
      .attr('opacity', 0);

    // Angle label
    const angleLabel = svgEl.append('text')
      .attr('x', cx + 50).attr('y', cy - 20)
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('θ');

    // Title
    const title = svgEl.append('text')
      .attr('x', cx).attr('y', 25)
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('Standard Position');

    async function animate() {
      while (animationRunning) {
        // Reset
        origin.attr('opacity', 0);
        originLabel.attr('opacity', 0);
        initialSide.attr('opacity', 0);
        initialLabel.attr('opacity', 0);
        terminalSide.attr('opacity', 0);
        terminalDot.attr('opacity', 0);
        arcPath.attr('opacity', 0);
        angleLabel.attr('opacity', 0);

        await sleep(500);
        if (!animationRunning) return;

        // Show origin
        origin.attr('opacity', 1);
        originLabel.attr('opacity', 1);
        await sleep(1200);
        if (!animationRunning) return;

        // Show initial side
        initialSide.attr('opacity', 1);
        initialLabel.attr('opacity', 1);
        await sleep(1200);
        if (!animationRunning) return;

        // Show terminal side rotating
        terminalSide.attr('opacity', 1);
        terminalDot.attr('opacity', 1);
        arcPath.attr('opacity', 1);
        angleLabel.attr('opacity', 1);

        const targetAngle = 50;
        for (let deg = 0; deg <= targetAngle; deg += 2) {
          if (!animationRunning) return;
          const angleRad = -deg * Math.PI / 180;
          const x2 = cx + radius * Math.cos(angleRad);
          const y2 = cy + radius * Math.sin(angleRad);

          terminalSide.attr('x2', x2).attr('y2', y2);
          terminalDot.attr('cx', x2).attr('cy', y2);
          arcPath.attr('d', arcGenerator({ startAngle: 0, endAngle: angleRad }));

          await sleep(40);
        }

        await sleep(2500);
        if (!animationRunning) return;

        // Rotate more
        for (let deg = 50; deg <= 150; deg += 2) {
          if (!animationRunning) return;
          const angleRad = -deg * Math.PI / 180;
          const x2 = cx + radius * Math.cos(angleRad);
          const y2 = cy + radius * Math.sin(angleRad);

          terminalSide.attr('x2', x2).attr('y2', y2);
          terminalDot.attr('cx', x2).attr('cy', y2);
          arcPath.attr('d', arcGenerator({ startAngle: 0, endAngle: angleRad }));

          await sleep(30);
        }

        await sleep(1500);
        if (!animationRunning) return;

        // Back to start
        for (let deg = 150; deg >= 0; deg -= 3) {
          if (!animationRunning) return;
          const angleRad = -deg * Math.PI / 180;
          const x2 = cx + radius * Math.cos(angleRad);
          const y2 = cy + radius * Math.sin(angleRad);

          terminalSide.attr('x2', x2).attr('y2', y2);
          terminalDot.attr('cx', x2).attr('cy', y2);
          arcPath.attr('d', arcGenerator({ startAngle: 0, endAngle: angleRad }));

          await sleep(20);
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
