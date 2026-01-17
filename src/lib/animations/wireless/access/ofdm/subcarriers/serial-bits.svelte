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
	let animationId: number;
	let transmitIndex = 0;
	let lastTransmit = 0;

	const maxStep = 2;
	const width = 520;
	const height = 200;

	const bits = ['1', '0', '1', '1', '0', '0', '1', '1', '1', '0', '1', '0'];
	const bitWidth = 32;
	const bitHeight = 36;
	const startX = 40;
	const bitY = 80;

	let bitElements: SVGGElement[] = [];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.timeline-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.bits-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.timing-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		if (step === 1) {
			transmitIndex = 0;
		}

		const messages = [
			'',
			'',
			''
		];
		svgEl.select('.message').text(messages[step]);
	}

	function animate() {
		const now = Date.now();

		// Animate bit transmission
		if (currentStep >= 1 && now - lastTransmit > 150) {
			lastTransmit = now;
			transmitIndex = (transmitIndex + 1) % bits.length;

			// Highlight current bit
			bitElements.forEach((el, i) => {
				const isActive = i === transmitIndex;
				d3.select(el).select('rect')
					.attr('stroke', isActive ? '#fabd2f' : 'none')
					.attr('stroke-width', isActive ? 3 : 0);
			});

			// Update transmit indicator position
			const indicatorX = startX + transmitIndex * bitWidth + bitWidth / 2;
			svgEl.select('.transmit-indicator')
				.attr('cx', indicatorX)
				.attr('opacity', 1);
		}

		animationId = requestAnimationFrame(animate);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1500);
			if (!isPlaying) return;
		}
		isPlaying = false;
	}

	function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
	function pause() { isPlaying = false; clearTimeouts(); }
	function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
	function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
	function skip() { pause(); applyStep(maxStep); }
	function replay() { pause(); currentStep = 0; transmitIndex = 0; applyStep(0); isPlaying = true; runAnimation(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			accent: s.getPropertyValue('--color-accent').trim(),
			yellow: s.getPropertyValue('--color-math').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('Serial Transmission: One Frequency');

		// Timeline group
		const timelineGroup = svgEl.append('g').attr('class', 'timeline-group').attr('opacity', 0);

		// Frequency label
		timelineGroup.append('text')
			.attr('x', 15)
			.attr('y', bitY + bitHeight / 2 + 4)
			.attr('fill', colors.accent)
			.attr('font-size', '10px')
			.text('f₁');

		// Timeline bar
		timelineGroup.append('rect')
			.attr('x', startX - 5)
			.attr('y', bitY - 5)
			.attr('width', bits.length * bitWidth + 10)
			.attr('height', bitHeight + 10)
			.attr('fill', colors.border)
			.attr('opacity', 0.3)
			.attr('rx', 4);

		// Time arrow
		timelineGroup.append('line')
			.attr('x1', startX)
			.attr('x2', startX + bits.length * bitWidth + 30)
			.attr('y1', bitY + bitHeight + 25)
			.attr('y2', bitY + bitHeight + 25)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('marker-end', 'url(#arrow)');

		timelineGroup.append('text')
			.attr('x', startX + bits.length * bitWidth + 35)
			.attr('y', bitY + bitHeight + 29)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Time');

		// Arrow marker
		svgEl.append('defs').append('marker')
			.attr('id', 'arrow')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', colors.fgMuted);

		// Bits group
		const bitsGroup = svgEl.append('g').attr('class', 'bits-group').attr('opacity', 0);

		bits.forEach((bit, i) => {
			const x = startX + i * bitWidth;
			const g = bitsGroup.append('g');

			g.append('rect')
				.attr('x', x)
				.attr('y', bitY)
				.attr('width', bitWidth - 2)
				.attr('height', bitHeight)
				.attr('fill', colors.accent)
				.attr('rx', 3);

			g.append('text')
				.attr('x', x + bitWidth / 2 - 1)
				.attr('y', bitY + bitHeight / 2 + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '13px')
				.attr('font-weight', 'bold')
				.text(bit);

			bitElements.push(g.node() as SVGGElement);
		});

		// Transmit indicator
		bitsGroup.append('circle')
			.attr('class', 'transmit-indicator')
			.attr('cx', startX + bitWidth / 2)
			.attr('cy', bitY - 12)
			.attr('r', 5)
			.attr('fill', '#fabd2f')
			.attr('opacity', 0);

		// Timing label
		svgEl.append('text')
			.attr('class', 'timing-label')
			.attr('x', startX + (bits.length * bitWidth) / 2)
			.attr('y', bitY + bitHeight + 48)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.text('↑ Very short time per bit = vulnerable to reflections')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('');

		animate();
		applyStep(0);
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => {
		clearTimeouts();
		if (animationId) cancelAnimationFrame(animationId);
	});
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
