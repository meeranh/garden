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

  const width = 560;
  const height = 380;
  const maxStep = 6;

  const aliceX = 80;
  const eveX = 280;
  const bobX = 480;
  const personY = 50;

  const allElements = [
    'alice', 'bob', 'eve', 'intended-line',
    'arrow-1', 'eve-stop-1',
    'arrow-2', 'bob-got',
    'arrow-3', 'eve-stop-2',
    'arrow-4', 'alice-got',
    'key-1', 'key-2', 'eve-knows'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: [],
    1: ['alice', 'bob', 'eve', 'intended-line'],
    2: ['alice', 'bob', 'eve', 'intended-line', 'arrow-1', 'eve-stop-1'],
    3: ['alice', 'bob', 'eve', 'intended-line', 'arrow-1', 'eve-stop-1', 'arrow-2', 'bob-got'],
    4: ['alice', 'bob', 'eve', 'intended-line', 'arrow-1', 'eve-stop-1', 'arrow-2', 'bob-got', 'arrow-3', 'eve-stop-2'],
    5: ['alice', 'bob', 'eve', 'intended-line', 'arrow-1', 'eve-stop-1', 'arrow-2', 'bob-got', 'arrow-3', 'eve-stop-2', 'arrow-4', 'alice-got'],
    6: ['alice', 'bob', 'eve', 'intended-line', 'arrow-1', 'eve-stop-1', 'arrow-2', 'bob-got', 'arrow-3', 'eve-stop-2', 'arrow-4', 'alice-got', 'key-1', 'key-2', 'eve-knows']
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

    const flowY1 = 175;
    const flowY2 = 240;

    // Step 1: Show all three people
    if (currentStep <= 1) {
      applyStep(1);
      await sleep(1500);
      if (!isPlaying) return;
    }

    // Step 2: Alice sends, Eve intercepts
    if (currentStep <= 2) {
      currentStep = 2;
      svgEl.select('.arrow-1').transition().duration(300).attr('opacity', 1);
      const particle1 = svgEl.select('.particle-1');
      particle1.attr('cx', aliceX + 30).attr('opacity', 0.9);
      particle1.transition().duration(1000).ease(d3.easeLinear).attr('cx', eveX - 20);
      await sleep(1100);
      if (!isPlaying) return;
      particle1.attr('opacity', 0);
      svgEl.select('.eve-stop-1').transition().duration(200).attr('opacity', 1);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 3: Eve sends fake to Bob
    if (currentStep <= 3) {
      currentStep = 3;
      svgEl.select('.arrow-2').transition().duration(300).attr('opacity', 1);
      const particle2 = svgEl.select('.particle-2');
      particle2.attr('cx', eveX + 20).attr('opacity', 0.9);
      particle2.transition().duration(1000).ease(d3.easeLinear).attr('cx', bobX - 30);
      await sleep(1100);
      if (!isPlaying) return;
      particle2.attr('opacity', 0);
      svgEl.select('.bob-got').transition().duration(200).attr('opacity', 1);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 4: Bob sends, Eve intercepts
    if (currentStep <= 4) {
      currentStep = 4;
      svgEl.select('.arrow-3').transition().duration(300).attr('opacity', 1);
      const particle3 = svgEl.select('.particle-3');
      particle3.attr('cx', bobX - 30).attr('opacity', 0.9);
      particle3.transition().duration(1000).ease(d3.easeLinear).attr('cx', eveX + 20);
      await sleep(1100);
      if (!isPlaying) return;
      particle3.attr('opacity', 0);
      svgEl.select('.eve-stop-2').transition().duration(200).attr('opacity', 1);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 5: Eve sends fake to Alice
    if (currentStep <= 5) {
      currentStep = 5;
      svgEl.select('.arrow-4').transition().duration(300).attr('opacity', 1);
      const particle4 = svgEl.select('.particle-4');
      particle4.attr('cx', eveX - 20).attr('opacity', 0.9);
      particle4.transition().duration(1000).ease(d3.easeLinear).attr('cx', aliceX + 30);
      await sleep(1100);
      if (!isPlaying) return;
      particle4.attr('opacity', 0);
      svgEl.select('.alice-got').transition().duration(200).attr('opacity', 1);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 6: Two keys - Eve has both
    if (currentStep <= 6) {
      applyStep(6);
      await sleep(500);
    }

    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
  function skip() { pause(); applyStep(maxStep); }
  function replay() {
    pause();
    svgEl.selectAll('.particle-1, .particle-2, .particle-3, .particle-4').attr('opacity', 0);
    applyStep(0);
    currentStep = 0;
    isPlaying = true;
    runAnimation();
  }
  function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

  function drawPerson(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string, name: string, subtitle?: string) {
    // Head
    g.append('circle').attr('cx', x).attr('cy', y).attr('r', 14)
      .attr('fill', colors.bgCard).attr('stroke', color).attr('stroke-width', 2);
    // Body
    g.append('line').attr('x1', x).attr('y1', y + 14).attr('x2', x).attr('y2', y + 40)
      .attr('stroke', color).attr('stroke-width', 2);
    // Arms
    g.append('line').attr('x1', x - 16).attr('y1', y + 25).attr('x2', x + 16).attr('y2', y + 25)
      .attr('stroke', color).attr('stroke-width', 2);
    // Left leg
    g.append('line').attr('x1', x).attr('y1', y + 40).attr('x2', x - 10).attr('y2', y + 55)
      .attr('stroke', color).attr('stroke-width', 2);
    // Right leg
    g.append('line').attr('x1', x).attr('y1', y + 40).attr('x2', x + 10).attr('y2', y + 55)
      .attr('stroke', color).attr('stroke-width', 2);
    // Name
    g.append('text').attr('x', x).attr('y', y + 72).attr('text-anchor', 'middle')
      .attr('fill', color).attr('font-size', '13px').attr('font-weight', 'bold').text(name);
    // Subtitle
    if (subtitle) {
      g.append('text').attr('x', x).attr('y', y + 86).attr('text-anchor', 'middle')
        .attr('fill', color).attr('font-size', '10px').text(subtitle);
    }
  }

  onMount(() => {
    const s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--color-bg').trim(),
      bgCard: s.getPropertyValue('--color-bg-card').trim(),
      fg: s.getPropertyValue('--color-fg').trim(),
      fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
      green: '#b8bb26',
      red: '#fb4934',
      blue: '#83a598',
      purple: '#d3869b',
      orange: '#fe8019',
      aqua: '#8ec07c'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    const flowY1 = 175;
    const flowY2 = 240;

    // Particles
    svgEl.append('circle').attr('class', 'particle-1').attr('cy', flowY1).attr('r', 10)
      .attr('fill', colors.aqua).attr('opacity', 0);
    svgEl.append('circle').attr('class', 'particle-2').attr('cy', flowY1).attr('r', 10)
      .attr('fill', colors.red).attr('opacity', 0);
    svgEl.append('circle').attr('class', 'particle-3').attr('cy', flowY2).attr('r', 10)
      .attr('fill', colors.blue).attr('opacity', 0);
    svgEl.append('circle').attr('class', 'particle-4').attr('cy', flowY2).attr('r', 10)
      .attr('fill', colors.red).attr('opacity', 0);

    // Intended connection line (dashed, with X)
    const intendedLine = svgEl.append('g').attr('class', 'intended-line').attr('opacity', 0);
    intendedLine.append('line').attr('x1', aliceX).attr('y1', 25).attr('x2', bobX).attr('y2', 25)
      .attr('stroke', colors.green).attr('stroke-width', 2).attr('stroke-dasharray', '6,4');
    // X mark
    intendedLine.append('line').attr('x1', eveX - 12).attr('y1', 15).attr('x2', eveX + 12).attr('y2', 35)
      .attr('stroke', colors.red).attr('stroke-width', 3);
    intendedLine.append('line').attr('x1', eveX + 12).attr('y1', 15).attr('x2', eveX - 12).attr('y2', 35)
      .attr('stroke', colors.red).attr('stroke-width', 3);

    // === People ===
    const alice = svgEl.append('g').attr('class', 'alice').attr('opacity', 0);
    drawPerson(alice, aliceX, personY, colors.aqua, 'Alice');

    const eve = svgEl.append('g').attr('class', 'eve').attr('opacity', 0);
    drawPerson(eve, eveX, personY, colors.red, 'Eve', '(attacker)');

    const bob = svgEl.append('g').attr('class', 'bob').attr('opacity', 0);
    drawPerson(bob, bobX, personY, colors.blue, 'Bob');

    // === Flow Row 1: Alice -> Eve -> Bob ===

    // Arrow 1: Alice sends (stops at Eve)
    const arrow1 = svgEl.append('g').attr('class', 'arrow-1').attr('opacity', 0);
    arrow1.append('line').attr('x1', aliceX + 25).attr('y1', flowY1).attr('x2', eveX - 25).attr('y2', flowY1)
      .attr('stroke', colors.aqua).attr('stroke-width', 2);
    arrow1.append('text').attr('x', (aliceX + eveX) / 2).attr('y', flowY1 - 10).attr('text-anchor', 'middle')
      .attr('fill', colors.aqua).attr('font-size', '11px').attr('font-weight', 'bold').text('g^a');

    // Eve stop 1
    const eveStop1 = svgEl.append('g').attr('class', 'eve-stop-1').attr('opacity', 0);
    eveStop1.append('rect').attr('x', eveX - 25).attr('y', flowY1 - 12).attr('width', 50).attr('height', 20).attr('rx', 3)
      .attr('fill', colors.red).attr('fill-opacity', 0.3).attr('stroke', colors.red);
    eveStop1.append('text').attr('x', eveX).attr('y', flowY1 + 3).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '9px').attr('font-weight', 'bold').text('STOP');

    // Arrow 2: Eve sends fake to Bob
    const arrow2 = svgEl.append('g').attr('class', 'arrow-2').attr('opacity', 0);
    arrow2.append('line').attr('x1', eveX + 25).attr('y1', flowY1).attr('x2', bobX - 25).attr('y2', flowY1)
      .attr('stroke', colors.red).attr('stroke-width', 2).attr('stroke-dasharray', '4,2');
    arrow2.append('text').attr('x', (eveX + bobX) / 2).attr('y', flowY1 - 10).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '11px').attr('font-weight', 'bold').text('g^e');

    // Bob thinks it's from Alice
    const bobGot = svgEl.append('g').attr('class', 'bob-got').attr('opacity', 0);
    bobGot.append('text').attr('x', bobX).attr('y', flowY1 + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '9px').text('thinks: g^a');

    // === Flow Row 2: Bob -> Eve -> Alice ===

    // Arrow 3: Bob sends (stops at Eve)
    const arrow3 = svgEl.append('g').attr('class', 'arrow-3').attr('opacity', 0);
    arrow3.append('line').attr('x1', bobX - 25).attr('y1', flowY2).attr('x2', eveX + 25).attr('y2', flowY2)
      .attr('stroke', colors.blue).attr('stroke-width', 2);
    arrow3.append('text').attr('x', (eveX + bobX) / 2).attr('y', flowY2 - 10).attr('text-anchor', 'middle')
      .attr('fill', colors.blue).attr('font-size', '11px').attr('font-weight', 'bold').text('g^b');

    // Eve stop 2
    const eveStop2 = svgEl.append('g').attr('class', 'eve-stop-2').attr('opacity', 0);
    eveStop2.append('rect').attr('x', eveX - 25).attr('y', flowY2 - 12).attr('width', 50).attr('height', 20).attr('rx', 3)
      .attr('fill', colors.red).attr('fill-opacity', 0.3).attr('stroke', colors.red);
    eveStop2.append('text').attr('x', eveX).attr('y', flowY2 + 3).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '9px').attr('font-weight', 'bold').text('STOP');

    // Arrow 4: Eve sends fake to Alice
    const arrow4 = svgEl.append('g').attr('class', 'arrow-4').attr('opacity', 0);
    arrow4.append('line').attr('x1', eveX - 25).attr('y1', flowY2).attr('x2', aliceX + 25).attr('y2', flowY2)
      .attr('stroke', colors.red).attr('stroke-width', 2).attr('stroke-dasharray', '4,2');
    arrow4.append('text').attr('x', (aliceX + eveX) / 2).attr('y', flowY2 - 10).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '11px').attr('font-weight', 'bold').text('g^e');

    // Alice thinks it's from Bob
    const aliceGot = svgEl.append('g').attr('class', 'alice-got').attr('opacity', 0);
    aliceGot.append('text').attr('x', aliceX).attr('y', flowY2 + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '9px').text('thinks: g^b');

    // === Result: Two keys ===
    const keyY = 290;

    // Key 1: Alice-Eve
    const key1 = svgEl.append('g').attr('class', 'key-1').attr('opacity', 0);
    key1.append('rect').attr('x', 40).attr('y', keyY).attr('width', 140).attr('height', 50).attr('rx', 6)
      .attr('fill', colors.bgCard).attr('stroke', colors.orange).attr('stroke-width', 2);
    key1.append('text').attr('x', 110).attr('y', keyY + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('Alice \u2194 Eve');
    key1.append('text').attr('x', 110).attr('y', keyY + 38).attr('text-anchor', 'middle')
      .attr('fill', colors.orange).attr('font-size', '13px').attr('font-weight', 'bold').text('K\u2081 = g^(ae)');

    // Key 2: Eve-Bob
    const key2 = svgEl.append('g').attr('class', 'key-2').attr('opacity', 0);
    key2.append('rect').attr('x', 380).attr('y', keyY).attr('width', 140).attr('height', 50).attr('rx', 6)
      .attr('fill', colors.bgCard).attr('stroke', colors.purple).attr('stroke-width', 2);
    key2.append('text').attr('x', 450).attr('y', keyY + 18).attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '10px').text('Eve \u2194 Bob');
    key2.append('text').attr('x', 450).attr('y', keyY + 38).attr('text-anchor', 'middle')
      .attr('fill', colors.purple).attr('font-size', '13px').attr('font-weight', 'bold').text('K\u2082 = g^(be)');

    // Eve knows both!
    const eveKnows = svgEl.append('g').attr('class', 'eve-knows').attr('opacity', 0);
    eveKnows.append('rect').attr('x', 195).attr('y', keyY + 8).attr('width', 170).attr('height', 35).attr('rx', 5)
      .attr('fill', colors.red).attr('fill-opacity', 0.3).attr('stroke', colors.red).attr('stroke-width', 2);
    eveKnows.append('text').attr('x', 280).attr('y', keyY + 30).attr('text-anchor', 'middle')
      .attr('fill', colors.red).attr('font-size', '11px').attr('font-weight', 'bold').text('Eve has BOTH keys!');

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
