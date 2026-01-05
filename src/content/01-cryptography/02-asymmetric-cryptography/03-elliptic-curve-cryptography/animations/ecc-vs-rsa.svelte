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
  const height = 380;
  const maxStep = 5;

  const comparisons = [
    { security: '80-bit', ecc: 160, rsa: 1024, ratio: '6x' },
    { security: '112-bit', ecc: 224, rsa: 2048, ratio: '9x' },
    { security: '128-bit', ecc: 256, rsa: 3072, ratio: '12x' },
    { security: '192-bit', ecc: 384, rsa: 7680, ratio: '20x' },
    { security: '256-bit', ecc: 521, rsa: 15360, ratio: '30x' }
  ];

  const allElements = ['header', 'legend', 'row-0', 'row-1', 'row-2', 'row-3', 'row-4'];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['header', 'legend', 'row-0'],
    2: ['header', 'legend', 'row-0', 'row-1'],
    3: ['header', 'legend', 'row-0', 'row-1', 'row-2'],
    4: ['header', 'legend', 'row-0', 'row-1', 'row-2', 'row-3'],
    5: ['header', 'legend', 'row-0', 'row-1', 'row-2', 'row-3', 'row-4']
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
    // Animate bars for visible rows
    for (let i = 0; i < comparisons.length; i++) {
      if (visible.includes(`row-${i}`)) {
        const comp = comparisons[i];
        svgEl.select(`.ecc-bar-${i}`).transition().duration(400).attr('width', (comp.ecc / 15360) * 280);
        svgEl.select(`.rsa-bar-${i}`).transition().duration(600).attr('width', (comp.rsa / 15360) * 280);
      }
    }
    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1000);
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
      yellow: s.getPropertyValue('--color-math').trim(),
      green: '#b8bb26',
      orange: '#fe8019',
      aqua: '#8ec07c'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const barStartX = 150;
    const barMaxWidth = 280;

    // Header
    const header = svgEl.append('g').attr('class', 'header').attr('opacity', 0);
    header.append('text').attr('x', 40).attr('y', 35).attr('fill', colors.fg).attr('font-size', '14px').attr('font-weight', 'bold').text('Security');
    header.append('text').attr('x', barStartX).attr('y', 35).attr('fill', colors.fg).attr('font-size', '14px').attr('font-weight', 'bold').text('Key Size (bits)');
    header.append('text').attr('x', 600).attr('y', 35).attr('text-anchor', 'middle').attr('fill', colors.fg).attr('font-size', '14px').attr('font-weight', 'bold').text('Ratio');

    // Legend (stacked vertically, top right corner)
    const legend = svgEl.append('g').attr('class', 'legend').attr('opacity', 0);
    legend.append('rect').attr('x', 555).attr('y', 8).attr('width', 14).attr('height', 12).attr('fill', colors.aqua).attr('rx', 2);
    legend.append('text').attr('x', 573).attr('y', 18).attr('fill', colors.aqua).attr('font-size', '12px').text('ECC');
    legend.append('rect').attr('x', 555).attr('y', 24).attr('width', 14).attr('height', 12).attr('fill', colors.orange).attr('rx', 2);
    legend.append('text').attr('x', 573).attr('y', 34).attr('fill', colors.orange).attr('font-size', '12px').text('RSA');

    // Rows
    const startY = 60;
    const rowHeight = 62;

    comparisons.forEach((comp, i) => {
      const y = startY + i * rowHeight;
      const row = svgEl.append('g').attr('class', `row-${i}`).attr('opacity', 0);

      // Security label
      row.append('text').attr('x', 40).attr('y', y + 25).attr('fill', colors.yellow).attr('font-size', '14px').attr('font-weight', 'bold').text(comp.security);

      // ECC bar
      row.append('rect').attr('class', `ecc-bar-${i}`).attr('x', barStartX).attr('y', y + 8).attr('width', 0).attr('height', 18).attr('fill', colors.aqua).attr('fill-opacity', 0.7).attr('rx', 3);
      row.append('text').attr('x', barStartX + (comp.ecc / 15360) * barMaxWidth + 8).attr('y', y + 22).attr('fill', colors.aqua).attr('font-size', '13px').attr('font-weight', 'bold').text(`${comp.ecc}`);

      // RSA bar
      row.append('rect').attr('class', `rsa-bar-${i}`).attr('x', barStartX).attr('y', y + 32).attr('width', 0).attr('height', 18).attr('fill', colors.orange).attr('fill-opacity', 0.7).attr('rx', 3);
      row.append('text').attr('x', barStartX + (comp.rsa / 15360) * barMaxWidth + 8).attr('y', y + 46).attr('fill', colors.orange).attr('font-size', '13px').attr('font-weight', 'bold').text(`${comp.rsa}`);

      // Ratio
      row.append('text').attr('x', 600).attr('y', y + 35).attr('text-anchor', 'middle').attr('fill', colors.green).attr('font-size', '16px').attr('font-weight', 'bold').text(comp.ratio);
    });

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
    max-height: 380px;
  }
</style>
