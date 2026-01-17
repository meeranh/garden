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

	const maxStep = 5;
	const width = 520;
	const height = 300;

	const titles = [
		'CML adapts to network conditions',
		'Heavy traffic → P-Phase (Proactive)',
		'Traffic decreasing... entering O-Phase',
		'Light traffic → R-Phase (Reactive)',
		'Traffic increases again → back to P-Phase',
		'Oscillation attack: forced repeated switching!',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Phase indicator
		const phases = ['?', 'P', 'O', 'R', 'P', 'O'];
		const phaseColors = [colors.fgMuted, '#8ec07c', '#fabd2f', '#83a598', '#8ec07c', '#fb4934'];

		svgEl.select('.phase-letter')
			.transition().duration(400)
			.attr('fill', phaseColors[step])
			.text(phases[step]);

		svgEl.select('.phase-box')
			.transition().duration(400)
			.attr('stroke', phaseColors[step]);

		// Phase labels
		const phaseLabels = ['', 'Proactive', 'Oscillation', 'Reactive', 'Proactive', 'Under Attack!'];
		svgEl.select('.phase-label')
			.transition().duration(400)
			.attr('fill', phaseColors[step])
			.text(phaseLabels[step]);

		// Traffic meter
		const trafficLevels = [50, 90, 50, 20, 80, 50];
		const trafficLevel = trafficLevels[step];
		svgEl.select('.traffic-fill')
			.transition().duration(500)
			.attr('width', trafficLevel * 1.5);

		const trafficLabels = ['', 'Heavy', 'Decreasing', 'Light', 'Heavy', 'Manipulated'];
		svgEl.select('.traffic-label')
			.transition().duration(400)
			.text(trafficLabels[step]);

		// Message packets (proactive mode shows them)
		const showPackets = step === 1 || step === 4;
		svgEl.selectAll('.routing-packet')
			.transition().duration(400)
			.attr('opacity', showPackets ? 1 : 0);

		// Routing activity label
		const activityLabels = ['', 'HELLO, TC messages flowing...', 'Transitioning...', 'Silent (waiting for requests)', 'HELLO, TC messages flowing...', 'Constant switching = chaos'];
		svgEl.select('.activity-label')
			.transition().duration(400)
			.text(activityLabels[step]);

		// Network nodes pulse in P-phase
		svgEl.selectAll('.net-node')
			.transition().duration(400)
			.attr('fill-opacity', showPackets ? 0.5 : 0.2)
			.attr('stroke-width', showPackets ? 2.5 : 1.5);

		// Attack indicator
		svgEl.select('.attack-indicator')
			.transition().duration(400)
			.attr('opacity', step === 5 ? 1 : 0);

		// Oscillation arrows
		svgEl.select('.oscillation-arrows')
			.transition().duration(400)
			.attr('opacity', step === 5 ? 1 : 0);
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
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// ========== LEFT: Phase Indicator ==========
		const phaseX = 80, phaseY = 100;

		svgEl.append('text')
			.attr('x', phaseX).attr('y', phaseY - 45)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Current Phase');

		svgEl.append('rect')
			.attr('class', 'phase-box')
			.attr('x', phaseX - 35).attr('y', phaseY - 35)
			.attr('width', 70).attr('height', 70)
			.attr('fill', 'none')
			.attr('stroke', colors.fgMuted).attr('stroke-width', 3)
			.attr('rx', 8);

		svgEl.append('text')
			.attr('class', 'phase-letter')
			.attr('x', phaseX).attr('y', phaseY + 12)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '40px').attr('font-weight', 'bold')
			.text('?');

		svgEl.append('text')
			.attr('class', 'phase-label')
			.attr('x', phaseX).attr('y', phaseY + 55)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('');

		// ========== CENTER: Network Visualization ==========
		const netX = 280, netY = 110;
		const nodePositions = [
			{ x: netX - 50, y: netY - 30 },
			{ x: netX + 50, y: netY - 30 },
			{ x: netX - 60, y: netY + 35 },
			{ x: netX, y: netY + 45 },
			{ x: netX + 60, y: netY + 35 },
		];

		// Links
		const links = [[0,1], [0,2], [0,3], [1,3], [1,4], [2,3], [3,4]];
		links.forEach(([i, j]) => {
			svgEl.append('line')
				.attr('x1', nodePositions[i].x).attr('y1', nodePositions[i].y)
				.attr('x2', nodePositions[j].x).attr('y2', nodePositions[j].y)
				.attr('stroke', colors.fgMuted).attr('stroke-width', 1).attr('stroke-opacity', 0.4);
		});

		// Nodes
		nodePositions.forEach((pos, i) => {
			svgEl.append('circle')
				.attr('class', 'net-node')
				.attr('cx', pos.x).attr('cy', pos.y)
				.attr('r', 18)
				.attr('fill', '#83a598').attr('fill-opacity', 0.2)
				.attr('stroke', '#83a598').attr('stroke-width', 1.5);
		});

		// Routing packets (shown in P-phase)
		const packetPositions = [
			{ x: netX - 25, y: netY - 15 },
			{ x: netX + 25, y: netY },
			{ x: netX - 10, y: netY + 25 },
		];
		packetPositions.forEach(pos => {
			svgEl.append('rect')
				.attr('class', 'routing-packet')
				.attr('x', pos.x - 12).attr('y', pos.y - 6)
				.attr('width', 24).attr('height', 12)
				.attr('fill', '#8ec07c').attr('fill-opacity', 0.8)
				.attr('rx', 2)
				.attr('opacity', 0);
		});

		// Activity label
		svgEl.append('text')
			.attr('class', 'activity-label')
			.attr('x', netX).attr('y', netY + 85)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('');

		// ========== RIGHT: Traffic Meter ==========
		const meterX = 440, meterY = 80;

		svgEl.append('text')
			.attr('x', meterX).attr('y', meterY - 10)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Traffic Load');

		// Meter background
		svgEl.append('rect')
			.attr('x', meterX - 75).attr('y', meterY)
			.attr('width', 150).attr('height', 20)
			.attr('fill', colors.fgMuted).attr('fill-opacity', 0.2)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('rx', 4);

		// Meter fill
		svgEl.append('rect')
			.attr('class', 'traffic-fill')
			.attr('x', meterX - 75).attr('y', meterY)
			.attr('width', 75).attr('height', 20)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.6)
			.attr('rx', 4);

		// Traffic label
		svgEl.append('text')
			.attr('class', 'traffic-label')
			.attr('x', meterX).attr('y', meterY + 40)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('');

		// ========== Attack Indicator ==========
		svgEl.append('text')
			.attr('class', 'attack-indicator')
			.attr('x', width / 2).attr('y', height - 50)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('Attacker manipulates traffic to force switching');

		// Oscillation arrows
		const arrowsG = svgEl.append('g').attr('class', 'oscillation-arrows').attr('opacity', 0);
		arrowsG.append('text')
			.attr('x', phaseX).attr('y', phaseY + 80)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '16px')
			.text('↑↓↑↓');

		// ========== Bottom: Phase Legend ==========
		const legendY = height - 20;
		const legendItems = [
			{ label: 'P = Proactive', color: '#8ec07c', x: 100 },
			{ label: 'O = Oscillation', color: '#fabd2f', x: 260 },
			{ label: 'R = Reactive', color: '#83a598', x: 420 },
		];

		legendItems.forEach(item => {
			svgEl.append('text')
				.attr('x', item.x).attr('y', legendY)
				.attr('text-anchor', 'middle').attr('fill', item.color)
				.attr('font-size', '9px')
				.text(item.label);
		});

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
