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

  const width = 700;
  const height = 440;
  const maxStep = 4;

  // Layout - vertical chain (more spacing)
  const centerX = 350;
  const rootY = 70;
  const interY = 200;
  const endY = 330;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'Certificate chain: a hierarchy of trust',
    'Root CA: pre-installed in your browser (the trust anchor)',
    'Root CA signs the Intermediate CA certificate',
    'Intermediate CA signs the end-entity certificate',
    'Complete chain: Root → Intermediate → Website'
  ];

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    const rootCert = svgEl.select('.root-cert');
    const interCert = svgEl.select('.inter-cert');
    const endCert = svgEl.select('.end-cert');
    const arrow1 = svgEl.select('.arrow1');
    const arrow2 = svgEl.select('.arrow2');
    const signLabel1 = svgEl.select('.sign-label1');
    const signLabel2 = svgEl.select('.sign-label2');
    const browserIcon = svgEl.select('.browser-icon');

    switch(step) {
      case 0:
        rootCert.attr('opacity', 0.3);
        interCert.attr('opacity', 0.3);
        endCert.attr('opacity', 0.3);
        arrow1.attr('opacity', 0);
        arrow2.attr('opacity', 0);
        signLabel1.attr('opacity', 0);
        signLabel2.attr('opacity', 0);
        browserIcon.attr('opacity', 0);
        break;

      case 1:
        rootCert.transition().duration(500).attr('opacity', 1);
        browserIcon.transition().duration(500).attr('opacity', 1);
        break;

      case 2:
        interCert.transition().duration(500).attr('opacity', 1);
        await sleep(300);
        if (!isPlaying && currentStep !== 2) return;
        arrow1.transition().duration(500).attr('opacity', 1);
        signLabel1.transition().duration(500).attr('opacity', 1);
        break;

      case 3:
        endCert.transition().duration(500).attr('opacity', 1);
        await sleep(300);
        if (!isPlaying && currentStep !== 3) return;
        arrow2.transition().duration(500).attr('opacity', 1);
        signLabel2.transition().duration(500).attr('opacity', 1);
        break;

      case 4:
        // All visible - nothing extra needed
        break;
    }

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      await animateStep(i);
      await sleep(1800);
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) { currentStep++; animateStep(currentStep); } }
  function prev() { pause(); if (currentStep > 0) { currentStep--; animateStep(currentStep); } }
  function applyFinalState() {
    svgEl.select('.step-label').text(stepLabels[maxStep]);
    svgEl.select('.root-cert').attr('opacity', 1);
    svgEl.select('.inter-cert').attr('opacity', 1);
    svgEl.select('.end-cert').attr('opacity', 1);
    svgEl.select('.arrow1').attr('opacity', 1);
    svgEl.select('.arrow2').attr('opacity', 1);
    svgEl.select('.sign-label1').attr('opacity', 1);
    svgEl.select('.sign-label2').attr('opacity', 1);
    svgEl.select('.browser-icon').attr('opacity', 1);
    currentStep = maxStep;
  }
  function skip() { pause(); applyFinalState(); }
  function replay() { pause(); currentStep = 0; animateStep(0); isPlaying = true; runAnimation(); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  function drawCertificate(parent: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, label: string, sublabel: string, color: string) {
    const g = parent.append('g');

    // Certificate shape (rectangle with folded corner)
    g.append('path')
      .attr('d', `M${x - 70},${y - 35} L${x + 50},${y - 35} L${x + 70},${y - 15} L${x + 70},${y + 35} L${x - 70},${y + 35} Z`)
      .attr('fill', colors.bgCard)
      .attr('stroke', color)
      .attr('stroke-width', 2.5);

    // Folded corner
    g.append('path')
      .attr('d', `M${x + 50},${y - 35} L${x + 50},${y - 15} L${x + 70},${y - 15}`)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);

    // Label
    g.append('text')
      .attr('x', x).attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('fill', color)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(label);

    // Sublabel
    g.append('text')
      .attr('x', x).attr('y', y + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text(sublabel);

    return g;
  }

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
      .attr('x', width / 2).attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Certificate Chain');

    // Step label (at bottom)
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', height - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // Certificates
    const rootG = svgEl.append('g').attr('class', 'root-cert').attr('opacity', 0.3);
    drawCertificate(rootG, centerX, rootY, 'Root CA', 'e.g. DigiCert', colors.yellow);

    const interG = svgEl.append('g').attr('class', 'inter-cert').attr('opacity', 0.3);
    drawCertificate(interG, centerX, interY, 'Intermediate CA', 'Signed by Root', colors.blue);

    const endG = svgEl.append('g').attr('class', 'end-cert').attr('opacity', 0.3);
    drawCertificate(endG, centerX, endY, 'example.com', 'Website certificate', colors.aqua);

    // Arrows
    svgEl.append('path')
      .attr('class', 'arrow1')
      .attr('d', `M${centerX},${rootY + 40} L${centerX},${interY - 45}`)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3)
      .attr('marker-end', 'url(#arrowhead)')
      .attr('opacity', 0);

    svgEl.append('path')
      .attr('class', 'arrow2')
      .attr('d', `M${centerX},${interY + 40} L${centerX},${endY - 45}`)
      .attr('stroke', colors.blue)
      .attr('stroke-width', 3)
      .attr('marker-end', 'url(#arrowhead2)')
      .attr('opacity', 0);

    // Arrowhead markers
    const defs = svgEl.append('defs');

    const marker1 = defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 7)
      .attr('refX', 9)
      .attr('refY', 3.5)
      .attr('orient', 'auto');
    marker1.append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', colors.yellow);

    const marker2 = defs.append('marker')
      .attr('id', 'arrowhead2')
      .attr('markerWidth', 10)
      .attr('markerHeight', 7)
      .attr('refX', 9)
      .attr('refY', 3.5)
      .attr('orient', 'auto');
    marker2.append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', colors.blue);

    // Sign labels
    svgEl.append('text')
      .attr('class', 'sign-label1')
      .attr('x', centerX + 50).attr('y', (rootY + interY) / 2 + 5)
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('signs');

    svgEl.append('text')
      .attr('class', 'sign-label2')
      .attr('x', centerX + 50).attr('y', (interY + endY) / 2 + 5)
      .attr('fill', colors.blue)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('signs');

    // Browser icon (simple representation)
    const browserG = svgEl.append('g')
      .attr('class', 'browser-icon')
      .attr('opacity', 0);

    browserG.append('rect')
      .attr('x', 50).attr('y', rootY - 25)
      .attr('width', 70).attr('height', 50)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2);

    browserG.append('text')
      .attr('x', 85).attr('y', rootY + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '10px')
      .text('Browser');

    browserG.append('line')
      .attr('x1', 120).attr('y1', rootY)
      .attr('x2', centerX - 75).attr('y2', rootY)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3');

    browserG.append('text')
      .attr('x', 85).attr('y', rootY + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('Pre-installed');

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
    max-height: 440px;
  }
</style>
