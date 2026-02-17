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
    const radius = 90;

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
      .attr('x2', cx + radius).attr('y2', cy)
      .attr('stroke', colors.muted)
      .attr('stroke-width', 2);

    // Arc for angle
    const arc = d3.arc<{startAngle: number, endAngle: number}>()
      .innerRadius(35)
      .outerRadius(35)
      .startAngle(0);

    const arcPath = svgEl.append('path')
      .attr('transform', `translate(${cx}, ${cy}) rotate(90)`)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    // Arrow on arc to show direction
    const arcArrow = svgEl.append('polygon')
      .attr('fill', colors.accent);

    // Terminal side (rotating)
    const terminalLine = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + radius).attr('y2', cy)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    const terminalDot = svgEl.append('circle')
      .attr('cx', cx + radius).attr('cy', cy)
      .attr('r', 5)
      .attr('fill', colors.accent);

    // Labels
    const angleLabel = svgEl.append('text')
      .attr('x', cx)
      .attr('y', cy - radius - 20)
      .attr('fill', colors.accent)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('+60°');

    const dirLabel = svgEl.append('text')
      .attr('x', cx)
      .attr('y', cy - radius - 5)
      .attr('fill', colors.accent)
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .text('counterclockwise');

    function updateAngle(angleDeg: number, color: string, label: string) {
      const angleRad = -angleDeg * Math.PI / 180;
      const x2 = cx + radius * Math.cos(angleRad);
      const y2 = cy + radius * Math.sin(angleRad);

      terminalLine.attr('x2', x2).attr('y2', y2).attr('stroke', color);
      terminalDot.attr('cx', x2).attr('cy', y2).attr('fill', color);
      arcPath.attr('stroke', color);

      // Arc
      const endAngle = -angleDeg * Math.PI / 180;
      arcPath.attr('d', arc({ startAngle: 0, endAngle: endAngle }));

      // Arrow on arc
      const arrowAngle = endAngle * 0.8;
      const arrowR = 35;
      const ax = cx + arrowR * Math.cos(arrowAngle);
      const ay = cy + arrowR * Math.sin(arrowAngle);

      // Calculate arrow direction (tangent to circle)
      const tangentAngle = arrowAngle + (angleDeg > 0 ? -Math.PI/2 : Math.PI/2);
      const arrowSize = 8;
      const points = [
        [ax + arrowSize * Math.cos(tangentAngle), ay + arrowSize * Math.sin(tangentAngle)],
        [ax + arrowSize * Math.cos(tangentAngle + 2.5), ay + arrowSize * Math.sin(tangentAngle + 2.5)],
        [ax + arrowSize * Math.cos(tangentAngle - 2.5), ay + arrowSize * Math.sin(tangentAngle - 2.5)]
      ];
      arcArrow.attr('points', points.map(p => p.join(',')).join(' ')).attr('fill', color);

      angleLabel.text(label).attr('fill', color);
      dirLabel.attr('fill', color);
    }

    // Infinite animation loop
    async function animate() {
      while (animationRunning) {
        // Positive angle (counterclockwise)
        dirLabel.text('counterclockwise');
        for (let angle = 0; angle <= 60; angle += 2) {
          if (!animationRunning) return;
          updateAngle(angle, colors.accent, `+${angle}°`);
          await sleep(40);
        }

        await sleep(1500);
        if (!animationRunning) return;

        // Back to 0
        for (let angle = 60; angle >= 0; angle -= 3) {
          if (!animationRunning) return;
          updateAngle(angle, colors.accent, `+${angle}°`);
          await sleep(25);
        }

        await sleep(500);
        if (!animationRunning) return;

        // Negative angle (clockwise)
        dirLabel.text('clockwise');
        for (let angle = 0; angle >= -60; angle -= 2) {
          if (!animationRunning) return;
          updateAngle(angle, colors.yellow, `${angle}°`);
          await sleep(40);
        }

        await sleep(1500);
        if (!animationRunning) return;

        // Back to 0
        for (let angle = -60; angle <= 0; angle += 3) {
          if (!animationRunning) return;
          updateAngle(angle, colors.yellow, `${angle}°`);
          await sleep(25);
        }

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
