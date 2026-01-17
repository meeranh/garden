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
	const height = 300;

	// Network layout
	const nodes = [
		{ id: 'A', x: 60, y: 150, label: 'Source' },
		{ id: 'B', x: 170, y: 80 },
		{ id: 'C', x: 170, y: 220 },
		{ id: 'E', x: 300, y: 150 },
		{ id: 'D', x: 440, y: 150, label: 'Dest' },
	];

	const links = [
		['A', 'B'], ['A', 'C'],
		['B', 'E'], ['C', 'E'],
		['E', 'D'],
	];

	const titles = [
		'A wants to send data to D (no route known)',
		'A broadcasts RREQ (Route Request)',
		'RREQ floods outward, nodes remember reverse path',
		'RREQ reaches more nodes...',
		'RREQ reaches D!',
		'D sends RREP back along reverse path',
		'Route established: A → B → E → D',
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

		// Reset all
		nodes.forEach(n => {
			svgEl.select(`.node-${n.id}`)
				.transition().duration(300)
				.attr('fill-opacity', 0.2)
				.attr('stroke-width', 2);
			svgEl.select(`.rreq-${n.id}`)
				.transition().duration(300)
				.attr('opacity', 0);
		});

		links.forEach(([from, to]) => {
			svgEl.select(`.link-${from}-${to}`)
				.transition().duration(300)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-opacity', 0.3)
				.attr('stroke-width', 1);
			svgEl.select(`.arrow-${from}-${to}`)
				.transition().duration(300)
				.attr('opacity', 0);
			svgEl.select(`.reverse-${from}-${to}`)
				.transition().duration(300)
				.attr('opacity', 0);
		});

		svgEl.selectAll('.rrep-packet')
			.transition().duration(300)
			.attr('opacity', 0);

		svgEl.select('.route-highlight')
			.transition().duration(300)
			.attr('opacity', 0);

		// Highlight source
		svgEl.select('.node-A')
			.transition().duration(300)
			.attr('fill-opacity', 0.5)
			.attr('stroke-width', 3);

		// Step 0: A wants to reach D
		if (step >= 0) {
			svgEl.select('.node-D')
				.transition().duration(300)
				.attr('fill-opacity', 0.5);
		}

		// Step 1: A broadcasts RREQ
		if (step >= 1) {
			svgEl.select('.rreq-A')
				.transition().duration(400)
				.attr('opacity', 1);
		}

		// Step 2: RREQ reaches B and C
		if (step >= 2) {
			['B', 'C'].forEach(id => {
				svgEl.select(`.node-${id}`)
					.transition().duration(300)
					.attr('fill-opacity', 0.5);
				svgEl.select(`.rreq-${id}`)
					.transition().duration(400)
					.attr('opacity', 1);
			});

			// Show RREQ arrows and reverse paths
			['A-B', 'A-C'].forEach(pair => {
				svgEl.select(`.arrow-${pair}`)
					.transition().duration(400)
					.attr('opacity', 1);
				svgEl.select(`.reverse-${pair}`)
					.transition().duration(400)
					.attr('opacity', 1);
			});
		}

		// Step 3: RREQ reaches E
		if (step >= 3) {
			svgEl.select('.node-E')
				.transition().duration(300)
				.attr('fill-opacity', 0.5);
			svgEl.select('.rreq-E')
				.transition().duration(400)
				.attr('opacity', 1);

			['B-E', 'C-E'].forEach(pair => {
				svgEl.select(`.arrow-${pair}`)
					.transition().duration(400)
					.attr('opacity', 1);
				svgEl.select(`.reverse-${pair}`)
					.transition().duration(400)
					.attr('opacity', 1);
			});
		}

		// Step 4: RREQ reaches D
		if (step >= 4) {
			svgEl.select('.node-D')
				.transition().duration(300)
				.attr('fill-opacity', 0.7)
				.attr('stroke-width', 3);
			svgEl.select('.rreq-D')
				.transition().duration(400)
				.attr('opacity', 1);

			svgEl.select('.arrow-E-D')
				.transition().duration(400)
				.attr('opacity', 1);
			svgEl.select('.reverse-E-D')
				.transition().duration(400)
				.attr('opacity', 1);
		}

		// Step 5: RREP travels back
		if (step >= 5) {
			// Hide RREQ labels
			nodes.forEach(n => {
				svgEl.select(`.rreq-${n.id}`)
					.transition().duration(300)
					.attr('opacity', 0);
			});

			// Show RREP path
			svgEl.selectAll('.rrep-packet')
				.transition().duration(400)
				.attr('opacity', 1);

			// Highlight the return path
			['E-D', 'B-E', 'A-B'].forEach(pair => {
				const [from, to] = pair.split('-');
				svgEl.select(`.link-${from}-${to}`)
					.transition().duration(400)
					.attr('stroke', '#83a598')
					.attr('stroke-opacity', 0.8)
					.attr('stroke-width', 3);
			});
		}

		// Step 6: Route established
		if (step >= 6) {
			svgEl.selectAll('.rrep-packet')
				.transition().duration(300)
				.attr('opacity', 0);

			// Final route highlight
			['A-B', 'B-E', 'E-D'].forEach(pair => {
				const [from, to] = pair.split('-');
				svgEl.select(`.link-${from}-${to}`)
					.transition().duration(400)
					.attr('stroke', '#8ec07c')
					.attr('stroke-opacity', 1)
					.attr('stroke-width', 4);
			});

			svgEl.select('.route-highlight')
				.transition().duration(400)
				.attr('opacity', 1);
		}
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
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Draw links
		links.forEach(([from, to]) => {
			const n1 = getNode(from);
			const n2 = getNode(to);

			svgEl.append('line')
				.attr('class', `link-${from}-${to}`)
				.attr('x1', n1.x).attr('y1', n1.y)
				.attr('x2', n2.x).attr('y2', n2.y)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 1)
				.attr('stroke-opacity', 0.3);

			// RREQ arrow (forward)
			const midX = (n1.x + n2.x) / 2;
			const midY = (n1.y + n2.y) / 2;
			svgEl.append('text')
				.attr('class', `arrow-${from}-${to}`)
				.attr('x', midX).attr('y', midY - 8)
				.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
				.attr('font-size', '12px')
				.attr('opacity', 0)
				.text('→');

			// Reverse path indicator
			svgEl.append('text')
				.attr('class', `reverse-${from}-${to}`)
				.attr('x', midX).attr('y', midY + 15)
				.attr('text-anchor', 'middle').attr('fill', '#83a598')
				.attr('font-size', '8px')
				.attr('opacity', 0)
				.text('←back');
		});

		// Draw nodes
		nodes.forEach(n => {
			const nodeColor = n.id === 'A' ? '#fb4934' : n.id === 'D' ? '#8ec07c' : '#83a598';

			svgEl.append('circle')
				.attr('class', `node-${n.id}`)
				.attr('cx', n.x).attr('cy', n.y)
				.attr('r', 25)
				.attr('fill', nodeColor)
				.attr('fill-opacity', 0.2)
				.attr('stroke', nodeColor)
				.attr('stroke-width', 2);

			svgEl.append('text')
				.attr('x', n.x).attr('y', n.y + 5)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '14px').attr('font-weight', 'bold')
				.text(n.id);

			if (n.label) {
				svgEl.append('text')
					.attr('x', n.x).attr('y', n.y + 42)
					.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
					.attr('font-size', '9px')
					.text(n.label);
			}

			// RREQ label
			svgEl.append('text')
				.attr('class', `rreq-${n.id}`)
				.attr('x', n.x).attr('y', n.y - 32)
				.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
				.attr('font-size', '9px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text('RREQ');
		});

		// RREP packets along the path
		const rrepPath = [
			{ x: 400, y: 150 },
			{ x: 250, y: 110 },
			{ x: 120, y: 110 },
		];
		rrepPath.forEach((pos, i) => {
			svgEl.append('rect')
				.attr('class', 'rrep-packet')
				.attr('x', pos.x - 18).attr('y', pos.y - 8)
				.attr('width', 36).attr('height', 16)
				.attr('fill', '#83a598').attr('fill-opacity', 0.8)
				.attr('stroke', '#83a598').attr('stroke-width', 1)
				.attr('rx', 3)
				.attr('opacity', 0);
			svgEl.append('text')
				.attr('class', 'rrep-packet')
				.attr('x', pos.x).attr('y', pos.y + 4)
				.attr('text-anchor', 'middle').attr('fill', '#1d2021')
				.attr('font-size', '8px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text('RREP');
		});

		// Route highlight text
		svgEl.append('text')
			.attr('class', 'route-highlight')
			.attr('x', width / 2).attr('y', height - 15)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('Route ready! A can now send data to D');

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
