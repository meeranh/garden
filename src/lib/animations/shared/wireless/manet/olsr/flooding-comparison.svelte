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
	const width = 520;
	const height = 320;

	// Two identical networks side by side
	const leftOffset = 0;
	const rightOffset = 270;

	const baseNodes = [
		{ id: 'A', x: 60, y: 130 },
		{ id: 'B', x: 130, y: 80 },
		{ id: 'C', x: 130, y: 180 },
		{ id: 'D', x: 200, y: 130 },
	];

	const links = [
		['A', 'B'], ['A', 'C'],
		['B', 'C'], ['B', 'D'], ['C', 'D']
	];

	// In naive flooding: everyone rebroadcasts
	// In MPR: only B rebroadcasts (B is A's MPR to reach D)

	const titles = [
		'Comparison: Naive Flooding vs MPR Flooding',
		'Source A wants to broadcast a message',
		'Naive: Everyone rebroadcasts (3 transmissions)',
		'OLSR: Only MPR (B) rebroadcasts (1 transmission)',
		'Naive: D receives duplicates from B and C',
		'OLSR: D receives once, less interference',
		'Result: MPR reduces overhead by 66%',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Reset all waves and highlights
		['left', 'right'].forEach(side => {
			baseNodes.forEach(n => {
				svgEl.select(`.wave-${side}-${n.id}`)
					.attr('r', 0).attr('opacity', 0);
				svgEl.select(`.node-${side}-${n.id}`)
					.transition().duration(300)
					.attr('fill-opacity', 0.3)
					.attr('stroke-width', 1);
			});
		});

		// Reset counters
		svgEl.select('.count-left').text('0');
		svgEl.select('.count-right').text('0');

		if (step >= 1) {
			// Highlight source A on both sides
			['left', 'right'].forEach(side => {
				svgEl.select(`.node-${side}-A`)
					.transition().duration(300)
					.attr('fill-opacity', 0.8);

				svgEl.select(`.wave-${side}-A`)
					.attr('r', 15).attr('opacity', 0.7)
					.transition().duration(800)
					.attr('r', 60).attr('opacity', 0);
			});
		}

		if (step >= 2) {
			// Left side: B and C both rebroadcast
			['B', 'C'].forEach((id, i) => {
				setTimeout(() => {
					svgEl.select(`.node-left-${id}`)
						.transition().duration(300)
						.attr('fill-opacity', 0.8);

					svgEl.select(`.wave-left-${id}`)
						.attr('r', 15).attr('opacity', 0.7)
						.transition().duration(800)
						.attr('r', 60).attr('opacity', 0);
				}, i * 300);
			});
			svgEl.select('.count-left').text('3');
		}

		if (step >= 3) {
			// Right side: Only B (MPR) rebroadcasts
			svgEl.select('.node-right-B')
				.transition().duration(300)
				.attr('fill-opacity', 0.8)
				.attr('stroke-width', 3);

			svgEl.select('.wave-right-B')
				.attr('r', 15).attr('opacity', 0.7)
				.transition().duration(800)
				.attr('r', 60).attr('opacity', 0);

			// C stays dim (not an MPR)
			svgEl.select('.node-right-C')
				.transition().duration(300)
				.attr('fill-opacity', 0.2);

			svgEl.select('.count-right').text('1');

			// Show MPR badge on B
			svgEl.select('.mpr-badge')
				.transition().duration(300)
				.attr('opacity', 1);
		}

		if (step >= 4) {
			// D receives on left (show duplicate issue)
			svgEl.select('.node-left-D')
				.transition().duration(300)
				.attr('fill-opacity', 0.8);

			svgEl.select('.duplicate-text')
				.transition().duration(300)
				.attr('opacity', 1);
		}

		if (step >= 5) {
			// D receives on right (single copy)
			svgEl.select('.node-right-D')
				.transition().duration(300)
				.attr('fill-opacity', 0.8);

			svgEl.select('.single-text')
				.transition().duration(300)
				.attr('opacity', 1);
		}

		if (step === 6) {
			// Highlight the difference
			svgEl.select('.savings-text')
				.transition().duration(300)
				.attr('opacity', 1);
		}
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
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Section labels
		svgEl.append('text')
			.attr('x', 130).attr('y', 50)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Naive Flooding');

		svgEl.append('text')
			.attr('x', 130 + rightOffset).attr('y', 50)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('OLSR (MPR)');

		// Divider
		svgEl.append('line')
			.attr('x1', width / 2).attr('y1', 40)
			.attr('x2', width / 2).attr('y2', 250)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,4')
			.attr('opacity', 0.5);

		// Draw both networks
		[{ offset: leftOffset, side: 'left' }, { offset: rightOffset, side: 'right' }].forEach(({ offset, side }) => {
			// Links
			links.forEach(([from, to]) => {
				const n1 = baseNodes.find(n => n.id === from)!;
				const n2 = baseNodes.find(n => n.id === to)!;
				svgEl.append('line')
					.attr('x1', n1.x + offset).attr('y1', n1.y)
					.attr('x2', n2.x + offset).attr('y2', n2.y)
					.attr('stroke', colors.fgMuted)
					.attr('stroke-width', 1)
					.attr('opacity', 0.3);
			});

			// Waves
			baseNodes.forEach(n => {
				svgEl.append('circle')
					.attr('class', `wave-${side}-${n.id}`)
					.attr('cx', n.x + offset).attr('cy', n.y)
					.attr('r', 0)
					.attr('fill', 'none')
					.attr('stroke', side === 'left' ? '#fb4934' : '#8ec07c')
					.attr('stroke-width', 2)
					.attr('opacity', 0);
			});

			// Nodes
			baseNodes.forEach(n => {
				const nodeColor = n.id === 'A' ? '#fabd2f' : (side === 'left' ? '#fb4934' : '#8ec07c');

				svgEl.append('circle')
					.attr('class', `node-${side}-${n.id}`)
					.attr('cx', n.x + offset).attr('cy', n.y)
					.attr('r', 18)
					.attr('fill', nodeColor)
					.attr('fill-opacity', 0.3)
					.attr('stroke', nodeColor)
					.attr('stroke-width', 1);

				svgEl.append('text')
					.attr('x', n.x + offset).attr('y', n.y + 5)
					.attr('text-anchor', 'middle').attr('fill', colors.fg)
					.attr('font-size', '12px').attr('font-weight', 'bold')
					.text(n.id);
			});
		});

		// MPR badge for B on right side
		const nodeB = baseNodes.find(n => n.id === 'B')!;
		svgEl.append('text')
			.attr('class', 'mpr-badge')
			.attr('x', nodeB.x + rightOffset).attr('y', nodeB.y - 25)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '9px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('MPR');

		// Counters
		svgEl.append('text')
			.attr('x', 130).attr('y', 220)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Rebroadcasts:');

		svgEl.append('text')
			.attr('class', 'count-left')
			.attr('x', 130).attr('y', 240)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '16px').attr('font-weight', 'bold')
			.text('0');

		svgEl.append('text')
			.attr('x', 130 + rightOffset).attr('y', 220)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Rebroadcasts:');

		svgEl.append('text')
			.attr('class', 'count-right')
			.attr('x', 130 + rightOffset).attr('y', 240)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '16px').attr('font-weight', 'bold')
			.text('0');

		// Status texts
		svgEl.append('text')
			.attr('class', 'duplicate-text')
			.attr('x', 130).attr('y', 262)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('D gets duplicates!');

		svgEl.append('text')
			.attr('class', 'single-text')
			.attr('x', 130 + rightOffset).attr('y', 262)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('D gets one copy');

		// Savings text
		svgEl.append('text')
			.attr('class', 'savings-text')
			.attr('x', width / 2).attr('y', height - 25)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('MPR saves 66% overhead (1 vs 3 rebroadcasts)');

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
