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
      .attr('stroke-width', 1.5);

    // Common angles data
    const angles = [
      { deg: 30, rad: 'π/6' },
      { deg: 45, rad: 'π/4' },
      { deg: 60, rad: 'π/3' },
      { deg: 90, rad: 'π/2' },
      { deg: 120, rad: '2π/3' },
      { deg: 180, rad: 'π' },
    ];

    // Arc
    const arcGenerator = d3.arc<{startAngle: number, endAngle: number}>()
      .innerRadius(40)
      .outerRadius(40)
      .startAngle(0);

    const arcPath = svgEl.append('path')
      .attr('transform', `translate(${cx}, ${cy}) rotate(90)`)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 3);

    // Terminal line
    const terminalLine = svgEl.append('line')
      .attr('x1', cx).attr('y1', cy)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2.5);

    const terminalDot = svgEl.append('circle')
      .attr('r', 5)
      .attr('fill', colors.accent);

    // Labels - all on one line: "45° = π/4"
    const degLabel = svgEl.append('text')
      .attr('x', cx - 50)
      .attr('y', 35)
      .attr('fill', colors.accent)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'end');

    const equalsSign = svgEl.append('text')
      .attr('x', cx)
      .attr('y', 35)
      .attr('fill', colors.muted)
      .attr('font-size', '20px')
      .attr('text-anchor', 'middle')
      .text('=');

    const radLabel = svgEl.append('text')
      .attr('x', cx + 50)
      .attr('y', 35)
      .attr('fill', colors.yellow)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'start');

    function showAngle(deg: number, radStr: string) {
      const angleRad = -deg * Math.PI / 180;
      const x2 = cx + radius * Math.cos(angleRad);
      const y2 = cy + radius * Math.sin(angleRad);

      terminalLine.attr('x2', x2).attr('y2', y2);
      terminalDot.attr('cx', x2).attr('cy', y2);
      arcPath.attr('d', arcGenerator({ startAngle: 0, endAngle: angleRad }));

      degLabel.text(`${deg}°`);
      radLabel.text(radStr);
    }

    async function animate() {
      let angleIndex = 0;

      while (animationRunning) {
        const angle = angles[angleIndex];

        // Animate to this angle
        const prevAngle = angleIndex === 0 ? 0 : angles[angleIndex - 1].deg;

        for (let d = prevAngle; d <= angle.deg; d += 2) {
          if (!animationRunning) return;
          const angleRad = -d * Math.PI / 180;
          const x2 = cx + radius * Math.cos(angleRad);
          const y2 = cy + radius * Math.sin(angleRad);

          terminalLine.attr('x2', x2).attr('y2', y2);
          terminalDot.attr('cx', x2).attr('cy', y2);
          arcPath.attr('d', arcGenerator({ startAngle: 0, endAngle: angleRad }));
          degLabel.text(`${d}°`);

          if (d === angle.deg) {
            radLabel.text(angle.rad);
          } else {
            radLabel.text('');
          }

          await sleep(30);
        }

        // Hold at this angle
        showAngle(angle.deg, angle.rad);
        await sleep(1500);
        if (!animationRunning) return;

        angleIndex++;
        if (angleIndex >= angles.length) {
          // Reset
          await sleep(500);
          angleIndex = 0;
          showAngle(0, '0');
          await sleep(800);
        }
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
