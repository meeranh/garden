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

    const width = 440;
    const height = 300;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 100;

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Circle outline
    svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    // Center point
    svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', 4)
      .attr('fill', colors.muted);

    // Initial side (fixed)
    svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + radius + 20).attr('y2', cy)
      .attr('stroke', colors.muted)
      .attr('stroke-width', 2);

    svgEl.append('text')
      .attr('x', cx + radius + 25)
      .attr('y', cy + 5)
      .attr('fill', colors.muted)
      .attr('font-size', '11px')
      .text('initial side');

    // Arc for angle
    const arc = d3.arc<{startAngle: number, endAngle: number}>()
      .innerRadius(30)
      .outerRadius(30)
      .startAngle(0);

    const arcPath = svgEl.append('path')
      .attr('transform', `translate(${cx}, ${cy}) rotate(90)`)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    // Terminal side (rotating)
    const terminalLine = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + radius + 20).attr('y2', cy)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Arrow at end of terminal side
    const arrow = svgEl.append('circle')
      .attr('cx', cx + radius + 20).attr('cy', cy)
      .attr('r', 5)
      .attr('fill', colors.accent);

    // Terminal side label
    const termLabel = svgEl.append('text')
      .attr('fill', colors.accent)
      .attr('font-size', '11px')
      .text('terminal side');

    // Angle label
    const angleLabel = svgEl.append('text')
      .attr('x', cx + 45)
      .attr('y', cy - 10)
      .attr('fill', colors.yellow)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('θ');

    function updateTerminalSide(angleDeg: number) {
      const angleRad = -angleDeg * Math.PI / 180; // Negative because SVG y is flipped
      const x2 = cx + (radius + 20) * Math.cos(angleRad);
      const y2 = cy + (radius + 20) * Math.sin(angleRad);

      terminalLine.attr('x2', x2).attr('y2', y2);
      arrow.attr('cx', x2).attr('cy', y2);
      termLabel.attr('x', x2 + 10).attr('y', y2);

      // Update arc
      const endAngle = -angleDeg * Math.PI / 180;
      arcPath.attr('d', arc({ startAngle: 0, endAngle: endAngle }));
    }

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        // Rotate from 0 to 135 degrees
        for (let angle = 0; angle <= 135; angle += 2) {
          if (!animationRunning) return;
          updateTerminalSide(angle);
          angleLabel.text(`θ = ${angle}°`);
          await sleep(30);
        }

        await sleep(1500);
        if (!animationRunning) return;

        // Rotate back to 0
        for (let angle = 135; angle >= 0; angle -= 2) {
          if (!animationRunning) return;
          updateTerminalSide(angle);
          angleLabel.text(`θ = ${angle}°`);
          await sleep(20);
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
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 440px; }
</style>
