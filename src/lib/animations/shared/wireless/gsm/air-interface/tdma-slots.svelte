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
	let activeSlot = 0;
	let lastSlotChange = 0;

	const maxStep = 4;
	const width = 620;
	const height = 300;

	const slotColors = ['#fb4934', '#8ec07c', '#83a598', '#fabd2f', '#d3869b', '#fe8019', '#b8bb26', '#458588'];
	const numSlots = 8;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show empty timeline
		// Step 1: Divide into 8 slots
		// Step 2: Assign users to slots
		// Step 3: Show one user transmitting
		// Step 4: Animate cycling through slots

		svgEl.select('.timeline-bg')
			.transition().duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.frame-label')
			.transition().duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.selectAll('.slot-divider')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.selectAll('.slot-rect')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.selectAll('.slot-label')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.selectAll('.user-group')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.selectAll('.connection-line')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.active-indicator')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		svgEl.select('.transmitting-label')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// Reset active slot when entering step 3
		if (step === 3) {
			activeSlot = 0;
			updateActiveSlot();
		}

		const messages = [
			'GSM frame = 4.615 ms',
			'Frame divided into 8 time slots (~577 μs each)',
			'Each user gets one slot',
			'Only one user transmits at a time',
			'8 users share one carrier!'
		];
		svgEl.select('.message').text(messages[step]);
	}

	function updateActiveSlot() {
		const slotWidth = 60;
		const slotGap = 6;
		const frameWidth = numSlots * slotWidth + (numSlots - 1) * slotGap;
		const slotStartX = (width - frameWidth) / 2;

		// Move active indicator
		svgEl.select('.active-indicator')
			.transition().duration(200)
			.attr('x', slotStartX + activeSlot * (slotWidth + slotGap) - 3);

		// Update transmitting label
		const userLabel = String.fromCharCode(65 + activeSlot);
		svgEl.select('.transmitting-label')
			.text(`User ${userLabel} transmitting`);

		// Highlight active user's phone
		svgEl.selectAll('.user-phone').each(function(_, i) {
			d3.select(this)
				.transition().duration(200)
				.attr('stroke', i === activeSlot ? '#fabd2f' : 'none')
				.attr('stroke-width', i === activeSlot ? 2 : 0);
		});

		// Show signal wave for active user
		svgEl.selectAll('.signal-burst').each(function(_, i) {
			d3.select(this)
				.transition().duration(150)
				.attr('opacity', i === activeSlot ? 1 : 0);
		});
	}

	function animate() {
		const now = Date.now();

		// Cycle through slots when in step 4
		if (currentStep >= 4) {
			if (now - lastSlotChange > 500) {
				lastSlotChange = now;
				activeSlot = (activeSlot + 1) % numSlots;
				updateActiveSlot();
			}
		} else if (currentStep === 3) {
			// In step 3, just show first user
			if (activeSlot !== 0) {
				activeSlot = 0;
				updateActiveSlot();
			}
		}

		animationId = requestAnimationFrame(animate);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1800);
			if (!isPlaying) return;
		}
		isPlaying = false;
	}

	function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
	function pause() { isPlaying = false; clearTimeouts(); }
	function next() { pause(); if (currentStep < maxStep) applyStep(currentStep + 1); }
	function prev() { pause(); if (currentStep > 0) applyStep(currentStep - 1); }
	function skip() { pause(); applyStep(maxStep); }
	function replay() { pause(); currentStep = 0; activeSlot = 0; applyStep(0); isPlaying = true; runAnimation(); }
	function getState() { return { isPlaying, currentStep, totalSteps: maxStep }; }

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			accent: s.getPropertyValue('--color-accent').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('GSM TDMA: 8 Users Share One Carrier');

		const timelineY = 70;
		const slotWidth = 60;
		const slotHeight = 45;
		const slotGap = 6;
		const frameWidth = numSlots * slotWidth + (numSlots - 1) * slotGap;
		const slotStartX = (width - frameWidth) / 2;

		// Timeline background
		svgEl.append('rect')
			.attr('class', 'timeline-bg')
			.attr('x', slotStartX - 8).attr('y', timelineY - 5)
			.attr('width', frameWidth + 16).attr('height', slotHeight + 10)
			.attr('fill', colors.border).attr('opacity', 0.3)
			.attr('rx', 6);

		// Frame label
		svgEl.append('text')
			.attr('class', 'frame-label')
			.attr('x', slotStartX + frameWidth / 2).attr('y', timelineY - 12)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('← One TDMA Frame (4.615 ms) →')
			.attr('opacity', 0);

		// Active indicator (highlight box)
		svgEl.append('rect')
			.attr('class', 'active-indicator')
			.attr('x', slotStartX - 3).attr('y', timelineY - 3)
			.attr('width', slotWidth + 6).attr('height', slotHeight + 6)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f').attr('stroke-width', 3)
			.attr('rx', 5).attr('opacity', 0);

		// Create 8 slots
		for (let i = 0; i < numSlots; i++) {
			const x = slotStartX + i * (slotWidth + slotGap);

			// Slot rectangle
			svgEl.append('rect')
				.attr('class', 'slot-rect')
				.attr('x', x).attr('y', timelineY)
				.attr('width', slotWidth).attr('height', slotHeight)
				.attr('fill', slotColors[i])
				.attr('rx', 3).attr('opacity', 0);

			// Slot label
			svgEl.append('text')
				.attr('class', 'slot-label')
				.attr('x', x + slotWidth / 2).attr('y', timelineY + slotHeight / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', colors.bg)
				.attr('font-size', '10px').attr('font-weight', 'bold')
				.text(`TS${i}`)
				.attr('opacity', 0);

			// Slot divider
			if (i < numSlots - 1) {
				svgEl.append('line')
					.attr('class', 'slot-divider')
					.attr('x1', x + slotWidth + slotGap / 2).attr('x2', x + slotWidth + slotGap / 2)
					.attr('y1', timelineY).attr('y2', timelineY + slotHeight)
					.attr('stroke', colors.bg).attr('stroke-width', 1)
					.attr('stroke-dasharray', '3,2').attr('opacity', 0);
			}
		}

		// User icons below slots
		const userY = timelineY + slotHeight + 55;
		for (let i = 0; i < numSlots; i++) {
			const x = slotStartX + i * (slotWidth + slotGap) + slotWidth / 2;

			const userGroup = svgEl.append('g')
				.attr('class', 'user-group')
				.attr('opacity', 0);

			// Phone (smaller for 8 users)
			userGroup.append('rect')
				.attr('class', 'user-phone')
				.attr('x', x - 10).attr('y', userY - 16)
				.attr('width', 20).attr('height', 32)
				.attr('fill', slotColors[i])
				.attr('rx', 4);

			userGroup.append('rect')
				.attr('x', x - 6).attr('y', userY - 10)
				.attr('width', 12).attr('height', 18)
				.attr('fill', colors.bg)
				.attr('rx', 2);

			// User label
			const userLabel = String.fromCharCode(65 + i);
			userGroup.append('text')
				.attr('x', x).attr('y', userY + 28)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(userLabel);

			// Connection line to slot
			svgEl.append('line')
				.attr('class', 'connection-line')
				.attr('x1', x).attr('y1', timelineY + slotHeight)
				.attr('x2', x).attr('y2', userY - 18)
				.attr('stroke', slotColors[i]).attr('stroke-width', 1)
				.attr('stroke-dasharray', '3,2').attr('opacity', 0);

			// Signal burst (shown when transmitting)
			const burstGroup = svgEl.append('g')
				.attr('class', 'signal-burst')
				.attr('opacity', 0);

			// Small wave arcs
			[6, 11, 16].forEach((r) => {
				burstGroup.append('path')
					.attr('d', `M ${x - r} ${userY - 20} A ${r} ${r} 0 0 1 ${x + r} ${userY - 20}`)
					.attr('fill', 'none')
					.attr('stroke', slotColors[i])
					.attr('stroke-width', 1.5)
					.attr('opacity', 0.8 - r * 0.03);
			});
		}

		// Transmitting label
		svgEl.append('text')
			.attr('class', 'transmitting-label')
			.attr('x', width / 2).attr('y', userY + 52)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('User A transmitting')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2).attr('y', height - 10)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('GSM frame = 4.615 ms');

		// Start animation loop
		lastSlotChange = Date.now();
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
