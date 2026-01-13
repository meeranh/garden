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
	let intervals: ReturnType<typeof setInterval>[] = [];
	let colors: Record<string, string>;

	const maxStep = 3;
	const width = 620;
	const height = 340;

	const titles = [
		'Relay Nodes: Extending Coverage',
		'Macro tower has fiber connection',
		'Relay receives signal wirelessly',
		'Relay retransmits to users (no fiber needed!)'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }
	function clearIntervals() { intervals.forEach(clearInterval); intervals = []; }

	function createRipples(g: d3.Selection<SVGGElement, unknown, null, undefined>, cx: number, cy: number, color: string, maxRadius: number) {
		const rippleCount = 3;
		for (let i = 0; i < rippleCount; i++) {
			const ripple = g.append('circle')
				.attr('cx', cx)
				.attr('cy', cy)
				.attr('r', 5)
				.attr('fill', 'none')
				.attr('stroke', color)
				.attr('stroke-width', 2)
				.attr('opacity', 0);

			function animateRipple() {
				ripple
					.attr('r', 5)
					.attr('opacity', 0.8)
					.transition()
					.duration(1500)
					.ease(d3.easeLinear)
					.attr('r', maxRadius)
					.attr('opacity', 0)
					.on('end', animateRipple);
			}

			setTimeout(() => animateRipple(), i * 500);
		}
	}

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.macro-tower').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0.3);
		svgEl.select('.fiber-line').transition().duration(400).attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.macro-ripples').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);
		svgEl.select('.relay-node').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0.3);
		svgEl.select('.backhaul-label').transition().duration(400).attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.relay-ripples').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.user').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0.3);
		svgEl.select('.retransmit-label').transition().duration(400).attr('opacity', step >= 3 ? 1 : 0);
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

	function drawTower(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('path').attr('d', 'M0,-70 L-12,0 L12,0 Z').attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
		t.append('line').attr('x1', -8).attr('y1', -18).attr('x2', 8).attr('y2', -18).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', -6).attr('y1', -35).attr('x2', 6).attr('y2', -35).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', -4).attr('y1', -52).attr('x2', 4).attr('y2', -52).attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', 0).attr('y1', -70).attr('x2', 0).attr('y2', -85).attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -88).attr('r', 4).attr('fill', color);
	}

	function drawRelay(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', -50).attr('stroke', color).attr('stroke-width', 3);
		t.append('rect').attr('x', -12).attr('y', -65).attr('width', 24).attr('height', 18).attr('fill', color).attr('fill-opacity', 0.3).attr('stroke', color).attr('stroke-width', 2).attr('rx', 3);
		t.append('line').attr('x1', 0).attr('y1', -65).attr('x2', 0).attr('y2', -78).attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -80).attr('r', 3).attr('fill', color);
	}

	function drawUser(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('circle').attr('cx', 0).attr('cy', -22).attr('r', 9).attr('fill', '#d3869b');
		t.append('line').attr('x1', 0).attr('y1', -13).attr('x2', 0).attr('y2', 8).attr('stroke', '#d3869b').attr('stroke-width', 2.5);
		t.append('line').attr('x1', 0).attr('y1', -5).attr('x2', -10).attr('y2', 3).attr('stroke', '#d3869b').attr('stroke-width', 2.5);
		t.append('line').attr('x1', 0).attr('y1', -5).attr('x2', 10).attr('y2', 0).attr('stroke', '#d3869b').attr('stroke-width', 2.5);
		t.append('rect').attr('x', 8).attr('y', -5).attr('width', 6).attr('height', 10).attr('fill', '#83a598').attr('rx', 1);
		t.append('line').attr('x1', 0).attr('y1', 8).attr('x2', -6).attr('y2', 22).attr('stroke', '#d3869b').attr('stroke-width', 2.5);
		t.append('line').attr('x1', 0).attr('y1', 8).attr('x2', 6).attr('y2', 22).attr('stroke', '#d3869b').attr('stroke-width', 2.5);
	}

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

		const baseY = 220;

		// Ground line
		svgEl.append('line')
			.attr('x1', 30).attr('y1', baseY)
			.attr('x2', width - 30).attr('y2', baseY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4');

		// ===== MACRO TOWER =====
		const macroX = 120;
		const macroTower = svgEl.append('g').attr('class', 'macro-tower').attr('opacity', 0.3);
		drawTower(macroTower, macroX, baseY, '#8ec07c');
		macroTower.append('text')
			.attr('x', macroX).attr('y', baseY + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Macro Tower');

		// Fiber line
		const fiberLine = svgEl.append('g').attr('class', 'fiber-line').attr('opacity', 0);
		fiberLine.append('line')
			.attr('x1', macroX).attr('y1', baseY)
			.attr('x2', macroX).attr('y2', baseY + 35)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 3);
		fiberLine.append('text')
			.attr('x', macroX).attr('y', baseY + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.text('Fiber');

		// ===== RELAY NODE =====
		const relayX = 350;
		const relayNode = svgEl.append('g').attr('class', 'relay-node').attr('opacity', 0.3);
		drawRelay(relayNode, relayX, baseY, '#83a598');
		relayNode.append('text')
			.attr('x', relayX).attr('y', baseY + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Relay Node');

		relayNode.append('text')
			.attr('x', relayX).attr('y', baseY + 32)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(No fiber!)');

		// Macro tower ripples (wireless backhaul)
		const macroRipples = svgEl.append('g').attr('class', 'macro-ripples').attr('opacity', 0);
		createRipples(macroRipples, macroX, baseY - 88, '#8ec07c', 120);

		// Backhaul label
		svgEl.append('text')
			.attr('class', 'backhaul-label')
			.attr('x', (macroX + relayX) / 2).attr('y', 55)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Wireless backhaul')
			.attr('opacity', 0);

		// ===== USER =====
		const userX = 520;
		const user = svgEl.append('g').attr('class', 'user').attr('opacity', 0.3);
		drawUser(user, userX, baseY - 25);
		user.append('text')
			.attr('x', userX).attr('y', baseY + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '10px')
			.text('User');

		// Relay ripples (to user)
		const relayRipples = svgEl.append('g').attr('class', 'relay-ripples').attr('opacity', 0);
		createRipples(relayRipples, relayX, baseY - 80, '#83a598', 100);

		// Retransmit label
		svgEl.append('text')
			.attr('class', 'retransmit-label')
			.attr('x', (relayX + userX) / 2 + 10).attr('y', 55)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.text('Retransmit')
			.attr('opacity', 0);

		// Result box
		const resultBox = svgEl.append('g').attr('class', 'result-box').attr('opacity', 0);
		resultBox.append('rect')
			.attr('x', width / 2 - 130).attr('y', height - 45)
			.attr('width', 260).attr('height', 35)
			.attr('fill', colors.bg)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('rx', 4);
		resultBox.append('text')
			.attr('x', width / 2).attr('y', height - 22)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Coverage extended without fiber!');

		applyStep(0);
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => { clearTimeouts(); clearIntervals(); });
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
