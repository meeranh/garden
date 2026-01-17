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

	const width = 600;
	const height = 300;

	function drawRouter(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const r = g.append('g').attr('transform', `translate(${x}, ${y})`);
		r.append('rect').attr('x', -18).attr('y', -10).attr('width', 36).attr('height', 20)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		r.append('line').attr('x1', -7).attr('y1', -10).attr('x2', -7).attr('y2', -18)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', -7).attr('cy', -21).attr('r', 3).attr('fill', color);
		r.append('line').attr('x1', 7).attr('y1', -10).attr('x2', 7).attr('y2', -18)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', 7).attr('cy', -21).attr('r', 3).attr('fill', color);
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
			.text('HMIPv6: Local Anchor (MAP)');

		// Hierarchy levels
		const haX = 300, haY = 60;
		const mapX = 300, mapY = 140;
		const ar1X = 180, ar2X = 420, arY = 210;
		const mnX = 180, mnY = 270;

		// Home Agent (far away)
		drawRouter(svgEl, haX, haY, '#fabd2f');
		svgEl.append('text')
			.attr('x', haX + 50).attr('y', haY + 5)
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Home Agent');
		svgEl.append('text')
			.attr('x', haX + 50).attr('y', haY + 18)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(far away)');

		// MAP (local anchor)
		drawRouter(svgEl, mapX, mapY, '#83a598');
		svgEl.append('text')
			.attr('x', mapX + 50).attr('y', mapY + 5)
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('MAP');
		svgEl.append('text')
			.attr('x', mapX + 50).attr('y', mapY + 18)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(local anchor)');

		// Access Routers
		drawRouter(svgEl, ar1X, arY, '#d3869b');
		svgEl.append('text')
			.attr('x', ar1X - 40).attr('y', arY + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '9px')
			.text('AR1');

		drawRouter(svgEl, ar2X, arY, '#d3869b');
		svgEl.append('text')
			.attr('x', ar2X + 40).attr('y', arY + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '9px')
			.text('AR2');

		// Mobile Node
		drawPhone(svgEl, mnX, mnY, '#8ec07c');

		// Region box
		svgEl.append('rect')
			.attr('x', 100).attr('y', 115)
			.attr('width', 400).attr('height', 175)
			.attr('fill', 'none')
			.attr('stroke', '#83a598')
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,5')
			.attr('rx', 10);

		svgEl.append('text')
			.attr('x', 115).attr('y', 132)
			.attr('fill', '#83a598')
			.attr('font-size', '9px')
			.text('Region (same RCoA)');

		// Connections
		// HA to MAP (long, infrequent)
		svgEl.append('line')
			.attr('x1', haX).attr('y1', haY + 15)
			.attr('x2', mapX).attr('y2', mapY - 15)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,8')
			.attr('opacity', 0.4);

		// MAP to ARs
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', mapX - 15).attr('y1', mapY + 12)
			.attr('x2', ar1X + 10).attr('y2', arY - 15)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		svgEl.append('line')
			.attr('x1', mapX + 15).attr('y1', mapY + 12)
			.attr('x2', ar2X - 10).attr('y2', arY - 15)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4')
			.attr('opacity', 0.3);

		// AR1 to MN
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', ar1X).attr('y1', arY + 12)
			.attr('x2', mnX).attr('y2', mnY - 20)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		// Move arrow
		svgEl.append('path')
			.attr('d', `M${mnX + 25},${mnY} Q${(mnX + ar2X) / 2},${mnY + 20} ${ar2X - 25},${arY + 10}`)
			.attr('fill', 'none')
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '4,4');

		svgEl.append('text')
			.attr('x', (mnX + ar2X) / 2 + 20).attr('y', mnY + 10)
			.attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.text('move locally');

		// Note
		svgEl.append('text')
			.attr('x', 30).attr('y', 70)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Local move =');
		svgEl.append('text')
			.attr('x', 30).attr('y', 83)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('only tell MAP');

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
