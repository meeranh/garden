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

  const width = 550;
  const height = 400;
  const maxStep = 4;

  const stepLabels = [
    'You are the center of your own web of trust',
    'You directly verify Alice, Bob, and Carol',
    'Alice has verified Dave and Eve',
    'Bob verified Frank; Carol verified Grace',
    'Trust flows through the network'
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function showStep(step: number, animate: boolean = true) {
    if (!svgEl) return;
    const duration = animate ? 500 : 0;

    svgEl.select('.step-label').text(stepLabels[step]);

    // Step 0: Just you
    svgEl.select('.you')
      .transition().duration(duration)
      .attr('opacity', step >= 0 ? 1 : 0);

    // Step 1: Direct connections (Alice, Bob, Carol)
    svgEl.select('.direct-trust')
      .transition().duration(duration)
      .attr('opacity', step >= 1 ? 1 : 0);

    // Step 2: Alice's connections (Dave, Eve)
    svgEl.select('.alice-trust')
      .transition().duration(duration)
      .attr('opacity', step >= 2 ? 1 : 0);

    // Step 3: Bob and Carol's connections
    svgEl.select('.bob-carol-trust')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

    // Step 4: Cross connections showing the web
    svgEl.select('.cross-trust')
      .transition().duration(duration)
      .attr('opacity', step >= 4 ? 1 : 0);

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      showStep(i, true);
      await sleep(1800);
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
    svgEl.select('.you').attr('opacity', 1);
    svgEl.select('.direct-trust').attr('opacity', 1);
    svgEl.select('.alice-trust').attr('opacity', 1);
    svgEl.select('.bob-carol-trust').attr('opacity', 1);
    svgEl.select('.cross-trust').attr('opacity', 1);
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
      blue: '#83a598'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('Web of Trust');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', height - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '12px')
      .text(stepLabels[0]);

    // Node positions - organic web layout
    const cx = width / 2;
    const cy = height / 2 - 10;

    const nodes: Record<string, {x: number, y: number, label: string, color: string}> = {
      you:   { x: cx, y: cy, label: 'You', color: colors.yellow },
      alice: { x: cx - 100, y: cy - 70, label: 'Alice', color: colors.aqua },
      bob:   { x: cx + 110, y: cy - 50, label: 'Bob', color: colors.aqua },
      carol: { x: cx + 30, y: cy + 90, label: 'Carol', color: colors.aqua },
      dave:  { x: cx - 170, y: cy - 20, label: 'Dave', color: colors.blue },
      eve:   { x: cx - 130, y: cy - 150, label: 'Eve', color: colors.blue },
      frank: { x: cx + 180, y: cy + 30, label: 'Frank', color: colors.blue },
      grace: { x: cx - 50, y: cy + 160, label: 'Grace', color: colors.blue }
    };

    const nodeRadius = 22;

    // Helper to draw a node
    function drawNode(g: d3.Selection<SVGGElement, unknown, null, undefined>,
                      node: {x: number, y: number, label: string, color: string}) {
      g.append('circle')
        .attr('cx', node.x).attr('cy', node.y)
        .attr('r', nodeRadius)
        .attr('fill', colors.bgCard)
        .attr('stroke', node.color)
        .attr('stroke-width', 2.5);

      g.append('text')
        .attr('x', node.x).attr('y', node.y + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', node.color)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(node.label);
    }

    // Helper to draw an edge
    function drawEdge(g: d3.Selection<SVGGElement, unknown, null, undefined>,
                      from: {x: number, y: number}, to: {x: number, y: number},
                      color: string, dashed: boolean = false) {
      // Calculate edge endpoints (from circle edge to circle edge)
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offsetX = (dx / dist) * nodeRadius;
      const offsetY = (dy / dist) * nodeRadius;

      const line = g.append('line')
        .attr('x1', from.x + offsetX).attr('y1', from.y + offsetY)
        .attr('x2', to.x - offsetX).attr('y2', to.y - offsetY)
        .attr('stroke', color)
        .attr('stroke-width', dashed ? 1.5 : 2)
        .attr('opacity', dashed ? 0.5 : 0.7);

      if (dashed) {
        line.attr('stroke-dasharray', '4,3');
      }
    }

    // === YOU (center) ===
    const youGroup = svgEl.append('g').attr('class', 'you').attr('opacity', 0);
    // Special glow for "You"
    youGroup.append('circle')
      .attr('cx', nodes.you.x).attr('cy', nodes.you.y)
      .attr('r', nodeRadius + 5)
      .attr('fill', 'none')
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 1)
      .attr('opacity', 0.3);
    drawNode(youGroup, nodes.you);

    // === DIRECT TRUST (Alice, Bob, Carol) ===
    const directTrust = svgEl.append('g').attr('class', 'direct-trust').attr('opacity', 0);

    // Edges first (so they appear behind nodes)
    drawEdge(directTrust, nodes.you, nodes.alice, colors.green);
    drawEdge(directTrust, nodes.you, nodes.bob, colors.green);
    drawEdge(directTrust, nodes.you, nodes.carol, colors.green);

    // Nodes
    drawNode(directTrust, nodes.alice);
    drawNode(directTrust, nodes.bob);
    drawNode(directTrust, nodes.carol);

    // === ALICE'S TRUST (Dave, Eve) ===
    const aliceTrust = svgEl.append('g').attr('class', 'alice-trust').attr('opacity', 0);

    drawEdge(aliceTrust, nodes.alice, nodes.dave, colors.fgMuted);
    drawEdge(aliceTrust, nodes.alice, nodes.eve, colors.fgMuted);

    drawNode(aliceTrust, nodes.dave);
    drawNode(aliceTrust, nodes.eve);

    // === BOB AND CAROL'S TRUST ===
    const bobCarolTrust = svgEl.append('g').attr('class', 'bob-carol-trust').attr('opacity', 0);

    drawEdge(bobCarolTrust, nodes.bob, nodes.frank, colors.fgMuted);
    drawEdge(bobCarolTrust, nodes.carol, nodes.grace, colors.fgMuted);

    drawNode(bobCarolTrust, nodes.frank);
    drawNode(bobCarolTrust, nodes.grace);

    // === CROSS CONNECTIONS (the "web" aspect) ===
    const crossTrust = svgEl.append('g').attr('class', 'cross-trust').attr('opacity', 0);

    // Some cross-connections that make it a true web
    drawEdge(crossTrust, nodes.eve, nodes.dave, colors.fgMuted, true);
    drawEdge(crossTrust, nodes.bob, nodes.alice, colors.fgMuted, true);
    drawEdge(crossTrust, nodes.carol, nodes.alice, colors.fgMuted, true);
    drawEdge(crossTrust, nodes.grace, nodes.carol, colors.fgMuted, true);
    drawEdge(crossTrust, nodes.frank, nodes.bob, colors.fgMuted, true);

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
