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
	const height = 280;

	const modulations = [
		{ name: 'BPSK', symbols: 2, bits: 1, cx: 70 },
		{ name: 'QPSK', symbols: 4, bits: 2, cx: 180 },
		{ name: '16-QAM', symbols: 16, bits: 4, cx: 290 },
		{ name: '64-QAM', symbols: 64, bits: 6, cx: 400 }
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

		for (let i = 0; i < modulations.length; i++) {
			const isActive = i < step;
			const isCurrent = i === step - 1;

			svgEl.select(`.mod-${i}`)
				.transition()
				.duration(400)
				.attr('opacity', isActive ? 1 : 0.2);

			svgEl.select(`.label-${i}`)
				.transition()
				.duration(400)
				.attr('fill', isCurrent ? colors.yellow : (isActive ? colors.fg : colors.border));

			svgEl.select(`.bits-${i}`)
				.transition()
				.duration(400)
				.attr('opacity', isActive ? 1 : 0.3);
		}
	}

	async function runAnimation() {
		if (!isPlaying) return;

		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1000);
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
			.text('Modulation Efficiency Comparison');

		const cy = 130;
		const radius = 35;

		for (let i = 0; i < modulations.length; i++) {
			const mod = modulations[i];
			const group = svgEl.append('g').attr('class', `mod-${i}`).attr('opacity', 0.2);

			// Draw constellation points
			if (mod.name === 'BPSK') {
				// 2 points on horizontal line
				group.append('circle').attr('cx', mod.cx - 15).attr('cy', cy).attr('r', 6).attr('fill', colors.accent);
				group.append('circle').attr('cx', mod.cx + 15).attr('cy', cy).attr('r', 6).attr('fill', colors.accent);
			} else if (mod.name === 'QPSK') {
				// 4 points in a square
				const offset = 15;
				[[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
					group.append('circle')
						.attr('cx', mod.cx + dx * offset)
						.attr('cy', cy + dy * offset)
						.attr('r', 6)
						.attr('fill', colors.accent);
				});
			} else if (mod.name === '16-QAM') {
				// 4x4 grid
				const spacing = 10;
				for (let row = 0; row < 4; row++) {
					for (let col = 0; col < 4; col++) {
						group.append('circle')
							.attr('cx', mod.cx + (col - 1.5) * spacing)
							.attr('cy', cy + (row - 1.5) * spacing)
							.attr('r', 4)
							.attr('fill', colors.accent);
					}
				}
			} else if (mod.name === '64-QAM') {
				// 8x8 grid
				const spacing = 5;
				for (let row = 0; row < 8; row++) {
					for (let col = 0; col < 8; col++) {
						group.append('circle')
							.attr('cx', mod.cx + (col - 3.5) * spacing)
							.attr('cy', cy + (row - 3.5) * spacing)
							.attr('r', 2)
							.attr('fill', colors.accent);
					}
				}
			}

			// Label
			svgEl.append('text')
				.attr('class', `label-${i}`)
				.attr('x', mod.cx)
				.attr('y', 55)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.border)
				.attr('font-size', '12px')
				.attr('font-weight', 'bold')
				.text(mod.name);

			// Bits per symbol
			svgEl.append('text')
				.attr('class', `bits-${i}`)
				.attr('x', mod.cx)
				.attr('y', 200)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.yellow)
				.attr('font-size', '11px')
				.text(`${mod.bits} bit${mod.bits > 1 ? 's' : ''}/symbol`)
				.attr('opacity', 0.3);

			// Symbol count
			svgEl.append('text')
				.attr('class', `bits-${i}`)
				.attr('x', mod.cx)
				.attr('y', 218)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(`(${mod.symbols} symbols)`)
				.attr('opacity', 0.3);
		}

		// Arrow showing progression
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 255)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('← Less efficient          More efficient →');

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
