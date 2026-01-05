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
  const height = 450;
  const maxStep = 9;

  const allElements = [
    'alice-label', 'bob-label', 'legend',
    'alice-keys', 'bob-knows',
    'message', 'hash-step', 'random-step', 'compute-s',
    'signature-out', 'send-arrow', 'bob-receives',
    'bob-verify', 'bob-check', 'valid'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['alice-label', 'bob-label', 'legend'],
    2: ['alice-label', 'bob-label', 'legend', 'alice-keys', 'bob-knows'],
    3: ['alice-label', 'bob-label', 'legend', 'alice-keys', 'bob-knows', 'message', 'hash-step'],
    4: ['alice-label', 'bob-label', 'legend', 'alice-keys', 'bob-knows', 'message', 'hash-step', 'random-step'],
    5: ['alice-label', 'bob-label', 'legend', 'alice-keys', 'bob-knows', 'message', 'hash-step', 'random-step', 'compute-s'],
    6: ['alice-label', 'bob-label', 'legend', 'alice-keys', 'bob-knows', 'message', 'hash-step', 'random-step', 'compute-s', 'signature-out', 'send-arrow', 'bob-receives'],
    7: ['alice-label', 'bob-label', 'legend', 'alice-keys', 'bob-knows', 'message', 'hash-step', 'random-step', 'compute-s', 'signature-out', 'send-arrow', 'bob-receives', 'bob-verify'],
    8: ['alice-label', 'bob-label', 'legend', 'alice-keys', 'bob-knows', 'message', 'hash-step', 'random-step', 'compute-s', 'signature-out', 'send-arrow', 'bob-receives', 'bob-verify', 'bob-check'],
    9: ['alice-label', 'bob-label', 'legend', 'alice-keys', 'bob-knows', 'message', 'hash-step', 'random-step', 'compute-s', 'signature-out', 'send-arrow', 'bob-receives', 'bob-verify', 'bob-check', 'valid']
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
      await sleep(1400);
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

    // Layout constants
    const aliceX = 160;
    const bobX = 560;
    const dividerX = 340;

    // Arrow marker
    svgEl.append('defs').append('marker').attr('id', 'arr')
      .attr('markerWidth', 8).attr('markerHeight', 6).attr('refX', 7).attr('refY', 3).attr('orient', 'auto')
      .append('polygon').attr('points', '0 0, 8 3, 0 6').attr('fill', colors.yellow);

    // === HEADERS ===

    // Alice label
    const aliceLabel = svgEl.append('g').attr('class', 'alice-label').attr('opacity', 0);
    aliceLabel.append('text').attr('x', aliceX).attr('y', 28).attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '16px').attr('font-weight', 'bold').text('Alice (Sign)');
    aliceLabel.append('line').attr('x1', 20).attr('y1', 42).attr('x2', dividerX - 30).attr('y2', 42)
      .attr('stroke', colors.aqua).attr('stroke-width', 1).attr('opacity', 0.5);

    // Bob label
    const bobLabel = svgEl.append('g').attr('class', 'bob-label').attr('opacity', 0);
    bobLabel.append('text').attr('x', 440).attr('y', 28).attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '16px').attr('font-weight', 'bold').text('Bob (Verify)');
    bobLabel.append('line').attr('x1', dividerX + 10).attr('y1', 42).attr('x2', 530).attr('y2', 42)
      .attr('stroke', colors.orange).attr('stroke-width', 1).attr('opacity', 0.5);

    // === LEGEND (top right) ===
    const legend = svgEl.append('g').attr('class', 'legend').attr('opacity', 0);
    const legX = 565, legY = 12;
    legend.append('rect').attr('x', legX).attr('y', legY).attr('width', 145).attr('height', 95).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted).attr('stroke-opacity', 0.5);
    legend.append('text').attr('x', legX + 8).attr('y', legY + 16)
      .attr('fill', colors.fgMuted).attr('font-size', '10px').attr('font-weight', 'bold').text('VARIABLES');

    const vars = [
      { sym: 'd', desc: 'private key', col: colors.red },
      { sym: 'Q', desc: 'public key (dG)', col: colors.green },
      { sym: 'h', desc: 'message hash', col: colors.yellow },
      { sym: 'k', desc: 'random nonce', col: colors.orange },
      { sym: 'r, s', desc: 'signature', col: colors.green }
    ];
    vars.forEach((v, i) => {
      const ly = legY + 32 + i * 13;
      legend.append('text').attr('x', legX + 12).attr('y', ly)
        .attr('fill', v.col).attr('font-size', '11px').attr('font-weight', 'bold').text(v.sym);
      legend.append('text').attr('x', legX + 45).attr('y', ly)
        .attr('fill', colors.fgMuted).attr('font-size', '10px').text(v.desc);
    });

    // === ALICE SIDE ===

    // Alice's keys
    const aliceKeys = svgEl.append('g').attr('class', 'alice-keys').attr('opacity', 0);
    aliceKeys.append('text').attr('x', 30).attr('y', 68)
      .attr('fill', colors.red).attr('font-size', '12px').text('Private:');
    aliceKeys.append('text').attr('x', 85).attr('y', 68)
      .attr('fill', colors.red).attr('font-size', '13px').attr('font-weight', 'bold').text('d');
    aliceKeys.append('text').attr('x', 120).attr('y', 68)
      .attr('fill', colors.green).attr('font-size', '12px').text('Public:');
    aliceKeys.append('text').attr('x', 170).attr('y', 68)
      .attr('fill', colors.green).attr('font-size', '13px').attr('font-weight', 'bold').text('Q = dG');

    // Bob knows Q
    const bobKnows = svgEl.append('g').attr('class', 'bob-knows').attr('opacity', 0);
    bobKnows.append('text').attr('x', 360).attr('y', 68)
      .attr('fill', colors.fg).attr('font-size', '12px').text('Knows:');
    bobKnows.append('text').attr('x', 410).attr('y', 68)
      .attr('fill', colors.green).attr('font-size', '13px').attr('font-weight', 'bold').text('Q');
    bobKnows.append('text').attr('x', 430).attr('y', 68)
      .attr('fill', colors.fgMuted).attr('font-size', '11px').text('(public key)');

    // Step 1: Message → Hash → h
    const message = svgEl.append('g').attr('class', 'message').attr('opacity', 0);
    message.append('rect').attr('x', 25).attr('y', 88).attr('width', 80).attr('height', 26).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.purple);
    message.append('text').attr('x', 65).attr('y', 106).attr('text-anchor', 'middle')
      .attr('fill', colors.purple).attr('font-size', '11px').text('message m');

    const hashStep = svgEl.append('g').attr('class', 'hash-step').attr('opacity', 0);
    hashStep.append('line').attr('x1', 110).attr('y1', 101).attr('x2', 135).attr('y2', 101)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr)');
    hashStep.append('rect').attr('x', 140).attr('y', 88).attr('width', 50).attr('height', 26).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted);
    hashStep.append('text').attr('x', 165).attr('y', 106).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '11px').text('Hash');
    hashStep.append('line').attr('x1', 195).attr('y1', 101).attr('x2', 220).attr('y2', 101)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr)');
    hashStep.append('rect').attr('x', 225).attr('y', 88).attr('width', 28).attr('height', 26).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.yellow);
    hashStep.append('text').attr('x', 239).attr('y', 106).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '14px').attr('font-weight', 'bold').text('h');

    // Step 2: Random k → R = kG → r
    const randomStep = svgEl.append('g').attr('class', 'random-step').attr('opacity', 0);
    randomStep.append('rect').attr('x', 25).attr('y', 130).attr('width', 80).attr('height', 26).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.orange);
    randomStep.append('text').attr('x', 65).attr('y', 148).attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '11px').text('random k');
    randomStep.append('line').attr('x1', 110).attr('y1', 143).attr('x2', 135).attr('y2', 143)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr)');
    randomStep.append('rect').attr('x', 140).attr('y', 130).attr('width', 65).attr('height', 26).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted);
    randomStep.append('text').attr('x', 172).attr('y', 148).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '11px').text('R = kG');
    randomStep.append('line').attr('x1', 210).attr('y1', 143).attr('x2', 235).attr('y2', 143)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr)');
    // r in a box
    randomStep.append('rect').attr('x', 240).attr('y', 130).attr('width', 28).attr('height', 26).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.yellow);
    randomStep.append('text').attr('x', 254).attr('y', 148).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '14px').attr('font-weight', 'bold').text('r');
    // Label below
    randomStep.append('text').attr('x', 254).attr('y', 170).attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '9px').text('(x-coord of R)');

    // Step 3: Compute s
    const computeS = svgEl.append('g').attr('class', 'compute-s').attr('opacity', 0);
    computeS.append('rect').attr('x', 30).attr('y', 185).attr('width', 250).attr('height', 40).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.yellow).attr('stroke-width', 1.5);
    computeS.append('text').attr('x', 155).attr('y', 203).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '11px').text('Compute signature value:');
    computeS.append('text').attr('x', 155).attr('y', 220).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '13px').attr('font-weight', 'bold').text('s = (h + d·r) / k');

    // Signature output
    const signatureOut = svgEl.append('g').attr('class', 'signature-out').attr('opacity', 0);
    signatureOut.append('line').attr('x1', 155).attr('y1', 230).attr('x2', 155).attr('y2', 255)
      .attr('stroke', colors.green).attr('stroke-width', 2).attr('marker-end', 'url(#arr)');
    signatureOut.append('rect').attr('x', 70).attr('y', 260).attr('width', 170).attr('height', 35).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.green).attr('stroke-width', 2);
    signatureOut.append('text').attr('x', 155).attr('y', 283).attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '14px').attr('font-weight', 'bold').text('Signature (r, s)');

    // Send arrow (connects to Bob's receives)
    const sendArrow = svgEl.append('g').attr('class', 'send-arrow').attr('opacity', 0);
    sendArrow.append('line').attr('x1', 245).attr('y1', 277).attr('x2', 350).attr('y2', 277)
      .attr('stroke', colors.yellow).attr('stroke-width', 2).attr('stroke-dasharray', '5,3').attr('marker-end', 'url(#arr)');
    sendArrow.append('text').attr('x', 297).attr('y', 268).attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '9px').text('send');

    // === BOB SIDE (verification) ===

    // Bob receives
    const bobReceives = svgEl.append('g').attr('class', 'bob-receives').attr('opacity', 0);
    bobReceives.append('rect').attr('x', 355).attr('y', 260).attr('width', 170).attr('height', 35).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.purple);
    bobReceives.append('text').attr('x', 375).attr('y', 282)
      .attr('fill', colors.fg).attr('font-size', '11px').text('Gets:');
    bobReceives.append('text').attr('x', 410).attr('y', 282)
      .attr('fill', colors.purple).attr('font-size', '12px').attr('font-weight', 'bold').text('m');
    bobReceives.append('text').attr('x', 425).attr('y', 282)
      .attr('fill', colors.fg).attr('font-size', '11px').text('and');
    bobReceives.append('text').attr('x', 465).attr('y', 282)
      .attr('fill', colors.green).attr('font-size', '12px').attr('font-weight', 'bold').text('(r, s)');

    // Bob verification steps
    const bobVerify = svgEl.append('g').attr('class', 'bob-verify').attr('opacity', 0);

    // Hash m → h
    bobVerify.append('line').attr('x1', 440).attr('y1', 300).attr('x2', 440).attr('y2', 320)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr)');
    bobVerify.append('rect').attr('x', 370).attr('y', 325).attr('width', 140).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.fgMuted);
    bobVerify.append('text').attr('x', 400).attr('y', 344)
      .attr('fill', colors.fg).attr('font-size', '11px').text('Hash(m) →');
    bobVerify.append('text').attr('x', 475).attr('y', 344)
      .attr('fill', colors.yellow).attr('font-size', '13px').attr('font-weight', 'bold').text('h');

    // Compute R'
    bobVerify.append('line').attr('x1', 440).attr('y1', 358).attr('x2', 440).attr('y2', 378)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr)');
    bobVerify.append('rect').attr('x', 355).attr('y', 383).attr('width', 170).attr('height', 28).attr('rx', 4)
      .attr('fill', colors.bgCard).attr('stroke', colors.orange);
    bobVerify.append('text').attr('x', 440).attr('y', 402).attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '12px').attr('font-weight', 'bold').text("R' = (h·G + r·Q) / s");

    // Bob check
    const bobCheck = svgEl.append('g').attr('class', 'bob-check').attr('opacity', 0);
    bobCheck.append('line').attr('x1', 530).attr('y1', 397).attr('x2', 560).attr('y2', 397)
      .attr('stroke', colors.fgMuted).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr)');
    bobCheck.append('rect').attr('x', 565).attr('y', 380).attr('width', 130).attr('height', 34).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.yellow).attr('stroke-width', 2);
    bobCheck.append('text').attr('x', 630).attr('y', 394).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('x-coord of R\'');
    bobCheck.append('text').attr('x', 630).attr('y', 408).attr('text-anchor', 'middle')
      .attr('fill', colors.yellow).attr('font-size', '12px').attr('font-weight', 'bold').text('== r ?');

    // Valid result
    const valid = svgEl.append('g').attr('class', 'valid').attr('opacity', 0);
    valid.append('line').attr('x1', 630).attr('y1', 418).attr('x2', 630).attr('y2', 435)
      .attr('stroke', colors.green).attr('stroke-width', 2).attr('marker-end', 'url(#arr)');
    valid.append('text').attr('x', 630).attr('y', 448).attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '15px').attr('font-weight', 'bold').text('✓ Valid');

    // Bottom insight
    valid.append('rect').attr('x', 30).attr('y', 310).attr('width', 280).attr('height', 35).attr('rx', 5)
      .attr('fill', colors.bgCard).attr('stroke', colors.red).attr('stroke-width', 1);
    valid.append('text').attr('x', 170).attr('y', 325).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '10px').text('Only someone with private key d');
    valid.append('text').attr('x', 170).attr('y', 339).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '10px').text('could create valid (r, s)');

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
    max-height: 450px;
  }
</style>
