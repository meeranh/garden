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

    const width = 480;
    const height = 400;
    const cx = width / 2;
    const cy = height / 2 + 15;
    const radius = 120;

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Axes
    svgEl.append('line')
      .attr('x1', cx - radius - 25).attr('y1', cy)
      .attr('x2', cx + radius + 25).attr('y2', cy)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    svgEl.append('line')
      .attr('x1', cx).attr('y1', cy + radius + 25)
      .attr('x2', cx).attr('y2', cy - radius - 25)
      .attr('stroke', colors.muted).attr('stroke-width', 1);

    // Circle
    svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1.5);

    // Center
    svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', 3)
      .attr('fill', colors.muted);

    // Radius line
    const radiusLine = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2);

    // Dashed lines to axes
    const xDash = svgEl.append('line')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');

    const yDash = svgEl.append('line')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');

    // Point
    const point = svgEl.append('circle')
      .attr('r', 7)
      .attr('fill', colors.accent);

    // Coordinate label
    const coordLabel = svgEl.append('text')
      .attr('fill', colors.fg)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold');

    // cos/sin labels
    const cosLabel = svgEl.append('text')
      .attr('fill', colors.yellow)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle');

    const sinLabel = svgEl.append('text')
      .attr('fill', colors.yellow)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold');

    // Angle arc
    const arcGen = d3.arc<any>()
      .innerRadius(25).outerRadius(25)
      .startAngle(0);

    const angleArc = svgEl.append('path')
      .attr('transform', `translate(${cx}, ${cy}) rotate(90)`)
      .attr('fill', 'none')
      .attr('stroke', colors.fg)
      .attr('stroke-width', 1.5);

    // Angle label
    const angleLabel = svgEl.append('text')
      .attr('fill', colors.fg)
      .attr('font-size', '14px');

    // Title
    svgEl.append('text')
      .attr('x', cx).attr('y', 28)
      .attr('fill', colors.fg)
      .attr('font-size', '15px')
      .attr('text-anchor', 'middle')
      .text('Point P = (cos θ, sin θ)');

    function updatePoint(angleDeg: number) {
      const angleRad = -angleDeg * Math.PI / 180;
      const x = cx + radius * Math.cos(angleRad);
      const y = cy + radius * Math.sin(angleRad);

      radiusLine.attr('x2', x).attr('y2', y);
      point.attr('cx', x).attr('cy', y);

      xDash.attr('x1', x).attr('y1', y).attr('x2', x).attr('y2', cy);
      yDash.attr('x1', x).attr('y1', y).attr('x2', cx).attr('y2', y);

      const cosVal = Math.cos(angleRad).toFixed(2);
      const sinVal = (-Math.sin(angleRad)).toFixed(2);

      // Position coordinate label
      const offsetX = Math.cos(angleRad) >= 0 ? 12 : -12;
      const offsetY = Math.sin(angleRad) >= 0 ? 20 : -12;
      coordLabel
        .attr('x', x + offsetX)
        .attr('y', y + offsetY)
        .attr('text-anchor', Math.cos(angleRad) >= 0 ? 'start' : 'end')
        .text(`(${cosVal}, ${sinVal})`);

      // Axis labels
      cosLabel.attr('x', x).attr('y', cy + 18).text('cos θ');
      sinLabel.attr('x', cx + 8).attr('y', y + 5).text('sin θ');

      // Angle arc
      angleArc.attr('d', arcGen({ startAngle: 0, endAngle: angleRad }));

      // Angle label
      const labelAngle = angleRad / 2;
      angleLabel
        .attr('x', cx + 38 * Math.cos(labelAngle))
        .attr('y', cy + 38 * Math.sin(labelAngle) + 4)
        .text('θ');
    }

    async function animate() {
      let angle = 30;
      const speed = 0.5;

      while (animationRunning) {
        updatePoint(angle);
        angle = (angle + speed) % 360;
        await sleep(25);
      }
    }

    animate();
    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => { animationRunning = false; clearTimeouts(); });
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 480px; }
</style>
