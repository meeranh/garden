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
	const width = 520;
	const height = 300;

	// Channel colors
	const channelColors = ['#fb4934', '#b8bb26', '#83a598', '#d3869b'];
	const userLabels = ['User 1', 'User 2', 'User 3', 'User 4'];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show empty spectrum
		// Step 1: Divide into channels
		// Step 2: Show guard bands
		// Step 3: Assign users
		// Step 4: Show simultaneous transmission

		svgEl.select('.spectrum-block')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.selectAll('.channel')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.selectAll('.guard-band')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.guard-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.selectAll('.user-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		svgEl.selectAll('.signal-wave')
			.transition()
			.duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		svgEl.select('.simultaneous-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		const messages = [
			'Total available frequency spectrum',
			'Divide spectrum into separate channels',
			'Guard bands prevent interference',
			'Each user gets one channel',
			'All users transmit simultaneously!'
		];
		svgEl.select('.message').text(messages[step]);
	}

	function animateSignals() {
		phase += 0.1;

		if (currentStep >= 4) {
			// Animate signal waves for each user
			svgEl.selectAll('.signal-path').each(function(_, i) {
				const path = d3.select(this);
				const baseY = 85 + i * 50;
				let d = `M 85 ${baseY}`;
				for (let x = 0; x <= 60; x += 2) {
					const y = baseY + Math.sin((x / 8) + phase + i) * 6;
					d += ` L ${85 + x} ${y}`;
				}
				path.attr('d', d);
			});
		}

		animationId = requestAnimationFrame(animateSignals);
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
			.text('FDMA: Frequency Division Multiple Access');

		// Frequency axis
		const spectrumX = 160;
		const spectrumWidth = 180;
		const spectrumTop = 55;
		const spectrumHeight = 200;
		const channelHeight = 40;
		const guardHeight = 8;

		// Spectrum background (empty)
		svgEl.append('rect')
			.attr('class', 'spectrum-block')
			.attr('x', spectrumX)
			.attr('y', spectrumTop)
			.attr('width', spectrumWidth)
			.attr('height', spectrumHeight)
			.attr('fill', colors.border)
			.attr('opacity', 0.3)
			.attr('rx', 4);

		// Frequency label (above spectrum)
		svgEl.append('text')
			.attr('x', spectrumX + spectrumWidth / 2)
			.attr('y', spectrumTop - 8)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Frequency ↓');

		// Create channels
		const channelStartY = spectrumTop + 10;
		for (let i = 0; i < 4; i++) {
			const y = channelStartY + i * (channelHeight + guardHeight);

			// Channel block
			svgEl.append('rect')
				.attr('class', 'channel')
				.attr('x', spectrumX + 5)
				.attr('y', y)
				.attr('width', spectrumWidth - 10)
				.attr('height', channelHeight)
				.attr('fill', channelColors[i])
				.attr('rx', 3)
				.attr('opacity', 0);

			// Channel label
			svgEl.append('text')
				.attr('class', 'channel')
				.attr('x', spectrumX + spectrumWidth / 2)
				.attr('y', y + channelHeight / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '11px')
				.attr('font-weight', 'bold')
				.text(`Channel ${i + 1}`)
				.attr('opacity', 0);

			// Guard band (between channels, not after last)
			if (i < 3) {
				svgEl.append('rect')
					.attr('class', 'guard-band')
					.attr('x', spectrumX + 5)
					.attr('y', y + channelHeight)
					.attr('width', spectrumWidth - 10)
					.attr('height', guardHeight)
					.attr('fill', colors.bg)
					.attr('stroke', colors.fgMuted)
					.attr('stroke-width', 1)
					.attr('stroke-dasharray', '3,2')
					.attr('opacity', 0);
			}
		}

		// Guard band label
		svgEl.append('text')
			.attr('class', 'guard-label')
			.attr('x', spectrumX - 10)
			.attr('y', channelStartY + channelHeight + guardHeight / 2 + 3)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Guard')
			.attr('opacity', 0);

		// User icons and connections
		const userX = 50;
		for (let i = 0; i < 4; i++) {
			const y = channelStartY + i * (channelHeight + guardHeight) + channelHeight / 2;
			const userGroup = svgEl.append('g')
				.attr('class', 'user-group')
				.attr('opacity', 0);

			// Phone icon
			userGroup.append('rect')
				.attr('x', userX - 12)
				.attr('y', y - 18)
				.attr('width', 24)
				.attr('height', 36)
				.attr('fill', channelColors[i])
				.attr('rx', 4);

			userGroup.append('rect')
				.attr('x', userX - 8)
				.attr('y', y - 12)
				.attr('width', 16)
				.attr('height', 22)
				.attr('fill', colors.bg)
				.attr('rx', 2);

			// User label (to the left of phone)
			userGroup.append('text')
				.attr('x', userX - 20)
				.attr('y', y + 4)
				.attr('text-anchor', 'end')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(userLabels[i]);

			// Connection line to channel
			userGroup.append('line')
				.attr('x1', userX + 15)
				.attr('y1', y)
				.attr('x2', spectrumX)
				.attr('y2', y)
				.attr('stroke', channelColors[i])
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '4,2');

			// Signal wave (animated)
			const signalGroup = svgEl.append('g')
				.attr('class', 'signal-wave')
				.attr('opacity', 0);

			signalGroup.append('path')
				.attr('class', 'signal-path')
				.attr('fill', 'none')
				.attr('stroke', channelColors[i])
				.attr('stroke-width', 2);
		}

		// Tower on right side
		const towerX = 420;
		const towerY = spectrumTop + spectrumHeight / 2;

		// Connection from spectrum to tower
		svgEl.append('line')
			.attr('class', 'user-group')
			.attr('x1', spectrumX + spectrumWidth)
			.attr('y1', towerY)
			.attr('x2', towerX - 25)
			.attr('y2', towerY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('opacity', 0);

		// Tower mast
		svgEl.append('rect')
			.attr('class', 'user-group')
			.attr('x', towerX - 3)
			.attr('y', towerY - 50)
			.attr('width', 6)
			.attr('height', 100)
			.attr('fill', colors.border)
			.attr('opacity', 0);

		// Tower antenna
		svgEl.append('circle')
			.attr('class', 'user-group')
			.attr('cx', towerX)
			.attr('cy', towerY - 55)
			.attr('r', 5)
			.attr('fill', colors.fgMuted)
			.attr('opacity', 0);

		// Antenna bars
		[-40, -20, 0].forEach((yOffset) => {
			svgEl.append('line')
				.attr('class', 'user-group')
				.attr('x1', towerX - 18)
				.attr('x2', towerX + 18)
				.attr('y1', towerY + yOffset)
				.attr('y2', towerY + yOffset)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 3)
				.attr('stroke-linecap', 'round')
				.attr('opacity', 0);
		});

		svgEl.append('text')
			.attr('class', 'user-group')
			.attr('x', towerX)
			.attr('y', towerY + 65)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Tower')
			.attr('opacity', 0);

		// Simultaneous label
		svgEl.append('text')
			.attr('class', 'simultaneous-label')
			.attr('x', 75)
			.attr('y', spectrumTop + spectrumHeight + 25)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('All at once!')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Total available frequency spectrum');

		// Start animation loop
		animateSignals();

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
