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
	const height = 260;

	function drawPhone(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const p = g.append('g').attr('transform', `translate(${x}, ${y})`);
		p.append('rect').attr('x', -10).attr('y', -16).attr('width', 20).attr('height', 32)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		p.append('rect').attr('x', -7).attr('y', -12).attr('width', 14).attr('height', 20)
			.attr('fill', '#1d2021').attr('rx', 2);
		p.append('circle').attr('cx', 0).attr('cy', 10).attr('r', 2.5).attr('fill', color);
	}

	function drawRouter(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const r = g.append('g').attr('transform', `translate(${x}, ${y})`);
		r.append('rect').attr('x', -20).attr('y', -12).attr('width', 40).attr('height', 24)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		r.append('line').attr('x1', -8).attr('y1', -12).attr('x2', -8).attr('y2', -20)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', -8).attr('cy', -23).attr('r', 3).attr('fill', color);
		r.append('line').attr('x1', 8).attr('y1', -12).attr('x2', 8).attr('y2', -20)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', 8).attr('cy', -23).attr('r', 3).attr('fill', color);
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

		const leftX = 165;
		const rightX = 485;

		// Divider
		svgEl.append('line')
			.attr('x1', width / 2).attr('y1', 40)
			.attr('x2', width / 2).attr('y2', height - 20)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		// === LEFT: MIPv4 ===
		svgEl.append('text')
			.attr('x', leftX).attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('Mobile IPv4');

		// HA
		drawRouter(svgEl, leftX - 50, 80, '#fabd2f');
		svgEl.append('text')
			.attr('x', leftX - 95).attr('y', 85)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('HA');

		// FA
		drawRouter(svgEl, leftX + 50, 80, '#83a598');
		svgEl.append('text')
			.attr('x', leftX + 95).attr('y', 85)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '9px')
			.text('FA');

		// MN
		drawPhone(svgEl, leftX + 50, 170, '#8ec07c');
		svgEl.append('text')
			.attr('x', leftX + 50).attr('y', 205)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('MN');

		// Flow: HA -> FA -> MN
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', leftX - 25).attr('y1', 80)
			.attr('x2', leftX + 25).attr('y2', 80)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', leftX + 50).attr('y1', 100)
			.attr('x2', leftX + 50).attr('y2', 150)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		svgEl.append('text')
			.attr('x', leftX).attr('y', height - 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Needs Foreign Agent');

		// === RIGHT: MIPv6 ===
		svgEl.append('text')
			.attr('x', rightX).attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('Mobile IPv6');

		// HA only
		drawRouter(svgEl, rightX, 80, '#fabd2f');
		svgEl.append('text')
			.attr('x', rightX - 45).attr('y', 85)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('HA');

		// MN (direct)
		drawPhone(svgEl, rightX, 170, '#8ec07c');
		svgEl.append('text')
			.attr('x', rightX).attr('y', 205)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('MN');

		// Direct flow
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', rightX).attr('y1', 100)
			.attr('x2', rightX).attr('y2', 150)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		// "No FA" crossed out
		svgEl.append('text')
			.attr('x', rightX + 70).attr('y', 85)
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('No FA!');

		svgEl.append('text')
			.attr('x', rightX).attr('y', height - 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Phone auto-configures CoA');

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
