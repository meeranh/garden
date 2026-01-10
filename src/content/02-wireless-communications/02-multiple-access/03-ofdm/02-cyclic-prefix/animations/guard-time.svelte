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
	const width = 440;
	const height = 180;

	// Layout constants
	const symbolWidth = 70;
	const symbolHeight = 26;
	const cpWidth = 20;
	const gap = 3;

	const startX = 85;
	const directY = 45;
	const reflectedY = 105;
	const delay = 18;

	// Calculated positions
	const sym1Start = startX + cpWidth;
	const cp2Start = sym1Start + symbolWidth + gap;
	const sym2Start = cp2Start + cpWidth;
	const totalWidth = cpWidth + symbolWidth + gap + cpWidth + symbolWidth;

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

		svgEl.select('.safe-marker')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);
	}

	function animate() {
		pulsePhase += 0.05;

		if (currentStep >= 2) {
			const opacity = 0.3 + Math.sin(pulsePhase * 2) * 0.15;
			svgEl.select('.safe-rect').attr('opacity', opacity);
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
			fgMuted: s.getPropertyValue('--color-fg-muted').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Arrow marker
		const defs = svgEl.append('defs');
		defs.append('marker')
			.attr('id', 'arrowGT')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', colors.fgMuted);

		// ===== DIRECT SIGNAL =====
		const directGroup = svgEl.append('g').attr('class', 'direct-group').attr('opacity', 0);

		directGroup.append('text')
			.attr('x', 10)
			.attr('y', directY + symbolHeight / 2 + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Direct:');

		// Time arrow
		directGroup.append('line')
			.attr('x1', startX)
			.attr('x2', startX + totalWidth + 25)
			.attr('y1', directY - 12)
			.attr('y2', directY - 12)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('marker-end', 'url(#arrowGT)');

		directGroup.append('text')
			.attr('x', startX + totalWidth + 30)
			.attr('y', directY - 8)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Time');

		// CP1
		directGroup.append('rect')
			.attr('x', startX)
			.attr('y', directY)
			.attr('width', cpWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#fabd2f')
			.attr('rx', 3);

		// Symbol 1
		directGroup.append('rect')
			.attr('x', sym1Start)
			.attr('y', directY)
			.attr('width', symbolWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#83a598')
			.attr('rx', 3);

		directGroup.append('text')
			.attr('x', sym1Start + symbolWidth / 2)
			.attr('y', directY + symbolHeight / 2 + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.bg)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Symbol 1');

		// CP2
		directGroup.append('rect')
			.attr('x', cp2Start)
			.attr('y', directY)
			.attr('width', cpWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#fabd2f')
			.attr('rx', 3);

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

		// ===== REFLECTED SIGNAL =====
		const reflectedGroup = svgEl.append('g').attr('class', 'reflected-group').attr('opacity', 0);

		reflectedGroup.append('text')
			.attr('x', 10)
			.attr('y', reflectedY + symbolHeight / 2 + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Reflected:');

		// Delayed CP1
		reflectedGroup.append('rect')
			.attr('x', startX + delay)
			.attr('y', reflectedY)
			.attr('width', cpWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#fabd2f')
			.attr('opacity', 0.6)
			.attr('rx', 3);

		// Delayed Symbol 1
		reflectedGroup.append('rect')
			.attr('x', sym1Start + delay)
			.attr('y', reflectedY)
			.attr('width', symbolWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#83a598')
			.attr('opacity', 0.6)
			.attr('rx', 3);

		reflectedGroup.append('text')
			.attr('x', sym1Start + delay + symbolWidth / 2)
			.attr('y', reflectedY + symbolHeight / 2 + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.bg)
			.attr('font-size', '10px')
			.text('Symbol 1');

		// Delayed CP2
		reflectedGroup.append('rect')
			.attr('x', cp2Start + delay)
			.attr('y', reflectedY)
			.attr('width', cpWidth)
			.attr('height', symbolHeight)
			.attr('fill', '#fabd2f')
			.attr('opacity', 0.6)
			.attr('rx', 3);

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

		// Delay indicator - horizontal arrow between rows
		const arrowY = (directY + symbolHeight + reflectedY) / 2;
		reflectedGroup.append('line')
			.attr('x1', startX + 8)
			.attr('x2', startX + delay + 8)
			.attr('y1', arrowY)
			.attr('y2', arrowY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1.5)
			.attr('marker-end', 'url(#arrowGT)');

		reflectedGroup.append('text')
			.attr('x', startX + delay / 2 + 8)
			.attr('y', arrowY - 5)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('delay');

		// ===== SAFE ZONE MARKER =====
		const safeMarker = svgEl.append('g').attr('class', 'safe-marker').attr('opacity', 0);

		// Highlight CP2 zone in direct signal - this is where reflection lands
		safeMarker.append('rect')
			.attr('class', 'safe-rect')
			.attr('x', cp2Start - 2)
			.attr('y', directY - 3)
			.attr('width', cpWidth + 4)
			.attr('height', symbolHeight + 6)
			.attr('fill', '#8ec07c')
			.attr('opacity', 0.3)
			.attr('rx', 4);

		// Vertical dashed line showing where reflected Symbol 1 ends
		const reflectedSym1End = sym1Start + delay + symbolWidth;
		safeMarker.append('line')
			.attr('x1', reflectedSym1End)
			.attr('x2', reflectedSym1End)
			.attr('y1', directY + symbolHeight + 4)
			.attr('y2', reflectedY - 4)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,3');

		// Small bracket under reflected Symbol 1's end
		safeMarker.append('path')
			.attr('d', `M ${reflectedSym1End - 12} ${reflectedY + symbolHeight + 4}
			            L ${reflectedSym1End - 12} ${reflectedY + symbolHeight + 8}
			            L ${reflectedSym1End} ${reflectedY + symbolHeight + 8}
			            L ${reflectedSym1End} ${reflectedY + symbolHeight + 4}`)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 1.5);

		safeMarker.append('text')
			.attr('x', reflectedSym1End - 6)
			.attr('y', reflectedY + symbolHeight + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('ends here');

		// Success message
		safeMarker.append('text')
			.attr('x', width / 2)
			.attr('y', height - 8)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Reflection lands in guard time, not in data');

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
