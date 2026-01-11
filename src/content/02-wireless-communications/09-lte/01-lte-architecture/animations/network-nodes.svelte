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

	const maxStep = 6;
	const width = 650;
	const height = 380;

	const titles = [
		'LTE Network Architecture',
		'UE: Your smartphone',
		'eNodeB: The smart cell tower',
		'S-GW: Routes data inside LTE',
		'P-GW: Gateway to the internet',
		'MME: The control brain',
		'HSS: Subscriber database'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Show nodes progressively
		svgEl.select('.node-ue').transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0.15);
		svgEl.select('.node-enodeb').transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0.15);
		svgEl.select('.node-sgw').transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0.15);
		svgEl.select('.node-pgw').transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0.15);
		svgEl.select('.node-internet').transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0.15);
		svgEl.select('.node-mme').transition().duration(400)
			.attr('opacity', step >= 5 ? 1 : 0.15);
		svgEl.select('.node-hss').transition().duration(400)
			.attr('opacity', step >= 6 ? 1 : 0.15);

		// Highlight current node
		const highlights = ['ue', 'enodeb', 'sgw', 'pgw', 'mme', 'hss'];
		highlights.forEach((h, i) => {
			svgEl.select(`.highlight-${h}`)
				.transition().duration(300)
				.attr('opacity', step === i + 1 ? 1 : 0);
		});

		// Show connections progressively
		svgEl.select('.data-connections').transition().duration(400)
			.attr('opacity', step >= 4 ? 0.6 : 0);
		svgEl.select('.control-connections').transition().duration(400)
			.attr('opacity', step >= 6 ? 0.6 : 0);

		// Show plane labels
		svgEl.select('.plane-labels').transition().duration(400)
			.attr('opacity', step >= 6 ? 1 : 0);
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

	function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
	function pause() { isPlaying = false; clearTimeouts(); }
	function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
	function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
	function skip() { pause(); applyStep(maxStep); }
	function replay() { pause(); currentStep = 0; applyStep(0); isPlaying = true; runAnimation(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	function drawPhone(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number) {
		// Phone body
		g.append('rect')
			.attr('x', x - 18).attr('y', y - 35)
			.attr('width', 36).attr('height', 70)
			.attr('fill', '#83a598').attr('fill-opacity', 0.3)
			.attr('stroke', '#83a598').attr('stroke-width', 2)
			.attr('rx', 6);
		// Screen
		g.append('rect')
			.attr('x', x - 14).attr('y', y - 28)
			.attr('width', 28).attr('height', 48)
			.attr('fill', '#83a598').attr('fill-opacity', 0.5)
			.attr('rx', 2);
		// Home button
		g.append('circle')
			.attr('cx', x).attr('cy', y + 28)
			.attr('r', 4)
			.attr('fill', 'none')
			.attr('stroke', '#83a598').attr('stroke-width', 1);
	}

	function drawTower(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number) {
		// Tower pole
		g.append('rect')
			.attr('x', x - 4).attr('y', y - 50)
			.attr('width', 8).attr('height', 65)
			.attr('fill', '#8ec07c');
		// Base
		g.append('rect')
			.attr('x', x - 20).attr('y', y + 15)
			.attr('width', 40).attr('height', 10)
			.attr('fill', '#8ec07c');
		// Antenna panels
		[-15, 0, 15].forEach(offset => {
			g.append('rect')
				.attr('x', x + offset - 6).attr('y', y - 45)
				.attr('width', 12).attr('height', 25)
				.attr('fill', '#8ec07c').attr('fill-opacity', 0.5)
				.attr('stroke', '#8ec07c').attr('stroke-width', 1)
				.attr('rx', 2);
		});
	}

	function drawGateway(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string, label: string) {
		// Main box
		g.append('rect')
			.attr('x', x - 40).attr('y', y - 30)
			.attr('width', 80).attr('height', 60)
			.attr('fill', color).attr('fill-opacity', 0.2)
			.attr('stroke', color).attr('stroke-width', 2)
			.attr('rx', 6);
		// Router lines inside
		g.append('line')
			.attr('x1', x - 25).attr('y1', y - 10)
			.attr('x2', x + 25).attr('y2', y - 10)
			.attr('stroke', color).attr('stroke-width', 1);
		g.append('line')
			.attr('x1', x - 25).attr('y1', y + 5)
			.attr('x2', x + 25).attr('y2', y + 5)
			.attr('stroke', color).attr('stroke-width', 1);
		// Ports
		[-20, -5, 10, 25].forEach(offset => {
			g.append('rect')
				.attr('x', x + offset - 5).attr('y', y + 12)
				.attr('width', 10).attr('height', 8)
				.attr('fill', color).attr('fill-opacity', 0.5);
		});
		// Label
		g.append('text')
			.attr('x', x).attr('y', y - 38)
			.attr('text-anchor', 'middle').attr('fill', color)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(label);
	}

	function drawMME(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number) {
		// Hexagon shape for "brain"
		const size = 35;
		const points = [];
		for (let i = 0; i < 6; i++) {
			const angle = (i * 60 - 30) * Math.PI / 180;
			points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
		}
		g.append('polygon')
			.attr('points', points.join(' '))
			.attr('fill', '#d3869b').attr('fill-opacity', 0.2)
			.attr('stroke', '#d3869b').attr('stroke-width', 2);
		// Inner connections (brain-like)
		g.append('circle')
			.attr('cx', x).attr('cy', y)
			.attr('r', 8)
			.attr('fill', '#d3869b').attr('fill-opacity', 0.4);
		[-15, 0, 15].forEach(offset => {
			g.append('line')
				.attr('x1', x).attr('y1', y)
				.attr('x2', x + offset).attr('y2', y - 18)
				.attr('stroke', '#d3869b').attr('stroke-width', 1);
			g.append('circle')
				.attr('cx', x + offset).attr('cy', y - 18)
				.attr('r', 4)
				.attr('fill', '#d3869b').attr('fill-opacity', 0.6);
		});
		// Label
		g.append('text')
			.attr('x', x).attr('y', y + 50)
			.attr('text-anchor', 'middle').attr('fill', '#d3869b')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('MME');
	}

	function drawHSS(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number) {
		// Database cylinder
		const w = 50, h = 55;
		// Bottom ellipse
		g.append('ellipse')
			.attr('cx', x).attr('cy', y + h/2 - 8)
			.attr('rx', w/2).attr('ry', 10)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.3)
			.attr('stroke', '#fb4934').attr('stroke-width', 2);
		// Body
		g.append('rect')
			.attr('x', x - w/2).attr('y', y - h/2 + 8)
			.attr('width', w).attr('height', h - 16)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.2)
			.attr('stroke', 'none');
		g.append('line')
			.attr('x1', x - w/2).attr('y1', y - h/2 + 8)
			.attr('x2', x - w/2).attr('y2', y + h/2 - 8)
			.attr('stroke', '#fb4934').attr('stroke-width', 2);
		g.append('line')
			.attr('x1', x + w/2).attr('y1', y - h/2 + 8)
			.attr('x2', x + w/2).attr('y2', y + h/2 - 8)
			.attr('stroke', '#fb4934').attr('stroke-width', 2);
		// Top ellipse
		g.append('ellipse')
			.attr('cx', x).attr('cy', y - h/2 + 8)
			.attr('rx', w/2).attr('ry', 10)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.3)
			.attr('stroke', '#fb4934').attr('stroke-width', 2);
		// Data lines
		[-12, 0, 12].forEach(offset => {
			g.append('line')
				.attr('x1', x - 15).attr('y1', y + offset)
				.attr('x2', x + 15).attr('y2', y + offset)
				.attr('stroke', '#fb4934').attr('stroke-width', 1).attr('stroke-opacity', 0.5);
		});
		// Label
		g.append('text')
			.attr('x', x).attr('y', y + h/2 + 18)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('HSS');
	}

	function drawCloud(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number) {
		const c = '#83a598';
		// Proper cloud path: flat bottom, 3 bumps on top
		g.append('path')
			.attr('d', `
				M ${x - 28} ${y + 12}
				L ${x + 28} ${y + 12}
				Q ${x + 42} ${y + 12} ${x + 40} ${y - 2}
				Q ${x + 38} ${y - 18} ${x + 18} ${y - 18}
				Q ${x + 15} ${y - 32} ${x - 5} ${y - 28}
				Q ${x - 22} ${y - 32} ${x - 25} ${y - 15}
				Q ${x - 42} ${y - 12} ${x - 40} ${y + 2}
				Q ${x - 42} ${y + 12} ${x - 28} ${y + 12}
				Z
			`)
			.attr('fill', c)
			.attr('fill-opacity', 0.2)
			.attr('stroke', c)
			.attr('stroke-width', 2);
		g.append('text')
			.attr('x', x)
			.attr('y', y)
			.attr('text-anchor', 'middle')
			.attr('fill', c)
			.attr('font-size', '10px')
			.text('Internet');
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
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Positions
		const dataY = 260;
		const controlY = 100;

		// ===== Data Plane Connections (draw first, behind nodes) =====
		const dataConn = svgEl.append('g').attr('class', 'data-connections').attr('opacity', 0);

		// UE to eNodeB (radio waves)
		dataConn.append('path')
			.attr('d', 'M 85 260 Q 120 240, 155 260')
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,3');

		// eNodeB to S-GW
		dataConn.append('line')
			.attr('x1', 205).attr('y1', dataY)
			.attr('x2', 290).attr('y2', dataY)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3);

		// S-GW to P-GW
		dataConn.append('line')
			.attr('x1', 370).attr('y1', dataY)
			.attr('x2', 430).attr('y2', dataY)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3);

		// P-GW to Internet
		dataConn.append('line')
			.attr('x1', 510).attr('y1', dataY)
			.attr('x2', 560).attr('y2', dataY)
			.attr('stroke', '#83a598').attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,2');

		// ===== Control Plane Connections =====
		const ctrlConn = svgEl.append('g').attr('class', 'control-connections').attr('opacity', 0);

		// MME to HSS
		ctrlConn.append('line')
			.attr('x1', 285).attr('y1', controlY)
			.attr('x2', 365).attr('y2', controlY)
			.attr('stroke', '#d3869b').attr('stroke-width', 2);

		// MME to eNodeB
		ctrlConn.append('path')
			.attr('d', 'M 220 120 Q 200 180, 190 220')
			.attr('fill', 'none')
			.attr('stroke', '#d3869b').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3');

		// MME to S-GW
		ctrlConn.append('path')
			.attr('d', 'M 270 130 Q 300 180, 330 220')
			.attr('fill', 'none')
			.attr('stroke', '#d3869b').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3');

		// ===== UE =====
		const ueG = svgEl.append('g').attr('class', 'node-ue').attr('opacity', 0.15);
		drawPhone(ueG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>, 60, dataY);
		ueG.append('text')
			.attr('x', 60).attr('y', dataY + 50)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('UE');

		// UE highlight
		const ueHighlight = svgEl.append('g').attr('class', 'highlight-ue').attr('opacity', 0);
		ueHighlight.append('rect')
			.attr('x', 30).attr('y', dataY - 45)
			.attr('width', 60).attr('height', 110)
			.attr('fill', 'none')
			.attr('stroke', '#83a598').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);
		ueHighlight.append('text')
			.attr('x', 60).attr('y', height - 20)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '9px')
			.text('Your device with SIM');

		// ===== eNodeB =====
		const enodebG = svgEl.append('g').attr('class', 'node-enodeb').attr('opacity', 0.15);
		drawTower(enodebG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>, 180, dataY - 10);
		enodebG.append('text')
			.attr('x', 180).attr('y', dataY + 50)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('eNodeB');

		// eNodeB highlight
		const enodebHighlight = svgEl.append('g').attr('class', 'highlight-enodeb').attr('opacity', 0);
		enodebHighlight.append('rect')
			.attr('x', 140).attr('y', dataY - 70)
			.attr('width', 85).attr('height', 135)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);
		enodebHighlight.append('text')
			.attr('x', 182).attr('y', height - 20)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('Smart tower, local decisions');

		// ===== S-GW =====
		const sgwG = svgEl.append('g').attr('class', 'node-sgw').attr('opacity', 0.15);
		drawGateway(sgwG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>, 330, dataY, '#fabd2f', 'S-GW');

		// S-GW highlight
		const sgwHighlight = svgEl.append('g').attr('class', 'highlight-sgw').attr('opacity', 0);
		sgwHighlight.append('rect')
			.attr('x', 280).attr('y', dataY - 50)
			.attr('width', 100).attr('height', 100)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);
		sgwHighlight.append('text')
			.attr('x', 330).attr('y', height - 20)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('Mobility anchor inside LTE');

		// ===== P-GW =====
		const pgwG = svgEl.append('g').attr('class', 'node-pgw').attr('opacity', 0.15);
		drawGateway(pgwG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>, 470, dataY, '#fe8019', 'P-GW');

		// P-GW highlight
		const pgwHighlight = svgEl.append('g').attr('class', 'highlight-pgw').attr('opacity', 0);
		pgwHighlight.append('rect')
			.attr('x', 420).attr('y', dataY - 50)
			.attr('width', 100).attr('height', 100)
			.attr('fill', 'none')
			.attr('stroke', '#fe8019').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);
		pgwHighlight.append('text')
			.attr('x', 470).attr('y', height - 20)
			.attr('text-anchor', 'middle').attr('fill', '#fe8019')
			.attr('font-size', '9px')
			.text('Assigns IP, connects to internet');

		// ===== Internet Cloud =====
		const cloudG = svgEl.append('g').attr('class', 'node-internet').attr('opacity', 0.15);
		drawCloud(cloudG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>, 600, dataY);

		// ===== MME =====
		const mmeG = svgEl.append('g').attr('class', 'node-mme').attr('opacity', 0.15);
		drawMME(mmeG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>, 250, controlY);

		// MME highlight
		const mmeHighlight = svgEl.append('g').attr('class', 'highlight-mme').attr('opacity', 0);
		mmeHighlight.append('rect')
			.attr('x', 200).attr('y', controlY - 50)
			.attr('width', 100).attr('height', 115)
			.attr('fill', 'none')
			.attr('stroke', '#d3869b').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);
		mmeHighlight.append('text')
			.attr('x', 250).attr('y', controlY + 75)
			.attr('text-anchor', 'middle').attr('fill', '#d3869b')
			.attr('font-size', '9px')
			.text('Auth, security, sessions');

		// ===== HSS =====
		const hssG = svgEl.append('g').attr('class', 'node-hss').attr('opacity', 0.15);
		drawHSS(hssG as unknown as d3.Selection<SVGGElement, unknown, null, undefined>, 400, controlY);

		// HSS highlight
		const hssHighlight = svgEl.append('g').attr('class', 'highlight-hss').attr('opacity', 0);
		hssHighlight.append('rect')
			.attr('x', 360).attr('y', controlY - 45)
			.attr('width', 80).attr('height', 105)
			.attr('fill', 'none')
			.attr('stroke', '#fb4934').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);
		hssHighlight.append('text')
			.attr('x', 400).attr('y', controlY + 85)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.text('Stores subscriber info');

		// ===== Plane Labels =====
		const planeLabels = svgEl.append('g').attr('class', 'plane-labels').attr('opacity', 0);

		// Control plane box
		planeLabels.append('rect')
			.attr('x', 185).attr('y', 45)
			.attr('width', 280).attr('height', 125)
			.attr('fill', 'none')
			.attr('stroke', '#d3869b').attr('stroke-width', 1)
			.attr('stroke-dasharray', '8,4')
			.attr('rx', 10);
		planeLabels.append('text')
			.attr('x', 195).attr('y', 60)
			.attr('fill', '#d3869b')
			.attr('font-size', '9px')
			.text('Control Plane');

		// Data plane box
		planeLabels.append('rect')
			.attr('x', 25).attr('y', 195)
			.attr('width', 520).attr('height', 130)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c').attr('stroke-width', 1)
			.attr('stroke-dasharray', '8,4')
			.attr('rx', 10);
		planeLabels.append('text')
			.attr('x', 35).attr('y', 210)
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('Data Plane');

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
