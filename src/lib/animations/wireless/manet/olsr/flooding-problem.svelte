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
	const width = 500;
	const height = 300;

	// Network topology - nodes in a mesh
	const nodes = [
		{ id: 'A', x: 80, y: 150, label: 'Source' },
		{ id: 'B', x: 160, y: 80 },
		{ id: 'C', x: 160, y: 220 },
		{ id: 'D', x: 250, y: 150 },
		{ id: 'E', x: 340, y: 80 },
		{ id: 'F', x: 340, y: 220 },
		{ id: 'G', x: 420, y: 150, label: 'Dest' }
	];

	// Links between nodes
	const links = [
		['A', 'B'], ['A', 'C'], ['A', 'D'],
		['B', 'D'], ['B', 'E'],
		['C', 'D'], ['C', 'F'],
		['D', 'E'], ['D', 'F'],
		['E', 'G'], ['F', 'G']
	];

	const titles = [
		'Problem: A wants to send a message to G',
		'Step 1: A broadcasts to all neighbors',
		'Step 2: B, C, D all rebroadcast',
		'Step 3: E and F rebroadcast (D already heard it)',
		'Step 4: G finally receives the message',
		'Result: 6 rebroadcasts for 1 message!',
	];

	// Which nodes broadcast at each step
	const broadcastSteps = [
		[],           // Step 0: none
		['A'],        // Step 1: A broadcasts
		['B', 'C', 'D'], // Step 2: neighbors rebroadcast
		['E', 'F'],   // Step 3: next layer
		['G'],        // Step 4: destination
		['A', 'B', 'C', 'D', 'E', 'F'], // Step 5: show all broadcasters
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

		// Reset all nodes
		nodes.forEach(n => {
			svgEl.select(`.node-${n.id}`)
				.transition().duration(300)
				.attr('fill', n.id === 'A' ? '#fb4934' : n.id === 'G' ? '#8ec07c' : colors.fgMuted)
				.attr('fill-opacity', 0.3);

			svgEl.select(`.broadcast-${n.id}`)
				.transition().duration(300)
				.attr('r', 0)
				.attr('opacity', 0);
		});

		// Highlight broadcasting nodes
		const broadcasters = broadcastSteps[step] || [];
		broadcasters.forEach(id => {
			svgEl.select(`.node-${id}`)
				.transition().duration(300)
				.attr('fill', '#fabd2f')
				.attr('fill-opacity', 0.8);

			// Show broadcast wave
			svgEl.select(`.broadcast-${id}`)
				.attr('r', 10)
				.attr('opacity', 0.6)
				.transition().duration(800)
				.attr('r', 60)
				.attr('opacity', 0);
		});

		// Update counter
		const totalBroadcasts = step === 5 ? 6 : broadcastSteps.slice(0, step + 1).flat().length;
		svgEl.select('.counter-text').text(`Broadcasts: ${totalBroadcasts}`);

		// Show received at G
		if (step >= 4) {
			svgEl.select('.node-G')
				.transition().duration(300)
				.attr('fill', '#8ec07c')
				.attr('fill-opacity', 0.8);
		}
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

		// Draw broadcast circles (initially hidden)
		nodes.forEach(n => {
			svgEl.append('circle')
				.attr('class', `broadcast-${n.id}`)
				.attr('cx', n.x).attr('cy', n.y)
				.attr('r', 0)
				.attr('fill', 'none')
				.attr('stroke', '#fabd2f')
				.attr('stroke-width', 2)
				.attr('opacity', 0);
		});

		// Draw nodes
		nodes.forEach(n => {
			svgEl.append('circle')
				.attr('class', `node-${n.id}`)
				.attr('cx', n.x).attr('cy', n.y)
				.attr('r', 20)
				.attr('fill', n.id === 'A' ? '#fb4934' : n.id === 'G' ? '#8ec07c' : colors.fgMuted)
				.attr('fill-opacity', 0.3)
				.attr('stroke', n.id === 'A' ? '#fb4934' : n.id === 'G' ? '#8ec07c' : colors.fgMuted)
				.attr('stroke-width', 2);

			svgEl.append('text')
				.attr('x', n.x).attr('y', n.y + 5)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '12px').attr('font-weight', 'bold')
				.text(n.id);

			if (n.label) {
				svgEl.append('text')
					.attr('x', n.x).attr('y', n.y + 38)
					.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
					.attr('font-size', '9px')
					.text(n.label);
			}
		});

		// Counter
		svgEl.append('text')
			.attr('class', 'counter-text')
			.attr('x', width / 2).attr('y', height - 15)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('Broadcasts: 0');

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
