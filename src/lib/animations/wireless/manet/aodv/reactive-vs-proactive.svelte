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

	const titles = [
		'Two approaches to routing',
		'OLSR: Constant updates (even when idle)',
		'AODV: Silent when idle',
		'When data needs to be sent...',
		'AODV discovers route on-demand',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// OLSR side
		svgEl.select('.olsr-label')
			.transition().duration(400)
			.attr('opacity', 1);

		// AODV side
		svgEl.select('.aodv-label')
			.transition().duration(400)
			.attr('opacity', 1);

		// OLSR packets (always showing after step 1)
		svgEl.selectAll('.olsr-packet')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// OLSR "constant overhead" label
		svgEl.select('.olsr-overhead')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// AODV silent
		svgEl.select('.aodv-silent')
			.transition().duration(400)
			.attr('opacity', step >= 2 && step < 4 ? 1 : 0);

		// Data request indicator
		svgEl.select('.data-request')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// AODV route discovery
		svgEl.selectAll('.aodv-discovery')
			.transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);

		// Summary labels
		svgEl.select('.olsr-summary')
			.transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);
		svgEl.select('.aodv-summary')
			.transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);
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
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		const leftX = 130, rightX = 390;
		const timelineY = 100, timelineH = 120;

		// Divider
		svgEl.append('line')
			.attr('x1', width / 2).attr('y1', 45)
			.attr('x2', width / 2).attr('y2', height - 20)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4').attr('opacity', 0.4);

		// ========== LEFT: OLSR ==========
		svgEl.append('text')
			.attr('class', 'olsr-label')
			.attr('x', leftX).attr('y', 55)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('OLSR (Proactive)');

		// Timeline
		svgEl.append('text')
			.attr('x', 30).attr('y', timelineY + timelineH / 2)
			.attr('text-anchor', 'start').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Time →');

		svgEl.append('line')
			.attr('x1', 60).attr('y1', timelineY + timelineH / 2)
			.attr('x2', 220).attr('y2', timelineY + timelineH / 2)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);

		// OLSR constant packets
		const packetPositions = [75, 100, 125, 150, 175, 200];
		packetPositions.forEach((x, i) => {
			svgEl.append('rect')
				.attr('class', 'olsr-packet')
				.attr('x', x - 8).attr('y', timelineY + timelineH / 2 - 20)
				.attr('width', 16).attr('height', 12)
				.attr('fill', '#fb4934').attr('fill-opacity', 0.6)
				.attr('stroke', '#fb4934').attr('stroke-width', 1)
				.attr('rx', 2)
				.attr('opacity', 0);
		});

		svgEl.append('text')
			.attr('class', 'olsr-overhead')
			.attr('x', leftX).attr('y', timelineY + timelineH / 2 + 35)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('HELLO, TC, HELLO, TC...');

		svgEl.append('text')
			.attr('class', 'olsr-summary')
			.attr('x', leftX).attr('y', timelineY + timelineH / 2 + 55)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('Always sending');

		// ========== RIGHT: AODV ==========
		svgEl.append('text')
			.attr('class', 'aodv-label')
			.attr('x', rightX).attr('y', 55)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('AODV (Reactive)');

		// Timeline
		svgEl.append('line')
			.attr('x1', 290).attr('y1', timelineY + timelineH / 2)
			.attr('x2', 480).attr('y2', timelineY + timelineH / 2)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);

		// AODV silent indicator
		svgEl.append('text')
			.attr('class', 'aodv-silent')
			.attr('x', rightX).attr('y', timelineY + timelineH / 2 - 15)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('(silence)');

		// Data request marker
		svgEl.append('line')
			.attr('class', 'data-request')
			.attr('x1', 400).attr('y1', timelineY + timelineH / 2 - 25)
			.attr('x2', 400).attr('y2', timelineY + timelineH / 2 + 5)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'data-request')
			.attr('x', 400).attr('y', timelineY + timelineH / 2 - 30)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '9px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('Need route!');

		// AODV discovery packets (only when needed)
		svgEl.append('rect')
			.attr('class', 'aodv-discovery')
			.attr('x', 410).attr('y', timelineY + timelineH / 2 - 20)
			.attr('width', 20).attr('height', 12)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.6)
			.attr('stroke', '#8ec07c').attr('stroke-width', 1)
			.attr('rx', 2)
			.attr('opacity', 0);

		svgEl.append('rect')
			.attr('class', 'aodv-discovery')
			.attr('x', 440).attr('y', timelineY + timelineH / 2 - 20)
			.attr('width', 20).attr('height', 12)
			.attr('fill', '#83a598').attr('fill-opacity', 0.6)
			.attr('stroke', '#83a598').attr('stroke-width', 1)
			.attr('rx', 2)
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'aodv-discovery')
			.attr('x', 435).attr('y', timelineY + timelineH / 2 + 35)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('RREQ → RREP');

		svgEl.append('text')
			.attr('class', 'aodv-summary')
			.attr('x', rightX).attr('y', timelineY + timelineH / 2 + 55)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('Only when needed');

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
