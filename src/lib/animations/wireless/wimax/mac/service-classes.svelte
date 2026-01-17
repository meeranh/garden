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
	const width = 520;
	const height = 320;

	const classes = [
		{
			name: 'UGS',
			full: 'Unsolicited Grant Service',
			use: 'VoIP, Video Calls',
			color: '#fb4934',
			priority: 'Highest',
			desc: 'Constant bit rate, automatic grants'
		},
		{
			name: 'rtPS',
			full: 'Real-time Polling Service',
			use: 'Streaming Video',
			color: '#fe8019',
			priority: 'High',
			desc: 'Variable bit rate, polled regularly'
		},
		{
			name: 'ertPS',
			full: 'Extended Real-time PS',
			use: 'VoIP + Silence',
			color: '#fabd2f',
			priority: 'High',
			desc: 'Adaptive: UGS when active, rtPS when idle'
		},
		{
			name: 'nrtPS',
			full: 'Non-real-time Polling',
			use: 'FTP, Downloads',
			color: '#8ec07c',
			priority: 'Medium',
			desc: 'Guaranteed minimum bandwidth'
		},
		{
			name: 'BE',
			full: 'Best Effort',
			use: 'Web, Email',
			color: '#83a598',
			priority: 'Lowest',
			desc: 'No guarantees, leftover bandwidth'
		}
	];

	const titles = [
		'WiMAX QoS: 5 Service Classes (highest to lowest priority)',
		'UGS: For real-time constant bit rate (VoIP)',
		'rtPS: For real-time variable bit rate (video)',
		'ertPS: Smart VoIP with silence detection',
		'nrtPS: Guaranteed bandwidth, not time-critical',
		'BE: No guarantees, best effort only'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Highlight classes based on step
		for (let i = 0; i < 5; i++) {
			const isActive = step === 0 || step === i + 1;
			const isCurrent = step === i + 1;

			svgEl.select(`.class-box-${i}`)
				.transition().duration(400)
				.attr('opacity', isActive ? 1 : 0.3)
				.attr('stroke-width', isCurrent ? 3 : 1);

			svgEl.select(`.class-content-${i}`)
				.transition().duration(400)
				.attr('opacity', isActive ? 1 : 0.3);

			// Show detail box for current
			svgEl.select(`.detail-${i}`)
				.transition().duration(400)
				.attr('opacity', isCurrent ? 1 : 0);
		}

		// Priority arrow
		svgEl.select('.priority-arrow')
			.transition().duration(300)
			.attr('opacity', step === 0 ? 1 : 0.3);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2200);
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

		// Class boxes - centered in SVG
		const totalBoxWidth = 5 * 80 + 4 * 10; // 440px
		const boxStartX = (width - totalBoxWidth) / 2; // centered
		const boxY = 50;
		const boxW = 80;
		const boxH = 120;
		const boxGap = 10;
		const boxEndX = boxStartX + totalBoxWidth;

		// Priority arrow below boxes (horizontal, HIGH on left, LOW on right)
		const arrowY = boxY + boxH + 15;
		svgEl.append('text')
			.attr('class', 'priority-arrow')
			.attr('x', boxStartX + boxW / 2).attr('y', arrowY + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('HIGH');

		svgEl.append('line')
			.attr('class', 'priority-arrow')
			.attr('x1', boxStartX + boxW / 2 + 25).attr('y1', arrowY)
			.attr('x2', boxEndX - boxW / 2 - 25).attr('y2', arrowY)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#priority-arrow-head)');

		svgEl.append('text')
			.attr('class', 'priority-arrow')
			.attr('x', boxEndX - boxW / 2).attr('y', arrowY + 4)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('LOW');

		// Arrow marker
		svgEl.append('defs')
			.append('marker')
			.attr('id', 'priority-arrow-head')
			.attr('markerWidth', 10)
			.attr('markerHeight', 7)
			.attr('refX', 5)
			.attr('refY', 3.5)
			.attr('orient', 'auto')
			.append('polygon')
			.attr('points', '0 0, 10 3.5, 0 7')
			.attr('fill', colors.fgMuted);

		classes.forEach((cls, i) => {
			const x = boxStartX + i * (boxW + boxGap);

			// Box
			svgEl.append('rect')
				.attr('class', `class-box-${i}`)
				.attr('x', x).attr('y', boxY)
				.attr('width', boxW).attr('height', boxH)
				.attr('fill', cls.color)
				.attr('fill-opacity', 0.2)
				.attr('stroke', cls.color)
				.attr('stroke-width', 1)
				.attr('rx', 6);

			// Content group
			const contentG = svgEl.append('g').attr('class', `class-content-${i}`);

			// Class name
			contentG.append('text')
				.attr('x', x + boxW / 2).attr('y', boxY + 25)
				.attr('text-anchor', 'middle').attr('fill', cls.color)
				.attr('font-size', '14px').attr('font-weight', 'bold')
				.text(cls.name);

			// Use case
			contentG.append('text')
				.attr('x', x + boxW / 2).attr('y', boxY + 50)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '9px')
				.text(cls.use);

			// Priority badge
			contentG.append('rect')
				.attr('x', x + 10).attr('y', boxY + boxH - 35)
				.attr('width', boxW - 20).attr('height', 18)
				.attr('fill', cls.color)
				.attr('fill-opacity', 0.3)
				.attr('rx', 3);

			contentG.append('text')
				.attr('x', x + boxW / 2).attr('y', boxY + boxH - 22)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '8px')
				.text(cls.priority);

			// Detail box (shown when class is selected) - centered with boxes
			const detailY = boxY + boxH + 35;
			const detailG = svgEl.append('g')
				.attr('class', `detail-${i}`)
				.attr('opacity', 0);

			detailG.append('rect')
				.attr('x', boxStartX).attr('y', detailY)
				.attr('width', totalBoxWidth).attr('height', 85)
				.attr('fill', cls.color)
				.attr('fill-opacity', 0.1)
				.attr('stroke', cls.color)
				.attr('stroke-width', 1)
				.attr('rx', 6);

			detailG.append('text')
				.attr('x', boxStartX + 20).attr('y', detailY + 22)
				.attr('fill', cls.color)
				.attr('font-size', '12px').attr('font-weight', 'bold')
				.text(cls.full);

			detailG.append('text')
				.attr('x', boxStartX + 20).attr('y', detailY + 42)
				.attr('fill', colors.fg)
				.attr('font-size', '10px')
				.text('Used for: ' + cls.use);

			detailG.append('text')
				.attr('x', boxStartX + 20).attr('y', detailY + 62)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(cls.desc);
		});

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 12)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Higher priority classes get bandwidth first');

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
