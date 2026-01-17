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

	const maxStep = 3;

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

		// Hide all pizza groups first
		svgEl.selectAll('.pizza-group').attr('opacity', 0);
		svgEl.selectAll('.label-group').attr('opacity', 0);

		// Show the appropriate step
		svgEl.select(`.pizza-${step}`).transition().duration(400).attr('opacity', 1);
		svgEl.select(`.label-${step}`).transition().duration(400).attr('opacity', 1);
	}

	async function runAnimation() {
		if (!isPlaying) return;

		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2000);
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

	function createPieSlices(group: d3.Selection<SVGGElement, unknown, null, undefined>, numSlices: number, cx: number, cy: number, radius: number, sliceColor: string, borderColor: string) {
		const pie = d3.pie<number>().value(() => 1);
		const arc = d3.arc<d3.PieArcDatum<number>>()
			.innerRadius(0)
			.outerRadius(radius);

		const data = Array(numSlices).fill(1);
		const arcs = pie(data);

		arcs.forEach((d, i) => {
			group.append('path')
				.attr('d', arc(d))
				.attr('transform', `translate(${cx}, ${cy})`)
				.attr('fill', sliceColor)
				.attr('stroke', borderColor)
				.attr('stroke-width', numSlices > 20 ? 0.5 : 1);
		});
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

		svgEl = d3.select(svg).attr('viewBox', '0 0 500 300');

		const cx = 180;
		const cy = 150;
		const radius = 80;

		// Title
		svgEl.append('text')
			.attr('x', 250)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('Same total power, divided among bits');

		// Step 0: Total power (no division yet)
		const group0 = svgEl.append('g').attr('class', 'pizza-group pizza-0');
		group0.append('circle')
			.attr('cx', cx)
			.attr('cy', cy)
			.attr('r', radius)
			.attr('fill', colors.yellow)
			.attr('stroke', colors.border)
			.attr('stroke-width', 2);

		const label0 = svgEl.append('g').attr('class', 'label-group label-0');
		label0.append('text')
			.attr('x', 340)
			.attr('y', 100)
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Total Power');
		label0.append('text')
			.attr('x', 340)
			.attr('y', 125)
			.attr('fill', colors.yellow)
			.attr('font-size', '18px')
			.text('-72 dBm');
		label0.append('text')
			.attr('x', 340)
			.attr('y', 160)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '12px')
			.text('This is what arrives');
		label0.append('text')
			.attr('x', 340)
			.attr('y', 178)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '12px')
			.text('at the receiver');

		// Step 1: 4 slices (representing slow bit rate)
		const group1 = svgEl.append('g').attr('class', 'pizza-group pizza-1').attr('opacity', 0);
		createPieSlices(group1, 4, cx, cy, radius, colors.accent, colors.bg);

		const label1 = svgEl.append('g').attr('class', 'label-group label-1').attr('opacity', 0);
		label1.append('text')
			.attr('x', 340)
			.attr('y', 100)
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('1 Mbps');
		label1.append('text')
			.attr('x', 340)
			.attr('y', 130)
			.attr('fill', colors.accent)
			.attr('font-size', '13px')
			.text('Each bit gets a');
		label1.append('text')
			.attr('x', 340)
			.attr('y', 150)
			.attr('fill', colors.accent)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('big slice');
		label1.append('text')
			.attr('x', 340)
			.attr('y', 185)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Plenty of energy per bit');

		// Step 2: 16 slices (medium bit rate)
		const group2 = svgEl.append('g').attr('class', 'pizza-group pizza-2').attr('opacity', 0);
		createPieSlices(group2, 16, cx, cy, radius, colors.yellow, colors.bg);

		const label2 = svgEl.append('g').attr('class', 'label-group label-2').attr('opacity', 0);
		label2.append('text')
			.attr('x', 340)
			.attr('y', 100)
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('10 Mbps');
		label2.append('text')
			.attr('x', 340)
			.attr('y', 130)
			.attr('fill', colors.yellow)
			.attr('font-size', '13px')
			.text('Each bit gets a');
		label2.append('text')
			.attr('x', 340)
			.attr('y', 150)
			.attr('fill', colors.yellow)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('smaller slice');
		label2.append('text')
			.attr('x', 340)
			.attr('y', 185)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('10× less energy per bit');

		// Step 3: 64 slices (high bit rate)
		const group3 = svgEl.append('g').attr('class', 'pizza-group pizza-3').attr('opacity', 0);
		createPieSlices(group3, 64, cx, cy, radius, '#fb4934', colors.bg);

		const label3 = svgEl.append('g').attr('class', 'label-group label-3').attr('opacity', 0);
		label3.append('text')
			.attr('x', 340)
			.attr('y', 100)
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('100 Mbps');
		label3.append('text')
			.attr('x', 340)
			.attr('y', 130)
			.attr('fill', '#fb4934')
			.attr('font-size', '13px')
			.text('Each bit gets a');
		label3.append('text')
			.attr('x', 340)
			.attr('y', 150)
			.attr('fill', '#fb4934')
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('tiny crumb');
		label3.append('text')
			.attr('x', 340)
			.attr('y', 185)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('100× less energy per bit');
		label3.append('text')
			.attr('x', 340)
			.attr('y', 205)
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.text('More vulnerable to noise!');

		// Bottom label
		svgEl.append('text')
			.attr('x', 250)
			.attr('y', 280)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '12px')
			.text('Higher bit rate → less energy per bit');

		// Initialize
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
