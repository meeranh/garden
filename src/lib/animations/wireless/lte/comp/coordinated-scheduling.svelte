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
	const width = 650;
	const height = 340;

	const titles = [
		'Coordinated Scheduling/Beamforming (CS/CB)',
		'Tower A serves cell-edge user',
		'Tower B points beam AWAY (avoids interference)',
		'Result: No interference, clean signal!'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

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

	function drawUser(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, label: string, color: string) {
		const userGroup = g.append('g').attr('transform', `translate(${x}, ${y})`);

		userGroup.append('circle').attr('cx', 0).attr('cy', -25).attr('r', 10).attr('fill', color);
		userGroup.append('line').attr('x1', 0).attr('y1', -15).attr('x2', 0).attr('y2', 10).attr('stroke', color).attr('stroke-width', 3);
		userGroup.append('line').attr('x1', 0).attr('y1', -5).attr('x2', -12).attr('y2', 5).attr('stroke', color).attr('stroke-width', 3);
		userGroup.append('line').attr('x1', 0).attr('y1', -5).attr('x2', 12).attr('y2', 5).attr('stroke', color).attr('stroke-width', 3);
		userGroup.append('line').attr('x1', 0).attr('y1', 10).attr('x2', -8).attr('y2', 30).attr('stroke', color).attr('stroke-width', 3);
		userGroup.append('line').attr('x1', 0).attr('y1', 10).attr('x2', 8).attr('y2', 30).attr('stroke', color).attr('stroke-width', 3);

		userGroup.append('rect').attr('x', 10).attr('y', -2).attr('width', 8).attr('height', 14).attr('fill', '#83a598').attr('rx', 2);

		userGroup.append('text')
			.attr('x', 0).attr('y', 50)
			.attr('text-anchor', 'middle')
			.attr('fill', color)
			.attr('font-size', '10px')
			.text(label);
	}

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Tower A beam (towards user)
		svgEl.select('.beam-a').transition().duration(400).attr('opacity', step >= 1 ? 0.5 : 0);
		svgEl.select('.serving-label').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);

		// Tower B beam (away from user)
		svgEl.select('.beam-b-away').transition().duration(400).attr('opacity', step >= 2 ? 0.5 : 0);
		svgEl.select('.avoid-label').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);
		svgEl.select('.user-b').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0.3);

		// Coordination message
		svgEl.select('.coord-msg').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);

		// Result
		svgEl.select('.result-box').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.no-interference').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
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

		// Coordination line between towers
		svgEl.append('line')
			.attr('x1', 100).attr('y1', groundY - 40)
			.attr('x2', 550).attr('y2', groundY - 40)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '10,5');

		// Coordination message - positioned on right side
		const coordMsg = svgEl.append('g').attr('class', 'coord-msg').attr('opacity', 0);
		coordMsg.append('rect')
			.attr('x', 340).attr('y', groundY - 70)
			.attr('width', 160).attr('height', 24)
			.attr('fill', '#fabd2f')
			.attr('fill-opacity', 0.2)
			.attr('stroke', '#fabd2f')
			.attr('rx', 4);
		coordMsg.append('text')
			.attr('x', 420).attr('y', groundY - 53)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.text('"Point away from my user!"');

		// Tower A (left) - serving tower
		const towerAGroup = svgEl.append('g').attr('class', 'tower-a');
		drawTower(towerAGroup, 100, groundY, '#8ec07c', 'Tower A');

		// Tower A beam (cone towards user)
		svgEl.append('path')
			.attr('class', 'beam-a')
			.attr('d', `M100,${groundY - 98} L300,${groundY - 150} L300,${groundY + 20} Z`)
			.attr('fill', '#8ec07c')
			.attr('opacity', 0);

		// Serving label
		svgEl.append('text')
			.attr('class', 'serving-label')
			.attr('x', 100).attr('y', groundY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('Serving user');

		// Tower B (right)
		const towerBGroup = svgEl.append('g').attr('class', 'tower-b');
		drawTower(towerBGroup, 550, groundY, '#83a598', 'Tower B');

		// Tower B beam pointing AWAY (to the right, away from cell-edge user)
		svgEl.append('path')
			.attr('class', 'beam-b-away')
			.attr('d', `M550,${groundY - 98} L700,${groundY - 150} L700,${groundY + 20} Z`)
			.attr('fill', '#83a598')
			.attr('opacity', 0);

		// Avoid label
		svgEl.append('text')
			.attr('class', 'avoid-label')
			.attr('x', 550).attr('y', groundY + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('Beam pointed away');

		// Cell edge user (being served by Tower A)
		const userAGroup = svgEl.append('g').attr('class', 'user-a');
		drawUser(userAGroup, 300, groundY - 30, 'You (cell edge)', '#d3869b');

		// Another user served by Tower B (on the right)
		const userBGroup = svgEl.append('g').attr('class', 'user-b').attr('opacity', 0.3);
		drawUser(userBGroup, 620, groundY - 30, 'Other user', '#83a598');

		// No interference indicator (just text, no lines)
		const noInterference = svgEl.append('g').attr('class', 'no-interference').attr('opacity', 0);
		noInterference.append('text')
			.attr('x', 300).attr('y', groundY - 90)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('No interference!');

		// Result box
		const resultBox = svgEl.append('g').attr('class', 'result-box').attr('opacity', 0);
		resultBox.append('rect')
			.attr('x', width / 2 - 160).attr('y', height - 55)
			.attr('width', 320).attr('height', 40)
			.attr('fill', colors.bg)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('rx', 4);
		resultBox.append('text')
			.attr('x', width / 2).attr('y', height - 38)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('Towers share scheduling info (not user data)');
		resultBox.append('text')
			.attr('x', width / 2).attr('y', height - 22)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Less backhaul needed, still effective!');

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
