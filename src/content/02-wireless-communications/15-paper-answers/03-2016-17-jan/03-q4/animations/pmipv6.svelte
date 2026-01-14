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
	const height = 280;

	function drawRouter(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const r = g.append('g').attr('transform', `translate(${x}, ${y})`);
		r.append('rect').attr('x', -20).attr('y', -12).attr('width', 40).attr('height', 24)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		r.append('line').attr('x1', -8).attr('y1', -12).attr('x2', -8).attr('y2', -22)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', -8).attr('cy', -25).attr('r', 3).attr('fill', color);
		r.append('line').attr('x1', 8).attr('y1', -12).attr('x2', 8).attr('y2', -22)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', 8).attr('cy', -25).attr('r', 3).attr('fill', color);
	}

	function drawPhone(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const p = g.append('g').attr('transform', `translate(${x}, ${y})`);
		p.append('rect').attr('x', -10).attr('y', -16).attr('width', 20).attr('height', 32)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		p.append('rect').attr('x', -7).attr('y', -12).attr('width', 14).attr('height', 20)
			.attr('fill', '#1d2021').attr('rx', 2);
		p.append('circle').attr('cx', 0).attr('cy', 10).attr('r', 2.5).attr('fill', color);
	}

	function animate() {
		offset += 0.4;
		svgEl.selectAll('.packet-flow').attr('stroke-dashoffset', -offset);
		animationFrame = requestAnimationFrame(animate);
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
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('PMIPv6: Network Does Everything');

		// LMA at top (central anchor)
		const lmaX = 310, lmaY = 70;
		drawRouter(svgEl, lmaX, lmaY, '#fabd2f');
		svgEl.append('text')
			.attr('x', lmaX).attr('y', lmaY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('LMA');
		svgEl.append('text')
			.attr('x', lmaX).attr('y', lmaY + 43)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Local Mobility Anchor)');

		// MAGs (Mobile Access Gateways)
		const mag1X = 150, mag2X = 470, magY = 160;

		drawRouter(svgEl, mag1X, magY, '#83a598');
		svgEl.append('text')
			.attr('x', mag1X + 50).attr('y', magY + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('MAG 1');

		drawRouter(svgEl, mag2X, magY, '#83a598');
		svgEl.append('text')
			.attr('x', mag2X + 50).attr('y', magY + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('MAG 2');

		// Phone (doesn't know about mobility)
		const mnX = 150, mnY = 235;
		drawPhone(svgEl, mnX, mnY, '#8ec07c');

		// "Doesn't know" box
		svgEl.append('rect')
			.attr('x', mnX - 115).attr('y', mnY - 25)
			.attr('width', 70).attr('height', 38)
			.attr('fill', '#1d2021')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 1.5)
			.attr('rx', 4);

		svgEl.append('text')
			.attr('x', mnX - 80).attr('y', mnY - 6)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('No MIPv6');
		svgEl.append('text')
			.attr('x', mnX - 80).attr('y', mnY + 8)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('needed!');

		// LMA to MAG1 tunnel
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', lmaX - 20).attr('y1', lmaY + 15)
			.attr('x2', mag1X + 15).attr('y2', magY - 18)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,5');

		// LMA to MAG2 (faded, not active)
		svgEl.append('line')
			.attr('x1', lmaX + 20).attr('y1', lmaY + 15)
			.attr('x2', mag2X - 15).attr('y2', magY - 18)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,5')
			.attr('opacity', 0.2);

		// MAG1 to MN
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', mag1X).attr('y1', magY + 15)
			.attr('x2', mnX).attr('y2', mnY - 20)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		// Move arrow
		svgEl.append('path')
			.attr('d', `M${mnX + 15},${mnY} Q${(mnX + mag2X) / 2},${mnY + 30} ${mag2X - 25},${magY + 15}`)
			.attr('fill', 'none')
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '4,4');

		svgEl.append('text')
			.attr('x', (mnX + mag2X) / 2).attr('y', mnY + 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.text('MN moves');

		// Process labels
		svgEl.append('text')
			.attr('x', 40).attr('y', 55)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('① MAG detects MN');

		svgEl.append('text')
			.attr('x', 40).attr('y', 73)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('② MAG tells LMA');

		svgEl.append('text')
			.attr('x', 40).attr('y', 91)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('③ LMA updates tunnel');

		svgEl.append('text')
			.attr('x', 40).attr('y', 112)
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('MN does nothing!');

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
