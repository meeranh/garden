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
    const height = 320;
    const cx = width / 2;
    const cy = height / 2 + 20;
    const radius = 90;

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Circle
    svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 1);

    // Center
    svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', 3)
      .attr('fill', colors.muted);

    // Initial side
    svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + radius).attr('y2', cy)
      .attr('stroke', colors.muted)
      .attr('stroke-width', 2);

    // Target position (45°)
    const targetAngle = 45;
    const targetRad = -targetAngle * Math.PI / 180;
    const targetX = cx + radius * Math.cos(targetRad);
    const targetY = cy + radius * Math.sin(targetRad);

    // Terminal side (fixed at 45°)
    svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', targetX).attr('y2', targetY)
      .attr('stroke', colors.fg)
      .attr('stroke-width', 2.5);

    svgEl.append('circle')
      .attr('cx', targetX).attr('cy', targetY)
      .attr('r', 6)
      .attr('fill', colors.fg);

    // Arc for current angle
    const arcGenerator = d3.arc<{startAngle: number, endAngle: number}>()
      .innerRadius(0)
      .outerRadius(0)
      .startAngle(0);

    const arcPath = svgEl.append('path')
      .attr('transform', `translate(${cx}, ${cy}) rotate(90)`)
      .attr('fill', 'none')
      .attr('stroke-width', 2.5);

    // Animated terminal side (tracing)
    const traceLine = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('stroke-width', 2)
      .attr('opacity', 0.7);

    const traceDot = svgEl.append('circle')
      .attr('r', 4)
      .attr('opacity', 0.7);

    // Labels
    const titleLabel = svgEl.append('text')
      .attr('x', cx).attr('y', 25)
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('Same terminal side');

    const angleLabel = svgEl.append('text')
      .attr('x', cx).attr('y', 50)
      .attr('fill', colors.accent)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle');

    const noteLabel = svgEl.append('text')
      .attr('x', cx).attr('y', height - 15)
      .attr('fill', colors.muted)
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle');

    function updateTrace(deg: number, color: string) {
      const rad = -deg * Math.PI / 180;
      const x = cx + radius * Math.cos(rad);
      const y = cy + radius * Math.sin(rad);

      traceLine.attr('x2', x).attr('y2', y).attr('stroke', color);
      traceDot.attr('cx', x).attr('cy', y).attr('fill', color);
    }

    async function animateToAngle(startDeg: number, endDeg: number, color: string, labelText: string, arcR: number) {
      const step = startDeg < endDeg ? 3 : -3;
      const innerR = arcR - 2;
      const outerR = arcR + 2;

      arcGenerator.innerRadius(innerR).outerRadius(outerR);
      arcPath.attr('stroke', color);

      for (let deg = startDeg; (step > 0 ? deg <= endDeg : deg >= endDeg); deg += step) {
        if (!animationRunning) return;

        updateTrace(deg, color);
        angleLabel.text(`${deg}°`).attr('fill', color);

        // Update arc
        const rad = -deg * Math.PI / 180;
        arcPath.attr('d', arcGenerator({ startAngle: 0, endAngle: rad }));

        await sleep(15);
      }

      angleLabel.text(labelText).attr('fill', color);
    }

    async function animate() {
      while (animationRunning) {
        // Show 45°
        noteLabel.text('');
        await animateToAngle(0, 45, colors.accent, '45°', 30);
        await sleep(1500);
        if (!animationRunning) return;

        // Show 405° (45 + 360)
        noteLabel.text('45° + 360° = 405°');
        await animateToAngle(45, 405, colors.yellow, '405°', 45);
        await sleep(1500);
        if (!animationRunning) return;

        // Show -315° (45 - 360)
        noteLabel.text('45° − 360° = −315°');
        arcPath.attr('d', null);
        await animateToAngle(0, -315, colors.accent, '−315°', 60);
        await sleep(1500);
        if (!animationRunning) return;

        // Reset
        noteLabel.text('All three angles are coterminal');
        await sleep(2000);
        if (!animationRunning) return;

        // Clear for next loop
        arcPath.attr('d', null);
        traceLine.attr('x2', cx + radius).attr('y2', cy);
        traceDot.attr('cx', cx + radius).attr('cy', cy);

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
