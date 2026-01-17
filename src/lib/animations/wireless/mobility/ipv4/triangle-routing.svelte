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

	const width = 550;
	const height = 280;

	function drawServer(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const s = g.append('g').attr('transform', `translate(${x}, ${y})`);
		s.append('rect').attr('x', -18).attr('y', -22).attr('width', 36).attr('height', 44)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		for (let i = 0; i < 2; i++) {
			s.append('rect').attr('x', -12).attr('y', -16 + i * 18).attr('width', 24).attr('height', 12)
				.attr('fill', '#3c3836').attr('rx', 2);
			s.append('circle').attr('cx', -6).attr('cy', -10 + i * 18).attr('r', 2).attr('fill', color);
		}
	}

	function drawRouter(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const r = g.append('g').attr('transform', `translate(${x}, ${y})`);
		r.append('rect').attr('x', -22).attr('y', -12).attr('width', 44).attr('height', 24)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		r.append('line').attr('x1', -10).attr('y1', -12).attr('x2', -10).attr('y2', -22)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', -10).attr('cy', -25).attr('r', 3).attr('fill', color);
		r.append('line').attr('x1', 10).attr('y1', -12).attr('x2', 10).attr('y2', -22)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', 10).attr('cy', -25).attr('r', 3).attr('fill', color);
	}

	function drawPhone(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const p = g.append('g').attr('transform', `translate(${x}, ${y})`);
		p.append('rect').attr('x', -10).attr('y', -18).attr('width', 20).attr('height', 36)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		p.append('rect').attr('x', -7).attr('y', -14).attr('width', 14).attr('height', 22)
			.attr('fill', '#1d2021').attr('rx', 2);
		p.append('circle').attr('cx', 0).attr('cy', 12).attr('r', 3).attr('fill', color);
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
			.text('Triangle Routing Problem');

		// Triangle layout
		const cnX = 100;
		const cnY = 200;
		const haX = 275;
		const haY = 80;
		const mnX = 450;
		const mnY = 200;

		// Draw entities
		drawServer(svgEl, cnX, cnY, '#d3869b');
		svgEl.append('text')
			.attr('x', cnX).attr('y', cnY + 38)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('CN (Sender)');

		drawRouter(svgEl, haX, haY, '#fabd2f');
		svgEl.append('text')
			.attr('x', haX).attr('y', haY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Home Agent');

		drawPhone(svgEl, mnX, mnY, '#8ec07c');
		svgEl.append('text')
			.attr('x', mnX).attr('y', mnY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('You');

		// Long path: CN -> HA -> MN (red, inefficient)
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', cnX + 20).attr('y1', cnY - 25)
			.attr('x2', haX - 25).attr('y2', haY + 15)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', haX + 25).attr('y1', haY + 15)
			.attr('x2', mnX - 15).attr('y2', mnY - 20)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		// Label for long path
		svgEl.append('text')
			.attr('x', haX - 80).attr('y', haY + 50)
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('Packets TO you');
		svgEl.append('text')
			.attr('x', haX - 80).attr('y', haY + 63)
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('(long detour)');

		// Direct path: MN -> CN (green, efficient)
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', mnX - 15).attr('y1', mnY + 5)
			.attr('x2', cnX + 20).attr('y2', cnY + 5)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		// Label for direct path
		svgEl.append('text')
			.attr('x', (cnX + mnX) / 2).attr('y', mnY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Packets FROM you (direct)');

		// X mark on the "optimal" direct path that's not used for incoming
		svgEl.append('line')
			.attr('x1', cnX + 25).attr('y1', cnY - 5)
			.attr('x2', mnX - 20).attr('y2', mnY - 5)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4')
			.attr('opacity', 0.4);

		svgEl.append('text')
			.attr('x', (cnX + mnX) / 2).attr('y', cnY - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0.6)
			.text('(optimal but not used)');

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Incoming packets always detour through Home Agent');

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
