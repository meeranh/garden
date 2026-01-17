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
	const width = 600;
	const height = 340;

	const titles = [
		'Data Flow: How your phone connects to the internet',
		'Step 1: Phone sends connection request',
		'Step 2: AMF authenticates you',
		'Step 3: AMF asks SMF to set up a session',
		'Step 4: SMF configures UPF with routing rules',
		'Step 5: Data flows through UPF to the internet',
		'Complete: Control plane decided, User plane delivers'
	];

	const stepDescriptions = [
		'',
		'"Hello, I want to connect"',
		'"Who are you? OK, you\'re valid"',
		'"Set up a data path for this user"',
		'"Route this user\'s traffic like this"',
		'Packets flow: Phone ↔ UPF ↔ Internet',
		'AMF + SMF = decisions | UPF = data movement'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);
		svgEl.select('.desc-text').text(stepDescriptions[step]);

		// Phone
		svgEl.select('.phone')
			.transition().duration(400)
			.attr('stroke-width', step >= 1 ? 3 : 1.5)
			.attr('fill-opacity', step >= 1 ? 0.3 : 0.1);

		// AMF highlight
		svgEl.select('.amf-box')
			.transition().duration(400)
			.attr('stroke-width', (step === 1 || step === 2 || step === 3) ? 3 : 1.5)
			.attr('fill-opacity', (step === 1 || step === 2 || step === 3) ? 0.3 : 0.15);

		// SMF highlight
		svgEl.select('.smf-box')
			.transition().duration(400)
			.attr('stroke-width', (step === 3 || step === 4) ? 3 : 1.5)
			.attr('fill-opacity', (step === 3 || step === 4) ? 0.3 : 0.15);

		// UPF highlight
		svgEl.select('.upf-box')
			.transition().duration(400)
			.attr('stroke-width', (step === 4 || step === 5) ? 3 : 1.5)
			.attr('fill-opacity', (step === 4 || step === 5) ? 0.3 : 0.15);

		// Internet highlight
		svgEl.select('.internet')
			.transition().duration(400)
			.attr('stroke-width', step >= 5 ? 3 : 1.5)
			.attr('fill-opacity', step >= 5 ? 0.3 : 0.1);

		// Arrows / signals
		// Phone to AMF (step 1-2)
		svgEl.select('.arrow-phone-amf')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// AMF processing indicator (step 2)
		svgEl.select('.amf-check')
			.transition().duration(400)
			.attr('opacity', step === 2 ? 1 : 0);

		// AMF to SMF (step 3)
		svgEl.select('.arrow-amf-smf')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// SMF to UPF (step 4)
		svgEl.select('.arrow-smf-upf')
			.transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		// Data flow (step 5-6)
		svgEl.select('.data-flow-group')
			.transition().duration(400)
			.attr('opacity', step >= 5 ? 1 : 0);

		// Animate data packets at step 5
		if (step === 5) {
			animateDataPackets();
		}

		// Control plane label
		svgEl.select('.control-plane-label')
			.transition().duration(400)
			.attr('opacity', step === 6 ? 1 : 0);

		// User plane label
		svgEl.select('.user-plane-label')
			.transition().duration(400)
			.attr('opacity', step === 6 ? 1 : 0);
	}

	function animateDataPackets() {
		// Animate packets from phone through UPF to internet
		const packet1 = svgEl.select('.packet-1');
		const packet2 = svgEl.select('.packet-2');

		// Phone to UPF
		packet1
			.attr('cx', 80).attr('cy', 200)
			.attr('opacity', 1)
			.transition().duration(600)
			.attr('cx', 300).attr('cy', 200)
			.transition().duration(600)
			.attr('cx', 520).attr('cy', 200)
			.transition().duration(200)
			.attr('opacity', 0);

		// Response: Internet to Phone
		packet2
			.attr('cx', 520).attr('cy', 220)
			.attr('opacity', 0)
			.transition().delay(800).duration(0)
			.attr('opacity', 1)
			.transition().duration(600)
			.attr('cx', 300).attr('cy', 220)
			.transition().duration(600)
			.attr('cx', 80).attr('cy', 220)
			.transition().duration(200)
			.attr('opacity', 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(i === 5 ? 3000 : 2200);
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

		// Arrow markers
		const defs = svgEl.append('defs');

		defs.append('marker')
			.attr('id', 'arrow-signal')
			.attr('markerWidth', 10).attr('markerHeight', 7)
			.attr('refX', 9).attr('refY', 3.5)
			.attr('orient', 'auto')
			.append('polygon')
			.attr('points', '0 0, 10 3.5, 0 7')
			.attr('fill', '#fabd2f');

		defs.append('marker')
			.attr('id', 'arrow-data')
			.attr('markerWidth', 8).attr('markerHeight', 6)
			.attr('refX', 7).attr('refY', 3)
			.attr('orient', 'auto')
			.append('polygon')
			.attr('points', '0 0, 8 3, 0 6')
			.attr('fill', '#8ec07c');

		// Title
		svgEl.append('text')
			.attr('class', 'title-text')
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Description
		svgEl.append('text')
			.attr('class', 'desc-text')
			.attr('x', width / 2).attr('y', 42)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px').attr('font-style', 'italic')
			.text('');

		// ===== PHONE =====
		svgEl.append('rect')
			.attr('class', 'phone')
			.attr('x', 30).attr('y', 170)
			.attr('width', 50).attr('height', 80)
			.attr('fill', '#458588').attr('fill-opacity', 0.1)
			.attr('stroke', '#83a598').attr('stroke-width', 1.5)
			.attr('rx', 8);

		svgEl.append('text')
			.attr('x', 55).attr('y', 215)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Phone');

		// ===== CONTROL PLANE BOX =====
		svgEl.append('rect')
			.attr('x', 120).attr('y', 60)
			.attr('width', 250).attr('height', 100)
			.attr('fill', 'none')
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);

		svgEl.append('text')
			.attr('class', 'control-plane-label')
			.attr('x', 245).attr('y', 78)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('CONTROL PLANE (decisions)');

		// ===== AMF =====
		svgEl.append('rect')
			.attr('class', 'amf-box')
			.attr('x', 140).attr('y', 90)
			.attr('width', 80).attr('height', 55)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.15)
			.attr('stroke', '#fb4934').attr('stroke-width', 1.5)
			.attr('rx', 6);

		svgEl.append('text')
			.attr('x', 180).attr('y', 115)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('AMF');

		svgEl.append('text')
			.attr('x', 180).attr('y', 132)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '8px')
			.text('Access & Mobility');

		// AMF check mark
		svgEl.append('text')
			.attr('class', 'amf-check')
			.attr('x', 225).attr('y', 100)
			.attr('fill', '#8ec07c')
			.attr('font-size', '16px')
			.attr('opacity', 0)
			.text('✓');

		// ===== SMF =====
		svgEl.append('rect')
			.attr('class', 'smf-box')
			.attr('x', 270).attr('y', 90)
			.attr('width', 80).attr('height', 55)
			.attr('fill', '#fe8019').attr('fill-opacity', 0.15)
			.attr('stroke', '#fe8019').attr('stroke-width', 1.5)
			.attr('rx', 6);

		svgEl.append('text')
			.attr('x', 310).attr('y', 115)
			.attr('text-anchor', 'middle').attr('fill', '#fe8019')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('SMF');

		svgEl.append('text')
			.attr('x', 310).attr('y', 132)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '8px')
			.text('Session Mgmt');

		// ===== USER PLANE BOX =====
		svgEl.append('rect')
			.attr('x', 240).attr('y', 175)
			.attr('width', 120).attr('height', 70)
			.attr('fill', 'none')
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);

		svgEl.append('text')
			.attr('class', 'user-plane-label')
			.attr('x', 300).attr('y', 260)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('USER PLANE (data)');

		// ===== UPF =====
		svgEl.append('rect')
			.attr('class', 'upf-box')
			.attr('x', 260).attr('y', 185)
			.attr('width', 80).attr('height', 50)
			.attr('fill', '#b16286').attr('fill-opacity', 0.15)
			.attr('stroke', '#d3869b').attr('stroke-width', 1.5)
			.attr('rx', 6);

		svgEl.append('text')
			.attr('x', 300).attr('y', 210)
			.attr('text-anchor', 'middle').attr('fill', '#d3869b')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('UPF');

		svgEl.append('text')
			.attr('x', 300).attr('y', 225)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '8px')
			.text('User Plane');

		// ===== INTERNET =====
		svgEl.append('ellipse')
			.attr('class', 'internet')
			.attr('cx', 520).attr('cy', 210)
			.attr('rx', 50).attr('ry', 35)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.1)
			.attr('stroke', '#8ec07c').attr('stroke-width', 1.5);

		svgEl.append('text')
			.attr('x', 520).attr('y', 215)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Internet');

		// ===== ARROWS =====

		// Phone to AMF (diagonal up)
		svgEl.append('path')
			.attr('class', 'arrow-phone-amf')
			.attr('d', 'M 80 185 Q 110 140 140 117')
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrow-signal)')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'arrow-phone-amf')
			.attr('x', 95).attr('y', 145)
			.attr('fill', '#fabd2f')
			.attr('font-size', '8px')
			.attr('opacity', 0)
			.text('1. Request');

		// AMF to SMF
		svgEl.append('line')
			.attr('class', 'arrow-amf-smf')
			.attr('x1', 220).attr('y1', 117)
			.attr('x2', 268).attr('y2', 117)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrow-signal)')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'arrow-amf-smf')
			.attr('x', 244).attr('y', 108)
			.attr('fill', '#fabd2f')
			.attr('font-size', '8px')
			.attr('text-anchor', 'middle')
			.attr('opacity', 0)
			.text('3');

		// SMF to UPF
		svgEl.append('line')
			.attr('class', 'arrow-smf-upf')
			.attr('x1', 310).attr('y1', 145)
			.attr('x2', 310).attr('y2', 183)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrow-signal)')
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'arrow-smf-upf')
			.attr('x', 325).attr('y', 168)
			.attr('fill', '#fabd2f')
			.attr('font-size', '8px')
			.attr('opacity', 0)
			.text('4');

		// ===== DATA FLOW =====
		const dataFlowG = svgEl.append('g').attr('class', 'data-flow-group').attr('opacity', 0);

		// Phone to UPF line
		dataFlowG.append('line')
			.attr('x1', 80).attr('y1', 210)
			.attr('x2', 258).attr('y2', 210)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3)
			.attr('stroke-dasharray', '6,3');

		// UPF to Internet line
		dataFlowG.append('line')
			.attr('x1', 342).attr('y1', 210)
			.attr('x2', 468).attr('y2', 210)
			.attr('stroke', '#8ec07c').attr('stroke-width', 3)
			.attr('stroke-dasharray', '6,3');

		// Animated packets
		dataFlowG.append('circle')
			.attr('class', 'packet-1')
			.attr('r', 8)
			.attr('fill', '#fabd2f')
			.attr('opacity', 0);

		dataFlowG.append('circle')
			.attr('class', 'packet-2')
			.attr('r', 8)
			.attr('fill', '#8ec07c')
			.attr('opacity', 0);

		// Legend at bottom
		svgEl.append('rect')
			.attr('x', 120).attr('y', 295)
			.attr('width', 12).attr('height', 12)
			.attr('fill', '#fabd2f').attr('rx', 2);
		svgEl.append('text')
			.attr('x', 138).attr('y', 305)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Control signaling');

		svgEl.append('rect')
			.attr('x', 260).attr('y', 295)
			.attr('width', 12).attr('height', 12)
			.attr('fill', '#8ec07c').attr('rx', 2);
		svgEl.append('text')
			.attr('x', 278).attr('y', 305)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('User data');

		svgEl.append('circle')
			.attr('cx', 406).attr('cy', 301)
			.attr('r', 6)
			.attr('fill', '#d3869b');
		svgEl.append('text')
			.attr('x', 418).attr('y', 305)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('UPF (forwards data)');

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
