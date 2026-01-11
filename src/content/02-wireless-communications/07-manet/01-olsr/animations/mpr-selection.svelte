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
	const height = 340;

	// Horizontal layout: A -> 1-hop -> 2-hop
	// This makes the "reach" concept much clearer
	const nodes = [
		// Source
		{ id: 'A', x: 70, y: 185, type: 'source' },
		// 1-hop neighbors (middle column)
		{ id: 'B', x: 200, y: 100, type: '1hop' },
		{ id: 'C', x: 200, y: 185, type: '1hop' },
		{ id: 'D', x: 200, y: 270, type: '1hop' },
		// 2-hop neighbors (right column) - A cannot reach these directly
		{ id: 'E', x: 340, y: 80, type: '2hop' },
		{ id: 'F', x: 340, y: 150, type: '2hop' },
		{ id: 'G', x: 340, y: 220, type: '2hop' },
		{ id: 'H', x: 340, y: 290, type: '2hop' },
	];

	// Who can reach whom
	const links = [
		// A to 1-hop (A's radio range)
		['A', 'B'], ['A', 'C'], ['A', 'D'],
		// 1-hop to 2-hop (their radio ranges)
		['B', 'E'], ['B', 'F'],  // B covers E, F
		['C', 'F'], ['C', 'G'],  // C covers F, G
		['D', 'G'], ['D', 'H'],  // D covers G, H
	];

	// Coverage mapping: which 1-hop covers which 2-hop
	const coverage: Record<string, string[]> = {
		'B': ['E', 'F'],
		'C': ['F', 'G'],
		'D': ['G', 'H'],
	};

	const titles = [
		'MPR Selection: A needs relays to reach distant nodes',
		'A can only reach B, C, D directly (1-hop neighbors)',
		'E, F, G, H are too far (2-hop neighbors)',
		'Which 1-hop neighbors should relay for A?',
		'B covers E, F | C covers F, G | D covers G, H',
		'Minimum set: B and D cover all 2-hop neighbors!',
		'C is redundant (F, G already covered). Only B, D are MPRs.',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function getNode(id: string) {
		return nodes.find(n => n.id === id)!;
	}

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Reset all nodes and links
		nodes.forEach(n => {
			svgEl.select(`.node-${n.id}`)
				.transition().duration(400)
				.attr('fill-opacity', 0.15)
				.attr('stroke-width', 1.5)
				.attr('stroke-opacity', 0.4);

			svgEl.select(`.label-${n.id}`)
				.transition().duration(400)
				.attr('opacity', 0.5);

			svgEl.select(`.mpr-badge-${n.id}`)
				.transition().duration(300)
				.attr('opacity', 0);
		});

		links.forEach(([from, to]) => {
			svgEl.select(`.link-${from}-${to}`)
				.transition().duration(400)
				.attr('stroke-opacity', 0.15)
				.attr('stroke-width', 1);
		});

		// Hide coverage highlights
		svgEl.selectAll('.coverage-line').transition().duration(300).attr('opacity', 0);

		// Radio range circle
		svgEl.select('.radio-range')
			.transition().duration(400)
			.attr('opacity', step >= 1 && step <= 2 ? 0.3 : 0);

		// Step 0: Initial state - show A
		if (step >= 0) {
			svgEl.select('.node-A')
				.transition().duration(400)
				.attr('fill-opacity', 0.7)
				.attr('stroke-opacity', 1);
			svgEl.select('.label-A')
				.transition().duration(400)
				.attr('opacity', 1);
		}

		// Step 1: Highlight 1-hop neighbors and links to them
		if (step >= 1) {
			['B', 'C', 'D'].forEach(id => {
				svgEl.select(`.node-${id}`)
					.transition().duration(400)
					.attr('fill-opacity', 0.6)
					.attr('stroke-opacity', 1);
				svgEl.select(`.label-${id}`)
					.transition().duration(400)
					.attr('opacity', 1);
				svgEl.select(`.link-A-${id}`)
					.transition().duration(400)
					.attr('stroke-opacity', 0.7)
					.attr('stroke-width', 2);
			});
		}

		// Step 2: Show 2-hop neighbors (outside range)
		if (step >= 2) {
			['E', 'F', 'G', 'H'].forEach(id => {
				svgEl.select(`.node-${id}`)
					.transition().duration(400)
					.attr('fill-opacity', 0.5)
					.attr('stroke-opacity', 1);
				svgEl.select(`.label-${id}`)
					.transition().duration(400)
					.attr('opacity', 1);
			});
		}

		// Step 3: Show the question
		if (step === 3) {
			['B', 'C', 'D'].forEach(id => {
				svgEl.select(`.node-${id}`)
					.transition().duration(400)
					.attr('stroke-width', 3);
			});
		}

		// Step 4: Show coverage links
		if (step >= 4) {
			// Show all 1-hop to 2-hop links
			['B', 'C', 'D'].forEach(hop1 => {
				coverage[hop1].forEach(hop2 => {
					svgEl.select(`.link-${hop1}-${hop2}`)
						.transition().duration(400)
						.attr('stroke-opacity', 0.6)
						.attr('stroke-width', 2);
				});
			});
		}

		// Step 5: Show B and D as optimal choice
		if (step >= 5) {
			// B and D highlighted as MPRs
			['B', 'D'].forEach(id => {
				svgEl.select(`.node-${id}`)
					.transition().duration(400)
					.attr('fill', '#8ec07c')
					.attr('fill-opacity', 0.7)
					.attr('stroke', '#8ec07c')
					.attr('stroke-width', 3)
					.attr('stroke-opacity', 1);

				svgEl.select(`.mpr-badge-${id}`)
					.transition().duration(400)
					.attr('opacity', 1);

				// Highlight coverage lines from B and D
				coverage[id].forEach(hop2 => {
					svgEl.select(`.link-${id}-${hop2}`)
						.transition().duration(400)
						.attr('stroke', '#8ec07c')
						.attr('stroke-opacity', 0.8)
						.attr('stroke-width', 3);
				});
			});

			// C is dimmed
			svgEl.select('.node-C')
				.transition().duration(400)
				.attr('fill-opacity', 0.2)
				.attr('stroke-opacity', 0.3);
		}

		// Step 6: Final state - emphasize C is redundant
		if (step === 6) {
			svgEl.select('.node-C')
				.transition().duration(400)
				.attr('fill-opacity', 0.1)
				.attr('stroke-opacity', 0.2);

			svgEl.select('.redundant-text')
				.transition().duration(400)
				.attr('opacity', 1);
		} else {
			svgEl.select('.redundant-text')
				.transition().duration(300)
				.attr('opacity', 0);
		}
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

		// Column labels
		svgEl.append('text')
			.attr('x', 70).attr('y', 50)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Source');

		svgEl.append('text')
			.attr('x', 200).attr('y', 50)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('1-hop neighbors');

		svgEl.append('text')
			.attr('x', 340).attr('y', 50)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '9px')
			.text('2-hop neighbors');

		// Radio range circle around A (shows A's reach)
		const nodeA = getNode('A');
		svgEl.append('circle')
			.attr('class', 'radio-range')
			.attr('cx', nodeA.x).attr('cy', nodeA.y)
			.attr('r', 155)
			.attr('fill', '#fabd2f')
			.attr('fill-opacity', 0.05)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4')
			.attr('opacity', 0);

		// Draw links first (so nodes are on top)
		links.forEach(([from, to]) => {
			const n1 = getNode(from);
			const n2 = getNode(to);

			const isFromA = from === 'A';
			const baseColor = isFromA ? '#fabd2f' : '#83a598';

			svgEl.append('line')
				.attr('class', `link-${from}-${to}`)
				.attr('x1', n1.x).attr('y1', n1.y)
				.attr('x2', n2.x).attr('y2', n2.y)
				.attr('stroke', baseColor)
				.attr('stroke-width', 1)
				.attr('stroke-opacity', 0.15);
		});

		// Draw nodes
		nodes.forEach(n => {
			let nodeColor = colors.fgMuted;
			if (n.type === 'source') nodeColor = '#fb4934';
			else if (n.type === '1hop') nodeColor = '#fabd2f';
			else if (n.type === '2hop') nodeColor = '#83a598';

			svgEl.append('circle')
				.attr('class', `node-${n.id}`)
				.attr('cx', n.x).attr('cy', n.y)
				.attr('r', 22)
				.attr('fill', nodeColor)
				.attr('fill-opacity', 0.15)
				.attr('stroke', nodeColor)
				.attr('stroke-width', 1.5)
				.attr('stroke-opacity', 0.4);

			svgEl.append('text')
				.attr('class', `label-${n.id}`)
				.attr('x', n.x).attr('y', n.y + 5)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '14px').attr('font-weight', 'bold')
				.attr('opacity', 0.5)
				.text(n.id);

			// MPR badges for 1-hop nodes
			if (n.type === '1hop') {
				svgEl.append('text')
					.attr('class', `mpr-badge-${n.id}`)
					.attr('x', n.x + 30).attr('y', n.y + 5)
					.attr('text-anchor', 'start').attr('fill', '#8ec07c')
					.attr('font-size', '10px').attr('font-weight', 'bold')
					.attr('opacity', 0)
					.text('MPR');
			}
		});

		// "Redundant" label for C
		const nodeC = getNode('C');
		svgEl.append('text')
			.attr('class', 'redundant-text')
			.attr('x', nodeC.x + 30).attr('y', nodeC.y + 5)
			.attr('text-anchor', 'start').attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('Not needed');

		// Bottom explanation
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 15)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('MPRs are the minimum set of 1-hop neighbors that cover all 2-hop neighbors');

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
