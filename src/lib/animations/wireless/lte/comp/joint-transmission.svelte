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
	let rippleIntervals: ReturnType<typeof setInterval>[] = [];
	let colors: Record<string, string>;

	const maxStep = 3;
	const width = 650;
	const height = 340;

	const titles = [
		'Joint Transmission (JT)',
		'Both towers send the SAME data',
		'Signals combine constructively at user',
		'Result: Stronger combined signal!'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() {
		timeouts.forEach(clearTimeout);
		timeouts = [];
		rippleIntervals.forEach(clearInterval);
		rippleIntervals = [];
	}

	function drawTower(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string, label: string) {
		const towerGroup = g.append('g').attr('transform', `translate(${x}, ${y})`);

		// Main tower structure
		towerGroup.append('path')
			.attr('d', 'M0,-80 L-15,0 L15,0 Z')
			.attr('fill', 'none')
			.attr('stroke', color)
			.attr('stroke-width', 2);

		// Cross beams
		towerGroup.append('line').attr('x1', -10).attr('y1', -20).attr('x2', 10).attr('y2', -20).attr('stroke', color).attr('stroke-width', 1.5);
		towerGroup.append('line').attr('x1', -7).attr('y1', -40).attr('x2', 7).attr('y2', -40).attr('stroke', color).attr('stroke-width', 1.5);
		towerGroup.append('line').attr('x1', -4).attr('y1', -60).attr('x2', 4).attr('y2', -60).attr('stroke', color).attr('stroke-width', 1.5);

		// Antenna
		towerGroup.append('line').attr('x1', 0).attr('y1', -80).attr('x2', 0).attr('y2', -95).attr('stroke', color).attr('stroke-width', 2);
		towerGroup.append('circle').attr('cx', 0).attr('cy', -98).attr('r', 4).attr('fill', color);

		// Label
		towerGroup.append('text')
			.attr('x', 0).attr('y', 20)
			.attr('text-anchor', 'middle')
			.attr('fill', color)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text(label);
	}

	function drawUser(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number) {
		const userGroup = g.append('g').attr('transform', `translate(${x}, ${y})`);

		userGroup.append('circle').attr('cx', 0).attr('cy', -25).attr('r', 10).attr('fill', '#d3869b');
		userGroup.append('line').attr('x1', 0).attr('y1', -15).attr('x2', 0).attr('y2', 10).attr('stroke', '#d3869b').attr('stroke-width', 3);
		userGroup.append('line').attr('x1', 0).attr('y1', -5).attr('x2', -12).attr('y2', 5).attr('stroke', '#d3869b').attr('stroke-width', 3);
		userGroup.append('line').attr('x1', 0).attr('y1', -5).attr('x2', 12).attr('y2', 5).attr('stroke', '#d3869b').attr('stroke-width', 3);
		userGroup.append('line').attr('x1', 0).attr('y1', 10).attr('x2', -8).attr('y2', 30).attr('stroke', '#d3869b').attr('stroke-width', 3);
		userGroup.append('line').attr('x1', 0).attr('y1', 10).attr('x2', 8).attr('y2', 30).attr('stroke', '#d3869b').attr('stroke-width', 3);

		userGroup.append('rect').attr('x', 10).attr('y', -2).attr('width', 8).attr('height', 14).attr('fill', '#fabd2f').attr('rx', 2);

		userGroup.append('text')
			.attr('x', 0).attr('y', 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '10px')
			.text('You');
	}

	function startRipples(g: d3.Selection<SVGGElement, unknown, null, undefined>, cx: number, cy: number, color: string) {
		function createRipple() {
			const ripple = g.append('circle')
				.attr('cx', cx)
				.attr('cy', cy)
				.attr('r', 10)
				.attr('fill', 'none')
				.attr('stroke', color)
				.attr('stroke-width', 2.5)
				.attr('opacity', 0.7);

			ripple.transition()
				.duration(2500)
				.ease(d3.easeLinear)
				.attr('r', 220)
				.attr('opacity', 0)
				.remove();
		}

		createRipple();
		const interval = setInterval(createRipple, 700);
		rippleIntervals.push(interval);
	}

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.tower1-ripples').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.tower2-ripples').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.same-data-labels').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.combine-indicator').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.result-box').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.signal-bars').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2500);
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

		// Title
		svgEl.append('text')
			.attr('class', 'title-text')
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text(titles[0]);

		const groundY = 260;

		// Ground line
		svgEl.append('line')
			.attr('x1', 30).attr('y1', groundY)
			.attr('x2', width - 30).attr('y2', groundY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,5');

		// Backhaul connection between towers
		svgEl.append('line')
			.attr('x1', 100).attr('y1', groundY - 40)
			.attr('x2', 550).attr('y2', groundY - 40)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '10,5');

		svgEl.append('text')
			.attr('x', 120).attr('y', groundY - 50)
			.attr('text-anchor', 'start')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('Fiber backhaul (data sharing)');

		// Tower 1 (left)
		const tower1Group = svgEl.append('g').attr('class', 'tower1');
		drawTower(tower1Group, 100, groundY, '#8ec07c', 'Tower A');

		// Tower 2 (right)
		const tower2Group = svgEl.append('g').attr('class', 'tower2');
		drawTower(tower2Group, 550, groundY, '#8ec07c', 'Tower B');

		// Ripples from both towers (same color = same data)
		const tower1Ripples = svgEl.append('g').attr('class', 'tower1-ripples').attr('opacity', 0);
		startRipples(tower1Ripples, 100, groundY - 98, '#8ec07c');

		const tower2Ripples = svgEl.append('g').attr('class', 'tower2-ripples').attr('opacity', 0);
		startRipples(tower2Ripples, 550, groundY - 98, '#8ec07c');

		// "Same data" labels
		const sameDataLabels = svgEl.append('g').attr('class', 'same-data-labels').attr('opacity', 0);
		sameDataLabels.append('text')
			.attr('x', 100).attr('y', groundY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Sending data X');
		sameDataLabels.append('text')
			.attr('x', 550).attr('y', groundY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Sending data X');

		// User at center
		const userGroup = svgEl.append('g').attr('class', 'user');
		drawUser(userGroup, 325, groundY - 30);

		// Combine indicator at user
		const combineIndicator = svgEl.append('g').attr('class', 'combine-indicator').attr('opacity', 0);
		combineIndicator.append('circle')
			.attr('cx', 325).attr('cy', groundY - 55)
			.attr('r', 35)
			.attr('fill', '#8ec07c')
			.attr('fill-opacity', 0.3)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2);
		combineIndicator.append('text')
			.attr('x', 325).attr('y', groundY - 105)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Signals combine!');

		// Signal strength bars (showing improvement) - centered above user
		const signalBars = svgEl.append('g').attr('class', 'signal-bars').attr('opacity', 0);
		const barX = 305;
		const barY = groundY - 130;
		for (let i = 0; i < 5; i++) {
			signalBars.append('rect')
				.attr('x', barX + i * 8)
				.attr('y', barY - (i + 1) * 8)
				.attr('width', 6)
				.attr('height', (i + 1) * 8)
				.attr('fill', '#fabd2f')
				.attr('rx', 1);
		}
		signalBars.append('text')
			.attr('x', barX + 20).attr('y', barY - 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Strong!');

		// Result box
		const resultBox = svgEl.append('g').attr('class', 'result-box').attr('opacity', 0);
		resultBox.append('rect')
			.attr('x', width / 2 - 150).attr('y', height - 55)
			.attr('width', 300).attr('height', 40)
			.attr('fill', colors.bg)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('rx', 4);
		resultBox.append('text')
			.attr('x', width / 2).attr('y', height - 38)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Both signals carry same data →');
		resultBox.append('text')
			.attr('x', width / 2).attr('y', height - 22)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Constructive combination!');

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
