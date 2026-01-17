<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let animationFrame: number;
	let dotOffset = 0;
	let colors: Record<string, string>;

	const width = 650;
	const height = 260;

	function animatePaths() {
		dotOffset += 0.5;

		// Animate traditional path dots
		svgEl.select('.trad-path-1')
			.attr('stroke-dashoffset', -dotOffset);
		svgEl.select('.trad-path-2')
			.attr('stroke-dashoffset', -dotOffset);

		// Animate D2D path
		svgEl.select('.d2d-path-line')
			.attr('stroke-dashoffset', -dotOffset * 0.8);

		animationFrame = requestAnimationFrame(animatePaths);
	}

	function drawPhone(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('rect').attr('x', -12).attr('y', -22).attr('width', 24).attr('height', 44)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 4);
		t.append('rect').attr('x', -8).attr('y', -18).attr('width', 16).attr('height', 28)
			.attr('fill', '#1d2021').attr('rx', 2);
		t.append('circle').attr('cx', 0).attr('cy', 16).attr('r', 3).attr('fill', color);
	}

	function drawTower(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('path').attr('d', 'M0,-45 L-8,0 L8,0 Z')
			.attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
		t.append('line').attr('x1', -5).attr('y1', -12).attr('x2', 5).attr('y2', -12)
			.attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', -4).attr('y1', -24).attr('x2', 4).attr('y2', -24)
			.attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', 0).attr('y1', -45).attr('x2', 0).attr('y2', -55)
			.attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -57).attr('r', 3).attr('fill', color);
	}

	// Simple controller - no steps needed
	function play() {}
	function pause() {}
	function next() {}
	function prev() {}
	function skip() {}
	function replay() {}
	function getState() { return { isPlaying: false, currentStep: 0, totalSteps: 0 }; }

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('Traditional vs D2D Communication');

		const leftX = 165;
		const rightX = 485;
		const baseY = 165;

		// ===== TRADITIONAL (Left) =====
		svgEl.append('text')
			.attr('x', leftX).attr('y', 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Traditional');

		// Tower
		drawTower(svgEl, leftX, baseY - 55, '#a89984');

		// Two phones
		drawPhone(svgEl, leftX - 80, baseY, '#d3869b');
		drawPhone(svgEl, leftX + 80, baseY, '#83a598');

		// Labels
		svgEl.append('text')
			.attr('x', leftX - 80).attr('y', baseY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Phone A');

		svgEl.append('text')
			.attr('x', leftX + 80).attr('y', baseY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Phone B');

		// Animated path A to Tower
		svgEl.append('line')
			.attr('class', 'trad-path-1')
			.attr('x1', leftX - 65).attr('y1', baseY - 15)
			.attr('x2', leftX - 12).attr('y2', baseY - 95)
			.attr('stroke', '#fb4934').attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,8');

		// Animated path Tower to B
		svgEl.append('line')
			.attr('class', 'trad-path-2')
			.attr('x1', leftX + 12).attr('y1', baseY - 95)
			.attr('x2', leftX + 65).attr('y2', baseY - 15)
			.attr('stroke', '#fb4934').attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,8');

		svgEl.append('text')
			.attr('x', leftX).attr('y', height - 20)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('Long path through tower');

		// ===== D2D (Right) =====
		svgEl.append('text')
			.attr('x', rightX).attr('y', 55)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('D2D (Direct)');

		// Tower (faded with X)
		const fadedTower = svgEl.append('g').attr('opacity', 0.15);
		drawTower(fadedTower, rightX, baseY - 55, '#a89984');

		svgEl.append('text')
			.attr('x', rightX).attr('y', baseY - 85)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '18px')
			.attr('font-weight', 'bold')
			.text('✕');

		// Two phones (closer)
		drawPhone(svgEl, rightX - 50, baseY, '#d3869b');
		drawPhone(svgEl, rightX + 50, baseY, '#83a598');

		// Labels
		svgEl.append('text')
			.attr('x', rightX - 50).attr('y', baseY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Phone A');

		svgEl.append('text')
			.attr('x', rightX + 50).attr('y', baseY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Phone B');

		// Animated direct path
		svgEl.append('line')
			.attr('class', 'd2d-path-line')
			.attr('x1', rightX - 35).attr('y1', baseY)
			.attr('x2', rightX + 35).attr('y2', baseY)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		// Arrow heads
		svgEl.append('polygon')
			.attr('points', `${rightX + 35},${baseY} ${rightX + 27},${baseY - 5} ${rightX + 27},${baseY + 5}`)
			.attr('fill', '#8ec07c');

		svgEl.append('polygon')
			.attr('points', `${rightX - 35},${baseY} ${rightX - 27},${baseY - 5} ${rightX - 27},${baseY + 5}`)
			.attr('fill', '#8ec07c');

		svgEl.append('text')
			.attr('x', rightX).attr('y', height - 20)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Direct, no tower needed!');

		// VS
		svgEl.append('text')
			.attr('x', width / 2).attr('y', 130)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('vs');

		// Start animation
		animatePaths();

		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => {
		if (animationFrame) cancelAnimationFrame(animationFrame);
	});
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
	.diagram {
		display: block;
		margin: 0 auto;
		background: #1d2021;
		border-radius: 0.5rem;
	}
</style>
