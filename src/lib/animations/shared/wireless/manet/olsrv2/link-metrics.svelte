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
	const height = 300;

	// Network with two paths from A to D
	const nodes = [
		{ id: 'A', x: 80, y: 150, label: 'Source' },
		{ id: 'B', x: 220, y: 80 },
		{ id: 'C', x: 220, y: 220 },
		{ id: 'D', x: 400, y: 150, label: 'Destination' },
	];

	// Two paths: A-B-D (2 hops, good links) vs A-C-D (2 hops, bad links)
	const links = [
		{ from: 'A', to: 'B', quality: 0.9, label: '90%' },
		{ from: 'B', to: 'D', quality: 0.85, label: '85%' },
		{ from: 'A', to: 'C', quality: 0.3, label: '30%' },
		{ from: 'C', to: 'D', quality: 0.4, label: '40%' },
	];

	const titles = [
		'Problem: Two paths, same hop count',
		'OLSR: Both paths are "2 hops" (equal)',
		'But link quality is very different!',
		'OLSRv2: Considers link quality (ETX)',
		'Result: Chooses A → B → D (better links)',
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
		links.forEach(link => {
			svgEl.select(`.link-${link.from}-${link.to}`)
				.transition().duration(400)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 2)
				.attr('stroke-opacity', 0.5);

			svgEl.select(`.quality-${link.from}-${link.to}`)
				.transition().duration(400)
				.attr('opacity', 0);
		});

		nodes.forEach(n => {
			svgEl.select(`.node-${n.id}`)
				.transition().duration(400)
				.attr('stroke-width', 2);
		});

		svgEl.select('.olsr-result').transition().duration(300).attr('opacity', 0);
		svgEl.select('.olsrv2-result').transition().duration(300).attr('opacity', 0);

		// Step 1: Show both paths as equal (hop count)
		if (step === 1) {
			// Highlight both paths
			links.forEach(link => {
				svgEl.select(`.link-${link.from}-${link.to}`)
					.transition().duration(400)
					.attr('stroke', '#fabd2f')
					.attr('stroke-width', 3)
					.attr('stroke-opacity', 0.8);
			});

			svgEl.select('.olsr-result').transition().duration(400).attr('opacity', 1);
		}

		// Step 2: Show link quality percentages
		if (step >= 2) {
			links.forEach(link => {
				const linkColor = link.quality >= 0.7 ? '#8ec07c' : '#fb4934';
				svgEl.select(`.link-${link.from}-${link.to}`)
					.transition().duration(400)
					.attr('stroke', linkColor)
					.attr('stroke-width', link.quality >= 0.7 ? 4 : 2)
					.attr('stroke-opacity', 0.8);

				svgEl.select(`.quality-${link.from}-${link.to}`)
					.transition().duration(400)
					.attr('opacity', 1)
					.attr('fill', linkColor);
			});
		}

		// Step 3-4: OLSRv2 chooses better path
		if (step >= 3) {
			// Dim bad path
			['A-C', 'C-D'].forEach(pair => {
				const [from, to] = pair.split('-');
				svgEl.select(`.link-${from}-${to}`)
					.transition().duration(400)
					.attr('stroke-opacity', 0.2)
					.attr('stroke-width', 1);
				svgEl.select(`.quality-${from}-${to}`)
					.transition().duration(400)
					.attr('opacity', 0.3);
			});

			// Highlight good path
			['A-B', 'B-D'].forEach(pair => {
				const [from, to] = pair.split('-');
				svgEl.select(`.link-${from}-${to}`)
					.transition().duration(400)
					.attr('stroke', '#8ec07c')
					.attr('stroke-width', 5)
					.attr('stroke-opacity', 1);
			});
		}

		if (step === 4) {
			svgEl.select('.olsrv2-result').transition().duration(400).attr('opacity', 1);
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
		links.forEach(link => {
			const n1 = getNode(link.from);
			const n2 = getNode(link.to);

			svgEl.append('line')
				.attr('class', `link-${link.from}-${link.to}`)
				.attr('x1', n1.x).attr('y1', n1.y)
				.attr('x2', n2.x).attr('y2', n2.y)
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 2)
				.attr('stroke-opacity', 0.5);

			// Quality label
			const midX = (n1.x + n2.x) / 2;
			const midY = (n1.y + n2.y) / 2;
			const offsetY = link.from === 'A' && link.to === 'B' ? -12 :
			                link.from === 'A' && link.to === 'C' ? 15 :
			                link.from === 'B' ? -12 : 15;

			svgEl.append('text')
				.attr('class', `quality-${link.from}-${link.to}`)
				.attr('x', midX).attr('y', midY + offsetY)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text(link.label);
		});

		// Draw nodes
		nodes.forEach(n => {
			svgEl.append('circle')
				.attr('class', `node-${n.id}`)
				.attr('cx', n.x).attr('cy', n.y)
				.attr('r', 25)
				.attr('fill', n.id === 'A' ? '#fb4934' : n.id === 'D' ? '#8ec07c' : '#83a598')
				.attr('fill-opacity', 0.3)
				.attr('stroke', n.id === 'A' ? '#fb4934' : n.id === 'D' ? '#8ec07c' : '#83a598')
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
		});

		// OLSR result text
		svgEl.append('text')
			.attr('class', 'olsr-result')
			.attr('x', width / 2).attr('y', height - 45)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('OLSR: "Both are 2 hops, pick either"');

		// OLSRv2 result text
		svgEl.append('text')
			.attr('class', 'olsrv2-result')
			.attr('x', width / 2).attr('y', height - 20)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('OLSRv2: "Top path has 76% success, bottom has 12%"');

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
