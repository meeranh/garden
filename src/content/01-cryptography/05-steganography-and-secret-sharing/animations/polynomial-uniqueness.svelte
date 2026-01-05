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

  const width = 720;
  const height = 400;
  const maxStep = 7;

  // The two points
  const point1 = { x: 1, y: 49 };
  const point2 = { x: 2, y: 56 };

  // Eve's guesses: lines through (1, 49) with different y-intercepts (secrets)
  // Line through (1,49) with y-intercept S: slope = 49 - S, so y = S + (49-S)x
  const guesses = [
    { secret: 30, color: '#fb4934' },   // red
    { secret: 55, color: '#d3869b' },   // purple
    { secret: 75, color: '#83a598' },   // blue
  ];

  // The correct line: y = 42 + 7x
  const correctSecret = 42;

  // Get y value for a line with given y-intercept passing through (1, 49)
  const getY = (secret: number, x: number) => secret + (49 - secret) * x;

  // Step narration - the story
  const stepLabels = [
    'Eve intercepts one share: (1, 49). Can she figure out the secret?',
    'She tries S = 30. Does the line pass through (1, 49)? Yes!',
    'What about S = 55? That also passes through (1, 49)!',
    'S = 75? Still works!',
    'With ONE share, any secret is possible. Eve learns nothing.',
    'But then... Eve intercepts a second share: (2, 56)',
    'The other lines don\'t pass through (2, 56). Only ONE line fits both.',
    'Secret revealed: S = 42. Two shares = one answer.'
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function showStep(step: number, animate: boolean = true) {
    if (!svgEl) return;
    const duration = animate ? 600 : 0;

    svgEl.select('.step-label').text(stepLabels[step]);

    // Step 0: Show point 1
    svgEl.select('.point1')
      .transition().duration(duration)
      .attr('opacity', step >= 0 ? 1 : 0);

    // Steps 1-3: Show ONE line at a time (not cumulative)
    // Step 1: Only line 1
    // Step 2: Only line 2
    // Step 3: Only line 3
    // Step 4+: All lines together

    const showAll = step >= 4;

    svgEl.select('.guess-1')
      .transition().duration(duration)
      .attr('opacity', (step === 1 || showAll) ? 1 : 0);

    svgEl.select('.intercept-1')
      .transition().duration(duration)
      .attr('opacity', (step === 1 || showAll) ? 1 : 0);

    svgEl.select('.guess-2')
      .transition().duration(duration)
      .attr('opacity', (step === 2 || showAll) ? 1 : 0);

    svgEl.select('.intercept-2')
      .transition().duration(duration)
      .attr('opacity', (step === 2 || showAll) ? 1 : 0);

    svgEl.select('.guess-3')
      .transition().duration(duration)
      .attr('opacity', (step === 3 || showAll) ? 1 : 0);

    svgEl.select('.intercept-3')
      .transition().duration(duration)
      .attr('opacity', (step === 3 || showAll) ? 1 : 0);

    // Step 4: Question marks / uncertainty (all lines visible)
    svgEl.select('.uncertainty')
      .transition().duration(duration)
      .attr('opacity', step === 4 ? 1 : 0);

    // Step 5: Show point 2
    svgEl.select('.point2')
      .transition().duration(duration)
      .attr('opacity', step >= 5 ? 1 : 0);

    // Step 6: Fade wrong lines, show correct line
    if (step >= 6) {
      svgEl.selectAll('.wrong-line')
        .transition().duration(duration)
        .attr('opacity', 0.12);

      svgEl.selectAll('.wrong-intercept')
        .transition().duration(duration)
        .attr('opacity', 0.12);

      svgEl.select('.correct-line')
        .transition().duration(duration)
        .attr('opacity', 1);

      svgEl.select('.uncertainty')
        .transition().duration(duration)
        .attr('opacity', 0);
    } else {
      svgEl.select('.correct-line')
        .transition().duration(duration)
        .attr('opacity', 0);
    }

    // Step 7: Show final secret
    svgEl.select('.final-secret')
      .transition().duration(duration)
      .attr('opacity', step >= 7 ? 1 : 0);

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      showStep(i, true);
      await sleep(2800);
      if (!isPlaying) return;
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) showStep(currentStep + 1, true); }
  function prev() { pause(); if (currentStep > 0) showStep(currentStep - 1, true); }
  function applyFinalState() {
    svgEl.select('.step-label').text(stepLabels[maxStep]);
    svgEl.select('.point1').attr('opacity', 1);
    svgEl.select('.point2').attr('opacity', 1);
    svgEl.selectAll('.wrong-line').attr('opacity', 0.12);
    svgEl.selectAll('.wrong-intercept').attr('opacity', 0.12);
    svgEl.select('.correct-line').attr('opacity', 1);
    svgEl.select('.uncertainty').attr('opacity', 0);
    svgEl.select('.final-secret').attr('opacity', 1);
    currentStep = maxStep;
  }
  function skip() { pause(); applyFinalState(); }
  function replay() { pause(); currentStep = 0; showStep(0, false); isPlaying = true; runAnimation(); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      bgCard: s.getPropertyValue('--color-bg-card').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      aqua: '#8ec07c',
      orange: '#fe8019',
      purple: '#d3869b',
      green: '#b8bb26',
      blue: '#83a598',
      red: '#fb4934'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Graph area - positioned to leave room for labels
    const graphLeft = 140;
    const graphRight = 580;
    const graphTop = 70;
    const graphBottom = 320;

    // Scales
    const xScale = d3.scaleLinear().domain([-0.3, 2.8]).range([graphLeft, graphRight]);
    const yScale = d3.scaleLinear().domain([0, 90]).range([graphBottom, graphTop]);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Why One Share Reveals Nothing');

    // Step label (story narration) - at bottom with more room
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', height - 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '14px')
      .text(stepLabels[0]);

    // Y-axis
    svgEl.append('line')
      .attr('x1', xScale(0)).attr('y1', graphTop - 10)
      .attr('x2', xScale(0)).attr('y2', graphBottom + 10)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5);

    // X-axis
    svgEl.append('line')
      .attr('x1', graphLeft - 10).attr('y1', yScale(0))
      .attr('x2', graphRight + 10).attr('y2', yScale(0))
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1);

    // Y-axis label
    svgEl.append('text')
      .attr('x', xScale(0)).attr('y', graphTop - 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('Secret');

    svgEl.append('text')
      .attr('x', xScale(0)).attr('y', graphTop - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text('f(0)');

    // X-axis ticks
    [1, 2].forEach(x => {
      svgEl.append('line')
        .attr('x1', xScale(x)).attr('y1', yScale(0) - 4)
        .attr('x2', xScale(x)).attr('y2', yScale(0) + 4)
        .attr('stroke', colors.fgMuted);

      svgEl.append('text')
        .attr('x', xScale(x)).attr('y', yScale(0) + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.fgMuted)
        .attr('font-size', '11px')
        .text(`x=${x}`);
    });

    // Draw Eve's guess lines
    guesses.forEach((g, i) => {
      const x1 = -0.3;
      const x2 = 2.8;
      const y1 = getY(g.secret, x1);
      const y2 = getY(g.secret, x2);

      // Line
      svgEl.append('line')
        .attr('class', `guess-${i + 1} wrong-line`)
        .attr('x1', xScale(x1)).attr('y1', yScale(y1))
        .attr('x2', xScale(x2)).attr('y2', yScale(y2))
        .attr('stroke', g.color)
        .attr('stroke-width', 2.5)
        .attr('opacity', 0);

      // Y-intercept marker
      const interceptG = svgEl.append('g')
        .attr('class', `intercept-${i + 1} wrong-intercept`)
        .attr('opacity', 0);

      interceptG.append('circle')
        .attr('cx', xScale(0)).attr('cy', yScale(g.secret))
        .attr('r', 6)
        .attr('fill', g.color);

      interceptG.append('text')
        .attr('x', xScale(0) - 18).attr('y', yScale(g.secret) + 4)
        .attr('text-anchor', 'end')
        .attr('fill', g.color)
        .attr('font-size', '13px')
        .attr('font-weight', 'bold')
        .text(`S=${g.secret}`);
    });

    // The correct line (y = 42 + 7x)
    const correctLine = svgEl.append('g')
      .attr('class', 'correct-line')
      .attr('opacity', 0);

    correctLine.append('line')
      .attr('x1', xScale(-0.3)).attr('y1', yScale(getY(42, -0.3)))
      .attr('x2', xScale(2.8)).attr('y2', yScale(getY(42, 2.8)))
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3.5);

    // Dotted line showing y-intercept
    correctLine.append('line')
      .attr('x1', xScale(0) - 45).attr('y1', yScale(42))
      .attr('x2', xScale(0)).attr('y2', yScale(42))
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3');

    // Y-intercept label
    correctLine.append('text')
      .attr('x', xScale(0) - 50).attr('y', yScale(42) + 5)
      .attr('text-anchor', 'end')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('S=42');

    correctLine.append('circle')
      .attr('cx', xScale(0)).attr('cy', yScale(42))
      .attr('r', 7)
      .attr('fill', colors.yellow);

    // Point 1
    const pt1 = svgEl.append('g')
      .attr('class', 'point1')
      .attr('opacity', 0);

    pt1.append('circle')
      .attr('cx', xScale(point1.x)).attr('cy', yScale(point1.y))
      .attr('r', 10)
      .attr('fill', colors.fg)
      .attr('stroke', colors.bgCard)
      .attr('stroke-width', 3);

    pt1.append('text')
      .attr('x', xScale(point1.x) + 16).attr('y', yScale(point1.y) + 5)
      .attr('fill', colors.fg)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('(1, 49)');

    // Point 2
    const pt2 = svgEl.append('g')
      .attr('class', 'point2')
      .attr('opacity', 0);

    pt2.append('circle')
      .attr('cx', xScale(point2.x)).attr('cy', yScale(point2.y))
      .attr('r', 10)
      .attr('fill', colors.fg)
      .attr('stroke', colors.bgCard)
      .attr('stroke-width', 3);

    pt2.append('text')
      .attr('x', xScale(point2.x) + 16).attr('y', yScale(point2.y) + 5)
      .attr('fill', colors.fg)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('(2, 56)');

    // Uncertainty indicator (shows during step 4)
    const uncertainty = svgEl.append('g')
      .attr('class', 'uncertainty')
      .attr('opacity', 0);

    uncertainty.append('rect')
      .attr('x', 30).attr('y', 95)
      .attr('width', 85).attr('height', 75)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.red)
      .attr('stroke-width', 2)
      .attr('rx', 6);

    uncertainty.append('text')
      .attr('x', 72).attr('y', 120)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Secret?');

    uncertainty.append('text')
      .attr('x', 72).attr('y', 142)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text('30? 55?');

    uncertainty.append('text')
      .attr('x', 72).attr('y', 158)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text('75? ...');

    // Final secret reveal box
    const finalSecret = svgEl.append('g')
      .attr('class', 'final-secret')
      .attr('opacity', 0);

    finalSecret.append('rect')
      .attr('x', 600).attr('y', 85)
      .attr('width', 100).attr('height', 65)
      .attr('fill', colors.green)
      .attr('opacity', 0.2)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2)
      .attr('rx', 6);

    finalSecret.append('text')
      .attr('x', 650).attr('y', 112)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '12px')
      .text('Secret');

    finalSecret.append('text')
      .attr('x', 650).attr('y', 138)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '22px')
      .attr('font-weight', 'bold')
      .text('S = 42');

    // Show initial state
    showStep(0, false);

    register?.({ play, pause, next, prev, skip, replay, getState });
  });

  onDestroy(() => clearTimeouts());
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
  .diagram {
    display: block;
    margin: 0 auto;
    background: var(--color-bg);
    border-radius: 0.5rem;
    max-height: 400px;
  }
</style>
