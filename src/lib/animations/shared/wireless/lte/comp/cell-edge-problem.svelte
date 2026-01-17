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
	const height = 320;

	const titles = [
		'The Cell Edge Problem',
		'Your tower is far away (weak signal)',
		'Neighbor tower is close (strong interference)',
		'Result: Poor signal quality at cell edge'
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
		// Tower base (trapezoid shape)
		const towerGroup = g.append('g').attr('transform', `translate(${x}, ${y})`);

		// Main tower structure (triangular lattice tower)
		towerGroup.append('path')
			.attr('d', 'M0,-80 L-15,0 L15,0 Z')
			.attr('fill', 'none')
			.attr('stroke', color)
			.attr('stroke-width', 2);

		// Cross beams
		towerGroup.append('line').attr('x1', -10).attr('y1', -20).attr('x2', 10).attr('y2', -20).attr('stroke', color).attr('stroke-width', 1.5);
		towerGroup.append('line').attr('x1', -7).attr('y1', -40).attr('x2', 7).attr('y2', -40).attr('stroke', color).attr('stroke-width', 1.5);
		towerGroup.append('line').attr('x1', -4).attr('y1', -60).attr('x2', 4).attr('y2', -60).attr('stroke', color).attr('stroke-width', 1.5);

		// Antenna at top
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

		// Body
		userGroup.append('circle').attr('cx', 0).attr('cy', -25).attr('r', 10).attr('fill', '#d3869b'); // Head
		userGroup.append('line').attr('x1', 0).attr('y1', -15).attr('x2', 0).attr('y2', 10).attr('stroke', '#d3869b').attr('stroke-width', 3); // Body
		userGroup.append('line').attr('x1', 0).attr('y1', -5).attr('x2', -12).attr('y2', 5).attr('stroke', '#d3869b').attr('stroke-width', 3); // Left arm
		userGroup.append('line').attr('x1', 0).attr('y1', -5).attr('x2', 12).attr('y2', 5).attr('stroke', '#d3869b').attr('stroke-width', 3); // Right arm
		userGroup.append('line').attr('x1', 0).attr('y1', 10).attr('x2', -8).attr('y2', 30).attr('stroke', '#d3869b').attr('stroke-width', 3); // Left leg
		userGroup.append('line').attr('x1', 0).attr('y1', 10).attr('x2', 8).attr('y2', 30).attr('stroke', '#d3869b').attr('stroke-width', 3); // Right leg

		// Phone in hand
		userGroup.append('rect').attr('x', 10).attr('y', -2).attr('width', 8).attr('height', 14).attr('fill', '#83a598').attr('rx', 2);

		// Label
		userGroup.append('text')
			.attr('x', 0).attr('y', 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '10px')
			.text('You (cell edge)');
	}

	function startRipples(g: d3.Selection<SVGGElement, unknown, null, undefined>, cx: number, cy: number, color: string, className: string, strong: boolean) {
		const rippleGroup = g.append('g').attr('class', className);

		function createRipple() {
			const ripple = rippleGroup.append('circle')
				.attr('cx', cx)
				.attr('cy', cy)
				.attr('r', 10)
				.attr('fill', 'none')
				.attr('stroke', color)
				.attr('stroke-width', strong ? 2.5 : 1.5)
				.attr('opacity', strong ? 0.8 : 0.4);

			ripple.transition()
				.duration(3000)
				.ease(d3.easeLinear)
				.attr('r', strong ? 250 : 300)
				.attr('opacity', 0)
				.remove();
		}

		createRipple();
		const interval = setInterval(createRipple, 800);
		rippleIntervals.push(interval);
	}

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.serving-tower').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0.3);
		svgEl.select('.serving-ripples').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.weak-label').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.neighbor-tower').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0.3);
		svgEl.select('.neighbor-ripples').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);
		svgEl.select('.interference-label').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);

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

		const groundY = 250;

		// Ground line
		svgEl.append('line')
			.attr('x1', 30).attr('y1', groundY)
			.attr('x2', width - 30).attr('y2', groundY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,5');

		// Cell boundary indicator
		svgEl.append('line')
			.attr('x1', width / 2).attr('y1', 50)
			.attr('x2', width / 2).attr('y2', groundY)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4')
			.attr('opacity', 0.6);

		svgEl.append('text')
			.attr('x', width / 2).attr('y', 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('Cell Boundary');

		// Serving tower (left, far from user)
		const servingGroup = svgEl.append('g').attr('class', 'serving-tower').attr('opacity', 0.3);
		drawTower(servingGroup, 100, groundY, '#8ec07c', 'Your Tower');

		// Serving tower ripples (weak - thin lines)
		const servingRipples = svgEl.append('g').attr('class', 'serving-ripples').attr('opacity', 0);
		startRipples(servingRipples, 100, groundY - 98, '#8ec07c', 'serving-waves', false);

		// Weak signal label
		svgEl.append('text')
			.attr('class', 'weak-label')
			.attr('x', 100).attr('y', groundY + 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('Weak signal (far)');

		// Neighbor tower (right, close to user)
		const neighborGroup = svgEl.append('g').attr('class', 'neighbor-tower').attr('opacity', 0.3);
		drawTower(neighborGroup, 550, groundY, '#fb4934', 'Neighbor Tower');

		// Neighbor tower ripples (strong - thick lines)
		const neighborRipples = svgEl.append('g').attr('class', 'neighbor-ripples').attr('opacity', 0);
		startRipples(neighborRipples, 550, groundY - 98, '#fb4934', 'neighbor-waves', true);

		// Interference label
		svgEl.append('text')
			.attr('class', 'interference-label')
			.attr('x', 550).attr('y', groundY + 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('Strong interference (close)');

		// User at cell edge
		const userGroup = svgEl.append('g').attr('class', 'user');
		drawUser(userGroup, 340, groundY - 30);

		// Result box
		const resultBox = svgEl.append('g').attr('class', 'result-box').attr('opacity', 0);
		resultBox.append('rect')
			.attr('x', width / 2 - 140).attr('y', height - 35)
			.attr('width', 280).attr('height', 30)
			.attr('fill', colors.bg)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2)
			.attr('rx', 4);
		resultBox.append('text')
			.attr('x', width / 2).attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Poor signal + High interference = Bad experience');

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
