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
	const width = 600;
	const height = 300;

	const titles = [
		'GSM vs LTE: Architecture comparison',
		'GSM: Many layers (hierarchical)',
		'LTE: Few layers (flat)',
		'Flat = Fewer hops = Lower latency'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.gsm-arch')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0.2);

		svgEl.select('.gsm-highlight')
			.transition().duration(400)
			.attr('opacity', step === 1 ? 1 : 0);

		svgEl.select('.lte-arch')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0.2);

		svgEl.select('.lte-highlight')
			.transition().duration(400)
			.attr('opacity', step === 2 ? 1 : 0);

		svgEl.select('.comparison')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);
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
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// ===== GSM Architecture (Left side) =====
		const gsmG = svgEl.append('g').attr('class', 'gsm-arch').attr('opacity', 0.2);
		const gsmX = 80;
		const gsmY = 70;
		const boxW = 50;
		const boxH = 30;
		const gapX = 20;

		// GSM label
		gsmG.append('text')
			.attr('x', 170).attr('y', gsmY - 15)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('GSM (Hierarchical)');

		const gsmNodes = [
			{ x: gsmX, y: gsmY, label: 'UE' },
			{ x: gsmX + boxW + gapX, y: gsmY, label: 'BTS' },
			{ x: gsmX + 2 * (boxW + gapX), y: gsmY, label: 'BSC' },
			{ x: gsmX + 3 * (boxW + gapX), y: gsmY, label: 'MSC' },
			{ x: gsmX + 4 * (boxW + gapX), y: gsmY, label: 'GMSC' }
		];

		gsmNodes.forEach((node, i) => {
			gsmG.append('rect')
				.attr('x', node.x).attr('y', node.y)
				.attr('width', boxW).attr('height', boxH)
				.attr('fill', '#fb4934').attr('fill-opacity', 0.3)
				.attr('stroke', '#fb4934').attr('stroke-width', 1)
				.attr('rx', 3);
			gsmG.append('text')
				.attr('x', node.x + boxW / 2).attr('y', node.y + boxH / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', '#fb4934')
				.attr('font-size', '9px').attr('font-weight', 'bold')
				.text(node.label);

			if (i < gsmNodes.length - 1) {
				gsmG.append('line')
					.attr('x1', node.x + boxW).attr('y1', node.y + boxH / 2)
					.attr('x2', gsmNodes[i + 1].x).attr('y2', gsmNodes[i + 1].y + boxH / 2)
					.attr('stroke', '#fb4934').attr('stroke-width', 2);
			}
		});

		// GSM hop count
		const gsmHighlight = svgEl.append('g').attr('class', 'gsm-highlight').attr('opacity', 0);
		gsmHighlight.append('text')
			.attr('x', 170).attr('y', gsmY + boxH + 25)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('5 nodes = 4 hops');
		gsmHighlight.append('text')
			.attr('x', 170).attr('y', gsmY + boxH + 40)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Latency: 100-200 ms');

		// ===== LTE Architecture (Right side) =====
		const lteG = svgEl.append('g').attr('class', 'lte-arch').attr('opacity', 0.2);
		const lteY = 170;
		const lteX = 130;

		// LTE label
		lteG.append('text')
			.attr('x', 300).attr('y', lteY - 15)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('LTE (Flat)');

		const lteNodes = [
			{ x: lteX, y: lteY, label: 'UE', w: 50 },
			{ x: lteX + 80, y: lteY, label: 'eNodeB', w: 65 },
			{ x: lteX + 175, y: lteY, label: 'S-GW', w: 55 },
			{ x: lteX + 260, y: lteY, label: 'P-GW', w: 55 }
		];

		lteNodes.forEach((node, i) => {
			lteG.append('rect')
				.attr('x', node.x).attr('y', node.y)
				.attr('width', node.w).attr('height', boxH)
				.attr('fill', '#8ec07c').attr('fill-opacity', 0.3)
				.attr('stroke', '#8ec07c').attr('stroke-width', 1)
				.attr('rx', 3);
			lteG.append('text')
				.attr('x', node.x + node.w / 2).attr('y', node.y + boxH / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
				.attr('font-size', '9px').attr('font-weight', 'bold')
				.text(node.label);

			if (i < lteNodes.length - 1) {
				lteG.append('line')
					.attr('x1', node.x + node.w).attr('y1', node.y + boxH / 2)
					.attr('x2', lteNodes[i + 1].x).attr('y2', lteNodes[i + 1].y + boxH / 2)
					.attr('stroke', '#8ec07c').attr('stroke-width', 2);
			}
		});

		// LTE hop count
		const lteHighlight = svgEl.append('g').attr('class', 'lte-highlight').attr('opacity', 0);
		lteHighlight.append('text')
			.attr('x', 300).attr('y', lteY + boxH + 25)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('4 nodes = 3 hops');
		lteHighlight.append('text')
			.attr('x', 300).attr('y', lteY + boxH + 40)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Latency: 30-50 ms');

		// ===== Comparison =====
		const comparison = svgEl.append('g').attr('class', 'comparison').attr('opacity', 0);

		comparison.append('rect')
			.attr('x', width / 2 - 120).attr('y', height - 48)
			.attr('width', 240).attr('height', 38)
			.attr('fill', colors.bg)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 4);

		comparison.append('text')
			.attr('x', width / 2).attr('y', height - 30)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('LTE: 3-4x lower latency!');

		comparison.append('text')
			.attr('x', width / 2).attr('y', height - 16)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Critical for real-time apps');

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
