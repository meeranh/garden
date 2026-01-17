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
	const width = 420;
	const height = 160;

	const senderX = 60;
	const receiverX = 360;
	const centerY = 80;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show sender and receiver
		// Step 1: Send data
		// Step 2: Receiver checks (error found)
		// Step 3: NACK sent back
		// Step 4: Retransmit
		// Step 5: ACK sent back

		svgEl.select('.base-group').attr('opacity', 1);
		svgEl.select('.data-arrow-1').attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.error-indicator').attr('opacity', step >= 2 && step < 4 ? 1 : 0);
		svgEl.select('.nack-arrow').attr('opacity', step >= 3 && step < 4 ? 1 : 0);
		svgEl.select('.data-arrow-2').attr('opacity', step >= 4 ? 1 : 0);
		svgEl.select('.success-indicator').attr('opacity', step >= 5 ? 1 : 0);
		svgEl.select('.ack-arrow').attr('opacity', step >= 5 ? 1 : 0);

		svgEl.select('.status-text')
			.text(
				step === 0 ? 'Ready to send' :
				step === 1 ? 'Sending data...' :
				step === 2 ? 'Error detected!' :
				step === 3 ? 'Requesting retransmission...' :
				step === 4 ? 'Retransmitting...' :
				'Success!'
			)
			.attr('fill',
				step === 2 || step === 3 ? '#fb4934' :
				step === 5 ? '#8ec07c' :
				colors.fgMuted
			);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1200);
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
			.attr('id', 'arqArrowBlue')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5).attr('refY', 5)
			.attr('markerWidth', 5).attr('markerHeight', 5)
			.attr('orient', 'auto')
			.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', '#83a598');

		defs.append('marker')
			.attr('id', 'arqArrowRed')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5).attr('refY', 5)
			.attr('markerWidth', 5).attr('markerHeight', 5)
			.attr('orient', 'auto')
			.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', '#fb4934');

		defs.append('marker')
			.attr('id', 'arqArrowGreen')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5).attr('refY', 5)
			.attr('markerWidth', 5).attr('markerHeight', 5)
			.attr('orient', 'auto')
			.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', '#8ec07c');

		// Base group
		const baseGroup = svgEl.append('g').attr('class', 'base-group');

		// Sender
		baseGroup.append('rect')
			.attr('x', senderX - 30).attr('y', centerY - 25)
			.attr('width', 60).attr('height', 50)
			.attr('fill', '#458588').attr('rx', 5);
		baseGroup.append('text')
			.attr('x', senderX).attr('y', centerY + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Sender');

		// Receiver
		baseGroup.append('rect')
			.attr('x', receiverX - 30).attr('y', centerY - 25)
			.attr('width', 60).attr('height', 50)
			.attr('fill', '#689d6a').attr('rx', 5);
		baseGroup.append('text')
			.attr('x', receiverX).attr('y', centerY + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Receiver');

		// Status text
		baseGroup.append('text')
			.attr('class', 'status-text')
			.attr('x', width / 2).attr('y', height - 15)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('Ready to send');

		// Data arrow 1 (first transmission)
		svgEl.append('g').attr('class', 'data-arrow-1').attr('opacity', 0)
			.append('line')
			.attr('x1', senderX + 35).attr('x2', receiverX - 35)
			.attr('y1', centerY - 10).attr('y2', centerY - 10)
			.attr('stroke', '#83a598').attr('stroke-width', 3)
			.attr('marker-end', 'url(#arqArrowBlue)');

		svgEl.select('.data-arrow-1').append('text')
			.attr('x', width / 2).attr('y', centerY - 18)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '10px').text('Data');

		// Error indicator
		svgEl.append('g').attr('class', 'error-indicator').attr('opacity', 0)
			.append('text')
			.attr('x', receiverX).attr('y', centerY + 45)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('✗ Error!');

		// NACK arrow
		svgEl.append('g').attr('class', 'nack-arrow').attr('opacity', 0)
			.append('line')
			.attr('x1', receiverX - 35).attr('x2', senderX + 35)
			.attr('y1', centerY + 10).attr('y2', centerY + 10)
			.attr('stroke', '#fb4934').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('marker-end', 'url(#arqArrowRed)');

		svgEl.select('.nack-arrow').append('text')
			.attr('x', width / 2).attr('y', centerY + 25)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px').text('NACK');

		// Data arrow 2 (retransmission)
		svgEl.append('g').attr('class', 'data-arrow-2').attr('opacity', 0)
			.append('line')
			.attr('x1', senderX + 35).attr('x2', receiverX - 35)
			.attr('y1', centerY - 10).attr('y2', centerY - 10)
			.attr('stroke', '#fabd2f').attr('stroke-width', 3)
			.attr('marker-end', 'url(#arqArrowBlue)');

		svgEl.select('.data-arrow-2').append('text')
			.attr('x', width / 2).attr('y', centerY - 18)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px').text('Retransmit');

		// Success indicator
		svgEl.append('g').attr('class', 'success-indicator').attr('opacity', 0)
			.append('text')
			.attr('x', receiverX).attr('y', centerY + 45)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('✓ OK!');

		// ACK arrow
		svgEl.append('g').attr('class', 'ack-arrow').attr('opacity', 0)
			.append('line')
			.attr('x1', receiverX - 35).attr('x2', senderX + 35)
			.attr('y1', centerY + 10).attr('y2', centerY + 10)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('marker-end', 'url(#arqArrowGreen)');

		svgEl.select('.ack-arrow').append('text')
			.attr('x', width / 2).attr('y', centerY + 25)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').text('ACK');

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
