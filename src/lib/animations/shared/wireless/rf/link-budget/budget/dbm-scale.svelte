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

	// dBm values and their linear equivalents
	const values = [
		{ dbm: 30, mw: 1000, label: '1000 mW' },
		{ dbm: 20, mw: 100, label: '100 mW' },
		{ dbm: 10, mw: 10, label: '10 mW' },
		{ dbm: 0, mw: 1, label: '1 mW' },
		{ dbm: -10, mw: 0.1, label: '0.1 mW' },
		{ dbm: -20, mw: 0.01, label: '0.01 mW' },
		{ dbm: -30, mw: 0.001, label: '0.001 mW' },
		{ dbm: -72, mw: 0.00000006, label: '0.00000006 mW' }
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

		// Show/hide elements based on step
		svgEl.selectAll('.step-0').transition().duration(300).attr('opacity', step >= 0 ? 1 : 0);
		svgEl.selectAll('.step-1').transition().duration(300).attr('opacity', step >= 1 ? 1 : 0);
		svgEl.selectAll('.step-2').transition().duration(300).attr('opacity', step >= 2 ? 1 : 0);
		svgEl.selectAll('.step-3').transition().duration(300).attr('opacity', step >= 3 ? 1 : 0);
		svgEl.selectAll('.step-4').transition().duration(300).attr('opacity', step >= 4 ? 1 : 0);
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

		svgEl = d3.select(svg).attr('viewBox', '0 0 500 320');

		const centerX = 250;
		const scaleTop = 40;
		const scaleBottom = 280;
		const scaleHeight = scaleBottom - scaleTop;

		// Title
		svgEl.append('text')
			.attr('class', 'step-0')
			.attr('x', centerX)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('dBm is relative to 1 milliwatt');

		// Draw the scale bar
		svgEl.append('rect')
			.attr('class', 'step-0')
			.attr('x', centerX - 30)
			.attr('y', scaleTop)
			.attr('width', 60)
			.attr('height', scaleHeight)
			.attr('fill', colors.border)
			.attr('rx', 4);

		// Reference point: 0 dBm = 1 mW (in the middle-ish)
		const refY = scaleTop + scaleHeight * 0.4;

		// Reference line and label
		svgEl.append('line')
			.attr('class', 'step-1')
			.attr('x1', centerX - 35)
			.attr('x2', centerX + 35)
			.attr('y1', refY)
			.attr('y2', refY)
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'step-1')
			.attr('x', centerX + 50)
			.attr('y', refY + 5)
			.attr('fill', colors.yellow)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('0 dBm = 1 mW')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'step-1')
			.attr('x', centerX + 50)
			.attr('y', refY + 20)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('(the reference)')
			.attr('opacity', 0);

		// Positive region (above reference)
		const posY = scaleTop + 30;
		svgEl.append('rect')
			.attr('class', 'step-2')
			.attr('x', centerX - 28)
			.attr('y', scaleTop + 2)
			.attr('width', 56)
			.attr('height', refY - scaleTop - 4)
			.attr('fill', colors.accent)
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'step-2')
			.attr('x', centerX - 50)
			.attr('y', posY + 10)
			.attr('text-anchor', 'end')
			.attr('fill', colors.accent)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('MORE than 1 mW')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'step-2')
			.attr('x', centerX - 50)
			.attr('y', posY + 30)
			.attr('text-anchor', 'end')
			.attr('fill', colors.accent)
			.attr('font-size', '11px')
			.text('+20 dBm = 100 mW')
			.attr('opacity', 0);

		// Negative region (below reference)
		svgEl.append('rect')
			.attr('class', 'step-3')
			.attr('x', centerX - 28)
			.attr('y', refY + 2)
			.attr('width', 56)
			.attr('height', scaleBottom - refY - 4)
			.attr('fill', '#fb4934')
			.attr('fill-opacity', 0.6)
			.attr('opacity', 0);

		const negY = refY + 40;
		svgEl.append('text')
			.attr('class', 'step-3')
			.attr('x', centerX - 50)
			.attr('y', negY)
			.attr('text-anchor', 'end')
			.attr('fill', '#fb4934')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('LESS than 1 mW')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'step-3')
			.attr('x', centerX - 50)
			.attr('y', negY + 20)
			.attr('text-anchor', 'end')
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.text('-30 dBm = 0.001 mW')
			.attr('opacity', 0);

		// The -72 dBm example
		const exampleY = scaleBottom - 20;
		svgEl.append('line')
			.attr('class', 'step-4')
			.attr('x1', centerX - 35)
			.attr('x2', centerX + 35)
			.attr('y1', exampleY)
			.attr('y2', exampleY)
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,2')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'step-4')
			.attr('x', centerX + 50)
			.attr('y', exampleY + 5)
			.attr('fill', colors.yellow)
			.attr('font-size', '12px')
			.text('-72 dBm')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'step-4')
			.attr('x', centerX + 50)
			.attr('y', exampleY + 20)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('= 0.00000006 mW')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'step-4')
			.attr('x', centerX)
			.attr('y', 305)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('Tiny, but still real power!')
			.attr('opacity', 0);

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
