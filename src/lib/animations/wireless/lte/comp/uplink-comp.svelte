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
		'Uplink CoMP (Reception)',
		'User transmits signal',
		'Multiple towers receive the signal',
		'Network combines for better reception'
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

		towerGroup.append('path')
			.attr('d', 'M0,-80 L-15,0 L15,0 Z')
			.attr('fill', 'none')
			.attr('stroke', color)
			.attr('stroke-width', 2);

		towerGroup.append('line').attr('x1', -10).attr('y1', -20).attr('x2', 10).attr('y2', -20).attr('stroke', color).attr('stroke-width', 1.5);
		towerGroup.append('line').attr('x1', -7).attr('y1', -40).attr('x2', 7).attr('y2', -40).attr('stroke', color).attr('stroke-width', 1.5);
		towerGroup.append('line').attr('x1', -4).attr('y1', -60).attr('x2', 4).attr('y2', -60).attr('stroke', color).attr('stroke-width', 1.5);

		towerGroup.append('line').attr('x1', 0).attr('y1', -80).attr('x2', 0).attr('y2', -95).attr('stroke', color).attr('stroke-width', 2);
		towerGroup.append('circle').attr('cx', 0).attr('cy', -98).attr('r', 4).attr('fill', color);

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
			.text('You (transmitting)');
	}

	function startUserRipples(g: d3.Selection<SVGGElement, unknown, null, undefined>, cx: number, cy: number) {
		function createRipple() {
			const ripple = g.append('circle')
				.attr('cx', cx)
				.attr('cy', cy)
				.attr('r', 5)
				.attr('fill', 'none')
				.attr('stroke', '#d3869b')
				.attr('stroke-width', 2)
				.attr('opacity', 0.8);

			ripple.transition()
				.duration(2500)
				.ease(d3.easeLinear)
				.attr('r', 280)
				.attr('opacity', 0)
				.remove();
		}

		createRipple();
		const interval = setInterval(createRipple, 600);
		rippleIntervals.push(interval);
	}

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.user-ripples').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.transmit-label').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.tower-a-receive').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);
		svgEl.select('.tower-b-receive').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.combine-box').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.combine-arrows').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.result-box').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
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

		const groundY = 220;

		// Ground line
		svgEl.append('line')
			.attr('x1', 30).attr('y1', groundY)
			.attr('x2', width - 30).attr('y2', groundY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,5');

		// Tower A (left)
		const towerAGroup = svgEl.append('g').attr('class', 'tower-a');
		drawTower(towerAGroup, 100, groundY, '#8ec07c', 'Tower A');

		// Tower B (right)
		const towerBGroup = svgEl.append('g').attr('class', 'tower-b');
		drawTower(towerBGroup, 550, groundY, '#83a598', 'Tower B');

		// User in center (transmitting)
		const userGroup = svgEl.append('g').attr('class', 'user');
		drawUser(userGroup, 325, groundY - 30);

		// User ripples (signal going outward)
		const userRipples = svgEl.append('g').attr('class', 'user-ripples').attr('opacity', 0);
		startUserRipples(userRipples, 325, groundY - 55);

		// Transmit label
		svgEl.append('text')
			.attr('class', 'transmit-label')
			.attr('x', 325).attr('y', groundY - 100)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('Signal radiates outward');

		// Tower A receive indicator
		const towerAReceive = svgEl.append('g').attr('class', 'tower-a-receive').attr('opacity', 0);
		towerAReceive.append('circle')
			.attr('cx', 100).attr('cy', groundY - 98)
			.attr('r', 20)
			.attr('fill', '#8ec07c')
			.attr('fill-opacity', 0.3)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2);
		towerAReceive.append('text')
			.attr('x', 100).attr('y', groundY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Weak signal');

		// Tower B receive indicator
		const towerBReceive = svgEl.append('g').attr('class', 'tower-b-receive').attr('opacity', 0);
		towerBReceive.append('circle')
			.attr('cx', 550).attr('cy', groundY - 98)
			.attr('r', 20)
			.attr('fill', '#83a598')
			.attr('fill-opacity', 0.3)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2);
		towerBReceive.append('text')
			.attr('x', 550).attr('y', groundY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.text('Stronger signal');

		// Combine box (network processor) - positioned below ground
		const combineBoxY = height - 60;
		const combineBox = svgEl.append('g').attr('class', 'combine-box').attr('opacity', 0);
		combineBox.append('rect')
			.attr('x', width / 2 - 45).attr('y', combineBoxY)
			.attr('width', 90).attr('height', 32)
			.attr('fill', '#fabd2f')
			.attr('fill-opacity', 0.2)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('rx', 4);
		combineBox.append('text')
			.attr('x', width / 2).attr('y', combineBoxY + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Combine');

		// Arrows from towers to combine box
		const combineArrows = svgEl.append('g').attr('class', 'combine-arrows').attr('opacity', 0);
		// From Tower A
		combineArrows.append('line')
			.attr('x1', 100).attr('y1', groundY + 45)
			.attr('x2', width / 2 - 45).attr('y2', combineBoxY + 16)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrowhead)');
		// From Tower B
		combineArrows.append('line')
			.attr('x1', 550).attr('y1', groundY + 45)
			.attr('x2', width / 2 + 45).attr('y2', combineBoxY + 16)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrowhead)');

		// Arrowhead marker
		svgEl.append('defs').append('marker')
			.attr('id', 'arrowhead')
			.attr('markerWidth', 10)
			.attr('markerHeight', 7)
			.attr('refX', 9)
			.attr('refY', 3.5)
			.attr('orient', 'auto')
			.append('polygon')
			.attr('points', '0 0, 10 3.5, 0 7')
			.attr('fill', colors.fgMuted);

		// Result box - below combine box
		const resultBox = svgEl.append('g').attr('class', 'result-box').attr('opacity', 0);
		resultBox.append('rect')
			.attr('x', width / 2 - 140).attr('y', height - 25)
			.attr('width', 280).attr('height', 22)
			.attr('fill', colors.bg)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('rx', 4);
		resultBox.append('text')
			.attr('x', width / 2).attr('y', height - 9)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Combined signal = Better decoding!');

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
