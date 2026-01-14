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

	// Bit pairs and their phases
	const symbols = [
		{ bits: '01', phase: 90 },
		{ bits: '00', phase: 0 },
		{ bits: '10', phase: 180 },
		{ bits: '11', phase: 270 }
	];
	const maxStep = symbols.length;
	const width = 580;
	const height = 300;
	const startX = 70;
	const symbolWidth = 100;
	const waveY = 180;
	const amplitude = 35;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		for (let i = 0; i < symbols.length; i++) {
			const isVisible = i < step;

			svgEl.select(`.wave-${i}`)
				.transition().duration(400)
				.attr('opacity', isVisible ? 1 : 0);

			svgEl.select(`.symbol-highlight-${i}`)
				.transition().duration(200)
				.attr('opacity', i === step - 1 ? 1 : 0);

			svgEl.select(`.phase-label-${i}`)
				.transition().duration(300)
				.attr('opacity', isVisible ? 1 : 0);
		}

		const msg = step === 0
			? 'Group bits into pairs, look up phase'
			: step <= symbols.length
				? `Symbol ${step}: ${symbols[step - 1].bits} → ${symbols[step - 1].phase}° phase`
				: 'Complete QPSK waveform (4 symbols for 8 bits!)';
		svgEl.select('.message').text(msg);
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
			yellow: s.getPropertyValue('--color-math').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('Drawing QPSK Waveform');

		// Original sequence
		svgEl.append('text')
			.attr('x', startX).attr('y', 50)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Original: 01001011 → Pairs: 01 | 00 | 10 | 11');

		// Phase mapping table
		const tableX = 485;
		svgEl.append('text')
			.attr('x', tableX).attr('y', 70)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('font-weight', 'bold')
			.text('Mapping:');

		const mapping = [
			{ bits: '00', phase: '0°' },
			{ bits: '01', phase: '90°' },
			{ bits: '10', phase: '180°' },
			{ bits: '11', phase: '270°' }
		];
		mapping.forEach((m, i) => {
			svgEl.append('text')
				.attr('x', tableX).attr('y', 85 + i * 14)
				.attr('fill', colors.fg)
				.attr('font-size', '9px')
				.text(`${m.bits} → ${m.phase}`);
		});

		// Symbol boxes
		symbols.forEach((sym, i) => {
			const x = startX + i * symbolWidth;

			// Symbol box
			svgEl.append('rect')
				.attr('x', x + 10).attr('y', 60)
				.attr('width', symbolWidth - 20).attr('height', 35)
				.attr('fill', colors.border).attr('opacity', 0.3)
				.attr('rx', 4);

			// Bits
			svgEl.append('text')
				.attr('x', x + symbolWidth / 2).attr('y', 75)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '16px')
				.attr('font-weight', 'bold')
				.text(sym.bits);

			// Phase
			svgEl.append('text')
				.attr('x', x + symbolWidth / 2).attr('y', 90)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(`${sym.phase}°`);

			// Highlight box
			svgEl.append('rect')
				.attr('class', `symbol-highlight-${i}`)
				.attr('x', x + 8).attr('y', 58)
				.attr('width', symbolWidth - 16).attr('height', 39)
				.attr('fill', 'none')
				.attr('stroke', colors.yellow)
				.attr('stroke-width', 2)
				.attr('rx', 5)
				.attr('opacity', 0);
		});

		// Zero line
		svgEl.append('line')
			.attr('x1', startX).attr('x2', startX + symbols.length * symbolWidth)
			.attr('y1', waveY).attr('y2', waveY)
			.attr('stroke', colors.border)
			.attr('stroke-dasharray', '4,4');

		// Vertical grid
		for (let i = 0; i <= symbols.length; i++) {
			svgEl.append('line')
				.attr('x1', startX + i * symbolWidth)
				.attr('x2', startX + i * symbolWidth)
				.attr('y1', waveY - amplitude - 10)
				.attr('y2', waveY + amplitude + 10)
				.attr('stroke', colors.border)
				.attr('opacity', 0.3);
		}

		// Wave colors for different phases
		const phaseColors = ['#83a598', '#8ec07c', '#fb4934', '#fabd2f'];

		// Create waves for each symbol
		symbols.forEach((sym, i) => {
			const x = startX + i * symbolWidth;
			const phaseRad = (sym.phase * Math.PI) / 180;

			let pathD = '';
			const points = 40;
			for (let p = 0; p <= points; p++) {
				const px = x + (p / points) * symbolWidth;
				const py = waveY - Math.sin((p / points) * Math.PI * 4 + phaseRad) * amplitude;
				pathD += (p === 0 ? 'M' : 'L') + ` ${px} ${py}`;
			}

			svgEl.append('path')
				.attr('class', `wave-${i}`)
				.attr('d', pathD)
				.attr('fill', 'none')
				.attr('stroke', phaseColors[i])
				.attr('stroke-width', 2.5)
				.attr('opacity', 0);

			// Phase label below wave
			svgEl.append('text')
				.attr('class', `phase-label-${i}`)
				.attr('x', x + symbolWidth / 2)
				.attr('y', waveY + amplitude + 25)
				.attr('text-anchor', 'middle')
				.attr('fill', phaseColors[i])
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text(`${sym.phase}°`)
				.attr('opacity', 0);
		});

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2 - 30).attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('Group bits into pairs, look up phase');

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
