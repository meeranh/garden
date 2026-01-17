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
  const height = 460;
  const maxStep = 25;

  // Pre-generate people with birthdays (seeded for collision at 23)
  const birthdays = [
    45, 123, 267, 89, 312, 178, 56, 234, 145, 298,
    67, 189, 321, 12, 256, 178, 93, 267, 341, 134,
    209, 76, 267, 156, 298 // 267 appears at indices 2, 17, 22 - collision at person 23
  ];

  // Position people in a wide arc (300 degrees)
  const centerX = 230;
  const centerY = 230;
  const radius = 175;
  const arcStart = Math.PI * 0.7;  // Start angle
  const arcEnd = Math.PI * 2.3;    // End angle (300 degrees)
  const arcSpan = arcEnd - arcStart;

  const people: { id: number; birthday: number; x: number; y: number }[] = [];
  for (let i = 0; i < 25; i++) {
    const angle = arcStart + (arcSpan * (i + 0.5)) / 25;
    people.push({
      id: i + 1,
      birthday: birthdays[i],
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    });
  }

  // Find first collision
  function findCollision(count: number): [number, number] | null {
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (birthdays[i] === birthdays[j]) {
          return [i, j];
        }
      }
    }
    return null;
  }

  // Calculate probability of collision
  function collisionProb(n: number): number {
    if (n <= 1) return 0;
    let pNoCollision = 1;
    for (let i = 0; i < n; i++) {
      pNoCollision *= (365 - i) / 365;
    }
    return 1 - pNoCollision;
  }

  // Number of pairs
  function numPairs(n: number): number {
    return (n * (n - 1)) / 2;
  }

  // Month names for display
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dayToDate(day: number): string {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let d = day;
    for (let m = 0; m < 12; m++) {
      if (d <= daysInMonth[m]) {
        return `${months[m]} ${d}`;
      }
      d -= daysInMonth[m];
    }
    return `Dec 31`;
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
  }
  function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

  function renderStep(step: number) {
    const count = step;
    const collision = findCollision(count);

    // Update people visibility
    svgEl.selectAll('.person').each(function(_, i) {
      const visible = i < count;
      const isCollider = collision && (i === collision[0] || i === collision[1]);
      d3.select(this)
        .transition().duration(300)
        .attr('opacity', visible ? 1 : 0);
      d3.select(this).select('circle')
        .transition().duration(300)
        .attr('fill', isCollider ? colors.green : colors.aqua)
        .attr('stroke', isCollider ? colors.green : colors.fgMuted)
        .attr('stroke-width', isCollider ? 3 : 1.5);
    });

    // Update stats
    svgEl.select('.stat-people').text(count);
    svgEl.select('.stat-pairs').text(numPairs(count));
    svgEl.select('.stat-prob').text((collisionProb(count) * 100).toFixed(1) + '%');

    // Update collision indicator
    if (collision) {
      const p1 = people[collision[0]];
      const p2 = people[collision[1]];
      svgEl.select('.collision-line')
        .attr('x1', p1.x).attr('y1', p1.y)
        .attr('x2', p2.x).attr('y2', p2.y)
        .transition().duration(400)
        .attr('opacity', 1);
      svgEl.select('.collision-text')
        .transition().duration(400)
        .attr('opacity', 1);
      svgEl.select('.collision-date')
        .text(dayToDate(p1.birthday))
        .transition().duration(400)
        .attr('opacity', 1);
    } else {
      svgEl.select('.collision-line').attr('opacity', 0);
      svgEl.select('.collision-text').attr('opacity', 0);
      svgEl.select('.collision-date').attr('opacity', 0);
    }

    // Progress bar
    svgEl.select('.progress-fill')
      .transition().duration(300)
      .attr('width', (count / 25) * 130);

    currentStep = step;
  }

  async function runAnimation() {
    if (!isPlaying) return;

    for (let i = currentStep; i <= maxStep; i++) {
      if (!isPlaying) return;
      renderStep(i);

      const collision = findCollision(i);
      if (collision) {
        await sleep(2000);
        isPlaying = false;
        return;
      }
      await sleep(600);
    }

    isPlaying = false;
  }

  function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
  function pause() { isPlaying = false; clearTimeouts(); }
  function next() { pause(); if (currentStep < maxStep) renderStep(currentStep + 1); }
  function prev() { pause(); if (currentStep > 0) renderStep(currentStep - 1); }
  function skip() { pause(); renderStep(23); }
  function replay() { pause(); renderStep(0); currentStep = 0; isPlaying = true; runAnimation(); }
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

    // Room label
    svgEl.append('text')
      .attr('x', centerX).attr('y', centerY)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '13px')
      .text('The Room');

    // Room circle (background)
    svgEl.append('circle')
      .attr('cx', centerX).attr('cy', centerY)
      .attr('r', radius + 30)
      .attr('fill', 'none')
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.3);

    // Collision line (hidden initially)
    svgEl.append('line')
      .attr('class', 'collision-line')
      .attr('stroke', colors.green)
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    // People (smaller circles, r=15)
    const personGroups = svgEl.selectAll('.person')
      .data(people)
      .enter()
      .append('g')
      .attr('class', 'person')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .attr('opacity', 0);

    personGroups.append('circle')
      .attr('r', 15)
      .attr('fill', colors.aqua)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-width', 1.5);

    personGroups.append('text')
      .attr('y', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.bg)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text(d => d.id);

    // Stats panel (right side)
    const statsX = 500;
    const statsY = 50;

    svgEl.append('rect')
      .attr('x', statsX).attr('y', statsY)
      .attr('width', 200).attr('height', 160)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.fgMuted)
      .attr('stroke-opacity', 0.5);

    svgEl.append('text')
      .attr('x', statsX + 100).attr('y', statsY + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fg).attr('font-size', '14px').attr('font-weight', 'bold')
      .text('Birthday Paradox');

    // People count
    svgEl.append('text')
      .attr('x', statsX + 20).attr('y', statsY + 60)
      .attr('fill', colors.fgMuted).attr('font-size', '12px')
      .text('People:');
    svgEl.append('text')
      .attr('class', 'stat-people')
      .attr('x', statsX + 180).attr('y', statsY + 60)
      .attr('text-anchor', 'end')
      .attr('fill', colors.aqua).attr('font-size', '16px').attr('font-weight', 'bold')
      .text('0');

    // Pairs count
    svgEl.append('text')
      .attr('x', statsX + 20).attr('y', statsY + 88)
      .attr('fill', colors.fgMuted).attr('font-size', '12px')
      .text('Pairs to check:');
    svgEl.append('text')
      .attr('class', 'stat-pairs')
      .attr('x', statsX + 180).attr('y', statsY + 88)
      .attr('text-anchor', 'end')
      .attr('fill', colors.orange).attr('font-size', '16px').attr('font-weight', 'bold')
      .text('0');

    // Collision probability
    svgEl.append('text')
      .attr('x', statsX + 20).attr('y', statsY + 116)
      .attr('fill', colors.fgMuted).attr('font-size', '12px')
      .text('P(collision):');
    svgEl.append('text')
      .attr('class', 'stat-prob')
      .attr('x', statsX + 180).attr('y', statsY + 116)
      .attr('text-anchor', 'end')
      .attr('fill', colors.yellow).attr('font-size', '16px').attr('font-weight', 'bold')
      .text('0%');

    // Progress bar
    svgEl.append('rect')
      .attr('x', statsX + 35).attr('y', statsY + 135)
      .attr('width', 130).attr('height', 10)
      .attr('rx', 5)
      .attr('fill', colors.bg);
    svgEl.append('rect')
      .attr('class', 'progress-fill')
      .attr('x', statsX + 35).attr('y', statsY + 135)
      .attr('width', 0).attr('height', 10)
      .attr('rx', 5)
      .attr('fill', colors.yellow);

    // Collision found panel
    const collisionY = 240;
    svgEl.append('rect')
      .attr('x', statsX).attr('y', collisionY)
      .attr('width', 200).attr('height', 100)
      .attr('rx', 8)
      .attr('fill', colors.bgCard)
      .attr('stroke', colors.green)
      .attr('stroke-width', 2);

    svgEl.append('text')
      .attr('class', 'collision-text')
      .attr('x', statsX + 100).attr('y', collisionY + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '16px').attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('MATCH FOUND!');

    svgEl.append('text')
      .attr('x', statsX + 100).attr('y', collisionY + 60)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '11px')
      .text('Shared birthday:');

    svgEl.append('text')
      .attr('class', 'collision-date')
      .attr('x', statsX + 100).attr('y', collisionY + 82)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.green).attr('font-size', '14px').attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('');

    // Bottom insight
    svgEl.append('text')
      .attr('x', centerX).attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.fgMuted).attr('font-size', '12px')
      .text('23 people → 253 comparisons → >50% chance of match');

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
    max-height: 460px;
  }
</style>
