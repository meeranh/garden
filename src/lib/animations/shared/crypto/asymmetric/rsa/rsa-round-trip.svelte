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
  const height = 180;
  const maxStep = 4;

  const allElements = [
    'message-box', 'arrow1', 'encrypt-label',
    'cipher-box', 'arrow2', 'decrypt-label',
    'result-box', 'checkmark', 'combined-label'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: ['message-box'],
    1: ['message-box', 'arrow1', 'encrypt-label'],
    2: ['message-box', 'arrow1', 'encrypt-label', 'cipher-box'],
    3: ['message-box', 'arrow1', 'encrypt-label', 'cipher-box', 'arrow2', 'decrypt-label'],
    4: ['message-box', 'arrow1', 'encrypt-label', 'cipher-box', 'arrow2', 'decrypt-label', 'result-box', 'checkmark', 'combined-label']
  };

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    const visible = stepVisibility[step] || [];
    allElements.forEach((el) => {
      svgEl.select(`.${el}`).transition().duration(300).attr('opacity', visible.includes(el) ? 1 : 0);
    });
    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1200);
      if (!isPlaying) return;
    }
    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() { pause(); applyStep(0); currentStep = 0; isPlaying = true; runAnimation(); }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      bgCard: s.getPropertyValue('--color-bg-card').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
      accent: s.getPropertyValue('--color-accent').trim(),
      yellow: s.getPropertyValue('--color-math').trim(),
      green: '#b8bb26'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const boxY = 50;
    const boxWidth = 90;
    const boxHeight = 55;

    // Message box
    const msgBox = svgEl.append('g').attr('class', 'message-box').attr('opacity', 0);
    msgBox.append('rect')
      .attr('x', 30).attr('y', boxY)
      .attr('width', boxWidth).attr('height', boxHeight)
      .attr('rx', 6)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2);
    msgBox.append('text')
      .attr('x', 75).attr('y', boxY + 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text('Message');
    msgBox.append('text')
      .attr('x', 75).attr('y', boxY + 43)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('M = 2');

    // Arrow 1
    svgEl.append('path')
      .attr('class', 'arrow1')
      .attr('d', `M ${30 + boxWidth + 10} ${boxY + boxHeight/2} L ${30 + boxWidth + 55} ${boxY + boxHeight/2}`)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)')
      .attr('opacity', 0);

    // Encrypt label
    svgEl.append('text')
      .attr('class', 'encrypt-label')
      .attr('x', 30 + boxWidth + 35).attr('y', boxY + boxHeight/2 - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .text('2³ mod 55')
      .attr('opacity', 0);

    // Cipher box
    const cipherBox = svgEl.append('g').attr('class', 'cipher-box').attr('opacity', 0);
    cipherBox.append('rect')
      .attr('x', 200).attr('y', boxY)
      .attr('width', boxWidth).attr('height', boxHeight)
      .attr('rx', 6)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);
    cipherBox.append('text')
      .attr('x', 245).attr('y', boxY + 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text('Ciphertext');
    cipherBox.append('text')
      .attr('x', 245).attr('y', boxY + 43)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('C = 8');

    // Arrow 2
    svgEl.append('path')
      .attr('class', 'arrow2')
      .attr('d', `M ${200 + boxWidth + 10} ${boxY + boxHeight/2} L ${200 + boxWidth + 55} ${boxY + boxHeight/2}`)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)')
      .attr('opacity', 0);

    // Decrypt label
    svgEl.append('text')
      .attr('class', 'decrypt-label')
      .attr('x', 200 + boxWidth + 35).attr('y', boxY + boxHeight/2 - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '11px')
      .text('8²⁷ mod 55')
      .attr('opacity', 0);

    // Result box
    const resultBox = svgEl.append('g').attr('class', 'result-box').attr('opacity', 0);
    resultBox.append('rect')
      .attr('x', 370).attr('y', boxY)
      .attr('width', boxWidth).attr('height', boxHeight)
      .attr('rx', 6)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);
    resultBox.append('text')
      .attr('x', 415).attr('y', boxY + 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text('Decrypted');
    resultBox.append('text')
      .attr('x', 415).attr('y', boxY + 43)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('M = 2');

    // Checkmark
    svgEl.append('text')
      .attr('class', 'checkmark')
      .attr('x', 475).attr('y', boxY + 38)
      .attr('fill', colors.green)
      .attr('font-size', '24px')
      .text('✓')
      .attr('opacity', 0);

    // Combined label at bottom
    svgEl.append('text')
      .attr('class', 'combined-label')
      .attr('x', width / 2).attr('y', 145)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text('2³ × ²⁷ mod 55 = 2⁸¹ mod 55 = 2')
      .attr('opacity', 0);

    // Arrowhead marker
    svgEl.append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 7)
      .attr('refX', 9)
      .attr('refY', 3.5)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', colors.accent);

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
    max-height: 180px;
  }
</style>
