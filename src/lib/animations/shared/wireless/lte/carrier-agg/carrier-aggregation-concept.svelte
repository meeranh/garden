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

	const maxStep = 3;
	const width = 620;
	const height = 280;

	const titles = [
		'Carrier Aggregation: Adding Lanes',
		'1 Channel = 20 MHz',
		'3 Channels = 60 MHz',
		'5 Channels = 100 MHz (Maximum!)'
	];

	const laneColors = ['#8ec07c', '#83a598', '#fabd2f', '#d3869b', '#fe8019'];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Show lanes based on step
		const laneCounts = [0, 1, 3, 5];
		const visibleLanes = laneCounts[step];

		for (let i = 0; i < 5; i++) {
			svgEl.select(`.lane-${i}`).transition().duration(400)
				.attr('opacity', i < visibleLanes ? 1 : 0);
		}

		// Update bandwidth text
		const bandwidths = ['', '20 MHz', '60 MHz', '100 MHz'];
		svgEl.select('.bandwidth-text').transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.bandwidth-text').text(bandwidths[step]);

		// Show max label only on last step
		svgEl.select('.max-label').transition().duration(400)
			.attr('opacity', step === 3 ? 1 : 0);
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
			fgMuted: s.getPropertyValue('--color-fg-muted').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('class', 'title-text')
			.attr('x', width / 2).attr('y', 28)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text(titles[0]);

		const laneHeight = 28;
		const laneWidth = 420;
		const startX = 100;
		const startY = 55;
		const gap = 6;

		// Phone icon on left (person with phone)
		const phoneX = 50;
		const phoneY = startY + 2 * laneHeight + 15;
		const phoneGroup = svgEl.append('g').attr('transform', `translate(${phoneX}, ${phoneY})`);
		phoneGroup.append('circle').attr('cx', 0).attr('cy', -20).attr('r', 8).attr('fill', '#d3869b'); // Head
		phoneGroup.append('line').attr('x1', 0).attr('y1', -12).attr('x2', 0).attr('y2', 8).attr('stroke', '#d3869b').attr('stroke-width', 2.5); // Body
		phoneGroup.append('line').attr('x1', 0).attr('y1', -5).attr('x2', -10).attr('y2', 3).attr('stroke', '#d3869b').attr('stroke-width', 2.5); // Left arm
		phoneGroup.append('line').attr('x1', 0).attr('y1', -5).attr('x2', 10).attr('y2', 0).attr('stroke', '#d3869b').attr('stroke-width', 2.5); // Right arm
		phoneGroup.append('rect').attr('x', 8).attr('y', -5).attr('width', 6).attr('height', 10).attr('fill', '#83a598').attr('rx', 1); // Phone
		phoneGroup.append('line').attr('x1', 0).attr('y1', 8).attr('x2', -6).attr('y2', 22).attr('stroke', '#d3869b').attr('stroke-width', 2.5); // Left leg
		phoneGroup.append('line').attr('x1', 0).attr('y1', 8).attr('x2', 6).attr('y2', 22).attr('stroke', '#d3869b').attr('stroke-width', 2.5); // Right leg

		// Tower icon on right (proper lattice tower)
		const towerX = startX + laneWidth + 40;
		const towerY = startY + 2 * laneHeight + 35;
		const towerGroup = svgEl.append('g').attr('transform', `translate(${towerX}, ${towerY})`);
		towerGroup.append('path')
			.attr('d', 'M0,-55 L-10,0 L10,0 Z')
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2);
		towerGroup.append('line').attr('x1', -7).attr('y1', -15).attr('x2', 7).attr('y2', -15).attr('stroke', '#8ec07c').attr('stroke-width', 1.5);
		towerGroup.append('line').attr('x1', -5).attr('y1', -30).attr('x2', 5).attr('y2', -30).attr('stroke', '#8ec07c').attr('stroke-width', 1.5);
		towerGroup.append('line').attr('x1', -3).attr('y1', -45).attr('x2', 3).attr('y2', -45).attr('stroke', '#8ec07c').attr('stroke-width', 1.5);
		towerGroup.append('line').attr('x1', 0).attr('y1', -55).attr('x2', 0).attr('y2', -68).attr('stroke', '#8ec07c').attr('stroke-width', 2);
		towerGroup.append('circle').attr('cx', 0).attr('cy', -70).attr('r', 3).attr('fill', '#8ec07c');

		// Draw 5 lanes (channels)
		for (let i = 0; i < 5; i++) {
			const y = startY + i * (laneHeight + gap);
			const laneGroup = svgEl.append('g').attr('class', `lane-${i}`).attr('opacity', 0);

			// Lane rectangle
			laneGroup.append('rect')
				.attr('x', startX)
				.attr('y', y)
				.attr('width', laneWidth)
				.attr('height', laneHeight)
				.attr('fill', laneColors[i])
				.attr('fill-opacity', 0.3)
				.attr('stroke', laneColors[i])
				.attr('stroke-width', 2)
				.attr('rx', 4);

			// Lane label
			laneGroup.append('text')
				.attr('x', startX + laneWidth / 2)
				.attr('y', y + laneHeight / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', laneColors[i])
				.attr('font-size', '11px')
				.attr('font-weight', 'bold')
				.text(`Channel ${i + 1}: 20 MHz`);

			// Arrow showing data flow
			laneGroup.append('path')
				.attr('d', `M${startX + 20},${y + laneHeight / 2} L${startX + laneWidth - 20},${y + laneHeight / 2}`)
				.attr('stroke', laneColors[i])
				.attr('stroke-width', 2)
				.attr('marker-end', `url(#arrow-${i})`)
				.attr('opacity', 0.6);

			// Arrow marker
			svgEl.append('defs').append('marker')
				.attr('id', `arrow-${i}`)
				.attr('markerWidth', 10)
				.attr('markerHeight', 7)
				.attr('refX', 9)
				.attr('refY', 3.5)
				.attr('orient', 'auto')
				.append('polygon')
				.attr('points', '0 0, 10 3.5, 0 7')
				.attr('fill', laneColors[i]);
		}

		// Bandwidth total text - positioned at bottom center, below all lanes
		svgEl.append('text')
			.attr('class', 'bandwidth-text')
			.attr('x', width / 2).attr('y', height - 28)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '20px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('');

		// Max label
		svgEl.append('text')
			.attr('class', 'max-label')
			.attr('x', width / 2).attr('y', height - 8)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('opacity', 0)
			.text('5 × 20 MHz = Maximum bandwidth!');

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
