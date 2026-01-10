<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let timeouts: ReturnType<typeof setTimeout>[] = [];
	let colors: Record<string, string>;
	let animationId: number;
	let pulsePhase = 0;

	const maxStep = 2;
	const width = 380;
	const height = 155;

	const symbolWidth = 80;
	const symbolHeight = 28;
	const directY = 30;
	const reflectedY = 95;
	const startX = 75;
	const delay = 25;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.direct-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.reflected-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.overlap-marker')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);
	}

	function animate() {
		pulsePhase += 0.08;

		// Pulse the overlap zone
		if (currentStep >= 2) {
			const opacity = 0.3 + Math.sin(pulsePhase * 2) * 0.2;
			svgEl.select('.overlap-rect').attr('opacity', opacity);
		}

		animationId = requestAnimationFrame(animate);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1500);
			if (!isPlaying) return;
		}
		isPlaying = false;
	}

	function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
	function pause() { isPlaying = false; clearTimeouts(); }
	function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
	function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
	function skip() { pause(); applyStep(maxStep); }
	function replay() { pause(); currentStep = 0; applyStep(0); isPlaying = true; runAnimation(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			accent: s.getPropertyValue('--color-accent').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Arrow marker
		svgEl.append('defs').append('marker')
			.attr('id', 'timeArrow')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', colors.fgMuted);

		const sym2Start = startX + symbolWidth + 4;

		// Direct signal group
		const directGroup = svgEl.append('g').attr('class', 'direct-group').attr('opacity', 0);

		directGroup.append('text')
			.attr('x', 12)
			.attr('y', directY + symbolHeight / 2 + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Direct:');

		// Symbol 1
		directGroup.append('rect')
			.attr('x', startX)
			.attr('y', directY)
			.attr('width', symbolWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#83a598')
			.attr('rx', 3);

		directGroup.append('text')
			.attr('x', startX + symbolWidth / 2)
			.attr('y', directY + symbolHeight / 2 + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.bg)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Symbol 1');

		// Symbol 2
		directGroup.append('rect')
			.attr('x', sym2Start)
			.attr('y', directY)
			.attr('width', symbolWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#b8bb26')
			.attr('rx', 3);

		directGroup.append('text')
			.attr('x', sym2Start + symbolWidth / 2)
			.attr('y', directY + symbolHeight / 2 + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.bg)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Symbol 2');

		// Time arrow
		directGroup.append('line')
			.attr('x1', startX)
			.attr('x2', sym2Start + symbolWidth + 20)
			.attr('y1', directY - 10)
			.attr('y2', directY - 10)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('marker-end', 'url(#timeArrow)');

		directGroup.append('text')
			.attr('x', sym2Start + symbolWidth + 25)
			.attr('y', directY - 6)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Time');

		// Reflected signal group
		const reflectedGroup = svgEl.append('g').attr('class', 'reflected-group').attr('opacity', 0);

		reflectedGroup.append('text')
			.attr('x', 12)
			.attr('y', reflectedY + symbolHeight / 2 + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Reflected:');

		// Delayed Symbol 1
		reflectedGroup.append('rect')
			.attr('x', startX + delay)
			.attr('y', reflectedY)
			.attr('width', symbolWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#83a598')
			.attr('opacity', 0.6)
			.attr('rx', 3);

		reflectedGroup.append('text')
			.attr('x', startX + delay + symbolWidth / 2)
			.attr('y', reflectedY + symbolHeight / 2 + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.bg)
			.attr('font-size', '10px')
			.text('Symbol 1');

		// Delayed Symbol 2
		reflectedGroup.append('rect')
			.attr('x', sym2Start + delay)
			.attr('y', reflectedY)
			.attr('width', symbolWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#b8bb26')
			.attr('opacity', 0.6)
			.attr('rx', 3);

		reflectedGroup.append('text')
			.attr('x', sym2Start + delay + symbolWidth / 2)
			.attr('y', reflectedY + symbolHeight / 2 + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.bg)
			.attr('font-size', '10px')
			.text('Symbol 2');

		// Delay arrow indicator (simple horizontal offset)
		const arrowY = (directY + symbolHeight + reflectedY) / 2;
		reflectedGroup.append('line')
			.attr('x1', startX + 5)
			.attr('x2', startX + delay + 5)
			.attr('y1', arrowY)
			.attr('y2', arrowY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1.5)
			.attr('marker-end', 'url(#timeArrow)');

		reflectedGroup.append('text')
			.attr('x', startX + delay / 2 + 5)
			.attr('y', arrowY - 6)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '8px')
			.text('delay');

		// Overlap marker group
		const overlapMarker = svgEl.append('g').attr('class', 'overlap-marker').attr('opacity', 0);

		// Overlap zone highlight - where Symbol 1 reflection overlaps Symbol 2
		overlapMarker.append('rect')
			.attr('class', 'overlap-rect')
			.attr('x', sym2Start - 2)
			.attr('y', reflectedY - 3)
			.attr('width', delay + 4)
			.attr('height', symbolHeight + 6)
			.attr('fill', '#fb4934')
			.attr('opacity', 0.3)
			.attr('rx', 4);

		// ISI label
		overlapMarker.append('text')
			.attr('x', width / 2)
			.attr('y', height - 8)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Symbol 1 reflection overlaps Symbol 2');

		animate();
		applyStep(0);
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => {
		clearTimeouts();
		if (animationId) cancelAnimationFrame(animationId);
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
