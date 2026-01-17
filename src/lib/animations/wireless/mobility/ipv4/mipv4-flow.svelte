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

	const width = 680;
	const height = 320;

	function drawPhone(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const p = g.append('g').attr('transform', `translate(${x}, ${y})`);
		p.append('rect').attr('x', -12).attr('y', -20).attr('width', 24).attr('height', 40)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		p.append('rect').attr('x', -9).attr('y', -16).attr('width', 18).attr('height', 26)
			.attr('fill', '#1d2021').attr('rx', 2);
		p.append('circle').attr('cx', 0).attr('cy', 14).attr('r', 3).attr('fill', color);
	}

	function drawServer(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const s = g.append('g').attr('transform', `translate(${x}, ${y})`);
		s.append('rect').attr('x', -20).attr('y', -25).attr('width', 40).attr('height', 50)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		for (let i = 0; i < 3; i++) {
			s.append('rect').attr('x', -14).attr('y', -19 + i * 15).attr('width', 28).attr('height', 10)
				.attr('fill', '#3c3836').attr('rx', 2);
			s.append('circle').attr('cx', -8).attr('cy', -14 + i * 15).attr('r', 2).attr('fill', color);
		}
	}

	function drawRouter(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const r = g.append('g').attr('transform', `translate(${x}, ${y})`);
		r.append('rect').attr('x', -25).attr('y', -15).attr('width', 50).attr('height', 30)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		r.append('line').attr('x1', -12).attr('y1', -15).attr('x2', -12).attr('y2', -25)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', -12).attr('cy', -28).attr('r', 3).attr('fill', color);
		r.append('line').attr('x1', 12).attr('y1', -15).attr('x2', 12).attr('y2', -25)
			.attr('stroke', color).attr('stroke-width', 2);
		r.append('circle').attr('cx', 12).attr('cy', -28).attr('r', 3).attr('fill', color);
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
			.text('Mobile IPv4 Packet Flow');

		// Network backgrounds
		// Home Network
		svgEl.append('rect')
			.attr('x', 200).attr('y', 45)
			.attr('width', 180).attr('height', 200)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.05)
			.attr('stroke', '#fabd2f').attr('stroke-opacity', 0.3)
			.attr('stroke-dasharray', '5,5')
			.attr('rx', 10);

		svgEl.append('text')
			.attr('x', 290).attr('y', 62)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.text('Home Network');

		// Foreign Network
		svgEl.append('rect')
			.attr('x', 420).attr('y', 45)
			.attr('width', 220).attr('height', 200)
			.attr('fill', '#83a598').attr('fill-opacity', 0.05)
			.attr('stroke', '#83a598').attr('stroke-opacity', 0.3)
			.attr('stroke-dasharray', '5,5')
			.attr('rx', 10);

		svgEl.append('text')
			.attr('x', 530).attr('y', 62)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.text('Foreign Network');

		const cnX = 80;
		const haX = 290;
		const faX = 490;
		const mnX = 590;
		const topY = 110;
		const bottomY = 200;

		// Correspondent Node
		drawServer(svgEl, cnX, topY, '#d3869b');
		svgEl.append('text')
			.attr('x', cnX).attr('y', topY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('CN');

		// Home Agent
		drawRouter(svgEl, haX, topY, '#fabd2f');
		svgEl.append('text')
			.attr('x', haX).attr('y', topY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Home Agent');

		// Foreign Agent
		drawRouter(svgEl, faX, topY, '#83a598');
		svgEl.append('text')
			.attr('x', faX).attr('y', topY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Foreign Agent');

		// Mobile Node
		drawPhone(svgEl, mnX, bottomY, '#8ec07c');
		svgEl.append('text')
			.attr('x', mnX).attr('y', bottomY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('You');

		// Step 1: CN -> HA (to Home Address)
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', cnX + 25).attr('y1', topY)
			.attr('x2', haX - 30).attr('y2', topY)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		svgEl.append('text')
			.attr('x', (cnX + haX) / 2).attr('y', topY - 20)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('① To Home Address');

		// Step 2: HA -> FA (tunneled)
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', haX + 30).attr('y1', topY)
			.attr('x2', faX - 30).attr('y2', topY)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		svgEl.append('text')
			.attr('x', (haX + faX) / 2).attr('y', topY - 20)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('② Tunnel to CoA');

		// Step 3: FA -> MN
		svgEl.append('line')
			.attr('class', 'packet-flow')
			.attr('x1', faX + 20).attr('y1', topY + 15)
			.attr('x2', mnX - 15).attr('y2', bottomY - 25)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		svgEl.append('text')
			.attr('x', faX + 60).attr('y', (topY + bottomY) / 2 - 10)
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('③ Deliver');

		// Reply: MN -> CN (direct, different color)
		svgEl.append('path')
			.attr('class', 'packet-flow')
			.attr('d', `M${mnX - 15},${bottomY + 5} Q${width / 2},${height - 30} ${cnX + 20},${topY + 25}`)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,5');

		svgEl.append('text')
			.attr('x', width / 2 - 50).attr('y', height - 25)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('④ Reply (direct)');

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
