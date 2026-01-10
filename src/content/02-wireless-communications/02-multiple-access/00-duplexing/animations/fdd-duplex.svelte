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

	const maxStep = 3;
	const width = 500;
	const height = 260;

	const phoneX = 60;
	const towerX = 440;
	const waveStartX = phoneX + 30;
	const waveEndX = towerX - 35;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function generateMovingWave(y: number, amplitude: number, frequency: number, phaseOffset: number, direction: number): string {
		let path = '';
		const points = 100;
		for (let i = 0; i <= points; i++) {
			const x = waveStartX + (i / points) * (waveEndX - waveStartX);
			const py = y + Math.sin((i / points) * Math.PI * 2 * frequency + phaseOffset * direction) * amplitude;
			path += (i === 0 ? 'M' : 'L') + ` ${x} ${py}`;
		}
		return path;
	}

	function getWaveY(baseY: number, amplitude: number, frequency: number, xNormalized: number, phaseOffset: number, direction: number): number {
		return baseY + Math.sin(xNormalized * Math.PI * 2 * frequency + phaseOffset * direction) * amplitude;
	}

	function animateWaves() {
		phase += 0.08;

		if (currentStep >= 1) {
			svgEl.select('.uplink-wave-path')
				.attr('d', generateMovingWave(95, 12, 8, phase, 1));

			// Animate uplink packets (left to right)
			svgEl.selectAll('.uplink-packet').each(function(_, i) {
				const packet = d3.select(this);
				const t = ((phase * 0.3 + i * 0.33) % 1);
				const x = waveStartX + t * (waveEndX - waveStartX);
				const y = getWaveY(95, 12, 8, t, phase, 1);
				packet.attr('cx', x).attr('cy', y);
			});
		}

		if (currentStep >= 2) {
			svgEl.select('.downlink-wave-path')
				.attr('d', generateMovingWave(165, 14, 5, phase, -1));

			// Animate downlink packets (right to left)
			svgEl.selectAll('.downlink-packet').each(function(_, i) {
				const packet = d3.select(this);
				const t = ((phase * 0.3 + i * 0.33) % 1);
				const x = waveEndX - t * (waveEndX - waveStartX);
				const y = getWaveY(165, 14, 5, 1 - t, phase, -1);
				packet.attr('cx', x).attr('cy', y);
			});
		}

		animationId = requestAnimationFrame(animateWaves);
	}

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.uplink-wave')
			.transition()
			.duration(500)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.uplink-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.downlink-wave')
			.transition()
			.duration(500)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.downlink-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.simultaneous-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		const messages = [
			'FDD uses two separate frequencies',
			'Uplink: phone → tower (frequency f₁)',
			'Downlink: tower → phone (frequency f₂)',
			'Both waves travel SIMULTANEOUSLY!'
		];
		svgEl.select('.message').text(messages[step]);
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
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('FDD: Two Frequencies, Simultaneous');

		// Phone icon
		const phoneY = 130;
		svgEl.append('rect')
			.attr('x', phoneX - 18)
			.attr('y', phoneY - 30)
			.attr('width', 36)
			.attr('height', 60)
			.attr('fill', colors.border)
			.attr('rx', 6);
		svgEl.append('rect')
			.attr('x', phoneX - 12)
			.attr('y', phoneY - 22)
			.attr('width', 24)
			.attr('height', 35)
			.attr('fill', colors.bg)
			.attr('rx', 2);
		svgEl.append('text')
			.attr('x', phoneX)
			.attr('y', phoneY + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Phone');

		// Tower icon (cell tower with mast and antennas)
		const towerY = 130;
		// Main mast
		svgEl.append('rect')
			.attr('x', towerX - 3)
			.attr('y', towerY - 40)
			.attr('width', 6)
			.attr('height', 70)
			.attr('fill', colors.border);
		// Top antenna
		svgEl.append('circle')
			.attr('cx', towerX)
			.attr('cy', towerY - 45)
			.attr('r', 5)
			.attr('fill', colors.fgMuted);
		// Antenna panels (3 horizontal bars)
		[-30, -15, 0].forEach((yOffset) => {
			svgEl.append('line')
				.attr('x1', towerX - 18)
				.attr('x2', towerX + 18)
				.attr('y1', towerY + yOffset)
				.attr('y2', towerY + yOffset)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 3)
				.attr('stroke-linecap', 'round');
		});
		svgEl.append('text')
			.attr('x', towerX)
			.attr('y', towerY + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Tower');

		// Uplink wave group
		const uplinkGroup = svgEl.append('g').attr('class', 'uplink-wave').attr('opacity', 0);

		uplinkGroup.append('path')
			.attr('class', 'uplink-wave-path')
			.attr('d', generateMovingWave(95, 12, 8, 0, 1))
			.attr('fill', 'none')
			.attr('stroke', colors.accent)
			.attr('stroke-width', 2)
			.attr('opacity', 0.6);

		// Uplink energy packets (3 dots traveling along the wave)
		for (let i = 0; i < 3; i++) {
			uplinkGroup.append('circle')
				.attr('class', 'uplink-packet')
				.attr('r', 5)
				.attr('fill', colors.accent)
				.attr('cx', waveStartX)
				.attr('cy', 95);
		}

		// Uplink label
		svgEl.append('text')
			.attr('class', 'uplink-label')
			.attr('x', 250)
			.attr('y', 60)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.accent)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Uplink (f₁)')
			.attr('opacity', 0);

		// Downlink wave group
		const downlinkGroup = svgEl.append('g').attr('class', 'downlink-wave').attr('opacity', 0);

		downlinkGroup.append('path')
			.attr('class', 'downlink-wave-path')
			.attr('d', generateMovingWave(165, 14, 5, 0, -1))
			.attr('fill', 'none')
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 2)
			.attr('opacity', 0.6);

		// Downlink energy packets (3 dots traveling along the wave)
		for (let i = 0; i < 3; i++) {
			downlinkGroup.append('circle')
				.attr('class', 'downlink-packet')
				.attr('r', 5)
				.attr('fill', colors.yellow)
				.attr('cx', waveEndX)
				.attr('cy', 165);
		}

		// Downlink label
		svgEl.append('text')
			.attr('class', 'downlink-label')
			.attr('x', 250)
			.attr('y', 210)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Downlink (f₂)')
			.attr('opacity', 0);

		// Simultaneous label
		svgEl.append('text')
			.attr('class', 'simultaneous-label')
			.attr('x', 250)
			.attr('y', 130)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('⚡ SIMULTANEOUS ⚡')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('FDD uses two separate frequencies');

		// Start wave animation loop
		animateWaves();

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
