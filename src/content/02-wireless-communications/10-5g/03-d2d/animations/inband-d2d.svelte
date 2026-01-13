<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let animationFrame: number;
	let offset = 0;
	let colors: Record<string, string>;

	const width = 620;
	const height = 240;

	function animate() {
		offset += 0.4;
		svgEl.selectAll('.data-flow').attr('stroke-dashoffset', -offset);
		animationFrame = requestAnimationFrame(animate);
	}

	function drawPhone(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('rect').attr('x', -10).attr('y', -18).attr('width', 20).attr('height', 36)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		t.append('rect').attr('x', -7).attr('y', -14).attr('width', 14).attr('height', 22)
			.attr('fill', '#1d2021').attr('rx', 2);
		t.append('circle').attr('cx', 0).attr('cy', 12).attr('r', 2.5).attr('fill', color);
	}

	function drawTower(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('path').attr('d', 'M0,-40 L-7,0 L7,0 Z')
			.attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
		t.append('line').attr('x1', -4).attr('y1', -10).attr('x2', 4).attr('y2', -10)
			.attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', -3).attr('y1', -22).attr('x2', 3).attr('y2', -22)
			.attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', 0).attr('y1', -40).attr('x2', 0).attr('y2', -48)
			.attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -50).attr('r', 3).attr('fill', color);
	}

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
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text('In-Band: Same Spectrum, Network Controls');

		// Single spectrum bar spanning the whole width
		svgEl.append('rect')
			.attr('x', 60).attr('y', 40)
			.attr('width', 500).attr('height', 28)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.15)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 4);

		svgEl.append('text')
			.attr('x', width / 2).attr('y', 59)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Cellular Spectrum (LTE/5G)');

		const baseY = 155;

		// Tower in the middle - it controls everything
		drawTower(svgEl, width / 2, baseY - 30, '#8ec07c');

		svgEl.append('text')
			.attr('x', width / 2).attr('y', baseY - 85)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Network');

		// Regular cellular user on left
		drawPhone(svgEl, 120, baseY, '#8ec07c');
		svgEl.append('text')
			.attr('x', 120).attr('y', baseY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Cellular User');

		// Connection to tower
		svgEl.append('line')
			.attr('class', 'data-flow')
			.attr('x1', 135).attr('y1', baseY - 10)
			.attr('x2', width / 2 - 20).attr('y2', baseY - 60)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		// D2D phones on right
		drawPhone(svgEl, 420, baseY, '#8ec07c');
		drawPhone(svgEl, 520, baseY, '#8ec07c');

		svgEl.append('text')
			.attr('x', 470).attr('y', baseY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('D2D Users');

		// D2D link (same color - same spectrum!)
		svgEl.append('line')
			.attr('class', 'data-flow')
			.attr('x1', 435).attr('y1', baseY)
			.attr('x2', 505).attr('y2', baseY)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		// Control lines from tower to D2D (dotted to show control)
		svgEl.append('line')
			.attr('x1', width / 2 + 20).attr('y1', baseY - 60)
			.attr('x2', 430).attr('y2', baseY - 15)
			.attr('stroke', '#fabd2f').attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '3,3')
			.attr('opacity', 0.7);

		svgEl.append('line')
			.attr('x1', width / 2 + 25).attr('y1', baseY - 55)
			.attr('x2', 510).attr('y2', baseY - 15)
			.attr('stroke', '#fabd2f').attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '3,3')
			.attr('opacity', 0.7);

		// Control label
		svgEl.append('text')
			.attr('x', width / 2 + 80).attr('y', baseY - 50)
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('controls');

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Everything uses cellular spectrum • Network coordinates to avoid interference');

		animate();
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
