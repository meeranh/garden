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
  const height = 400;
  const maxStep = 6;

  // Layout
  const browserX = 100;
  const serverX = 600;
  const chainX = 350;
  const startY = 120;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'Browser connects to example.com',
    'Server sends certificate chain',
    'Browser verifies: Is end cert signed by intermediate?',
    'Browser verifies: Is intermediate signed by root?',
    'Browser checks: Is root CA trusted?',
    'All checks pass!',
    'Secure connection established'
  ];

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    const certChain = svgEl.select('.cert-chain');
    const check1 = svgEl.select('.check1');
    const check2 = svgEl.select('.check2');
    const check3 = svgEl.select('.check3');
    const verifyLine1 = svgEl.select('.verify-line1');
    const verifyLine2 = svgEl.select('.verify-line2');
    const verifyLine3 = svgEl.select('.verify-line3');
    const secureConn = svgEl.selectAll('.secure-conn');
    const padlock = svgEl.select('.padlock');

    switch(step) {
      case 0:
        certChain.attr('opacity', 0).attr('transform', `translate(${serverX - 50}, ${startY})`);
        check1.attr('opacity', 0);
        check2.attr('opacity', 0);
        check3.attr('opacity', 0);
        verifyLine1.attr('opacity', 0);
        verifyLine2.attr('opacity', 0);
        verifyLine3.attr('opacity', 0);
        secureConn.attr('opacity', 0);
        padlock.attr('opacity', 0);
        break;

      case 1:
        certChain.attr('opacity', 1)
          .transition().duration(1000).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${chainX}, ${startY})`);
        break;

      case 2:
        verifyLine1.transition().duration(400).attr('opacity', 1);
        await sleep(500);
        if (!isPlaying && currentStep !== 2) return;
        check1.transition().duration(400).attr('opacity', 1);
        break;

      case 3:
        verifyLine2.transition().duration(400).attr('opacity', 1);
        await sleep(500);
        if (!isPlaying && currentStep !== 3) return;
        check2.transition().duration(400).attr('opacity', 1);
        break;

      case 4:
        verifyLine3.transition().duration(400).attr('opacity', 1);
        await sleep(500);
        if (!isPlaying && currentStep !== 4) return;
        check3.transition().duration(400).attr('opacity', 1);
        break;

      case 5:
        // Flash all checks
        check1.transition().duration(200).attr('fill', colors.green);
        check2.transition().duration(200).attr('fill', colors.green);
        check3.transition().duration(200).attr('fill', colors.green);
        break;

      case 6:
        secureConn.transition().duration(500).attr('opacity', 1);
        padlock.transition().duration(500).attr('opacity', 1);
        break;
    }

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;
    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      await animateStep(i);
      await sleep(1600);
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) { currentStep++; animateStep(currentStep); } }
  function prev() { pause(); if (currentStep > 0) { currentStep--; animateStep(currentStep); } }
  function applyFinalState() {
    svgEl.select('.step-label').text(stepLabels[maxStep]);
    svgEl.select('.cert-chain').attr('opacity', 1).attr('transform', `translate(${chainX}, ${startY})`);
    svgEl.select('.check1').attr('opacity', 1).attr('fill', colors.green);
    svgEl.select('.check2').attr('opacity', 1).attr('fill', colors.green);
    svgEl.select('.check3').attr('opacity', 1).attr('fill', colors.green);
    svgEl.select('.verify-line1').attr('opacity', 1);
    svgEl.select('.verify-line2').attr('opacity', 1);
    svgEl.select('.verify-line3').attr('opacity', 1);
    svgEl.selectAll('.secure-conn').attr('opacity', 1);
    svgEl.select('.padlock').attr('opacity', 1);
    currentStep = maxStep;
  }
  function skip() { pause(); applyFinalState(); }
  function replay() { pause(); currentStep = 0; animateStep(0); isPlaying = true; runAnimation(); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  function drawMiniCert(parent: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, label: string, color: string) {
    parent.append('rect')
      .attr('x', x - 45).attr('y', y - 18)
      .attr('width', 90).attr('height', 36)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', color)
      .attr('stroke-width', 2);

    parent.append('text')
      .attr('x', x).attr('y', y + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', color)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text(label);
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
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Certificate Verification');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 52)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // Browser
    const browser = svgEl.append('g');
    browser.append('rect')
      .attr('x', browserX - 40).attr('y', 80)
      .attr('width', 80).attr('height', 60)
      .attr('rx', 6)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);

    browser.append('text')
      .attr('x', browserX).attr('y', 115)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Browser');

    // Server
    const server = svgEl.append('g');
    server.append('rect')
      .attr('x', serverX - 40).attr('y', 80)
      .attr('width', 80).attr('height', 60)
      .attr('rx', 6)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2);

    server.append('text')
      .attr('x', serverX).attr('y', 108)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('example.com');

    server.append('text')
      .attr('x', serverX).attr('y', 123)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '10px')
      .text('Server');

    // Certificate chain (movable group)
    const certChain = svgEl.append('g')
      .attr('class', 'cert-chain')
      .attr('opacity', 0)
      .attr('transform', `translate(${serverX - 50}, ${startY})`);

    // Draw mini certs in chain
    drawMiniCert(certChain, 0, 0, 'Root CA', colors.yellow);
    drawMiniCert(certChain, 0, 60, 'Intermediate', colors.blue);
    drawMiniCert(certChain, 0, 120, 'example.com', colors.aqua);

    // Connecting lines in chain
    certChain.append('line')
      .attr('x1', 0).attr('y1', 18)
      .attr('x2', 0).attr('y2', 42)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2);

    certChain.append('line')
      .attr('x1', 0).attr('y1', 78)
      .attr('x2', 0).attr('y2', 102)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2);

    // Verification lines (from browser to each cert)
    svgEl.append('line')
      .attr('class', 'verify-line1')
      .attr('x1', browserX + 40).attr('y1', 110)
      .attr('x2', chainX - 50).attr('y2', startY + 120)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3')
      .attr('opacity', 0);

    svgEl.append('line')
      .attr('class', 'verify-line2')
      .attr('x1', browserX + 40).attr('y1', 105)
      .attr('x2', chainX - 50).attr('y2', startY + 60)
      .attr('stroke', colors.blue)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3')
      .attr('opacity', 0);

    svgEl.append('line')
      .attr('class', 'verify-line3')
      .attr('x1', browserX + 40).attr('y1', 100)
      .attr('x2', chainX - 50).attr('y2', startY)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3')
      .attr('opacity', 0);

    // Check marks
    svgEl.append('text')
      .attr('class', 'check1')
      .attr('x', chainX + 60).attr('y', startY + 125)
      .attr('fill', colors.green)
      .attr('font-size', '18px')
      .attr('opacity', 0)
      .text('✓');

    svgEl.append('text')
      .attr('class', 'check2')
      .attr('x', chainX + 60).attr('y', startY + 65)
      .attr('fill', colors.green)
      .attr('font-size', '18px')
      .attr('opacity', 0)
      .text('✓');

    svgEl.append('text')
      .attr('class', 'check3')
      .attr('x', chainX + 60).attr('y', startY + 5)
      .attr('fill', colors.green)
      .attr('font-size', '18px')
      .attr('opacity', 0)
      .text('✓');

    // Secure connection path: Browser → down → right → Secure box → right → up → Server
    const secureY = 355;
    const secureBoxLeft = width/2 - 50;
    const secureBoxRight = width/2 + 50;

    // Left side of connection (Browser to Secure box)
    svgEl.append('path')
      .attr('class', 'secure-conn')
      .attr('d', `M${browserX},140 L${browserX},${secureY} L${secureBoxLeft},${secureY}`)
      .attr('fill', 'none')
      .attr('stroke', colors.green)
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    // Right side of connection (Secure box to Server)
    svgEl.append('path')
      .attr('class', 'secure-conn')
      .attr('d', `M${secureBoxRight},${secureY} L${serverX},${secureY} L${serverX},140`)
      .attr('fill', 'none')
      .attr('stroke', colors.green)
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    // Secure box
    const padlock = svgEl.append('g')
      .attr('class', 'padlock')
      .attr('opacity', 0);

    padlock.append('rect')
      .attr('x', secureBoxLeft).attr('y', 330)
      .attr('width', 100).attr('height', 50)
      .attr('rx', 6)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);

    padlock.append('text')
      .attr('x', width/2).attr('y', 362)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Secure');

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
