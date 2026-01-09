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

	const maxStep = 4;
	const width = 500;
	const height = 300;
	const centerX = 200;
	const centerY = 160;
	const radius = 80;

	// QPSK symbols at 45°, 135°, 225°, 315°
	const symbols = [
		{ angle: 45, bits: '00', x: Math.cos(Math.PI / 4), y: -Math.sin(Math.PI / 4) },
		{ angle: 135, bits: '01', x: Math.cos(3 * Math.PI / 4), y: -Math.sin(3 * Math.PI / 4) },
		{ angle: 225, bits: '11', x: Math.cos(5 * Math.PI / 4), y: -Math.sin(5 * Math.PI / 4) },
		{ angle: 315, bits: '10', x: Math.cos(7 * Math.PI / 4), y: -Math.sin(7 * Math.PI / 4) }
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => {
			timeouts.push(setTimeout(r, ms));
		});
	}
	function clearTimeouts() {
		timeouts.forEach(clearTimeout);
		timeouts = [];
	}

	function applyStep(step: number) {
		currentStep = step;

		// Show symbols progressively
		for (let i = 0; i < symbols.length; i++) {
			const isActive = i < step;
			const isCurrent = i === step - 1;

			svgEl.select(`.symbol-${i}`)
				.transition()
				.duration(400)
				.attr('opacity', isActive ? 1 : 0.2)
				.attr('r', isCurrent ? 12 : 8);

			svgEl.select(`.label-${i}`)
				.transition()
				.duration(400)
				.attr('opacity', isActive ? 1 : 0.2);

			svgEl.select(`.angle-${i}`)
				.transition()
				.duration(400)
				.attr('opacity', isActive ? 0.7 : 0);

			svgEl.select(`.line-${i}`)
				.transition()
				.duration(400)
				.attr('opacity', isCurrent ? 0.8 : 0);
		}

		// Update info text
		if (step > 0 && step <= symbols.length) {
			const sym = symbols[step - 1];
			svgEl.select('.info-text')
				.text(`${sym.bits} → ${sym.angle}° phase`);
		} else if (step === 0) {
			svgEl.select('.info-text').text('4 symbols, each representing 2 bits');
		}
	}

	async function runAnimation() {
		if (!isPlaying) return;

		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1200);
			if (!isPlaying) return;
		}
		isPlaying = false;
	}

	function play() {
		if (!isPlaying) {
			isPlaying = true;
			runAnimation();
		}
	}
	function pause() {
		isPlaying = false;
		clearTimeouts();
	}
	function next() {
		pause();
		if (currentStep < maxStep) applyStep(currentStep + 1);
	}
	function prev() {
		pause();
		if (currentStep > 0) applyStep(currentStep - 1);
	}
	function skip() {
		pause();
		applyStep(maxStep);
	}
	function replay() {
		pause();
		currentStep = 0;
		applyStep(0);
		isPlaying = true;
		runAnimation();
	}
	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			accent: s.getPropertyValue('--color-accent').trim(),
			yellow: s.getPropertyValue('--color-math').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('QPSK Constellation Diagram');

		// Axes
		svgEl.append('line')
			.attr('x1', centerX - radius - 30)
			.attr('x2', centerX + radius + 30)
			.attr('y1', centerY)
			.attr('y2', centerY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		svgEl.append('line')
			.attr('x1', centerX)
			.attr('x2', centerX)
			.attr('y1', centerY - radius - 30)
			.attr('y2', centerY + radius + 30)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1);

		// Axis labels
		svgEl.append('text')
			.attr('x', centerX + radius + 40)
			.attr('y', centerY + 4)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('I');

		svgEl.append('text')
			.attr('x', centerX - 4)
			.attr('y', centerY - radius - 35)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Q');

		// Reference circle (dashed)
		svgEl.append('circle')
			.attr('cx', centerX)
			.attr('cy', centerY)
			.attr('r', radius)
			.attr('fill', 'none')
			.attr('stroke', colors.border)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4')
			.attr('opacity', 0.5);

		// Draw symbols
		const symbolColors = [colors.accent, colors.yellow, '#fb4934', '#83a598'];

		for (let i = 0; i < symbols.length; i++) {
			const sym = symbols[i];
			const x = centerX + sym.x * radius;
			const y = centerY + sym.y * radius;

			// Line from center to symbol
			svgEl.append('line')
				.attr('class', `line-${i}`)
				.attr('x1', centerX)
				.attr('y1', centerY)
				.attr('x2', x)
				.attr('y2', y)
				.attr('stroke', symbolColors[i])
				.attr('stroke-width', 2)
				.attr('opacity', 0);

			// Symbol point
			svgEl.append('circle')
				.attr('class', `symbol-${i}`)
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', 8)
				.attr('fill', symbolColors[i])
				.attr('opacity', 0.2);

			// Bit label
			const labelOffset = 20;
			const labelX = centerX + sym.x * (radius + labelOffset);
			const labelY = centerY + sym.y * (radius + labelOffset);

			svgEl.append('text')
				.attr('class', `label-${i}`)
				.attr('x', labelX)
				.attr('y', labelY + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', symbolColors[i])
				.attr('font-size', '13px')
				.attr('font-weight', 'bold')
				.text(sym.bits)
				.attr('opacity', 0.2);

			// Angle label (smaller, closer to center)
			const angleX = centerX + sym.x * (radius * 0.5);
			const angleY = centerY + sym.y * (radius * 0.5);

			svgEl.append('text')
				.attr('class', `angle-${i}`)
				.attr('x', angleX)
				.attr('y', angleY + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(`${sym.angle}°`)
				.attr('opacity', 0);
		}

		// Info panel on the right
		svgEl.append('rect')
			.attr('x', 320)
			.attr('y', 80)
			.attr('width', 160)
			.attr('height', 140)
			.attr('fill', colors.border)
			.attr('rx', 6)
			.attr('opacity', 0.3);

		svgEl.append('text')
			.attr('x', 400)
			.attr('y', 110)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('QPSK');

		svgEl.append('text')
			.attr('x', 400)
			.attr('y', 135)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('4 phases');

		svgEl.append('text')
			.attr('x', 400)
			.attr('y', 155)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('= 4 symbols');

		svgEl.append('text')
			.attr('x', 400)
			.attr('y', 175)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('= 2 bits/symbol');

		// Dynamic info text
		svgEl.append('text')
			.attr('class', 'info-text')
			.attr('x', 400)
			.attr('y', 205)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('4 symbols, each representing 2 bits');

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('I = In-phase, Q = Quadrature (90° shifted)');

		applyStep(0);
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => clearTimeouts());
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
