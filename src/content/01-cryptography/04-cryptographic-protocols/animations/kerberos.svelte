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
  const height = 420;
  const maxStep = 6;

  // Layout
  const aliceX = 100;
  const aliceY = 210;
  const serverX = 550;
  const asY = 90;
  const tgsY = 210;
  const svcY = 330;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'Kerberos: Authenticate once, access everything',
    '① Alice logs in with password',
    '② AS verifies and returns TGT',
    '③ Alice requests file server access with TGT',
    '④ TGS returns service ticket',
    '⑤ Alice presents ticket to file server',
    '✓ Access granted! Password used only once.'
  ];

  function drawStickman(parent: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
    // Head
    parent.append('circle')
      .attr('cx', x).attr('cy', y - 35)
      .attr('r', 12)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.5);

    // Body
    parent.append('line')
      .attr('x1', x).attr('y1', y - 23)
      .attr('x2', x).attr('y2', y + 10)
      .attr('stroke', color)
      .attr('stroke-width', 2.5);

    // Arms
    parent.append('line')
      .attr('x1', x - 18).attr('y1', y - 10)
      .attr('x2', x + 18).attr('y2', y - 10)
      .attr('stroke', color)
      .attr('stroke-width', 2.5);

    // Left leg
    parent.append('line')
      .attr('x1', x).attr('y1', y + 10)
      .attr('x2', x - 14).attr('y2', y + 35)
      .attr('stroke', color)
      .attr('stroke-width', 2.5);

    // Right leg
    parent.append('line')
      .attr('x1', x).attr('y1', y + 10)
      .attr('x2', x + 14).attr('y2', y + 35)
      .attr('stroke', color)
      .attr('stroke-width', 2.5);
  }

  function drawServer(parent: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string, label: string, sublabel: string) {
    const g = parent.append('g');

    // Server body
    g.append('rect')
      .attr('x', x - 40).attr('y', y - 35)
      .attr('width', 80).attr('height', 70)
      .attr('rx', 6)
      .attr('fill', colors.bgCard)
      .attr('stroke', color)
      .attr('stroke-width', 2);

    // Server slots (horizontal lines)
    for (let i = 0; i < 3; i++) {
      g.append('rect')
        .attr('x', x - 32).attr('y', y - 25 + i * 18)
        .attr('width', 64).attr('height', 12)
        .attr('rx', 2)
        .attr('fill', color)
        .attr('opacity', 0.2);

      // Status light
      g.append('circle')
        .attr('cx', x + 25).attr('cy', y - 19 + i * 18)
        .attr('r', 3)
        .attr('fill', color)
        .attr('opacity', 0.6);
    }

    // Label
    g.append('text')
      .attr('x', x).attr('y', y + 52)
      .attr('text-anchor', 'middle')
      .attr('fill', color)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text(label);

    // Sublabel
    g.append('text')
      .attr('x', x).attr('y', y + 67)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '10px')
      .text(sublabel);

    return g;
  }

  async function animateStep(step: number) {
    svgEl.select('.step-label').text(stepLabels[step]);

    const msg1to = svgEl.select('.msg1-to');
    const msg1from = svgEl.select('.msg1-from');
    const msg2to = svgEl.select('.msg2-to');
    const msg2from = svgEl.select('.msg2-from');
    const msg3to = svgEl.select('.msg3-to');
    const tgtHeld = svgEl.select('.tgt-held');
    const svcTktHeld = svgEl.select('.svc-tkt-held');
    const accessGranted = svgEl.select('.access-granted');

    switch(step) {
      case 0:
        msg1to.attr('opacity', 0).attr('transform', `translate(${aliceX + 60}, ${aliceY - 50})`);
        msg1from.attr('opacity', 0).attr('transform', `translate(${serverX - 80}, ${asY})`);
        msg2to.attr('opacity', 0).attr('transform', `translate(${aliceX + 60}, ${aliceY})`);
        msg2from.attr('opacity', 0).attr('transform', `translate(${serverX - 80}, ${tgsY})`);
        msg3to.attr('opacity', 0).attr('transform', `translate(${aliceX + 60}, ${aliceY + 50})`);
        tgtHeld.attr('opacity', 0);
        svcTktHeld.attr('opacity', 0);
        accessGranted.attr('opacity', 0);
        break;

      case 1:
        msg1to.attr('opacity', 1)
          .transition().duration(900).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${serverX - 120}, ${asY})`);
        break;

      case 2:
        msg1to.transition().duration(300).attr('opacity', 0);
        await sleep(300);
        if (!isPlaying && currentStep !== 2) return;
        msg1from.attr('opacity', 1)
          .transition().duration(900).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${aliceX + 60}, ${aliceY - 50})`);
        await sleep(1000);
        if (!isPlaying && currentStep !== 2) return;
        msg1from.transition().duration(300).attr('opacity', 0);
        tgtHeld.transition().duration(400).attr('opacity', 1);
        break;

      case 3:
        msg2to.attr('opacity', 1)
          .transition().duration(900).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${serverX - 120}, ${tgsY})`);
        break;

      case 4:
        msg2to.transition().duration(300).attr('opacity', 0);
        await sleep(300);
        if (!isPlaying && currentStep !== 4) return;
        msg2from.attr('opacity', 1)
          .transition().duration(900).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${aliceX + 60}, ${aliceY})`);
        await sleep(1000);
        if (!isPlaying && currentStep !== 4) return;
        msg2from.transition().duration(300).attr('opacity', 0);
        svcTktHeld.transition().duration(400).attr('opacity', 1);
        break;

      case 5:
        msg3to.attr('opacity', 1)
          .transition().duration(900).ease(d3.easeQuadInOut)
          .attr('transform', `translate(${serverX - 120}, ${svcY})`);
        break;

      case 6:
        msg3to.transition().duration(300).attr('opacity', 0);
        await sleep(400);
        if (!isPlaying && currentStep !== 6) return;
        accessGranted.transition().duration(500).attr('opacity', 1);
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
    svgEl.select('.msg1-to').attr('opacity', 0);
    svgEl.select('.msg1-from').attr('opacity', 0);
    svgEl.select('.msg2-to').attr('opacity', 0);
    svgEl.select('.msg2-from').attr('opacity', 0);
    svgEl.select('.msg3-to').attr('opacity', 0);
    svgEl.select('.tgt-held').attr('opacity', 1);
    svgEl.select('.svc-tkt-held').attr('opacity', 1);
    svgEl.select('.access-granted').attr('opacity', 1);
    currentStep = maxStep;
  }
  function skip() { pause(); applyFinalState(); }
  function replay() { pause(); currentStep = 0; animateStep(0); isPlaying = true; runAnimation(); }
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
      .attr('x', width / 2).attr('y', 26)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Kerberos Authentication');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // === Alice (stickman) ===
    const aliceGroup = svgEl.append('g');
    drawStickman(aliceGroup, aliceX, aliceY, colors.purple);

    svgEl.append('text')
      .attr('x', aliceX).attr('y', aliceY + 60)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Alice');

    // === Servers ===
    const serversGroup = svgEl.append('g');
    drawServer(serversGroup, serverX, asY, colors.blue, 'AS', 'Authentication');
    drawServer(serversGroup, serverX, tgsY, colors.blue, 'TGS', 'Ticket Granting');
    drawServer(serversGroup, serverX, svcY, colors.aqua, 'File Server', 'Service');

    // === Tickets held by Alice (positioned to her right, below her) ===
    const tgtHeld = svgEl.append('g')
      .attr('class', 'tgt-held')
      .attr('opacity', 0);

    tgtHeld.append('rect')
      .attr('x', aliceX + 35).attr('y', aliceY + 50)
      .attr('width', 50).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    tgtHeld.append('text')
      .attr('x', aliceX + 60).attr('y', aliceY + 69)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('TGT');

    const svcTktHeld = svgEl.append('g')
      .attr('class', 'svc-tkt-held')
      .attr('opacity', 0);

    svcTktHeld.append('rect')
      .attr('x', aliceX + 90).attr('y', aliceY + 50)
      .attr('width', 65).attr('height', 28)
      .attr('rx', 4)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2);

    svcTktHeld.append('text')
      .attr('x', aliceX + 122).attr('y', aliceY + 69)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('Svc Tkt');

    // === Messages ===
    // Message 1: Alice -> AS (password)
    const msg1to = svgEl.append('g')
      .attr('class', 'msg1-to')
      .attr('opacity', 0)
      .attr('transform', `translate(${aliceX + 60}, ${aliceY - 50})`);

    msg1to.append('rect')
      .attr('x', -40).attr('y', -14)
      .attr('width', 80).attr('height', 28)
      .attr('rx', 14)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);

    msg1to.append('text')
      .attr('x', 0).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('password');

    // Message 1: AS -> Alice (TGT)
    const msg1from = svgEl.append('g')
      .attr('class', 'msg1-from')
      .attr('opacity', 0)
      .attr('transform', `translate(${serverX - 80}, ${asY})`);

    msg1from.append('rect')
      .attr('x', -30).attr('y', -14)
      .attr('width', 60).attr('height', 28)
      .attr('rx', 14)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    msg1from.append('text')
      .attr('x', 0).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('TGT');

    // Message 2: Alice -> TGS (TGT)
    const msg2to = svgEl.append('g')
      .attr('class', 'msg2-to')
      .attr('opacity', 0)
      .attr('transform', `translate(${aliceX + 60}, ${aliceY})`);

    msg2to.append('rect')
      .attr('x', -30).attr('y', -14)
      .attr('width', 60).attr('height', 28)
      .attr('rx', 14)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);

    msg2to.append('text')
      .attr('x', 0).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('TGT');

    // Message 2: TGS -> Alice (Service Ticket)
    const msg2from = svgEl.append('g')
      .attr('class', 'msg2-from')
      .attr('opacity', 0)
      .attr('transform', `translate(${serverX - 80}, ${tgsY})`);

    msg2from.append('rect')
      .attr('x', -35).attr('y', -14)
      .attr('width', 70).attr('height', 28)
      .attr('rx', 14)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2);

    msg2from.append('text')
      .attr('x', 0).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Svc Tkt');

    // Message 3: Alice -> Service (Service Ticket)
    const msg3to = svgEl.append('g')
      .attr('class', 'msg3-to')
      .attr('opacity', 0)
      .attr('transform', `translate(${aliceX + 60}, ${aliceY + 50})`);

    msg3to.append('rect')
      .attr('x', -35).attr('y', -14)
      .attr('width', 70).attr('height', 28)
      .attr('rx', 14)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.orange)
      .attr('stroke-width', 2);

    msg3to.append('text')
      .attr('x', 0).attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Svc Tkt');

    // === Access Granted ===
    const accessGranted = svgEl.append('g')
      .attr('class', 'access-granted')
      .attr('opacity', 0);

    accessGranted.append('rect')
      .attr('x', width / 2 - 85).attr('y', height - 50)
      .attr('width', 170).attr('height', 38)
      .attr('rx', 19)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 3);

    accessGranted.append('text')
      .attr('x', width / 2).attr('y', height - 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '15px')
      .attr('font-weight', 'bold')
      .text('✓ Access Granted');

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
    max-height: 420px;
  }
</style>
