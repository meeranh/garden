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

	const width = 650;
	const height = 280;

	function drawRouter(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const r = g.append('g').attr('transform', `translate(${x}, ${y})`);
		r.append('rect').attr('x', -22).attr('y', -12).attr('width', 44).attr('height', 24)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		r.append('line').attr('x1', -9).attr('y1', -12).attr('x2', -9).attr('y2', -22)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', -9).attr('cy', -25).attr('r', 3).attr('fill', color);
		r.append('line').attr('x1', 9).attr('y1', -12).attr('x2', 9).attr('y2', -22)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', 9).attr('cy', -25).attr('r', 3).attr('fill', color);
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
		offset += 0.5;
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
			.text('FMIPv6: Predict & Prepare Before Moving');

		// Timeline
		const timeY = 250;
		svgEl.append('line')
			.attr('x1', 50).attr('y1', timeY)
			.attr('x2', 600).attr('y2', timeY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2);

		svgEl.append('text')
			.attr('x', 50).attr('y', timeY + 18)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Time →');

		// Before move marker
		svgEl.append('line')
			.attr('x1', 250).attr('y1', timeY - 5)
			.attr('x2', 250).attr('y2', timeY + 5)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);
		svgEl.append('text')
			.attr('x', 250).attr('y', timeY + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('Prepare');

		// Handover marker
		svgEl.append('line')
			.attr('x1', 400).attr('y1', timeY - 5)
			.attr('x2', 400).attr('y2', timeY + 5)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2);
		svgEl.append('text')
			.attr('x', 400).attr('y', timeY + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.text('Move');

		// After marker
		svgEl.append('line')
			.attr('x1', 520).attr('y1', timeY - 5)
			.attr('x2', 520).attr('y2', timeY + 5)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2);
		svgEl.append('text')
			.attr('x', 520).attr('y', timeY + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('No loss!');

		// Routers
		const parX = 180, parY = 100;  // Previous Access Router
		const narX = 470, narY = 100;  // New Access Router

		drawRouter(svgEl, parX, parY, '#fabd2f');
		svgEl.append('text')
			.attr('x', parX).attr('y', parY - 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Previous Router');

		drawRouter(svgEl, narX, narY, '#8ec07c');
		svgEl.append('text')
			.attr('x', narX).attr('y', narY - 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('New Router');

		// Phone positions (before and after)
		drawPhone(svgEl, 180, 190, '#8ec07c');
		svgEl.append('text')
			.attr('x', 180).attr('y', 225)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Before');

		drawPhone(svgEl, 470, 190, '#8ec07c');
		svgEl.append('text')
			.attr('x', 470).attr('y', 225)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('After');

		// Step 1: MN tells PAR "I'm about to move"
		svgEl.append('line')
			.attr('x1', 195).attr('y1', 175)
			.attr('x2', 195).attr('y2', 115)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '4,3');

		svgEl.append('text')
			.attr('x', 90).attr('y', 150)
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('① "I\'m moving"');

		// Step 2: PAR tells NAR to expect MN
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', parX + 30).attr('y1', parY)
			.attr('x2', narX - 30).attr('y2', narY)
			.attr('stroke', '#d3869b')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,5');

		svgEl.append('text')
			.attr('x', (parX + narX) / 2).attr('y', parY - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '9px')
			.text('② "Forward packets here"');

		// Step 3: Forwarding tunnel established
		svgEl.append('text')
			.attr('x', (parX + narX) / 2).attr('y', parY + 55)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('③ Packets forwarded');

		// Move arrow
		svgEl.append('path')
			.attr('d', 'M220,190 Q325,160 450,190')
			.attr('fill', 'none')
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrowhead)');

		// Arrow marker
		svgEl.append('defs').append('marker')
			.attr('id', 'arrowhead')
			.attr('markerWidth', 10)
			.attr('markerHeight', 7)
			.attr('refX', 9)
			.attr('refY', 3.5)
			.attr('orient', 'auto')
			.append('polygon')
			.attr('points', '0 0, 10 3.5, 0 7')
			.attr('fill', '#fb4934');

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
