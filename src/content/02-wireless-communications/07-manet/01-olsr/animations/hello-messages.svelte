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
	const height = 300;

	const nodes = [
		{ id: 'A', x: 100, y: 150 },
		{ id: 'B', x: 200, y: 80 },
		{ id: 'C', x: 200, y: 220 },
		{ id: 'D', x: 320, y: 150 },
		{ id: 'E', x: 420, y: 150 },
	];

	const links = [
		['A', 'B'], ['A', 'C'],
		['B', 'D'], ['C', 'D'],
		['D', 'E']
	];

	const titles = [
		'HELLO Messages: Discovering neighbors',
		'Node A broadcasts HELLO (contains: "I am A")',
		'B and C receive it, learn A is their neighbor',
		'All nodes periodically send HELLOs',
		'Each node builds a neighbor table',
		'Result: Everyone knows their 1-hop and 2-hop neighbors',
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

		// Reset broadcasts
		nodes.forEach(n => {
			svgEl.select(`.hello-wave-${n.id}`)
				.attr('r', 0)
				.attr('opacity', 0);

			svgEl.select(`.node-${n.id}`)
				.transition().duration(300)
				.attr('fill-opacity', 0.3);
		});

		// Hide all tables initially
		svgEl.selectAll('.neighbor-table').attr('opacity', 0);
		svgEl.select('.hello-packet').attr('opacity', 0);

		if (step === 1) {
			// A sends HELLO
			svgEl.select('.node-A')
				.transition().duration(300)
				.attr('fill-opacity', 0.8);

			svgEl.select('.hello-wave-A')
				.attr('r', 15)
				.attr('opacity', 0.8)
				.transition().duration(1000)
				.attr('r', 80)
				.attr('opacity', 0);

			svgEl.select('.hello-packet')
				.attr('opacity', 1);
		}

		if (step === 2) {
			// B and C receive, highlight them
			['B', 'C'].forEach(id => {
				svgEl.select(`.node-${id}`)
					.transition().duration(300)
					.attr('fill-opacity', 0.8);
			});

			svgEl.select('.table-B').attr('opacity', 1);
			svgEl.select('.table-C').attr('opacity', 1);
		}

		if (step === 3) {
			// All nodes send HELLOs
			nodes.forEach((n, i) => {
				setTimeout(() => {
					svgEl.select(`.hello-wave-${n.id}`)
						.attr('r', 15)
						.attr('opacity', 0.6)
						.transition().duration(800)
						.attr('r', 70)
						.attr('opacity', 0);
				}, i * 200);
			});
		}

		if (step >= 4) {
			// Show all neighbor tables
			nodes.forEach(n => {
				svgEl.select(`.table-${n.id}`).attr('opacity', 1);
			});
		}

		if (step === 5) {
			// Highlight all nodes
			nodes.forEach(n => {
				svgEl.select(`.node-${n.id}`)
					.transition().duration(300)
					.attr('fill-opacity', 0.6);
			});
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
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Draw links
		links.forEach(([from, to]) => {
			const n1 = getNode(from);
			const n2 = getNode(to);
			svgEl.append('line')
				.attr('x1', n1.x).attr('y1', n1.y)
				.attr('x2', n2.x).attr('y2', n2.y)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 1)
				.attr('opacity', 0.4);
		});

		// HELLO waves
		nodes.forEach(n => {
			svgEl.append('circle')
				.attr('class', `hello-wave-${n.id}`)
				.attr('cx', n.x).attr('cy', n.y)
				.attr('r', 0)
				.attr('fill', 'none')
				.attr('stroke', '#8ec07c')
				.attr('stroke-width', 2)
				.attr('opacity', 0);
		});

		// Draw nodes
		nodes.forEach(n => {
			svgEl.append('circle')
				.attr('class', `node-${n.id}`)
				.attr('cx', n.x).attr('cy', n.y)
				.attr('r', 20)
				.attr('fill', '#83a598')
				.attr('fill-opacity', 0.3)
				.attr('stroke', '#83a598')
				.attr('stroke-width', 2);

			svgEl.append('text')
				.attr('x', n.x).attr('y', n.y + 5)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '13px').attr('font-weight', 'bold')
				.text(n.id);
		});

		// HELLO packet visualization
		const packetG = svgEl.append('g')
			.attr('class', 'hello-packet')
			.attr('opacity', 0);

		packetG.append('rect')
			.attr('x', 60).attr('y', 200)
			.attr('width', 80).attr('height', 50)
			.attr('fill', '#8ec07c')
			.attr('fill-opacity', 0.2)
			.attr('stroke', '#8ec07c')
			.attr('rx', 4);

		packetG.append('text')
			.attr('x', 100).attr('y', 218)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '9px').attr('font-weight', 'bold')
			.text('HELLO');

		packetG.append('text')
			.attr('x', 100).attr('y', 235)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '8px')
			.text('From: A');

		packetG.append('text')
			.attr('x', 100).attr('y', 245)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '8px')
			.text('Neighbors: []');

		// Mini neighbor tables for each node
		const tableData: Record<string, string[]> = {
			'A': ['B', 'C'],
			'B': ['A', 'D'],
			'C': ['A', 'D'],
			'D': ['B', 'C', 'E'],
			'E': ['D']
		};

		nodes.forEach(n => {
			const tableG = svgEl.append('g')
				.attr('class', `neighbor-table table-${n.id}`)
				.attr('opacity', 0);

			const tableX = n.x - 25;
			const tableY = n.y + 28;

			tableG.append('rect')
				.attr('x', tableX).attr('y', tableY)
				.attr('width', 50).attr('height', 25)
				.attr('fill', colors.bg)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 0.5)
				.attr('rx', 3);

			tableG.append('text')
				.attr('x', tableX + 25).attr('y', tableY + 16)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '8px')
				.text(tableData[n.id].join(', '));
		});

		// Note at bottom
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 12)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('HELLOs are NOT forwarded (only travel 1 hop)');

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
