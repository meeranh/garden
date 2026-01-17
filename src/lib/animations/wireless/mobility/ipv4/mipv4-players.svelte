<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let animationFrame: number;
	let pulsePhase = 0;
	let colors: Record<string, string>;

	const width = 650;
	const height = 200;

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
		r.append('circle').attr('cx', -8).attr('cy', 0).attr('r', 4).attr('fill', '#8ec07c');
		r.append('circle').attr('cx', 8).attr('cy', 0).attr('r', 4).attr('fill', '#fabd2f');
	}

	function animate() {
		pulsePhase += 0.03;
		const pulse = 1 + Math.sin(pulsePhase) * 0.05;
		svgEl.select('.mn-group').attr('transform', `translate(90, 100) scale(${pulse})`);
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
			.text('The Four Players in Mobile IPv4');

		const y = 100;

		// Mobile Node (MN)
		const mnG = svgEl.append('g').attr('class', 'mn-group').attr('transform', `translate(90, ${y})`);
		mnG.append('rect').attr('x', -12).attr('y', -20).attr('width', 24).attr('height', 40)
			.attr('fill', '#504945').attr('stroke', '#8ec07c').attr('stroke-width', 2).attr('rx', 3);
		mnG.append('rect').attr('x', -9).attr('y', -16).attr('width', 18).attr('height', 26)
			.attr('fill', '#1d2021').attr('rx', 2);
		mnG.append('circle').attr('cx', 0).attr('cy', 14).attr('r', 3).attr('fill', '#8ec07c');

		svgEl.append('text')
			.attr('x', 90).attr('y', y + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Mobile Node');
		svgEl.append('text')
			.attr('x', 90).attr('y', y + 52)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Your Phone)');

		// Correspondent Node (CN)
		drawServer(svgEl, 250, y, '#d3869b');
		svgEl.append('text')
			.attr('x', 250).attr('y', y + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Correspondent');
		svgEl.append('text')
			.attr('x', 250).attr('y', y + 52)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Server/Sender)');

		// Home Agent (HA)
		drawRouter(svgEl, 410, y, '#fabd2f');
		svgEl.append('text')
			.attr('x', 410).attr('y', y + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Home Agent');
		svgEl.append('text')
			.attr('x', 410).attr('y', y + 52)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Home Router)');

		// Foreign Agent (FA)
		drawRouter(svgEl, 560, y, '#83a598');
		svgEl.append('text')
			.attr('x', 560).attr('y', y + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Foreign Agent');
		svgEl.append('text')
			.attr('x', 560).attr('y', y + 52)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Visited Router)');

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
