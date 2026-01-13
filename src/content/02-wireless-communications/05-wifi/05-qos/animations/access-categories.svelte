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
	const width = 520;
	const height = 280;

	const categories = [
		{
			name: 'AC_VO',
			full: 'Voice',
			use: 'VoIP, Video Calls',
			color: '#fb4934',
			aifs: '2',
			cw: '3-7'
		},
		{
			name: 'AC_VI',
			full: 'Video',
			use: 'Streaming',
			color: '#fe8019',
			aifs: '2',
			cw: '7-15'
		},
		{
			name: 'AC_BE',
			full: 'Best Effort',
			use: 'Web, Email',
			color: '#8ec07c',
			aifs: '3',
			cw: '15-1023'
		},
		{
			name: 'AC_BK',
			full: 'Background',
			use: 'Downloads',
			color: '#83a598',
			aifs: '7',
			cw: '15-1023'
		}
	];

	const titles = [
		'802.11e EDCA: 4 Access Categories',
		'AC_VO (Voice): Highest priority for real-time calls',
		'AC_VI (Video): High priority for streaming',
		'AC_BE (Best Effort): Default for normal traffic',
		'AC_BK (Background): Lowest priority for bulk transfers'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		for (let i = 0; i < 4; i++) {
			const isActive = step === 0 || step === i + 1;
			const isCurrent = step === i + 1;

			svgEl.select(`.cat-box-${i}`)
				.transition().duration(400)
				.attr('opacity', isActive ? 1 : 0.3)
				.attr('stroke-width', isCurrent ? 3 : 1);

			svgEl.select(`.cat-content-${i}`)
				.transition().duration(400)
				.attr('opacity', isActive ? 1 : 0.3);

			svgEl.select(`.detail-${i}`)
				.transition().duration(400)
				.attr('opacity', isCurrent ? 1 : 0);
		}

		svgEl.select('.priority-label')
			.transition().duration(300)
			.attr('opacity', step === 0 ? 1 : 0.3);
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
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Category boxes
		const boxW = 100;
		const boxH = 90;
		const boxGap = 20;
		const totalW = 4 * boxW + 3 * boxGap;
		const boxStartX = (width - totalW) / 2;
		const boxY = 50;

		// Priority arrow
		const arrowG = svgEl.append('g').attr('class', 'priority-label');
		arrowG.append('text')
			.attr('x', boxStartX).attr('y', boxY + boxH + 20)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('HIGH');
		arrowG.append('line')
			.attr('x1', boxStartX + 30).attr('y1', boxY + boxH + 16)
			.attr('x2', boxStartX + totalW - 30).attr('y2', boxY + boxH + 16)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('marker-end', 'url(#ac-arrow)');
		arrowG.append('text')
			.attr('x', boxStartX + totalW).attr('y', boxY + boxH + 20)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('LOW');

		// Arrow marker
		svgEl.append('defs')
			.append('marker')
			.attr('id', 'ac-arrow')
			.attr('markerWidth', 8)
			.attr('markerHeight', 6)
			.attr('refX', 8)
			.attr('refY', 3)
			.attr('orient', 'auto')
			.append('polygon')
			.attr('points', '0 0, 8 3, 0 6')
			.attr('fill', colors.fgMuted);

		categories.forEach((cat, i) => {
			const x = boxStartX + i * (boxW + boxGap);

			// Box
			svgEl.append('rect')
				.attr('class', `cat-box-${i}`)
				.attr('x', x).attr('y', boxY)
				.attr('width', boxW).attr('height', boxH)
				.attr('fill', cat.color)
				.attr('fill-opacity', 0.15)
				.attr('stroke', cat.color)
				.attr('stroke-width', 1)
				.attr('rx', 6);

			// Content
			const contentG = svgEl.append('g').attr('class', `cat-content-${i}`);

			contentG.append('text')
				.attr('x', x + boxW / 2).attr('y', boxY + 22)
				.attr('text-anchor', 'middle').attr('fill', cat.color)
				.attr('font-size', '13px').attr('font-weight', 'bold')
				.text(cat.name);

			contentG.append('text')
				.attr('x', x + boxW / 2).attr('y', boxY + 40)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '10px')
				.text(cat.full);

			contentG.append('text')
				.attr('x', x + boxW / 2).attr('y', boxY + 58)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(cat.use);

			// AIFS badge
			contentG.append('text')
				.attr('x', x + boxW / 2).attr('y', boxY + 78)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '8px')
				.text(`AIFS: ${cat.aifs}`);

			// Detail box
			const detailY = boxY + boxH + 35;
			const detailG = svgEl.append('g')
				.attr('class', `detail-${i}`)
				.attr('opacity', 0);

			detailG.append('rect')
				.attr('x', boxStartX).attr('y', detailY)
				.attr('width', totalW).attr('height', 65)
				.attr('fill', cat.color)
				.attr('fill-opacity', 0.1)
				.attr('stroke', cat.color)
				.attr('rx', 6);

			detailG.append('text')
				.attr('x', boxStartX + 15).attr('y', detailY + 20)
				.attr('fill', cat.color)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(`${cat.name} (${cat.full})`);

			detailG.append('text')
				.attr('x', boxStartX + 15).attr('y', detailY + 38)
				.attr('fill', colors.fg)
				.attr('font-size', '10px')
				.text(`AIFS: ${cat.aifs} slots  |  CW: ${cat.cw}`);

			detailG.append('text')
				.attr('x', boxStartX + 15).attr('y', detailY + 54)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`Used for: ${cat.use}`);
		});

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
