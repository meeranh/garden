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

  const width = 600;
  const height = 340;
  const maxStep = 7;

  const allElements = ['alice', 'bob', 'public-params', 'alice-keys', 'bob-keys', 'exchange', 'alice-shared', 'bob-shared', 'shared-link'];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['alice', 'bob'],
    2: ['alice', 'bob', 'public-params'],
    3: ['alice', 'bob', 'public-params', 'alice-keys'],
    4: ['alice', 'bob', 'public-params', 'alice-keys', 'bob-keys'],
    5: ['alice', 'bob', 'public-params', 'alice-keys', 'bob-keys', 'exchange'],
    6: ['alice', 'bob', 'public-params', 'alice-keys', 'bob-keys', 'exchange', 'alice-shared', 'bob-shared'],
    7: ['alice', 'bob', 'public-params', 'alice-keys', 'bob-keys', 'exchange', 'alice-shared', 'bob-shared', 'shared-link']
  };

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function applyStep(step: number) {
    const visible = stepVisibility[step] || [];
    allElements.forEach((el) => {
      svgEl.select(`.${el}`).transition().duration(400).attr('opacity', visible.includes(el) ? 1 : 0);
    });
    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(1200);
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
      aqua: '#8ec07c',
      orange: '#fe8019',
      purple: '#d3869b',
      green: '#b8bb26',
      red: '#fb4934'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const aliceX = 100;
    const bobX = 500;
    const centerX = width / 2;

    // Alice
    const alice = svgEl.append('g').attr('class', 'alice').attr('opacity', 0);
    alice.append('circle').attr('cx', aliceX).attr('cy', 50).attr('r', 30)
      .attr('fill', colors.bgCard).attr('stroke', colors.aqua).attr('stroke-width', 3);
    alice.append('text').attr('x', aliceX).attr('y', 55).attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '14px').attr('font-weight', 'bold').text('Alice');

    // Bob
    const bob = svgEl.append('g').attr('class', 'bob').attr('opacity', 0);
    bob.append('circle').attr('cx', bobX).attr('cy', 50).attr('r', 30)
      .attr('fill', colors.bgCard).attr('stroke', colors.orange).attr('stroke-width', 3);
    bob.append('text').attr('x', bobX).attr('y', 55).attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '14px').attr('font-weight', 'bold').text('Bob');

    // Public parameters
    const publicParams = svgEl.append('g').attr('class', 'public-params').attr('opacity', 0);
    publicParams.append('rect').attr('x', centerX - 100).attr('y', 25).attr('width', 200).attr('height', 50).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.purple);
    publicParams.append('text').attr('x', centerX).attr('y', 47).attr('text-anchor', 'middle')
      .attr('fill', colors.purple).attr('font-size', '11px').text('Public: Curve E, Generator G');
    publicParams.append('text').attr('x', centerX).attr('y', 65).attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '10px').text('(everyone knows these)');

    // Alice's keys
    const aliceKeys = svgEl.append('g').attr('class', 'alice-keys').attr('opacity', 0);
    aliceKeys.append('rect').attr('x', aliceX - 55).attr('y', 100).attr('width', 110).attr('height', 55).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.aqua);
    aliceKeys.append('text').attr('x', aliceX).attr('y', 120).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '11px').text('secret: a');
    aliceKeys.append('text').attr('x', aliceX).attr('y', 145).attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '13px').attr('font-weight', 'bold').text('A = aG');

    // Bob's keys
    const bobKeys = svgEl.append('g').attr('class', 'bob-keys').attr('opacity', 0);
    bobKeys.append('rect').attr('x', bobX - 55).attr('y', 100).attr('width', 110).attr('height', 55).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.orange);
    bobKeys.append('text').attr('x', bobX).attr('y', 120).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '11px').text('secret: b');
    bobKeys.append('text').attr('x', bobX).attr('y', 145).attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '13px').attr('font-weight', 'bold').text('B = bG');

    // Exchange arrows
    svgEl.append('defs').append('marker').attr('id', 'arrow-ecdh')
      .attr('markerWidth', 8).attr('markerHeight', 6).attr('refX', 7).attr('refY', 3).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 8 3, 0 6').attr('fill', colors.yellow);

    const exchange = svgEl.append('g').attr('class', 'exchange').attr('opacity', 0);
    exchange.append('line').attr('x1', aliceX + 60).attr('y1', 175).attr('x2', bobX - 60).attr('y2', 175)
      .attr('stroke', colors.yellow).attr('stroke-width', 2).attr('marker-end', 'url(#arrow-ecdh)');
    exchange.append('text').attr('x', centerX).attr('y', 170).attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '12px').text('A');
    exchange.append('line').attr('x1', bobX - 60).attr('y1', 195).attr('x2', aliceX + 60).attr('y2', 195)
      .attr('stroke', colors.yellow).attr('stroke-width', 2).attr('marker-end', 'url(#arrow-ecdh)');
    exchange.append('text').attr('x', centerX).attr('y', 210).attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '12px').text('B');

    // Alice's shared secret
    const aliceShared = svgEl.append('g').attr('class', 'alice-shared').attr('opacity', 0);
    aliceShared.append('rect').attr('x', aliceX - 60).attr('y', 230).attr('width', 120).attr('height', 55).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.green).attr('stroke-width', 2);
    aliceShared.append('text').attr('x', aliceX).attr('y', 253).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '11px').text('a × B =');
    aliceShared.append('text').attr('x', aliceX).attr('y', 275).attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '16px').attr('font-weight', 'bold').text('abG');

    // Bob's shared secret
    const bobShared = svgEl.append('g').attr('class', 'bob-shared').attr('opacity', 0);
    bobShared.append('rect').attr('x', bobX - 60).attr('y', 230).attr('width', 120).attr('height', 55).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.green).attr('stroke-width', 2);
    bobShared.append('text').attr('x', bobX).attr('y', 253).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '11px').text('b × A =');
    bobShared.append('text').attr('x', bobX).attr('y', 275).attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '16px').attr('font-weight', 'bold').text('abG');

    // Shared link
    const sharedLink = svgEl.append('g').attr('class', 'shared-link').attr('opacity', 0);
    sharedLink.append('line').attr('x1', aliceX + 65).attr('y1', 257).attr('x2', bobX - 65).attr('y2', 257)
      .attr('stroke', colors.green).attr('stroke-width', 2).attr('stroke-dasharray', '8,4');
    sharedLink.append('text').attr('x', centerX).attr('y', 252).attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '12px').attr('font-weight', 'bold').text('Same secret!');

    // Security note
    sharedLink.append('rect').attr('x', centerX - 130).attr('y', 300).attr('width', 260).attr('height', 30).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.red);
    sharedLink.append('text').attr('x', centerX).attr('y', 320).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '11px').text('Attacker sees A, B but cannot find abG');

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
    max-height: 340px;
  }
</style>
