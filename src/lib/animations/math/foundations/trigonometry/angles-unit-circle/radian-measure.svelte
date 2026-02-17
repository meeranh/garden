<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

  let { register }: { register?: (controller: AnimationController) => void } = $props();
  let svg: SVGSVGElement;
  let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let timeouts: ReturnType<typeof setTimeout>[] = [];
  let colors: Record<string, string>;
  let animationFrameId: number | null = null;

  const maxStep = 5;
  let isPlaying = $state(false);
  let currentStep = $state(0);

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  let elements: Record<string, d3.Selection<any, any, any, any>> = {};
  let circleLength: number;

  const width = 440;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = 110;
  const oneRadian = 1;
  const numPoints = 40;

  // Generate interpolated points between straight line and arc
  function getInterpolatedPoints(t: number): [number, number][] {
    const points: [number, number][] = [];
    for (let i = 0; i <= numPoints; i++) {
      const frac = i / numPoints;

      // Straight line: from center to edge
      const straightX = cx + frac * radius;
      const straightY = cy;

      // Arc: from edge (angle 0) counterclockwise
      const angle = -frac * oneRadian;
      const arcX = cx + radius * Math.cos(angle);
      const arcY = cy + radius * Math.sin(angle);

      // Interpolate
      const x = straightX + t * (arcX - straightX);
      const y = straightY + t * (arcY - straightY);
      points.push([x, y]);
    }
    return points;
  }

  function pointsToPath(points: [number, number][]): string {
    if (points.length === 0) return '';
    return 'M ' + points.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ');
  }

  function setFoldingLine(t: number) {
    const points = getInterpolatedPoints(t);
    elements.foldingLine?.attr('d', pointsToPath(points));
  }

  function applyStep(step: number) {
    currentStep = step;
    clearTimeouts();

    // Reset all
    elements.circle?.attr('stroke-dashoffset', 0).attr('opacity', 1);
    elements.centerDot?.attr('opacity', 0);
    elements.radius?.attr('opacity', 0);
    elements.radiusLabel?.attr('opacity', 0);
    elements.foldingLine?.attr('opacity', 0);
    elements.arcLabel?.attr('opacity', 0);
    elements.terminalLine?.attr('opacity', 0);
    elements.angleArc?.attr('opacity', 0);
    elements.angleLabel?.attr('opacity', 0);
    elements.formula?.attr('opacity', 0);
    elements.title?.attr('opacity', 1);

    if (step === 0) {
      elements.title?.text('A circle with radius r');
    }

    if (step >= 1) {
      elements.title?.text('Here is the radius');
      elements.centerDot?.attr('opacity', 1);
      elements.radius?.attr('opacity', 1);
      elements.radiusLabel?.attr('opacity', 1);
    }

    if (step >= 2) {
      elements.title?.text('Take a copy of the radius...');
      elements.centerDot?.attr('opacity', 1);
      elements.radius?.attr('opacity', 1);
      elements.radiusLabel?.attr('opacity', 1);
      setFoldingLine(0);
      elements.foldingLine?.attr('opacity', 1);
    }

    if (step >= 3) {
      elements.title?.text('...and bend it along the circle');
      elements.centerDot?.attr('opacity', 1);
      elements.radius?.attr('opacity', 1);
      elements.radiusLabel?.attr('opacity', 1);
      setFoldingLine(1); // Fully bent
      elements.foldingLine?.attr('opacity', 1);
      elements.arcLabel?.attr('opacity', 1);
    }

    if (step >= 4) {
      elements.title?.text('The angle formed is 1 radian');
      elements.centerDot?.attr('opacity', 1);
      elements.radius?.attr('opacity', 1);
      setFoldingLine(1);
      elements.foldingLine?.attr('opacity', 1);
      elements.terminalLine?.attr('opacity', 1);
      elements.angleArc?.attr('opacity', 1);
      elements.angleLabel?.attr('opacity', 1);
    }

    if (step >= 5) {
      elements.title?.text('1 radian ≈ 57.3°');
      elements.centerDot?.attr('opacity', 1);
      elements.radius?.attr('opacity', 1);
      setFoldingLine(1);
      elements.foldingLine?.attr('opacity', 1);
      elements.terminalLine?.attr('opacity', 1);
      elements.angleArc?.attr('opacity', 1);
      elements.angleLabel?.attr('opacity', 1);
      elements.formula?.attr('opacity', 1);
    }
  }

  // Manual animation for the fold
  function animateFold(): Promise<void> {
    return new Promise((resolve) => {
      const duration = 1500;
      const startTime = performance.now();

      function frame(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out
        const t = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        setFoldingLine(t);

        if (progress < 1 && isPlaying) {
          animationFrameId = requestAnimationFrame(frame);
        } else {
          resolve();
        }
      }

      animationFrameId = requestAnimationFrame(frame);
    });
  }

  async function runAnimation() {
    if (!isPlaying) return;

    // Reset everything
    elements.circle?.attr('stroke-dashoffset', circleLength).attr('opacity', 1);
    elements.centerDot?.attr('opacity', 0);
    elements.radius?.attr('x2', cx).attr('opacity', 0);
    elements.radiusLabel?.attr('opacity', 0);
    setFoldingLine(0);
    elements.foldingLine?.attr('opacity', 0);
    elements.arcLabel?.attr('opacity', 0);
    elements.terminalLine?.attr('opacity', 0);
    elements.angleArc?.attr('opacity', 0);
    elements.angleLabel?.attr('opacity', 0);
    elements.formula?.attr('opacity', 0);

    // Step 0: Draw circle
    currentStep = 0;
    elements.title?.text('A circle with radius r').attr('opacity', 1);
    elements.circle?.transition().duration(1200).ease(d3.easeLinear).attr('stroke-dashoffset', 0);
    await sleep(1500);
    if (!isPlaying) return;

    // Step 1: Show radius
    currentStep = 1;
    elements.title?.text('Here is the radius');
    elements.centerDot?.attr('opacity', 1);
    elements.radius?.attr('opacity', 1).attr('x2', cx);
    elements.radius?.transition().duration(500).ease(d3.easeLinear).attr('x2', cx + radius);
    await sleep(700);
    if (!isPlaying) return;
    elements.radiusLabel?.attr('opacity', 1);
    await sleep(1500);
    if (!isPlaying) return;

    // Step 2: Show copy of radius
    currentStep = 2;
    elements.title?.text('Take a copy of the radius...');
    setFoldingLine(0);
    elements.foldingLine?.attr('opacity', 1);
    await sleep(1500);
    if (!isPlaying) return;

    // Step 3: Animate the fold
    currentStep = 3;
    elements.title?.text('...and bend it along the circle');
    await animateFold();
    if (!isPlaying) return;
    elements.arcLabel?.attr('opacity', 1);
    await sleep(1500);
    if (!isPlaying) return;

    // Step 4: Show terminal line and angle
    currentStep = 4;
    elements.title?.text('The angle formed is 1 radian');
    elements.terminalLine?.attr('opacity', 1);
    await sleep(600);
    if (!isPlaying) return;
    elements.angleArc?.attr('opacity', 1);
    elements.angleLabel?.attr('opacity', 1);
    await sleep(2000);
    if (!isPlaying) return;

    // Step 5: Show degree equivalent
    currentStep = 5;
    elements.title?.text('1 radian ≈ 57.3°');
    elements.formula?.attr('opacity', 1);
    await sleep(2500);

    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() { pause(); currentStep = 0; isPlaying = true; runAnimation(); }
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

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);
    circleLength = 2 * Math.PI * radius;

    // Title
    elements.title = svgEl.append('text')
      .attr('x', cx).attr('y', 35)
      .attr('fill', colors.fg).attr('font-size', '16px')
      .attr('text-anchor', 'middle')
      .attr('opacity', 0);

    // Circle
    elements.circle = svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', colors.muted)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', circleLength)
      .attr('stroke-dashoffset', circleLength)
      .attr('transform', `rotate(-90, ${cx}, ${cy})`);

    // Center dot
    elements.centerDot = svgEl.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', 5)
      .attr('fill', colors.fg)
      .attr('opacity', 0);

    // Radius line
    elements.radius = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + radius).attr('y2', cy)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 4)
      .attr('opacity', 0);

    // Radius label
    elements.radiusLabel = svgEl.append('text')
      .attr('x', cx + radius / 2).attr('y', cy + 28)
      .attr('fill', colors.accent)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('r')
      .attr('opacity', 0);

    // The folding line
    elements.foldingLine = svgEl.append('path')
      .attr('d', pointsToPath(getInterpolatedPoints(0)))
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 6)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0);

    // Arc label
    const arcMidAngle = -oneRadian / 2;
    elements.arcLabel = svgEl.append('text')
      .attr('x', cx + (radius + 25) * Math.cos(arcMidAngle))
      .attr('y', cy + (radius + 25) * Math.sin(arcMidAngle) + 5)
      .attr('fill', colors.yellow)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('r')
      .attr('opacity', 0);

    // Terminal line
    const termX = cx + radius * Math.cos(-oneRadian);
    const termY = cy + radius * Math.sin(-oneRadian);

    elements.terminalLine = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('x2', termX).attr('y2', termY)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    // Angle arc
    const angleArcPath = d3.arc<any>()
      .innerRadius(40)
      .outerRadius(40)
      .startAngle(0)
      .endAngle(-oneRadian);

    elements.angleArc = svgEl.append('path')
      .attr('transform', `translate(${cx}, ${cy}) rotate(90)`)
      .attr('d', angleArcPath({}))
      .attr('fill', 'none')
      .attr('stroke', colors.fg)
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    // Angle label
    elements.angleLabel = svgEl.append('text')
      .attr('x', cx + 45).attr('y', cy - 20)
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('1 rad')
      .attr('opacity', 0);

    // Formula
    elements.formula = svgEl.append('text')
      .attr('x', cx).attr('y', height - 25)
      .attr('fill', colors.muted)
      .attr('font-size', '14px')
      .attr('text-anchor', 'middle')
      .text('Arc length = radius → angle = 1 radian')
      .attr('opacity', 0);

    applyStep(0);
    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram { display: block; margin: 0 auto; background: var(--color-bg); border-radius: 0.5rem; width: 100%; max-width: 440px; }
</style>
