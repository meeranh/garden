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

  const width = 650;
  const height = 370;
  const maxStep = 5;

  // Pixel data: original value, binary, new value after LSB replacement, message bit
  const pixels = [
    { dec: 181, bin: '10110101', newDec: 180, newBin: '10110100', msg: '0', color: '#b45a5a' },
    { dec: 110, bin: '01101110', newDec: 111, newBin: '01101111', msg: '1', color: '#5ab46e' },
    { dec: 203, bin: '11001011', newDec: 202, newBin: '11001010', msg: '0', color: '#5a6eb4' },
    { dec: 157, bin: '10011101', newDec: 156, newBin: '10011100', msg: '0', color: '#9c5ab4' }
  ];

  const stepLabels = [
    'Original pixel values (decimal and binary)',
    'The LSB (last bit) has minimal visual impact: ±1',
    'Secret message "Hi" converted to bits',
    'Replace each pixel\'s LSB with a message bit',
    'New pixel values changed by only ±1',
    'Image looks identical, but secret data is hidden inside'
  ];

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function showStep(step: number, animate: boolean = true) {
    if (!svgEl) return;
    const duration = animate ? 400 : 0;

    svgEl.select('.step-label').text(stepLabels[step]);

    // Step 0: Original pixels
    svgEl.select('.original-section')
      .transition().duration(duration)
      .attr('opacity', step >= 0 ? 1 : 0);

    // Step 1: LSB highlight
    svgEl.select('.lsb-highlight')
      .transition().duration(duration)
      .attr('opacity', step >= 1 ? 1 : 0);

    // Step 2: Secret message
    svgEl.select('.secret-section')
      .transition().duration(duration)
      .attr('opacity', step >= 2 ? 1 : 0);

    // Step 3: Arrow
    svgEl.select('.arrow-section')
      .transition().duration(duration)
      .attr('opacity', step >= 3 ? 1 : 0);

    // Step 4: Modified pixels
    svgEl.select('.modified-section')
      .transition().duration(duration)
      .attr('opacity', step >= 4 ? 1 : 0);

    // Step 5: Result box
    svgEl.select('.result-box')
      .transition().duration(duration)
      .attr('opacity', step >= 5 ? 1 : 0);

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
    svgEl.select('.original-section').attr('opacity', 1);
    svgEl.select('.lsb-highlight').attr('opacity', 1);
    svgEl.select('.secret-section').attr('opacity', 1);
    svgEl.select('.arrow-section').attr('opacity', 1);
    svgEl.select('.modified-section').attr('opacity', 1);
    svgEl.select('.result-box').attr('opacity', 1);
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
      green: '#b8bb26'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const pixelWidth = 70;
    const pixelGap = 14;
    const startX = 30;

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('LSB Steganography');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', height - 18)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // === ORIGINAL SECTION ===
    const origSection = svgEl.append('g')
      .attr('class', 'original-section')
      .attr('opacity', 0);

    origSection.append('text')
      .attr('x', startX).attr('y', 50)
      .attr('fill', colors.fg)
      .attr('font-size', '12px')
      .text('original pixels');

    pixels.forEach((p, i) => {
      const x = startX + i * (pixelWidth + pixelGap);
      const centerX = x + pixelWidth / 2;

      // Colored pixel box
      origSection.append('rect')
        .attr('x', x).attr('y', 60)
        .attr('width', pixelWidth).attr('height', 26)
        .attr('fill', p.color)
        .attr('rx', 4);

      // Decimal value
      origSection.append('text')
        .attr('x', centerX).attr('y', 106)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.fg)
        .attr('font-size', '15px')
        .attr('font-weight', 'bold')
        .text(p.dec);

      // Binary value (first 7 bits)
      origSection.append('text')
        .attr('x', centerX + 2).attr('y', 124)
        .attr('text-anchor', 'end')
        .attr('fill', colors.fgMuted)
        .attr('font-size', '11px')
        .text(p.bin.slice(0, 7));

      // Binary value (LSB - last bit)
      origSection.append('text')
        .attr('x', centerX + 5).attr('y', 124)
        .attr('text-anchor', 'start')
        .attr('fill', colors.fg)
        .attr('font-size', '11px')
        .text(p.bin.charAt(7));
    });

    // === LSB HIGHLIGHT ===
    const lsbHighlight = svgEl.append('g')
      .attr('class', 'lsb-highlight')
      .attr('opacity', 0);

    pixels.forEach((_, i) => {
      const x = startX + i * (pixelWidth + pixelGap);
      const centerX = x + pixelWidth / 2;

      lsbHighlight.append('rect')
        .attr('x', centerX + 3).attr('y', 111)
        .attr('width', 12).attr('height', 16)
        .attr('fill', colors.yellow)
        .attr('opacity', 0.35)
        .attr('rx', 2);
    });

    // === SECRET MESSAGE SECTION ===
    const secretSection = svgEl.append('g')
      .attr('class', 'secret-section')
      .attr('opacity', 0);

    secretSection.append('text')
      .attr('x', startX).attr('y', 150)
      .attr('fill', colors.orange)
      .attr('font-size', '12px')
      .text('secret: "Hi"');

    pixels.forEach((p, i) => {
      const x = startX + i * (pixelWidth + pixelGap);
      const centerX = x + pixelWidth / 2;

      secretSection.append('rect')
        .attr('x', centerX - 12).attr('y', 158)
        .attr('width', 24).attr('height', 22)
        .attr('fill', colors.orange)
        .attr('opacity', 0.2)
        .attr('stroke', colors.orange)
        .attr('stroke-width', 1)
        .attr('rx', 3);

      secretSection.append('text')
        .attr('x', centerX).attr('y', 175)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.orange)
        .attr('font-size', '15px')
        .attr('font-weight', 'bold')
        .text(p.msg);
    });

    // === ARROW SECTION ===
    const arrowSection = svgEl.append('g')
      .attr('class', 'arrow-section')
      .attr('opacity', 0);

    arrowSection.append('text')
      .attr('x', 180).attr('y', 200)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '12px')
      .text('replace LSB');

    arrowSection.append('text')
      .attr('x', 180).attr('y', 215)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '16px')
      .text('↓');

    // === MODIFIED SECTION ===
    const modSection = svgEl.append('g')
      .attr('class', 'modified-section')
      .attr('opacity', 0);

    modSection.append('text')
      .attr('x', startX).attr('y', 238)
      .attr('fill', colors.fg)
      .attr('font-size', '12px')
      .text('modified pixels');

    pixels.forEach((p, i) => {
      const x = startX + i * (pixelWidth + pixelGap);
      const centerX = x + pixelWidth / 2;

      // Colored pixel box (same color - visually identical)
      modSection.append('rect')
        .attr('x', x).attr('y', 248)
        .attr('width', pixelWidth).attr('height', 26)
        .attr('fill', p.color)
        .attr('rx', 4);

      const changed = p.dec !== p.newDec;

      // New decimal value
      modSection.append('text')
        .attr('x', centerX).attr('y', 294)
        .attr('text-anchor', 'middle')
        .attr('fill', changed ? colors.green : colors.fg)
        .attr('font-size', '15px')
        .attr('font-weight', 'bold')
        .text(p.newDec);

      // Binary value (first 7 bits)
      modSection.append('text')
        .attr('x', centerX + 2).attr('y', 312)
        .attr('text-anchor', 'end')
        .attr('fill', colors.fgMuted)
        .attr('font-size', '11px')
        .text(p.newBin.slice(0, 7));

      // Binary value (LSB - now contains message bit)
      modSection.append('text')
        .attr('x', centerX + 5).attr('y', 312)
        .attr('text-anchor', 'start')
        .attr('fill', colors.orange)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(p.newBin.charAt(7));

      // Show +1 or -1 change
      if (changed) {
        const diff = p.newDec - p.dec;
        modSection.append('text')
          .attr('x', centerX + 26).attr('y', 294)
          .attr('text-anchor', 'start')
          .attr('fill', colors.green)
          .attr('font-size', '11px')
          .text(diff > 0 ? '+1' : '-1');
      }
    });

    // === RESULT BOX ===
    const resultBox = svgEl.append('g')
      .attr('class', 'result-box')
      .attr('opacity', 0);

    resultBox.append('rect')
      .attr('x', 400).attr('y', 145)
      .attr('width', 220).attr('height', 65)
      .attr('fill', colors.green)
      .attr('opacity', 0.12)
      .attr('stroke', colors.green)
      .attr('stroke-width', 1.5)
      .attr('rx', 4);

    resultBox.append('text')
      .attr('x', 510).attr('y', 170)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '12px')
      .text('max change: ±1');

    resultBox.append('text')
      .attr('x', 510).attr('y', 192)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('invisible to human eye');

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
    max-height: 370px;
  }
</style>
