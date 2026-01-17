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

	// Loop state machine for smooth infinite cycling
	const LOOP_UPLINK = 0;
	const LOOP_SWITCH_TO_DOWN = 1;
	const LOOP_DOWNLINK = 2;
	const LOOP_SWITCH_TO_UP = 3;
	let loopState = LOOP_UPLINK;
	let loopPhaseStart = 0;

	// Timing (in phase units, ~0.08 per frame at 60fps)
	const WAVE_DURATION = 5;     // How long each wave shows (~1s)
	const SWITCH_DURATION = 3;   // How long SWITCHING label shows (~0.6s)

	const maxStep = 4;
	const width = 500;
	const height = 280;

	const phoneX = 60;
	const towerX = 440;
	const waveStartX = phoneX + 30;
	const waveEndX = towerX - 35;
	const waveY = 100;

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

		// Smooth infinite loop after step 4 (when timeline appears)
		if (currentStep >= 4) {
			const elapsed = phase - loopPhaseStart;

			switch (loopState) {
				case LOOP_UPLINK:
					if (elapsed > WAVE_DURATION) {
						loopState = LOOP_SWITCH_TO_DOWN;
						loopPhaseStart = phase;
						// Fade out uplink, show switching
						svgEl.select('.uplink-wave').transition().duration(250).attr('opacity', 0);
						svgEl.select('.switch-label').transition().duration(250).attr('opacity', 1);
					}
					break;
				case LOOP_SWITCH_TO_DOWN:
					if (elapsed > SWITCH_DURATION) {
						loopState = LOOP_DOWNLINK;
						loopPhaseStart = phase;
						// Hide switching, show downlink
						svgEl.select('.switch-label').transition().duration(250).attr('opacity', 0);
						svgEl.select('.downlink-wave').transition().duration(250).attr('opacity', 1);
					}
					break;
				case LOOP_DOWNLINK:
					if (elapsed > WAVE_DURATION) {
						loopState = LOOP_SWITCH_TO_UP;
						loopPhaseStart = phase;
						// Fade out downlink, show switching
						svgEl.select('.downlink-wave').transition().duration(250).attr('opacity', 0);
						svgEl.select('.switch-label').transition().duration(250).attr('opacity', 1);
					}
					break;
				case LOOP_SWITCH_TO_UP:
					if (elapsed > SWITCH_DURATION) {
						loopState = LOOP_UPLINK;
						loopPhaseStart = phase;
						// Hide switching, show uplink
						svgEl.select('.switch-label').transition().duration(250).attr('opacity', 0);
						svgEl.select('.uplink-wave').transition().duration(250).attr('opacity', 1);
					}
					break;
			}
		}

		// Determine which wave to animate based on current state
		const inLoop = currentStep >= 4;
		const showUplink = currentStep === 1 || (inLoop && loopState === LOOP_UPLINK);
		const showDownlink = currentStep === 3 || (inLoop && loopState === LOOP_DOWNLINK);

		if (showUplink) {
			svgEl.select('.uplink-wave-path')
				.attr('d', generateMovingWave(waveY, 14, 6, phase, 1));

			// Animate uplink packets (left to right)
			svgEl.selectAll('.uplink-packet').each(function(_, i) {
				const packet = d3.select(this);
				const t = ((phase * 0.3 + i * 0.33) % 1);
				const x = waveStartX + t * (waveEndX - waveStartX);
				const y = getWaveY(waveY, 14, 6, t, phase, 1);
				packet.attr('cx', x).attr('cy', y);
			});
		}

		if (showDownlink) {
			svgEl.select('.downlink-wave-path')
				.attr('d', generateMovingWave(waveY, 14, 6, phase, -1));

			// Animate downlink packets (right to left)
			svgEl.selectAll('.downlink-packet').each(function(_, i) {
				const packet = d3.select(this);
				const t = ((phase * 0.3 + i * 0.33) % 1);
				const x = waveEndX - t * (waveEndX - waveStartX);
				const y = getWaveY(waveY, 14, 6, 1 - t, phase, -1);
				packet.attr('cx', x).attr('cy', y);
			});
		}

		animationId = requestAnimationFrame(animateWaves);
	}

	function applyStep(step: number) {
		currentStep = step;

		// Initialize loop state when entering the looping phase
		if (step >= 4) {
			loopState = LOOP_UPLINK;
			loopPhaseStart = phase;
		}

		// Step 0: Show phone and tower
		// Step 1: Show uplink wave (phone to tower)
		// Step 2: Hide uplink, show "switching"
		// Step 3: Show downlink wave (tower to phone)
		// Step 4+: Timeline + smooth infinite loop

		svgEl.select('.uplink-wave')
			.transition()
			.duration(400)
			.attr('opacity', (step === 1 || step >= 4) ? 1 : 0);

		svgEl.select('.uplink-label')
			.transition()
			.duration(300)
			.attr('opacity', step === 1 ? 1 : 0);

		svgEl.select('.switch-label')
			.transition()
			.duration(300)
			.attr('opacity', step === 2 ? 1 : 0);

		svgEl.select('.downlink-wave')
			.transition()
			.duration(400)
			.attr('opacity', step === 3 ? 1 : 0);

		svgEl.select('.downlink-label')
			.transition()
			.duration(300)
			.attr('opacity', step === 3 ? 1 : 0);

		svgEl.select('.timeline')
			.transition()
			.duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		const messages = [
			'TDD uses ONE frequency, taking turns',
			'Time slot 1: Uplink (phone → tower)',
			'Switching direction...',
			'Time slot 2: Downlink (tower → phone)',
			'Same frequency, alternating time slots!'
		];
		svgEl.select('.message').text(messages[step]);
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
	function replay() { pause(); currentStep = 0; loopState = LOOP_UPLINK; loopPhaseStart = phase; applyStep(0); isPlaying = true; runAnimation(); }
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
			.text('TDD: One Frequency, Taking Turns');

		// Phone icon (left)
		const phoneY = 100;
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
		const towerY = 100;
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

		// Uplink wave group (phone to tower) - green/accent
		const uplinkGroup = svgEl.append('g').attr('class', 'uplink-wave').attr('opacity', 0);

		uplinkGroup.append('path')
			.attr('class', 'uplink-wave-path')
			.attr('d', generateMovingWave(waveY, 14, 6, 0, 1))
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
				.attr('cy', waveY);
		}

		// Uplink label
		svgEl.append('text')
			.attr('class', 'uplink-label')
			.attr('x', 250)
			.attr('y', waveY - 30)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.accent)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Uplink (f)')
			.attr('opacity', 0);

		// Switch label
		svgEl.append('text')
			.attr('class', 'switch-label')
			.attr('x', 250)
			.attr('y', waveY)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('⟳ SWITCHING ⟳')
			.attr('opacity', 0);

		// Downlink wave group (tower to phone) - yellow
		const downlinkGroup = svgEl.append('g').attr('class', 'downlink-wave').attr('opacity', 0);

		downlinkGroup.append('path')
			.attr('class', 'downlink-wave-path')
			.attr('d', generateMovingWave(waveY, 14, 6, 0, -1))
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
				.attr('cy', waveY);
		}

		// Downlink label
		svgEl.append('text')
			.attr('class', 'downlink-label')
			.attr('x', 250)
			.attr('y', waveY - 30)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Downlink (same f)')
			.attr('opacity', 0);

		// Timeline at bottom
		const timelineGroup = svgEl.append('g').attr('class', 'timeline').attr('opacity', 0);
		const timeY = 190;
		const slotWidth = 60;
		const slotHeight = 30;
		const startX = 110;

		// Time axis
		timelineGroup.append('line')
			.attr('x1', 90)
			.attr('x2', 410)
			.attr('y1', timeY + slotHeight + 15)
			.attr('y2', timeY + slotHeight + 15)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1);

		timelineGroup.append('text')
			.attr('x', 415)
			.attr('y', timeY + slotHeight + 20)
			.attr('text-anchor', 'start')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Time →');

		// Time slots: UP DOWN UP DOWN UP
		const slots = ['UP', 'DOWN', 'UP', 'DOWN', 'UP'];
		slots.forEach((slot, i) => {
			const isUp = slot === 'UP';
			timelineGroup.append('rect')
				.attr('x', startX + i * (slotWidth + 4))
				.attr('y', timeY)
				.attr('width', slotWidth)
				.attr('height', slotHeight)
				.attr('fill', isUp ? colors.accent : colors.yellow)
				.attr('rx', 4);

			timelineGroup.append('text')
				.attr('x', startX + i * (slotWidth + 4) + slotWidth / 2)
				.attr('y', timeY + slotHeight / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.bg)
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text(slot);
		});

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('TDD uses ONE frequency, taking turns');

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
