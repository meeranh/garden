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

	const maxStep = 2;
	const width = 550;
	const height = 240;

	const titles = [
		'GSM spectrum divided into 200 kHz carriers',
		'Each carrier is one channel',
		'More spectrum = more carriers = more capacity',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Highlight individual carriers
		svgEl.selectAll('.carrier-box')
			.transition().duration(400)
			.attr('stroke-width', step >= 1 ? 2 : 1);

		// Show carrier labels
		svgEl.select('.carrier-labels')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// Show summary
		svgEl.select('.summary-group')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);
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

		const startX = 40;
		const carrierWidth = 55;
		const carrierHeight = 80;
		const carrierY = 70;
		const carrierColors = ['#fb4934', '#8ec07c', '#83a598', '#fabd2f', '#d3869b', '#fe8019', '#b8bb26', '#458588'];

		// Draw carriers
		for (let i = 0; i < 8; i++) {
			const x = startX + i * (carrierWidth + 4);

			svgEl.append('rect')
				.attr('class', 'carrier-box')
				.attr('x', x).attr('y', carrierY)
				.attr('width', carrierWidth).attr('height', carrierHeight)
				.attr('fill', carrierColors[i]).attr('fill-opacity', 0.3)
				.attr('stroke', carrierColors[i]).attr('stroke-width', 1)
				.attr('rx', 3);

			// Carrier number
			svgEl.append('text')
				.attr('x', x + carrierWidth / 2).attr('y', carrierY + carrierHeight / 2 + 5)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '12px').attr('font-weight', 'bold')
				.text(`C${i + 1}`);
		}

		// Bandwidth label
		svgEl.append('text')
			.attr('x', startX + carrierWidth / 2).attr('y', carrierY + carrierHeight + 20)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('200 kHz');

		// Bracket showing one carrier width
		svgEl.append('line')
			.attr('x1', startX).attr('y1', carrierY + carrierHeight + 8)
			.attr('x2', startX + carrierWidth).attr('y2', carrierY + carrierHeight + 8)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);

		svgEl.append('line')
			.attr('x1', startX).attr('y1', carrierY + carrierHeight + 5)
			.attr('x2', startX).attr('y2', carrierY + carrierHeight + 11)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);

		svgEl.append('line')
			.attr('x1', startX + carrierWidth).attr('y1', carrierY + carrierHeight + 5)
			.attr('x2', startX + carrierWidth).attr('y2', carrierY + carrierHeight + 11)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);

		// Dots indicating more carriers
		svgEl.append('text')
			.attr('x', startX + 8 * (carrierWidth + 4) + 10).attr('y', carrierY + carrierHeight / 2 + 5)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '14px')
			.text('...');

		// Carrier labels group
		const labelsG = svgEl.append('g').attr('class', 'carrier-labels').attr('opacity', 0);

		labelsG.append('text')
			.attr('x', width / 2).attr('y', carrierY - 15)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Each carrier = one 200 kHz channel');

		// Frequency axis
		svgEl.append('line')
			.attr('x1', startX - 10).attr('y1', carrierY + carrierHeight + 35)
			.attr('x2', width - 30).attr('y2', carrierY + carrierHeight + 35)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('marker-end', 'url(#arrowFreq)');

		svgEl.append('text')
			.attr('x', width - 25).attr('y', carrierY + carrierHeight + 40)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Frequency');

		// Summary
		const summaryG = svgEl.append('g').attr('class', 'summary-group').attr('opacity', 0);

		summaryG.append('rect')
			.attr('x', width / 2 - 130).attr('y', height - 45)
			.attr('width', 260).attr('height', 30)
			.attr('fill', colors.bg)
			.attr('stroke', '#8ec07c').attr('stroke-width', 1)
			.attr('rx', 4);

		summaryG.append('text')
			.attr('x', width / 2).attr('y', height - 25)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('25 MHz ÷ 0.2 MHz = 125 carriers');

		// Arrow marker
		const defs = svgEl.append('defs');
		defs.append('marker')
			.attr('id', 'arrowFreq')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5).attr('refY', 5)
			.attr('markerWidth', 4).attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', colors.fgMuted);

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
