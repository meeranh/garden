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
  const maxStep = 7;

  // Positions
  const friendX = 200;
  const proverX = 500;
  const centerY = 200;
  const ballRadius = 25;

  // Ball positions relative to friend
  let leftBallX = -60;
  let rightBallX = 60;
  let ballsSwapped = false;
  let roundCount = 0;

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  const stepLabels = [
    'Your colorblind friend holds two balls',
    'To them, the balls look identical',
    'Friend hides hands behind their back...',
    'Friend may swap the balls (or not)',
    'Friend shows hands again',
    'You identify: "Swapped!" (or "Not swapped")',
    'Correct! Friend is more convinced...',
    'After many rounds: Proof complete!'
  ];

  async function animateStep(step: number) {
    const leftBall = svgEl.select('.left-ball');
    const rightBall = svgEl.select('.right-ball');
    const hands = svgEl.select('.hands');
    const questionMarks = svgEl.select('.question-marks');
    const speechBubble = svgEl.select('.speech-bubble');
    const roundText = svgEl.select('.round-count');
    const successMsg = svgEl.select('.success-message');
    const proverSpeech = svgEl.select('.prover-speech');

    svgEl.select('.step-label').text(stepLabels[step]);

    switch(step) {
      case 0:
        // Initial state - show both balls
        leftBall.attr('opacity', 1).attr('cx', friendX + leftBallX).attr('cy', centerY);
        rightBall.attr('opacity', 1).attr('cx', friendX + rightBallX).attr('cy', centerY);
        hands.attr('opacity', 1);
        questionMarks.attr('opacity', 0);
        speechBubble.attr('opacity', 0);
        proverSpeech.attr('opacity', 0);
        successMsg.attr('opacity', 0);
        roundText.text('Round: 0');
        roundCount = 0;
        ballsSwapped = false;
        break;

      case 1:
        // Friend sees them as identical
        speechBubble.attr('opacity', 1);
        svgEl.select('.speech-text').text('They look the same to me...');
        break;

      case 2:
        // Hide balls behind back
        leftBall.transition().duration(600).attr('opacity', 0);
        rightBall.transition().duration(600).attr('opacity', 0);
        speechBubble.transition().duration(300).attr('opacity', 0);
        await sleep(400);
        if (!isPlaying && currentStep !== 2) return;
        questionMarks.transition().duration(300).attr('opacity', 1);
        break;

      case 3:
        // Maybe swap
        ballsSwapped = Math.random() > 0.5;
        svgEl.select('.swap-indicator').text(ballsSwapped ? '🔀 Swapping...' : '➡️ Not swapping...');
        svgEl.select('.swap-indicator').attr('opacity', 1);
        await sleep(800);
        if (!isPlaying && currentStep !== 3) return;
        svgEl.select('.swap-indicator').transition().duration(300).attr('opacity', 0);
        break;

      case 4:
        // Show balls again (possibly swapped)
        questionMarks.transition().duration(300).attr('opacity', 0);
        await sleep(300);
        if (!isPlaying && currentStep !== 4) return;

        if (ballsSwapped) {
          // Red on right, green on left
          leftBall.attr('fill', colors.green);
          rightBall.attr('fill', colors.red);
        } else {
          // Red on left, green on right
          leftBall.attr('fill', colors.red);
          rightBall.attr('fill', colors.green);
        }

        leftBall.transition().duration(400).attr('opacity', 1);
        rightBall.transition().duration(400).attr('opacity', 1);
        break;

      case 5:
        // Prover answers
        proverSpeech.attr('opacity', 1);
        svgEl.select('.prover-text').text(ballsSwapped ? '"Swapped!"' : '"Not swapped!"');
        break;

      case 6:
        // Correct answer
        roundCount++;
        roundText.text(`Round: ${roundCount}`);
        svgEl.select('.prover-text').text('✓ Correct!');
        proverSpeech.select('rect').attr('stroke', colors.green);
        speechBubble.attr('opacity', 1);
        svgEl.select('.speech-text').text('Lucky guess? Let\'s try again...');
        break;

      case 7:
        // Final state - many rounds passed
        roundText.text('Round: 20');
        proverSpeech.attr('opacity', 0);
        speechBubble.attr('opacity', 1);
        svgEl.select('.speech-text').text('OK, I\'m convinced they\'re different!');
        successMsg.attr('opacity', 1);
        break;
    }

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      await animateStep(i);
      await sleep(i === 6 ? 2000 : 1500);
    }

    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) { currentStep++; animateStep(currentStep); } }
  function prev() { pause(); if (currentStep > 0) { currentStep--; animateStep(currentStep); } }
  function applyFinalState() {
    svgEl.select('.step-label').text(stepLabels[maxStep]);
    svgEl.select('.left-ball').attr('opacity', 1);
    svgEl.select('.right-ball').attr('opacity', 1);
    svgEl.select('.question-marks').attr('opacity', 0);
    svgEl.select('.speech-bubble').attr('opacity', 1);
    svgEl.select('.speech-text').text('OK, I\'m convinced they\'re different!');
    svgEl.select('.prover-speech').attr('opacity', 0);
    svgEl.select('.round-count').text('Round: 20');
    svgEl.select('.success-message').attr('opacity', 1);
    currentStep = maxStep;
  }
  function skip() { pause(); applyFinalState(); }
  function replay() {
    pause();
    currentStep = 0;
    // Reset ball colors
    svgEl.select('.left-ball').attr('fill', colors.red);
    svgEl.select('.right-ball').attr('fill', colors.green);
    svgEl.select('.prover-speech').select('rect').attr('stroke', colors.fgMuted);
    animateStep(0);
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
      yellow: s.getPropertyValue('--color-math').trim(),
      aqua: '#8ec07c',
      purple: '#d3869b',
      green: '#b8bb26',
      red: '#fb4934',
      orange: '#fe8019'
    };

    svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    // Title
    svgEl.append('text')
      .attr('x', width / 2).attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Zero-Knowledge Proof: Colorblind Test');

    // Step label
    svgEl.append('text')
      .attr('class', 'step-label')
      .attr('x', width / 2).attr('y', 55)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '13px')
      .text(stepLabels[0]);

    // Round counter
    svgEl.append('text')
      .attr('class', 'round-count')
      .attr('x', width / 2).attr('y', 85)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.yellow)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Round: 0');

    // Friend (Verifier) - colorblind
    svgEl.append('circle')
      .attr('cx', friendX).attr('cy', 130)
      .attr('r', 30)
      .attr('fill', colors.purple)
      .attr('opacity', 0.25);
    svgEl.append('text')
      .attr('x', friendX).attr('y', 135)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.purple)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('Friend');
    svgEl.append('text')
      .attr('x', friendX).attr('y', 150)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '10px')
      .text('(colorblind)');

    // Prover - you
    svgEl.append('circle')
      .attr('cx', proverX).attr('cy', 130)
      .attr('r', 30)
      .attr('fill', colors.aqua)
      .attr('opacity', 0.25);
    svgEl.append('text')
      .attr('x', proverX).attr('y', 135)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.aqua)
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .text('You');
    svgEl.append('text')
      .attr('x', proverX).attr('y', 150)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '10px')
      .text('(prover)');

    // Hands group
    const hands = svgEl.append('g').attr('class', 'hands');

    // Left hand
    hands.append('ellipse')
      .attr('cx', friendX + leftBallX).attr('cy', centerY + 35)
      .attr('rx', 30).attr('ry', 15)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2);
    hands.append('text')
      .attr('x', friendX + leftBallX).attr('y', centerY + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '10px')
      .text('Left');

    // Right hand
    hands.append('ellipse')
      .attr('cx', friendX + rightBallX).attr('cy', centerY + 35)
      .attr('rx', 30).attr('ry', 15)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2);
    hands.append('text')
      .attr('x', friendX + rightBallX).attr('y', centerY + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '10px')
      .text('Right');

    // Balls
    svgEl.append('circle')
      .attr('class', 'left-ball')
      .attr('cx', friendX + leftBallX).attr('cy', centerY)
      .attr('r', ballRadius)
      .attr('fill', colors.red)
      .attr('stroke', colors.fg)
      .attr('stroke-width', 2);

    svgEl.append('circle')
      .attr('class', 'right-ball')
      .attr('cx', friendX + rightBallX).attr('cy', centerY)
      .attr('r', ballRadius)
      .attr('fill', colors.green)
      .attr('stroke', colors.fg)
      .attr('stroke-width', 2);

    // Question marks when hidden
    svgEl.append('text')
      .attr('class', 'question-marks')
      .attr('x', friendX).attr('y', centerY + 8)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted)
      .attr('font-size', '28px')
      .attr('opacity', 0)
      .text('? ?');

    // Swap indicator
    svgEl.append('text')
      .attr('class', 'swap-indicator')
      .attr('x', friendX).attr('y', centerY - 50)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.orange)
      .attr('font-size', '14px')
      .attr('opacity', 0);

    // Friend speech bubble
    const speechBubble = svgEl.append('g')
      .attr('class', 'speech-bubble')
      .attr('opacity', 0);
    speechBubble.append('rect')
      .attr('x', friendX - 100).attr('y', centerY + 70)
      .attr('width', 200).attr('height', 40)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2);
    speechBubble.append('text')
      .attr('class', 'speech-text')
      .attr('x', friendX).attr('y', centerY + 95)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '12px');

    // Prover speech bubble
    const proverSpeech = svgEl.append('g')
      .attr('class', 'prover-speech')
      .attr('opacity', 0);
    proverSpeech.append('rect')
      .attr('x', proverX - 70).attr('y', centerY - 20)
      .attr('width', 140).attr('height', 40)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 2);
    proverSpeech.append('text')
      .attr('class', 'prover-text')
      .attr('x', proverX).attr('y', centerY + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold');

    // Success message
    svgEl.append('text')
      .attr('class', 'success-message')
      .attr('x', width / 2).attr('y', 360)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('✓ Proven: balls are different colors (but which is which? Still unknown!)');

    // Legend
    const legendY = 320;
    svgEl.append('rect')
      .attr('x', width/2 - 140).attr('y', legendY)
      .attr('width', 280).attr('height', 30)
      .attr('rx', 5)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-opacity', 0.5);

    svgEl.append('circle')
      .attr('cx', width/2 - 100).attr('cy', legendY + 15)
      .attr('r', 8)
      .attr('fill', colors.red);
    svgEl.append('text')
      .attr('x', width/2 - 85).attr('y', legendY + 19)
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text('Red ball');

    svgEl.append('circle')
      .attr('cx', width/2 + 20).attr('cy', legendY + 15)
      .attr('r', 8)
      .attr('fill', colors.green);
    svgEl.append('text')
      .attr('x', width/2 + 35).attr('y', legendY + 19)
      .attr('fill', colors.fgMuted)
      .attr('font-size', '11px')
      .text('Green ball');

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
