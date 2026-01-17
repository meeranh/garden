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
	let phase = 0;

	const maxStep = 4;
	const width = 540;
	const height = 320;

	const bits = ['1', '0', '1', '1', '0', '0', '1', '1'];
	const subcarrierColors = ['#fb4934', '#b8bb26', '#83a598', '#d3869b'];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show bit stream
		// Step 1: Show serial approach
		// Step 2: Show problem with serial (interference)
		// Step 3: Show parallel approach
		// Step 4: Highlight advantage

		svgEl.select('.bit-stream')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.serial-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.interference-indicator')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.parallel-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		svgEl.select('.advantage-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		const messages = [
			'We need to send 8 bits of data',
			'Serial: Send one bit at a time on ONE frequency',
			'Problem: Short bit duration = reflections cause interference',
			'Parallel: Send 2 bits at a time on FOUR frequencies',
			'Each bit gets 4× more time = resistant to reflections!'
		];
		svgEl.select('.message').text(messages[step]);
	}

	function animate() {
		phase += 0.05;

		// Animate serial bits moving
		if (currentStep >= 1) {
			svgEl.selectAll('.serial-bit').each(function(_, i) {
				const bit = d3.select(this);
				const baseX = 85 + i * 32;
				const offset = (Math.sin(phase * 2 + i * 0.5) * 2);
				bit.attr('transform', `translate(${offset}, 0)`);
			});
		}

		// Animate parallel subcarrier waves
		if (currentStep >= 3) {
			svgEl.selectAll('.subcarrier-wave').each(function(_, i) {
				const path = d3.select(this);
				const baseY = 215 + i * 25;
				let d = 'M 85 ' + baseY;
				for (let x = 0; x <= 160; x += 3) {
					const y = baseY + Math.sin((x / 12) + phase * 2 + i * 1.5) * 6;
					d += ` L ${85 + x} ${y}`;
				}
				path.attr('d', d);
			});
		}

		animationId = requestAnimationFrame(animate);
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
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Serial vs Parallel Transmission');

		// Bit stream display
		const bitStreamGroup = svgEl.append('g').attr('class', 'bit-stream').attr('opacity', 0);

		bitStreamGroup.append('text')
			.attr('x', 20)
			.attr('y', 55)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Data:');

		bits.forEach((bit, i) => {
			bitStreamGroup.append('rect')
				.attr('x', 60 + i * 28)
				.attr('y', 40)
				.attr('width', 24)
				.attr('height', 24)
				.attr('fill', colors.border)
				.attr('rx', 3);

			bitStreamGroup.append('text')
				.attr('x', 72 + i * 28)
				.attr('y', 57)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '12px')
				.attr('font-weight', 'bold')
				.text(bit);
		});

		// Serial transmission section
		const serialGroup = svgEl.append('g').attr('class', 'serial-group').attr('opacity', 0);

		serialGroup.append('text')
			.attr('x', 20)
			.attr('y', 95)
			.attr('fill', colors.accent)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Serial (1 frequency):');

		// Serial timeline
		serialGroup.append('line')
			.attr('x1', 80)
			.attr('x2', 345)
			.attr('y1', 115)
			.attr('y2', 115)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1);

		serialGroup.append('text')
			.attr('x', 355)
			.attr('y', 118)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Time →');

		// Serial bits (narrow)
		bits.forEach((bit, i) => {
			const g = serialGroup.append('g').attr('class', 'serial-bit');

			g.append('rect')
				.attr('x', 85 + i * 32)
				.attr('y', 100)
				.attr('width', 28)
				.attr('height', 30)
				.attr('fill', colors.accent)
				.attr('rx', 2);

			g.append('text')
				.attr('x', 99 + i * 32)
				.attr('y', 120)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '11px')
				.attr('font-weight', 'bold')
				.text(bit);
		});

		serialGroup.append('text')
			.attr('x', 400)
			.attr('y', 115)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Short duration');

		// Interference indicator
		const interferenceGroup = svgEl.append('g').attr('class', 'interference-indicator').attr('opacity', 0);

		interferenceGroup.append('path')
			.attr('d', 'M 115 135 Q 125 150, 140 135')
			.attr('fill', 'none')
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2);

		interferenceGroup.append('text')
			.attr('x', 127)
			.attr('y', 165)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.text('Overlap!');

		interferenceGroup.append('text')
			.attr('x', 320)
			.attr('y', 150)
			.attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('❌ Reflections cause ISI');

		// Parallel transmission section
		const parallelGroup = svgEl.append('g').attr('class', 'parallel-group').attr('opacity', 0);

		parallelGroup.append('text')
			.attr('x', 20)
			.attr('y', 200)
			.attr('fill', colors.yellow)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Parallel (4 frequencies):');

		// Four subcarriers with bits
		for (let i = 0; i < 4; i++) {
			const y = 215 + i * 25;

			// Frequency label
			parallelGroup.append('text')
				.attr('x', 55)
				.attr('y', y + 4)
				.attr('text-anchor', 'end')
				.attr('fill', subcarrierColors[i])
				.attr('font-size', '9px')
				.text(`f${i + 1}`);

			// Subcarrier wave
			parallelGroup.append('path')
				.attr('class', 'subcarrier-wave')
				.attr('fill', 'none')
				.attr('stroke', subcarrierColors[i])
				.attr('stroke-width', 2)
				.attr('opacity', 0.7);

			// Bits on this subcarrier (2 bits each, wider)
			for (let j = 0; j < 2; j++) {
				const bitIndex = i * 2 + j;
				const x = 270 + j * 70;

				parallelGroup.append('rect')
					.attr('x', x)
					.attr('y', y - 10)
					.attr('width', 60)
					.attr('height', 20)
					.attr('fill', subcarrierColors[i])
					.attr('rx', 3);

				parallelGroup.append('text')
					.attr('x', x + 30)
					.attr('y', y + 5)
					.attr('text-anchor', 'middle')
					.attr('fill', colors.bg)
					.attr('font-size', '10px')
					.attr('font-weight', 'bold')
					.text(bits[bitIndex]);
			}
		}

		parallelGroup.append('text')
			.attr('x', 480)
			.attr('y', 250)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Longer');

		parallelGroup.append('text')
			.attr('x', 480)
			.attr('y', 262)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('duration');

		// Advantage label
		svgEl.append('text')
			.attr('class', 'advantage-label')
			.attr('x', 350)
			.attr('y', 200)
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('✓ Same data rate, no ISI!')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('We need to send 8 bits of data');

		// Start animation
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
