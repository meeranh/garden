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
	const width = 620;
	const height = 300;

	const titles = [
		'Binary Exponential Backoff: How CW doubles on collision',
		'Two devices want to transmit. CW = 16 (pick from 0-15)',
		'Device A picks 5, Device B picks 5. Both wait...',
		'COLLISION! Both picked the same slot.',
		'CW doubles to 32. Pick new random numbers.',
		'Device A picks 3, Device B picks 12. Different slots!',
		'Device A wins! Transmits first. No collision.'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// CW indicator
		const cwValues = [16, 16, 16, 16, 32, 32, 32];
		svgEl.select('.cw-value').text(`CW = ${cwValues[step]}`);
		svgEl.select('.cw-range').text(`Pick from: 0 - ${cwValues[step] - 1}`);

		// CW bar width
		const maxBarWidth = 300;
		const barWidth = (cwValues[step] / 32) * maxBarWidth;
		svgEl.select('.cw-bar')
			.transition().duration(500)
			.attr('width', barWidth);

		// Device positions on timeline
		const slotWidth = 18;
		const timelineX = 160;
		const deviceASlots = [0, 5, 5, 5, 3, 3, 0];
		const deviceBSlots = [0, 5, 5, 5, 12, 12, 12];

		// Show/hide elements based on step
		svgEl.select('.devices-group')
			.transition().duration(300)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.collision-indicator')
			.transition().duration(300)
			.attr('opacity', step === 3 ? 1 : 0);

		svgEl.select('.success-indicator')
			.transition().duration(300)
			.attr('opacity', step === 6 ? 1 : 0);

		svgEl.select('.double-indicator')
			.transition().duration(300)
			.attr('opacity', step === 4 ? 1 : 0);

		// Device A marker position
		if (step >= 1) {
			const aPos = timelineX + deviceASlots[step] * slotWidth;
			svgEl.select('.device-a-marker')
				.transition().duration(600)
				.attr('cx', aPos);
			svgEl.select('.device-a-label')
				.transition().duration(600)
				.attr('x', aPos);
			svgEl.select('.device-a-slot')
				.text(step >= 2 ? `Slot: ${deviceASlots[step]}` : '');
		}

		// Device B marker position
		if (step >= 1) {
			const bPos = timelineX + deviceBSlots[step] * slotWidth;
			svgEl.select('.device-b-marker')
				.transition().duration(600)
				.attr('cx', bPos);
			svgEl.select('.device-b-label')
				.transition().duration(600)
				.attr('x', bPos);
			svgEl.select('.device-b-slot')
				.text(step >= 2 ? `Slot: ${deviceBSlots[step]}` : '');
		}

		// Timeline slots highlight
		const numSlots = cwValues[step];
		svgEl.selectAll('.slot-mark').remove();
		for (let i = 0; i < Math.min(numSlots, 16); i++) {
			svgEl.select('.timeline-group').append('line')
				.attr('class', 'slot-mark')
				.attr('x1', timelineX + i * slotWidth)
				.attr('y1', 165)
				.attr('x2', timelineX + i * slotWidth)
				.attr('y2', 175)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 1);
		}

		// Show "..." for larger CW
		svgEl.select('.more-slots')
			.attr('opacity', cwValues[step] > 16 ? 1 : 0);
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
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// CW indicator box
		const cwBoxX = 30;
		const cwBoxY = 45;
		svgEl.append('rect')
			.attr('x', cwBoxX).attr('y', cwBoxY)
			.attr('width', 110).attr('height', 55)
			.attr('fill', '#458588').attr('fill-opacity', 0.15)
			.attr('stroke', '#83a598').attr('stroke-width', 1)
			.attr('rx', 6);

		svgEl.append('text')
			.attr('class', 'cw-value')
			.attr('x', cwBoxX + 55).attr('y', cwBoxY + 25)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '16px').attr('font-weight', 'bold')
			.text('CW = 16');

		svgEl.append('text')
			.attr('class', 'cw-range')
			.attr('x', cwBoxX + 55).attr('y', cwBoxY + 45)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Pick from: 0 - 15');

		// CW visual bar
		svgEl.append('text')
			.attr('x', 160).attr('y', 60)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Contention Window Size:');

		svgEl.append('rect')
			.attr('x', 160).attr('y', 70)
			.attr('width', 300).attr('height', 20)
			.attr('fill', '#504945').attr('fill-opacity', 0.3)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('rx', 3);

		svgEl.append('rect')
			.attr('class', 'cw-bar')
			.attr('x', 160).attr('y', 70)
			.attr('width', 150).attr('height', 20)
			.attr('fill', '#83a598').attr('fill-opacity', 0.5)
			.attr('rx', 3);

		// Devices group
		const devicesG = svgEl.append('g').attr('class', 'devices-group').attr('opacity', 0);

		// Device A
		devicesG.append('rect')
			.attr('x', 30).attr('y', 120)
			.attr('width', 90).attr('height', 40)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.2)
			.attr('stroke', '#fb4934').attr('stroke-width', 1.5)
			.attr('rx', 5);

		devicesG.append('text')
			.attr('x', 75).attr('y', 140)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Device A');

		devicesG.append('text')
			.attr('class', 'device-a-slot')
			.attr('x', 75).attr('y', 155)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('');

		// Device B
		devicesG.append('rect')
			.attr('x', 30).attr('y', 200)
			.attr('width', 90).attr('height', 40)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.2)
			.attr('stroke', '#8ec07c').attr('stroke-width', 1.5)
			.attr('rx', 5);

		devicesG.append('text')
			.attr('x', 75).attr('y', 220)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Device B');

		devicesG.append('text')
			.attr('class', 'device-b-slot')
			.attr('x', 75).attr('y', 235)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('');

		// Timeline
		const timelineG = svgEl.append('g').attr('class', 'timeline-group');
		const timelineX = 160;
		const timelineWidth = 320;

		timelineG.append('line')
			.attr('x1', timelineX).attr('y1', 170)
			.attr('x2', timelineX + timelineWidth).attr('y2', 170)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		timelineG.append('text')
			.attr('x', timelineX).attr('y', 195)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('0');

		timelineG.append('text')
			.attr('class', 'more-slots')
			.attr('x', timelineX + 300).attr('y', 195)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('...');

		timelineG.append('text')
			.attr('x', timelineX + timelineWidth / 2).attr('y', 210)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Time Slots →');

		// Device markers on timeline
		devicesG.append('circle')
			.attr('class', 'device-a-marker')
			.attr('cx', timelineX).attr('cy', 140)
			.attr('r', 10)
			.attr('fill', '#fb4934');

		devicesG.append('text')
			.attr('class', 'device-a-label')
			.attr('x', timelineX).attr('y', 125)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '9px').attr('font-weight', 'bold')
			.text('A');

		devicesG.append('circle')
			.attr('class', 'device-b-marker')
			.attr('cx', timelineX).attr('cy', 220)
			.attr('r', 10)
			.attr('fill', '#8ec07c');

		devicesG.append('text')
			.attr('class', 'device-b-label')
			.attr('x', timelineX).attr('y', 250)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '9px').attr('font-weight', 'bold')
			.text('B');

		// Collision indicator
		svgEl.append('g')
			.attr('class', 'collision-indicator')
			.attr('opacity', 0)
			.append('text')
			.attr('x', width / 2 + 50).attr('y', 280)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('COLLISION!');

		// Double indicator
		const doubleG = svgEl.append('g')
			.attr('class', 'double-indicator')
			.attr('opacity', 0);

		doubleG.append('text')
			.attr('x', width / 2 + 50).attr('y', 275)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('CW doubles: 16 → 32');

		// Success indicator
		svgEl.append('g')
			.attr('class', 'success-indicator')
			.attr('opacity', 0)
			.append('text')
			.attr('x', width / 2 + 50).attr('y', 280)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('SUCCESS! No collision.');

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
