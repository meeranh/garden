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
		// Server box
		s.append('rect').attr('x', -25).attr('y', -30).attr('width', 50).attr('height', 60)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 4);
		// Lines on server
		for (let i = 0; i < 3; i++) {
			s.append('rect').attr('x', -18).attr('y', -22 + i * 18).attr('width', 36).attr('height', 10)
				.attr('fill', '#3c3836').attr('stroke', color).attr('stroke-opacity', 0.5).attr('rx', 2);
			s.append('circle').attr('cx', -12).attr('cy', -17 + i * 18).attr('r', 2).attr('fill', color);
		}
	}

	function drawRouter(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const r = g.append('g').attr('transform', `translate(${x}, ${y})`);
		// Router body
		r.append('rect').attr('x', -30).attr('y', -18).attr('width', 60).attr('height', 36)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 4);
		// Antennas
		r.append('line').attr('x1', -15).attr('y1', -18).attr('x2', -15).attr('y2', -30)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', -15).attr('cy', -33).attr('r', 3).attr('fill', color);
		r.append('line').attr('x1', 15).attr('y1', -18).attr('x2', 15).attr('y2', -30)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', 15).attr('cy', -33).attr('r', 3).attr('fill', color);
		// Lights
		r.append('circle').attr('cx', -10).attr('cy', 0).attr('r', 4).attr('fill', '#8ec07c');
		r.append('circle').attr('cx', 5).attr('cy', 0).attr('r', 4).attr('fill', '#fabd2f');
	}

	function drawPhone(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const p = g.append('g').attr('transform', `translate(${x}, ${y})`);
		p.append('rect').attr('x', -15).attr('y', -25).attr('width', 30).attr('height', 50)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 4);
		p.append('rect').attr('x', -11).attr('y', -20).attr('width', 22).attr('height', 32)
			.attr('fill', '#1d2021').attr('rx', 2);
		p.append('circle').attr('cx', 0).attr('cy', 18).attr('r', 4).attr('fill', color);
	}

	function drawHouse(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number) {
		const h = g.append('g').attr('transform', `translate(${x}, ${y})`);
		// Roof
		h.append('path').attr('d', 'M-40,0 L0,-30 L40,0 Z')
			.attr('fill', '#cc241d').attr('fill-opacity', 0.3).attr('stroke', '#cc241d').attr('stroke-width', 2);
		// Body
		h.append('rect').attr('x', -30).attr('y', 0).attr('width', 60).attr('height', 40)
			.attr('fill', '#3c3836').attr('stroke', '#7c6f64').attr('stroke-width', 2);
		// Door
		h.append('rect').attr('x', -8).attr('y', 15).attr('width', 16).attr('height', 25)
			.attr('fill', '#504945').attr('stroke', '#7c6f64');
	}

	function drawHotel(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number) {
		const h = g.append('g').attr('transform', `translate(${x}, ${y})`);
		// Building
		h.append('rect').attr('x', -35).attr('y', -40).attr('width', 70).attr('height', 80)
			.attr('fill', '#3c3836').attr('stroke', '#83a598').attr('stroke-width', 2).attr('rx', 3);
		// Windows
		for (let row = 0; row < 3; row++) {
			for (let col = 0; col < 3; col++) {
				h.append('rect')
					.attr('x', -25 + col * 20).attr('y', -32 + row * 22)
					.attr('width', 12).attr('height', 14)
					.attr('fill', '#fabd2f').attr('fill-opacity', 0.4);
			}
		}
		// Sign
		h.append('text').attr('x', 0).attr('y', -50).attr('text-anchor', 'middle')
			.attr('fill', '#83a598').attr('font-size', '10px').attr('font-weight', 'bold').text('HOTEL');
	}

	function animate() {
		offset += 0.5;
		svgEl.selectAll('.packet-line').attr('stroke-dashoffset', -offset);
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
			.text('Packet Forwarding: Home Agent Redirects to You');

		const senderX = 80;
		const homeX = 325;
		const foreignX = 560;
		const topY = 100;
		const bottomY = 200;

		// Sender (Correspondent Node)
		drawServer(svgEl, senderX, topY, '#d3869b');
		svgEl.append('text')
			.attr('x', senderX).attr('y', topY + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Sender');

		// Home Network
		drawHouse(svgEl, homeX, topY - 10);
		drawRouter(svgEl, homeX, bottomY, '#fabd2f');
		svgEl.append('text')
			.attr('x', homeX).attr('y', bottomY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Home Agent');

		svgEl.append('text')
			.attr('x', homeX).attr('y', topY + 55)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Home Network');

		// Foreign Network (where phone actually is)
		drawHotel(svgEl, foreignX, topY);
		drawPhone(svgEl, foreignX, bottomY, '#8ec07c');
		svgEl.append('text')
			.attr('x', foreignX).attr('y', bottomY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('You (Mobile)');

		svgEl.append('text')
			.attr('x', foreignX).attr('y', topY + 55)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Foreign Network');

		// Step 1: Sender -> Home Address
		svgEl.append('line')
			.attr('class', 'packet-line')
			.attr('x1', senderX + 30).attr('y1', topY)
			.attr('x2', homeX - 45).attr('y2', topY)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		svgEl.append('text')
			.attr('x', (senderX + homeX) / 2).attr('y', topY - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('① To: Home Address');

		// Step 2: Home Agent -> Care-of Address
		svgEl.append('path')
			.attr('class', 'packet-line')
			.attr('d', `M${homeX + 35},${bottomY} Q${(homeX + foreignX) / 2},${bottomY + 30} ${foreignX - 20},${bottomY}`)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		svgEl.append('text')
			.attr('x', (homeX + foreignX) / 2).attr('y', bottomY + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('② Forward to: Care-of Address');

		// Connection from house to router
		svgEl.append('line')
			.attr('x1', homeX).attr('y1', topY + 40)
			.attr('x2', homeX).attr('y2', bottomY - 25)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('opacity', 0.5);

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
