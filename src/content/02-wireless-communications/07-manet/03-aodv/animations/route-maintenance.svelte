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

	// Network layout - linear for clarity
	const nodes = [
		{ id: 'A', x: 70, y: 140 },
		{ id: 'B', x: 180, y: 140 },
		{ id: 'E', x: 290, y: 140 },
		{ id: 'D', x: 400, y: 140 },
	];

	const titles = [
		'Active route: A → B → E → D',
		'Data flowing through the route...',
		'Link breaks! E moved away',
		'B detects failure, sends RERR to A',
		'A knows route is broken (can rediscover)',
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

		// Reset
		svgEl.select('.link-break').transition().duration(300).attr('opacity', 0);
		svgEl.select('.rerr-packet').transition().duration(300).attr('opacity', 0);
		svgEl.select('.broken-text').transition().duration(300).attr('opacity', 0);

		// Active route highlight
		const routeActive = step <= 1;
		['A-B', 'B-E', 'E-D'].forEach(pair => {
			svgEl.select(`.link-${pair}`)
				.transition().duration(400)
				.attr('stroke', routeActive ? '#8ec07c' : colors.fgMuted)
				.attr('stroke-opacity', routeActive ? 0.8 : 0.3)
				.attr('stroke-width', routeActive ? 3 : 2);
		});

		// Data packets flowing
		svgEl.selectAll('.data-packet')
			.transition().duration(300)
			.attr('opacity', step === 1 ? 1 : 0);

		// Link break (step 2+)
		if (step >= 2) {
			// Move E node
			svgEl.select('.node-E')
				.transition().duration(500)
				.attr('cy', 200);
			svgEl.select('.label-E')
				.transition().duration(500)
				.attr('y', 205);

			// Break the B-E link
			svgEl.select('.link-B-E')
				.transition().duration(400)
				.attr('stroke', '#fb4934')
				.attr('stroke-opacity', 0.5)
				.attr('stroke-dasharray', '5,5');

			// Also update E-D link position
			svgEl.select('.link-E-D')
				.transition().duration(500)
				.attr('y1', 200);

			svgEl.select('.link-break')
				.transition().duration(400)
				.attr('opacity', 1);
		} else {
			// Reset E position
			svgEl.select('.node-E')
				.transition().duration(400)
				.attr('cy', 140);
			svgEl.select('.label-E')
				.transition().duration(400)
				.attr('y', 145);
			svgEl.select('.link-E-D')
				.transition().duration(400)
				.attr('y1', 140);
			svgEl.select('.link-B-E')
				.transition().duration(400)
				.attr('stroke-dasharray', 'none');
		}

		// RERR (step 3)
		if (step >= 3) {
			svgEl.select('.rerr-packet')
				.transition().duration(400)
				.attr('opacity', 1);
		}

		// A knows (step 4)
		if (step >= 4) {
			svgEl.select('.node-A')
				.transition().duration(400)
				.attr('stroke', '#fabd2f')
				.attr('stroke-width', 3);

			svgEl.select('.broken-text')
				.transition().duration(400)
				.attr('opacity', 1);

			svgEl.select('.rerr-packet')
				.transition().duration(300)
				.attr('opacity', 0);
		} else {
			svgEl.select('.node-A')
				.transition().duration(400)
				.attr('stroke', '#fb4934')
				.attr('stroke-width', 2);
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

		// Draw links
		const linkPairs = [['A', 'B'], ['B', 'E'], ['E', 'D']];
		linkPairs.forEach(([from, to]) => {
			const n1 = getNode(from);
			const n2 = getNode(to);

			svgEl.append('line')
				.attr('class', `link-${from}-${to}`)
				.attr('x1', n1.x).attr('y1', n1.y)
				.attr('x2', n2.x).attr('y2', n2.y)
				.attr('stroke', '#8ec07c')
				.attr('stroke-width', 3)
				.attr('stroke-opacity', 0.8);
		});

		// Draw nodes
		nodes.forEach(n => {
			const nodeColor = n.id === 'A' ? '#fb4934' : n.id === 'D' ? '#8ec07c' : '#83a598';

			svgEl.append('circle')
				.attr('class', `node-${n.id}`)
				.attr('cx', n.x).attr('cy', n.y)
				.attr('r', 25)
				.attr('fill', nodeColor)
				.attr('fill-opacity', 0.3)
				.attr('stroke', nodeColor)
				.attr('stroke-width', 2);

			svgEl.append('text')
				.attr('class', `label-${n.id}`)
				.attr('x', n.x).attr('y', n.y + 5)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '14px').attr('font-weight', 'bold')
				.text(n.id);
		});

		// Data packets (for step 1)
		[120, 230, 340].forEach((x, i) => {
			svgEl.append('rect')
				.attr('class', 'data-packet')
				.attr('x', x).attr('y', 125)
				.attr('width', 25).attr('height', 14)
				.attr('fill', '#8ec07c').attr('fill-opacity', 0.7)
				.attr('rx', 3)
				.attr('opacity', 0);
			svgEl.append('text')
				.attr('class', 'data-packet')
				.attr('x', x + 12).attr('y', 135)
				.attr('text-anchor', 'middle').attr('fill', '#1d2021')
				.attr('font-size', '8px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text('DATA');
		});

		// Link break indicator
		const bNode = getNode('B');
		const eNode = getNode('E');
		svgEl.append('text')
			.attr('class', 'link-break')
			.attr('x', (bNode.x + eNode.x) / 2).attr('y', 110)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '16px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('✕');

		// RERR packet group
		const rerrG = svgEl.append('g').attr('class', 'rerr-packet').attr('opacity', 0);

		rerrG.append('rect')
			.attr('x', 110).attr('y', 165)
			.attr('width', 40).attr('height', 18)
			.attr('fill', '#fb4934')
			.attr('stroke', '#fb4934').attr('stroke-width', 1)
			.attr('rx', 3);

		rerrG.append('text')
			.attr('x', 130).attr('y', 177)
			.attr('text-anchor', 'middle').attr('fill', '#fff')
			.attr('font-size', '9px').attr('font-weight', 'bold')
			.text('RERR');

		// Arrow for RERR
		rerrG.append('text')
			.attr('x', 95).attr('y', 177)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '14px')
			.text('←');

		// "Route broken" text
		svgEl.append('text')
			.attr('class', 'broken-text')
			.attr('x', width / 2).attr('y', height - 20)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('A can start new route discovery if needed');

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
