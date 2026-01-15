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
  const height = 320;
  const maxStep = 5;

  const allElements = [
    'admin', 'user-alice', 'user-bob', 'user-carol',
    'grant-alice', 'grant-bob', 'revoke-carol',
    'permissions-alice', 'permissions-bob', 'permissions-carol'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['admin'],
    2: ['admin', 'user-alice', 'user-bob', 'user-carol'],
    3: ['admin', 'user-alice', 'user-bob', 'user-carol', 'grant-alice', 'permissions-alice'],
    4: ['admin', 'user-alice', 'user-bob', 'user-carol', 'grant-alice', 'permissions-alice', 'grant-bob', 'permissions-bob'],
    5: ['admin', 'user-alice', 'user-bob', 'user-carol', 'grant-alice', 'permissions-alice', 'grant-bob', 'permissions-bob', 'revoke-carol', 'permissions-carol']
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

    const labels = [
      '',
      'Admin creates the MultiChain network',
      'New users want to join the network',
      'Admin grants Alice: connect, send, receive',
      'Admin grants Bob: connect, send, receive, mine',
      'Carol only gets connect (read-only)'
    ];
    svgEl.select('.step-label').text(labels[step] || '');

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      applyStep(i);
      await sleep(2000);
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
      aqua: '#8ec07c',
      orange: '#fe8019',
      green: '#b8bb26',
      red: '#fb4934',
      yellow: s.getPropertyValue('--color-math').trim(),
      purple: '#d3869b'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '15px').attr('font-weight', 'bold')
      .text('MultiChain Permissions');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 48)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '12px')
      .text('');

    const adminX = 100;
    const adminY = 160;
    const userStartX = 350;
    const userY = [95, 160, 225];

    // Admin node
    const admin = svgEl.append('g').attr('class', 'admin').attr('opacity', 0);
    admin.append('circle')
      .attr('cx', adminX).attr('cy', adminY)
      .attr('r', 35)
      .attr('fill', colors.yellow).attr('fill-opacity', 0.2)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 3);
    admin.append('text')
      .attr('x', adminX).attr('y', adminY - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '12px').attr('font-weight', 'bold')
      .text('ADMIN');
    admin.append('text')
      .attr('x', adminX).attr('y', adminY + 10)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '18px')
      .text('👑');

    // User nodes
    const users = [
      { name: 'Alice', class: 'user-alice', y: userY[0], color: colors.aqua },
      { name: 'Bob', class: 'user-bob', y: userY[1], color: colors.purple },
      { name: 'Carol', class: 'user-carol', y: userY[2], color: colors.orange }
    ];

    users.forEach((user) => {
      const g = svgEl.append('g').attr('class', user.class).attr('opacity', 0);
      g.append('circle')
        .attr('cx', userStartX).attr('cy', user.y)
        .attr('r', 28)
        .attr('fill', colors.bgCard)
        .attr('stroke', user.color)
        .attr('stroke-width', 2);
      g.append('text')
        .attr('x', userStartX).attr('y', user.y + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', user.color).attr('font-size', '11px').attr('font-weight', 'bold')
        .text(user.name);
    });

    // Grant arrows
    svgEl.append('defs').append('marker').attr('id', 'arrow-grant')
      .attr('markerWidth', 8).attr('markerHeight', 6).attr('refX', 7).attr('refY', 3).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 8 3, 0 6').attr('fill', colors.green);

    const grantAlice = svgEl.append('g').attr('class', 'grant-alice').attr('opacity', 0);
    grantAlice.append('path')
      .attr('d', `M${adminX + 40},${adminY - 20} Q${230},${userY[0]} ${userStartX - 32},${userY[0]}`)
      .attr('stroke', colors.green).attr('stroke-width', 2).attr('fill', 'none')
      .attr('marker-end', 'url(#arrow-grant)');
    grantAlice.append('text')
      .attr('x', 210).attr('y', userY[0] - 20)
      .attr('fill', colors.green).attr('font-size', '9px')
      .text('GRANT');

    const grantBob = svgEl.append('g').attr('class', 'grant-bob').attr('opacity', 0);
    grantBob.append('path')
      .attr('d', `M${adminX + 38},${adminY} L${userStartX - 32},${userY[1]}`)
      .attr('stroke', colors.green).attr('stroke-width', 2).attr('fill', 'none')
      .attr('marker-end', 'url(#arrow-grant)');
    grantBob.append('text')
      .attr('x', 210).attr('y', userY[1] - 8)
      .attr('fill', colors.green).attr('font-size', '9px')
      .text('GRANT');

    const revokeCarol = svgEl.append('g').attr('class', 'revoke-carol').attr('opacity', 0);
    revokeCarol.append('path')
      .attr('d', `M${adminX + 40},${adminY + 20} Q${230},${userY[2]} ${userStartX - 32},${userY[2]}`)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 2).attr('fill', 'none').attr('stroke-dasharray', '4,3')
      .attr('marker-end', 'url(#arrow-grant)');
    revokeCarol.append('text')
      .attr('x', 205).attr('y', userY[2] + 25)
      .attr('fill', colors.fgMuted).attr('font-size', '9px')
      .text('LIMITED');

    // Permission badges
    const permAlice = svgEl.append('g').attr('class', 'permissions-alice').attr('opacity', 0);
    permAlice.append('rect')
      .attr('x', userStartX + 40).attr('y', userY[0] - 20)
      .attr('width', 130).attr('height', 40)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.aqua)
      .attr('stroke-width', 1);
    permAlice.append('text')
      .attr('x', userStartX + 105).attr('y', userY[0])
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '9px')
      .text('connect, send,');
    permAlice.append('text')
      .attr('x', userStartX + 105).attr('y', userY[0] + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '9px')
      .text('receive');

    const permBob = svgEl.append('g').attr('class', 'permissions-bob').attr('opacity', 0);
    permBob.append('rect')
      .attr('x', userStartX + 40).attr('y', userY[1] - 20)
      .attr('width', 130).attr('height', 40)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 1);
    permBob.append('text')
      .attr('x', userStartX + 105).attr('y', userY[1])
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple).attr('font-size', '9px')
      .text('connect, send,');
    permBob.append('text')
      .attr('x', userStartX + 105).attr('y', userY[1] + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple).attr('font-size', '9px')
      .text('receive, mine ⛏');

    const permCarol = svgEl.append('g').attr('class', 'permissions-carol').attr('opacity', 0);
    permCarol.append('rect')
      .attr('x', userStartX + 40).attr('y', userY[2] - 15)
      .attr('width', 130).attr('height', 30)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1);
    permCarol.append('text')
      .attr('x', userStartX + 105).attr('y', userY[2] + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '9px')
      .text('connect (read-only)');

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
