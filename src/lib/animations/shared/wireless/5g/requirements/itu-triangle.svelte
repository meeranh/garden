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
	const width = 650;
	const height = 380;

	const titles = [
		'The 5G Triangle: Three Pillars',
		'eMBB: Enhanced Mobile Broadband',
		'URLLC: Ultra-Reliable Low-Latency',
		'mMTC: Massive Machine-Type Communications',
		'5G supports all three simultaneously!'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Triangle always visible after step 0
		svgEl.select('.triangle').transition().duration(400).attr('opacity', 1);

		// eMBB (top)
		svgEl.select('.embb-node').transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0.3);
		svgEl.select('.embb-highlight').transition().duration(400)
			.attr('opacity', step === 1 ? 1 : 0);
		svgEl.select('.embb-details').transition().duration(400)
			.attr('opacity', step === 1 ? 1 : 0);

		// URLLC (bottom left)
		svgEl.select('.urllc-node').transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0.3);
		svgEl.select('.urllc-highlight').transition().duration(400)
			.attr('opacity', step === 2 ? 1 : 0);
		svgEl.select('.urllc-details').transition().duration(400)
			.attr('opacity', step === 2 ? 1 : 0);

		// mMTC (bottom right)
		svgEl.select('.mmtc-node').transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0.3);
		svgEl.select('.mmtc-highlight').transition().duration(400)
			.attr('opacity', step === 3 ? 1 : 0);
		svgEl.select('.mmtc-details').transition().duration(400)
			.attr('opacity', step === 3 ? 1 : 0);

		// Final - all lit up
		svgEl.select('.center-5g').transition().duration(400)
			.attr('opacity', step === 4 ? 1 : 0.5);
		svgEl.select('.final-glow').transition().duration(400)
			.attr('opacity', step === 4 ? 0.3 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2800);
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
			.attr('x', width / 2).attr('y', 28)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Triangle coordinates
		const cx = width / 2;
		const cy = 200;
		const triRadius = 120;

		const topX = cx;
		const topY = cy - triRadius;
		const bottomLeftX = cx - triRadius * Math.cos(Math.PI / 6);
		const bottomLeftY = cy + triRadius * Math.sin(Math.PI / 6);
		const bottomRightX = cx + triRadius * Math.cos(Math.PI / 6);
		const bottomRightY = cy + triRadius * Math.sin(Math.PI / 6);

		// Triangle group
		const triangle = svgEl.append('g').attr('class', 'triangle');

		// Triangle lines
		triangle.append('path')
			.attr('d', `M${topX},${topY} L${bottomLeftX},${bottomLeftY} L${bottomRightX},${bottomRightY} Z`)
			.attr('fill', 'none')
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4');

		// Center glow (for final step)
		svgEl.append('circle')
			.attr('class', 'final-glow')
			.attr('cx', cx).attr('cy', cy)
			.attr('r', 80)
			.attr('fill', '#8ec07c')
			.attr('opacity', 0);

		// Center 5G label
		const center5g = svgEl.append('g').attr('class', 'center-5g').attr('opacity', 0.5);
		center5g.append('text')
			.attr('x', cx).attr('y', cy + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '20px')
			.attr('font-weight', 'bold')
			.text('5G');

		// ===== eMBB (Top) =====
		const embbNode = svgEl.append('g').attr('class', 'embb-node').attr('opacity', 0.3);

		embbNode.append('circle')
			.attr('cx', topX).attr('cy', topY)
			.attr('r', 35)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.2)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2);

		embbNode.append('text')
			.attr('x', topX).attr('y', topY + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('eMBB');

		// eMBB highlight
		svgEl.append('circle')
			.attr('class', 'embb-highlight')
			.attr('cx', topX).attr('cy', topY)
			.attr('r', 42)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// eMBB details box
		const embbDetails = svgEl.append('g').attr('class', 'embb-details').attr('opacity', 0);
		embbDetails.append('rect')
			.attr('x', topX + 50).attr('y', topY - 45)
			.attr('width', 160).attr('height', 70)
			.attr('fill', colors.bg)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('rx', 6);
		embbDetails.append('text')
			.attr('x', topX + 130).attr('y', topY - 22)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Enhanced Broadband');
		embbDetails.append('text')
			.attr('x', topX + 130).attr('y', topY - 3)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('Peak: 20 Gbps');
		embbDetails.append('text')
			.attr('x', topX + 130).attr('y', topY + 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('VR, 4K streaming, stadiums');

		// ===== URLLC (Bottom Left) =====
		const urllcNode = svgEl.append('g').attr('class', 'urllc-node').attr('opacity', 0.3);

		urllcNode.append('circle')
			.attr('cx', bottomLeftX).attr('cy', bottomLeftY)
			.attr('r', 35)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.2)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2);

		urllcNode.append('text')
			.attr('x', bottomLeftX).attr('y', bottomLeftY + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('URLLC');

		// URLLC highlight
		svgEl.append('circle')
			.attr('class', 'urllc-highlight')
			.attr('cx', bottomLeftX).attr('cy', bottomLeftY)
			.attr('r', 42)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// URLLC details box
		const urllcDetails = svgEl.append('g').attr('class', 'urllc-details').attr('opacity', 0);
		urllcDetails.append('rect')
			.attr('x', bottomLeftX - 205).attr('y', bottomLeftY - 25)
			.attr('width', 145).attr('height', 70)
			.attr('fill', colors.bg)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('rx', 6);
		urllcDetails.append('text')
			.attr('x', bottomLeftX - 132).attr('y', bottomLeftY - 2)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Ultra-Reliable');
		urllcDetails.append('text')
			.attr('x', bottomLeftX - 132).attr('y', bottomLeftY + 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('Latency: 1 ms');
		urllcDetails.append('text')
			.attr('x', bottomLeftX - 132).attr('y', bottomLeftY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Surgery, autonomous cars');

		// ===== mMTC (Bottom Right) =====
		const mmtcNode = svgEl.append('g').attr('class', 'mmtc-node').attr('opacity', 0.3);

		mmtcNode.append('circle')
			.attr('cx', bottomRightX).attr('cy', bottomRightY)
			.attr('r', 35)
			.attr('fill', '#83a598').attr('fill-opacity', 0.2)
			.attr('stroke', '#83a598').attr('stroke-width', 2);

		mmtcNode.append('text')
			.attr('x', bottomRightX).attr('y', bottomRightY + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('mMTC');

		// mMTC highlight
		svgEl.append('circle')
			.attr('class', 'mmtc-highlight')
			.attr('cx', bottomRightX).attr('cy', bottomRightY)
			.attr('r', 42)
			.attr('fill', 'none')
			.attr('stroke', '#83a598')
			.attr('stroke-width', 3)
			.attr('opacity', 0);

		// mMTC details box
		const mmtcDetails = svgEl.append('g').attr('class', 'mmtc-details').attr('opacity', 0);
		mmtcDetails.append('rect')
			.attr('x', bottomRightX + 55).attr('y', bottomRightY - 25)
			.attr('width', 155).attr('height', 70)
			.attr('fill', colors.bg)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2)
			.attr('rx', 6);
		mmtcDetails.append('text')
			.attr('x', bottomRightX + 133).attr('y', bottomRightY - 2)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Massive IoT');
		mmtcDetails.append('text')
			.attr('x', bottomRightX + 133).attr('y', bottomRightY + 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('1M devices/km²');
		mmtcDetails.append('text')
			.attr('x', bottomRightX + 133).attr('y', bottomRightY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Sensors, smart meters');

		// Bottom summary
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Fast (eMBB) • Instant (URLLC) • Everywhere (mMTC)');

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
