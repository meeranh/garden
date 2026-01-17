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

	function drawServer(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const s = g.append('g').attr('transform', `translate(${x}, ${y})`);
		s.append('rect').attr('x', -15).attr('y', -20).attr('width', 30).attr('height', 40)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		for (let i = 0; i < 2; i++) {
			s.append('rect').attr('x', -10).attr('y', -14 + i * 16).attr('width', 20).attr('height', 10)
				.attr('fill', '#3c3836').attr('rx', 2);
			s.append('circle').attr('cx', -4).attr('cy', -9 + i * 16).attr('r', 2).attr('fill', color);
		}
	}

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
			.text('Route Optimization: Before vs After');

		const leftX = 160;
		const rightX = 490;

		// Divider
		svgEl.append('line')
			.attr('x1', width / 2).attr('y1', 35)
			.attr('x2', width / 2).attr('y2', height - 15)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		// === LEFT: Before (Triangle) ===
		svgEl.append('text')
			.attr('x', leftX).attr('y', 48)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('First Packet (Triangle)');

		// Triangle positions
		const lCnX = 70, lCnY = 190;
		const lHaX = 160, lHaY = 85;
		const lMnX = 250, lMnY = 190;

		// CN
		drawServer(svgEl, lCnX, lCnY, '#d3869b');
		svgEl.append('text')
			.attr('x', lCnX).attr('y', lCnY + 32)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '9px')
			.text('CN');

		// HA
		drawRouter(svgEl, lHaX, lHaY, '#fabd2f');
		svgEl.append('text')
			.attr('x', lHaX).attr('y', lHaY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('HA');

		// MN
		drawPhone(svgEl, lMnX, lMnY, '#8ec07c');
		svgEl.append('text')
			.attr('x', lMnX).attr('y', lMnY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('MN');

		// Triangle path: CN -> HA -> MN
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', lCnX + 15).attr('y1', lCnY - 20)
			.attr('x2', lHaX - 20).attr('y2', lHaY + 12)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,5');

		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', lHaX + 20).attr('y1', lHaY + 12)
			.attr('x2', lMnX - 12).attr('y2', lMnY - 18)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,5');

		svgEl.append('text')
			.attr('x', leftX).attr('y', height - 20)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('Long detour through HA');

		// === RIGHT: After (Direct) ===
		svgEl.append('text')
			.attr('x', rightX).attr('y', 48)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('After Optimization (Direct)');

		// Same positions, offset right
		const rCnX = 400, rCnY = 190;
		const rHaX = 490, rHaY = 105;
		const rMnX = 580, rMnY = 190;

		// CN
		drawServer(svgEl, rCnX, rCnY, '#d3869b');
		svgEl.append('text')
			.attr('x', rCnX).attr('y', rCnY + 32)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '9px')
			.text('CN');

		// HA (faded - not used)
		const haFaded = svgEl.append('g').attr('opacity', 0.25);
		drawRouter(haFaded as unknown as d3.Selection<SVGSVGElement, unknown, null, undefined>, rHaX, rHaY, '#fabd2f');
		svgEl.append('text')
			.attr('x', rHaX).attr('y', rHaY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.attr('opacity', 0.4)
			.text('HA');

		// MN
		drawPhone(svgEl, rMnX, rMnY, '#8ec07c');
		svgEl.append('text')
			.attr('x', rMnX).attr('y', rMnY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('MN');

		// Direct path: CN -> MN
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', rCnX + 18).attr('y1', rCnY)
			.attr('x2', rMnX - 15).attr('y2', rMnY)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '8,5');

		// "Skipped" indicator
		svgEl.append('text')
			.attr('x', rHaX).attr('y', rHaY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(skipped)');

		svgEl.append('text')
			.attr('x', rightX).attr('y', height - 20)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Direct path, no detour!');

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
