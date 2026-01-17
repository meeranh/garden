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

  const width = 620;
  const height = 340;
  const maxStep = 9;

  const allElements = [
    'alice', 'alice-label', 'alice-public-key', 'alice-private-key',
    'bob', 'bob-label', 'bob-public-key',
    'bob-message', 'encrypt-calc', 'bob-ciphertext',
    'alice-ciphertext', 'decrypt-calc', 'alice-decrypted', 'valid-text',
    'pubkey-particle', 'cipher-particle'
  ];

  const stepVisibility: Record<number, string[]> = {
    0: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key'],
    1: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key', 'bob', 'bob-label'],
    2: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key', 'bob', 'bob-label'],
    3: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key', 'bob', 'bob-label', 'bob-public-key'],
    4: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key', 'bob', 'bob-label', 'bob-public-key', 'bob-message'],
    5: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key', 'bob', 'bob-label', 'bob-public-key', 'bob-message', 'encrypt-calc', 'bob-ciphertext'],
    6: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key', 'bob', 'bob-label', 'bob-public-key', 'bob-message', 'encrypt-calc', 'bob-ciphertext'],
    7: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key', 'bob', 'bob-label', 'bob-public-key', 'bob-message', 'encrypt-calc', 'bob-ciphertext', 'alice-ciphertext'],
    8: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key', 'bob', 'bob-label', 'bob-public-key', 'bob-message', 'encrypt-calc', 'bob-ciphertext', 'alice-ciphertext', 'decrypt-calc', 'alice-decrypted'],
    9: ['alice', 'alice-label', 'alice-public-key', 'alice-private-key', 'bob', 'bob-label', 'bob-public-key', 'bob-message', 'encrypt-calc', 'bob-ciphertext', 'alice-ciphertext', 'decrypt-calc', 'alice-decrypted', 'valid-text']
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

    // Step 0: Alice with keys
    if (currentStep <= 0) {
      applyStep(0);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 1: Bob appears
    if (currentStep <= 1) {
      applyStep(1);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 2: Public key travels to Bob
    if (currentStep <= 2) {
      currentStep = 2;
      const particle = svgEl.select('.pubkey-particle');
      particle.attr('opacity', 0.9).attr('cx', 145).attr('cy', 140);
      particle.transition().duration(1200).ease(d3.easeCubicInOut).attr('cx', 475);
      await sleep(1300);
      particle.attr('opacity', 0);
      if (!isPlaying) return;
    }

    // Step 3: Bob has public key
    if (currentStep <= 3) {
      applyStep(3);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 4: Bob has message
    if (currentStep <= 4) {
      applyStep(4);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 5: Bob encrypts
    if (currentStep <= 5) {
      applyStep(5);
      await sleep(1200);
      if (!isPlaying) return;
    }

    // Step 6: Ciphertext travels to Alice
    if (currentStep <= 6) {
      currentStep = 6;
      const particle = svgEl.select('.cipher-particle');
      particle.attr('opacity', 0.9).attr('cx', 475).attr('cy', 230);
      particle.transition().duration(1200).ease(d3.easeCubicInOut).attr('cx', 145);
      await sleep(1300);
      particle.attr('opacity', 0);
      if (!isPlaying) return;
    }

    // Step 7: Alice receives ciphertext
    if (currentStep <= 7) {
      applyStep(7);
      await sleep(1000);
      if (!isPlaying) return;
    }

    // Step 8: Alice decrypts
    if (currentStep <= 8) {
      applyStep(8);
      await sleep(1200);
      if (!isPlaying) return;
    }

    // Step 9: Success
    if (currentStep <= 9) {
      applyStep(9);
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
    svgEl.select('.pubkey-particle').attr('opacity', 0);
    svgEl.select('.cipher-particle').attr('opacity', 0);
    applyStep(0);
    currentStep = 0;
    isPlaying = true;
    runAnimation();
  }
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
      green: '#b8bb26',
      red: '#fb4934',
      blue: '#83a598',
      purple: '#d3869b'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // === ALICE (left side) ===
    const aliceX = 80;
    const aliceY = 40;

    const alice = svgEl.append('g').attr('class', 'alice').attr('opacity', 0);
    alice.append('circle')
      .attr('cx', aliceX).attr('cy', aliceY)
      .attr('r', 18)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2);
    alice.append('line')
      .attr('x1', aliceX).attr('y1', aliceY + 18)
      .attr('x2', aliceX).attr('y2', aliceY + 45)
      .attr('stroke', colors.accent).attr('stroke-width', 2);
    alice.append('line')
      .attr('x1', aliceX).attr('y1', aliceY + 26)
      .attr('x2', aliceX - 15).attr('y2', aliceY + 38)
      .attr('stroke', colors.accent).attr('stroke-width', 2);
    alice.append('line')
      .attr('x1', aliceX).attr('y1', aliceY + 26)
      .attr('x2', aliceX + 15).attr('y2', aliceY + 38)
      .attr('stroke', colors.accent).attr('stroke-width', 2);

    svgEl.append('text')
      .attr('class', 'alice-label')
      .attr('x', aliceX).attr('y', aliceY + 62)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.accent)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('Alice')
      .attr('opacity', 0);

    // Alice's public key (green)
    const alicePubKey = svgEl.append('g').attr('class', 'alice-public-key').attr('opacity', 0);
    alicePubKey.append('rect')
      .attr('x', 30).attr('y', 110)
      .attr('width', 100).attr('height', 40)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);
    alicePubKey.append('text')
      .attr('x', 80).attr('y', 126)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('PUBLIC KEY');
    alicePubKey.append('text')
      .attr('x', 80).attr('y', 142)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '11px')
      .text('e=3, n=55');

    // Alice's private key (red)
    const alicePrivKey = svgEl.append('g').attr('class', 'alice-private-key').attr('opacity', 0);
    alicePrivKey.append('rect')
      .attr('x', 30).attr('y', 158)
      .attr('width', 100).attr('height', 40)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.red)
      .attr('stroke-width', 2);
    alicePrivKey.append('text')
      .attr('x', 80).attr('y', 174)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.red)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('PRIVATE KEY');
    alicePrivKey.append('text')
      .attr('x', 80).attr('y', 190)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '11px')
      .text('d=27, n=55');

    // Alice's received ciphertext (purple - matches Bob's)
    const aliceCipher = svgEl.append('g').attr('class', 'alice-ciphertext').attr('opacity', 0);
    aliceCipher.append('rect')
      .attr('x', 30).attr('y', 206)
      .attr('width', 100).attr('height', 38)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);
    aliceCipher.append('text')
      .attr('x', 80).attr('y', 221)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('RECEIVED');
    aliceCipher.append('text')
      .attr('x', 80).attr('y', 238)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('C = 8');

    // Decrypt calculation
    svgEl.append('text')
      .attr('class', 'decrypt-calc')
      .attr('x', 80).attr('y', 260)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '10px')
      .text('8²⁷ mod 55 = 2')
      .attr('opacity', 0);

    // Alice's decrypted message (yellow - matches Bob's original)
    const aliceDecrypted = svgEl.append('g').attr('class', 'alice-decrypted').attr('opacity', 0);
    aliceDecrypted.append('rect')
      .attr('x', 30).attr('y', 268)
      .attr('width', 100).attr('height', 38)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);
    aliceDecrypted.append('text')
      .attr('x', 80).attr('y', 283)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('DECRYPTED');
    aliceDecrypted.append('text')
      .attr('x', 80).attr('y', 300)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('M = 2');

    // Valid text
    svgEl.append('text')
      .attr('class', 'valid-text')
      .attr('x', 80).attr('y', 322)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Message received! ✓')
      .attr('opacity', 0);

    // === PARTICLES for transfer ===
    svgEl.append('circle')
      .attr('class', 'pubkey-particle')
      .attr('r', 12)
      .attr('fill', colors.green)
      .attr('opacity', 0);

    svgEl.append('circle')
      .attr('class', 'cipher-particle')
      .attr('r', 12)
      .attr('fill', colors.purple)
      .attr('opacity', 0);

    // === BOB (right side) ===
    const bobX = 540;
    const bobY = 40;

    const bob = svgEl.append('g').attr('class', 'bob').attr('opacity', 0);
    bob.append('circle')
      .attr('cx', bobX).attr('cy', bobY)
      .attr('r', 18)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.blue)
      .attr('stroke-width', 2);
    bob.append('line')
      .attr('x1', bobX).attr('y1', bobY + 18)
      .attr('x2', bobX).attr('y2', bobY + 45)
      .attr('stroke', colors.blue).attr('stroke-width', 2);
    bob.append('line')
      .attr('x1', bobX).attr('y1', bobY + 26)
      .attr('x2', bobX - 15).attr('y2', bobY + 38)
      .attr('stroke', colors.blue).attr('stroke-width', 2);
    bob.append('line')
      .attr('x1', bobX).attr('y1', bobY + 26)
      .attr('x2', bobX + 15).attr('y2', bobY + 38)
      .attr('stroke', colors.blue).attr('stroke-width', 2);

    svgEl.append('text')
      .attr('class', 'bob-label')
      .attr('x', bobX).attr('y', bobY + 62)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.blue)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('Bob')
      .attr('opacity', 0);

    // Bob's received public key (green - matches Alice's)
    const bobPubKey = svgEl.append('g').attr('class', 'bob-public-key').attr('opacity', 0);
    bobPubKey.append('rect')
      .attr('x', 490).attr('y', 110)
      .attr('width', 100).attr('height', 40)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);
    bobPubKey.append('text')
      .attr('x', 540).attr('y', 126)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('ALICE\'S PUBLIC');
    bobPubKey.append('text')
      .attr('x', 540).attr('y', 142)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '11px')
      .text('e=3, n=55');

    // Bob's message (yellow)
    const bobMsg = svgEl.append('g').attr('class', 'bob-message').attr('opacity', 0);
    bobMsg.append('rect')
      .attr('x', 490).attr('y', 158)
      .attr('width', 100).attr('height', 38)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.yellow)
      .attr('stroke-width', 2);
    bobMsg.append('text')
      .attr('x', 540).attr('y', 173)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('MESSAGE');
    bobMsg.append('text')
      .attr('x', 540).attr('y', 190)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('M = 2');

    // Encrypt calculation
    svgEl.append('text')
      .attr('class', 'encrypt-calc')
      .attr('x', 540).attr('y', 212)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '10px')
      .text('2³ mod 55 = 8')
      .attr('opacity', 0);

    // Bob's ciphertext (purple)
    const bobCipher = svgEl.append('g').attr('class', 'bob-ciphertext').attr('opacity', 0);
    bobCipher.append('rect')
      .attr('x', 490).attr('y', 220)
      .attr('width', 100).attr('height', 38)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);
    bobCipher.append('text')
      .attr('x', 540).attr('y', 235)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('CIPHERTEXT');
    bobCipher.append('text')
      .attr('x', 540).attr('y', 252)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('C = 8');

    // Center arrows and labels
    svgEl.append('text')
      .attr('x', 310).attr('y', 135)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '20px')
      .text('→');

    svgEl.append('text')
      .attr('x', 310).attr('y', 152)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '9px')
      .text('public key');

    svgEl.append('text')
      .attr('x', 310).attr('y', 230)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '20px')
      .text('←');

    svgEl.append('text')
      .attr('x', 310).attr('y', 247)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '9px')
      .text('ciphertext');

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
