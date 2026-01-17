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
	const width = 620;
	const height = 280;

	const titles = [
		'Two Ways to Combine Channels',
		'Intra-band: Same frequency band',
		'Inter-band: Different frequency bands'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.intra-section').transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0.3);
		svgEl.select('.intra-highlight').transition().duration(400)
			.attr('opacity', step === 1 ? 1 : 0);

		svgEl.select('.inter-section').transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0.3);
		svgEl.select('.inter-highlight').transition().duration(400)
			.attr('opacity', step === 2 ? 1 : 0);
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
			.attr('x', width / 2).attr('y', 28)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text(titles[0]);

		const boxWidth = 240;
		const boxHeight = 180;
		const leftX = 50;
		const rightX = 330;
		const topY = 55;

		// ===== INTRA-BAND (Left side) =====
		const intraSection = svgEl.append('g').attr('class', 'intra-section').attr('opacity', 0.3);

		// Label
		intraSection.append('text')
			.attr('x', leftX + boxWidth / 2).attr('y', topY)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('INTRA-BAND');

		// Band box (one color)
		intraSection.append('rect')
			.attr('x', leftX).attr('y', topY + 15)
			.attr('width', boxWidth).attr('height', boxHeight - 40)
			.attr('fill', '#8ec07c')
			.attr('fill-opacity', 0.1)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);

		intraSection.append('text')
			.attr('x', leftX + boxWidth / 2).attr('y', topY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Band A');

		// Channels inside (all same color)
		const intraChannelY = topY + 55;
		for (let i = 0; i < 3; i++) {
			intraSection.append('rect')
				.attr('x', leftX + 20 + i * 70)
				.attr('y', intraChannelY)
				.attr('width', 60)
				.attr('height', 70)
				.attr('fill', '#8ec07c')
				.attr('fill-opacity', 0.4)
				.attr('stroke', '#8ec07c')
				.attr('stroke-width', 2)
				.attr('rx', 4);

			intraSection.append('text')
				.attr('x', leftX + 50 + i * 70)
				.attr('y', intraChannelY + 40)
				.attr('text-anchor', 'middle')
				.attr('fill', '#8ec07c')
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text('20');

			intraSection.append('text')
				.attr('x', leftX + 50 + i * 70)
				.attr('y', intraChannelY + 55)
				.attr('text-anchor', 'middle')
				.attr('fill', '#8ec07c')
				.attr('font-size', '9px')
				.text('MHz');
		}

		// Description
		intraSection.append('text')
			.attr('x', leftX + boxWidth / 2).attr('y', topY + boxHeight - 5)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('All channels from same band');

		// Highlight box - positioned below the title
		svgEl.append('rect')
			.attr('class', 'intra-highlight')
			.attr('x', leftX - 5).attr('y', topY + 5)
			.attr('width', boxWidth + 10).attr('height', boxHeight - 15)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 3)
			.attr('rx', 10)
			.attr('opacity', 0);

		// ===== INTER-BAND (Right side) =====
		const interSection = svgEl.append('g').attr('class', 'inter-section').attr('opacity', 0.3);

		// Label
		interSection.append('text')
			.attr('x', rightX + boxWidth / 2).attr('y', topY)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('INTER-BAND');

		// Band A box
		interSection.append('rect')
			.attr('x', rightX).attr('y', topY + 15)
			.attr('width', 110).attr('height', boxHeight - 60)
			.attr('fill', '#8ec07c')
			.attr('fill-opacity', 0.1)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);

		interSection.append('text')
			.attr('x', rightX + 55).attr('y', topY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Band A');

		// Band B box
		interSection.append('rect')
			.attr('x', rightX + 130).attr('y', topY + 15)
			.attr('width', 110).attr('height', boxHeight - 60)
			.attr('fill', '#83a598')
			.attr('fill-opacity', 0.1)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 8);

		interSection.append('text')
			.attr('x', rightX + 185).attr('y', topY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.text('Band B');

		// Channel in Band A (green)
		const interChannelY = topY + 55;
		interSection.append('rect')
			.attr('x', rightX + 25)
			.attr('y', interChannelY)
			.attr('width', 60)
			.attr('height', 50)
			.attr('fill', '#8ec07c')
			.attr('fill-opacity', 0.4)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('rx', 4);

		interSection.append('text')
			.attr('x', rightX + 55)
			.attr('y', interChannelY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('20 MHz');

		// Channels in Band B (blue)
		for (let i = 0; i < 2; i++) {
			interSection.append('rect')
				.attr('x', rightX + 140 + i * 40)
				.attr('y', interChannelY)
				.attr('width', 35)
				.attr('height', 50)
				.attr('fill', '#83a598')
				.attr('fill-opacity', 0.4)
				.attr('stroke', '#83a598')
				.attr('stroke-width', 2)
				.attr('rx', 4);
		}

		interSection.append('text')
			.attr('x', rightX + 177)
			.attr('y', interChannelY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '9px')
			.attr('font-weight', 'bold')
			.text('40 MHz');

		// Plus sign between bands
		interSection.append('text')
			.attr('x', rightX + 120)
			.attr('y', interChannelY + 30)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '16px')
			.attr('font-weight', 'bold')
			.text('+');

		// Description
		interSection.append('text')
			.attr('x', rightX + boxWidth / 2).attr('y', topY + boxHeight - 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Channels from different bands');

		interSection.append('text')
			.attr('x', rightX + boxWidth / 2).attr('y', topY + boxHeight - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('(More common!)');

		// Highlight box - positioned below the title, includes all text
		svgEl.append('rect')
			.attr('class', 'inter-highlight')
			.attr('x', rightX - 5).attr('y', topY + 5)
			.attr('width', boxWidth + 10).attr('height', boxHeight)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 3)
			.attr('rx', 10)
			.attr('opacity', 0);

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
