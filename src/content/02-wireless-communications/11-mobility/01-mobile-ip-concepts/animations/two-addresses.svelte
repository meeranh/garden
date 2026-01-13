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

	const width = 600;
	const height = 220;

	function drawPhone(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const p = g.append('g').attr('transform', `translate(${x}, ${y})`);
		p.append('rect').attr('x', -15).attr('y', -25).attr('width', 30).attr('height', 50)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 4);
		p.append('rect').attr('x', -11).attr('y', -20).attr('width', 22).attr('height', 32)
			.attr('fill', '#1d2021').attr('rx', 2);
		p.append('circle').attr('cx', 0).attr('cy', 18).attr('r', 4).attr('fill', color);
	}

	function animate() {
		pulsePhase += 0.04;
		const pulse = 1 + Math.sin(pulsePhase) * 0.1;

		svgEl.select('.phone-group').attr('transform', `translate(300, 120) scale(${pulse})`);

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
			.attr('x', width / 2).attr('y', 24)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('One Device, Two Addresses');

		// Phone in center
		const phoneG = svgEl.append('g').attr('class', 'phone-group').attr('transform', 'translate(300, 120)');
		phoneG.append('rect').attr('x', -15).attr('y', -25).attr('width', 30).attr('height', 50)
			.attr('fill', '#504945').attr('stroke', '#8ec07c').attr('stroke-width', 2).attr('rx', 4);
		phoneG.append('rect').attr('x', -11).attr('y', -20).attr('width', 22).attr('height', 32)
			.attr('fill', '#1d2021').attr('rx', 2);
		phoneG.append('circle').attr('cx', 0).attr('cy', 18).attr('r', 4).attr('fill', '#8ec07c');

		// Home Address (left)
		const haX = 100;
		const haY = 120;

		svgEl.append('rect')
			.attr('x', haX - 70).attr('y', haY - 35)
			.attr('width', 140).attr('height', 70)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.1)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('rx', 8);

		svgEl.append('text')
			.attr('x', haX).attr('y', haY - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Home Address');

		svgEl.append('text')
			.attr('x', haX).attr('y', haY + 8)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.attr('font-family', 'monospace')
			.text('192.168.1.100');

		svgEl.append('text')
			.attr('x', haX).attr('y', haY + 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(permanent)');

		// Arrow from HA to phone
		svgEl.append('line')
			.attr('x1', haX + 70).attr('y1', haY)
			.attr('x2', 270).attr('y2', 120)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		// Care-of Address (right)
		const coaX = 500;
		const coaY = 120;

		svgEl.append('rect')
			.attr('x', coaX - 70).attr('y', coaY - 35)
			.attr('width', 140).attr('height', 70)
			.attr('fill', '#83a598').attr('fill-opacity', 0.1)
			.attr('stroke', '#83a598').attr('stroke-width', 2)
			.attr('rx', 8);

		svgEl.append('text')
			.attr('x', coaX).attr('y', coaY - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Care-of Address');

		svgEl.append('text')
			.attr('x', coaX).attr('y', coaY + 8)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.attr('font-family', 'monospace')
			.text('10.0.0.55');

		svgEl.append('text')
			.attr('x', coaX).attr('y', coaY + 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(temporary)');

		// Arrow from phone to CoA
		svgEl.append('line')
			.attr('x1', 330).attr('y1', 120)
			.attr('x2', coaX - 70).attr('y2', coaY)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Others contact you via Home Address • You actually receive at Care-of Address');

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
