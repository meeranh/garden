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
	const height = 240;

	function animate() {
		offset += 0.4;
		svgEl.selectAll('.data-flow').attr('stroke-dashoffset', -offset);
		animationFrame = requestAnimationFrame(animate);
	}

	function drawPhone(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('rect').attr('x', -10).attr('y', -18).attr('width', 20).attr('height', 36)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		t.append('rect').attr('x', -7).attr('y', -14).attr('width', 14).attr('height', 22)
			.attr('fill', '#1d2021').attr('rx', 2);
		t.append('circle').attr('cx', 0).attr('cy', 12).attr('r', 2.5).attr('fill', color);
	}

	function drawTower(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('path').attr('d', 'M0,-40 L-7,0 L7,0 Z')
			.attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
		t.append('line').attr('x1', -4).attr('y1', -10).attr('x2', 4).attr('y2', -10)
			.attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', -3).attr('y1', -22).attr('x2', 3).attr('y2', -22)
			.attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', 0).attr('y1', -40).attr('x2', 0).attr('y2', -48)
			.attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -50).attr('r', 3).attr('fill', color);
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
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text('Out-Band: Different Spectrum, Network Not Involved');

		// TWO separate spectrum bars
		// Cellular spectrum (left)
		svgEl.append('rect')
			.attr('x', 40).attr('y', 40)
			.attr('width', 200).attr('height', 28)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.15)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 4);

		svgEl.append('text')
			.attr('x', 140).attr('y', 59)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Cellular Spectrum');

		// WiFi/Bluetooth spectrum (right) - DIFFERENT COLOR
		svgEl.append('rect')
			.attr('x', 380).attr('y', 40)
			.attr('width', 200).attr('height', 28)
			.attr('fill', '#83a598').attr('fill-opacity', 0.15)
			.attr('stroke', '#83a598').attr('stroke-width', 2)
			.attr('rx', 4);

		svgEl.append('text')
			.attr('x', 480).attr('y', 59)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.text('WiFi / Bluetooth');

		// Big gap/separator
		svgEl.append('line')
			.attr('x1', width / 2).attr('y1', 75)
			.attr('x2', width / 2).attr('y2', 195)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		const baseY = 150;

		// === LEFT SIDE: Cellular ===
		drawTower(svgEl, 140, baseY - 35, '#8ec07c');
		drawPhone(svgEl, 80, baseY + 5, '#8ec07c');

		svgEl.append('line')
			.attr('class', 'data-flow')
			.attr('x1', 95).attr('y1', baseY - 5)
			.attr('x2', 125).attr('y2', baseY - 65)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,4');

		svgEl.append('text')
			.attr('x', 140).attr('y', baseY + 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Cellular');

		// === RIGHT SIDE: D2D via WiFi ===
		// No tower! Just phones
		drawPhone(svgEl, 420, baseY, '#83a598');
		drawPhone(svgEl, 540, baseY, '#83a598');

		// Direct D2D connection
		svgEl.append('line')
			.attr('class', 'data-flow')
			.attr('x1', 435).attr('y1', baseY)
			.attr('x2', 525).attr('y2', baseY)
			.attr('stroke', '#83a598').attr('stroke-width', 3)
			.attr('stroke-dasharray', '8,5');

		// WiFi symbol above
		const wifiX = 480;
		const wifiY = baseY - 35;
		svgEl.append('path')
			.attr('d', `M${wifiX - 18},${wifiY + 5} Q${wifiX},${wifiY - 15} ${wifiX + 18},${wifiY + 5}`)
			.attr('fill', 'none').attr('stroke', '#83a598').attr('stroke-width', 2);
		svgEl.append('path')
			.attr('d', `M${wifiX - 12},${wifiY + 10} Q${wifiX},${wifiY} ${wifiX + 12},${wifiY + 10}`)
			.attr('fill', 'none').attr('stroke', '#83a598').attr('stroke-width', 2);
		svgEl.append('circle')
			.attr('cx', wifiX).attr('cy', wifiY + 15).attr('r', 3).attr('fill', '#83a598');

		svgEl.append('text')
			.attr('x', 480).attr('y', baseY + 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.text('D2D via WiFi');

		// "No tower needed" indicator
		svgEl.append('text')
			.attr('x', 480).attr('y', baseY + 60)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('font-style', 'italic')
			.text('(like AirDrop)');

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Completely separate • No interference • Network not involved');

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
