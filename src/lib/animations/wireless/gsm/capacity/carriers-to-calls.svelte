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
	const width = 600;
	const height = 320;

	const titles = [
		'One cell has 5 carriers',
		'Each carrier has 8 TDMA time slots',
		'5 carriers × 8 slots = 40 total',
		'Some slots reserved for control',
		'~38 speech calls per cell!',
	];

	const carrierColors = ['#fb4934', '#8ec07c', '#83a598', '#fabd2f', '#d3869b'];
	const slotColors = ['#fb4934', '#8ec07c', '#83a598', '#fabd2f', '#d3869b', '#fe8019', '#b8bb26', '#458588'];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Show TDMA expansion
		svgEl.select('.slots-group')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// Show expansion brackets
		svgEl.select('.brackets-group')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// Show total count
		svgEl.select('.total-label')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Dim control channel slots
		if (step >= 3) {
			// Dim first 2 slots of first carrier (control channels)
			svgEl.selectAll('.slot-box').each(function(_, i) {
				const isControl = i < 2; // First 2 slots are control
				d3.select(this)
					.transition().duration(400)
					.attr('fill-opacity', isControl ? 0.15 : 0.5)
					.attr('stroke-opacity', isControl ? 0.3 : 1);
			});
			svgEl.select('.control-label')
				.transition().duration(400)
				.attr('opacity', 1);
		} else {
			svgEl.selectAll('.slot-box')
				.transition().duration(400)
				.attr('fill-opacity', 0.5)
				.attr('stroke-opacity', 1);
			svgEl.select('.control-label')
				.transition().duration(400)
				.attr('opacity', 0);
		}

		// Show final result
		svgEl.select('.result-group')
			.transition().duration(400)
			.attr('opacity', step >= 4 ? 1 : 0);
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
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text(titles[0]);

		// 5 carriers on the left
		const carrierX = 40;
		const carrierY = 55;
		const carrierW = 60;
		const carrierH = 38;
		const carrierGap = 8;

		for (let i = 0; i < 5; i++) {
			const y = carrierY + i * (carrierH + carrierGap);

			svgEl.append('rect')
				.attr('x', carrierX).attr('y', y)
				.attr('width', carrierW).attr('height', carrierH)
				.attr('fill', carrierColors[i]).attr('fill-opacity', 0.4)
				.attr('stroke', carrierColors[i]).attr('stroke-width', 2)
				.attr('rx', 4);

			svgEl.append('text')
				.attr('x', carrierX + carrierW / 2).attr('y', y + carrierH / 2 + 5)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(`C${i + 1}`);
		}

		// "5 carriers" label
		svgEl.append('text')
			.attr('x', carrierX + carrierW / 2).attr('y', carrierY + 5 * (carrierH + carrierGap) + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('5 carriers');

		// Expansion brackets
		const bracketsG = svgEl.append('g').attr('class', 'brackets-group').attr('opacity', 0);

		// Slots group (8 slots per carrier = 40 total, arranged in 5 rows of 8)
		const slotsG = svgEl.append('g').attr('class', 'slots-group').attr('opacity', 0);
		const slotStartX = 150;
		const slotW = 50;
		const slotH = 32;
		const slotGapX = 4;
		const slotGapY = 14;

		for (let row = 0; row < 5; row++) {
			const rowY = carrierY + row * (carrierH + carrierGap) + (carrierH - slotH) / 2;

			// Draw bracket from carrier to slots
			bracketsG.append('path')
				.attr('d', `M ${carrierX + carrierW + 5} ${carrierY + row * (carrierH + carrierGap) + carrierH / 2}
				            L ${slotStartX - 10} ${rowY + slotH / 2}`)
				.attr('fill', 'none')
				.attr('stroke', carrierColors[row]).attr('stroke-width', 1)
				.attr('stroke-dasharray', '3,2');

			// 8 slots per row
			for (let col = 0; col < 8; col++) {
				const x = slotStartX + col * (slotW + slotGapX);
				const slotIndex = row * 8 + col;

				slotsG.append('rect')
					.attr('class', 'slot-box')
					.attr('data-index', slotIndex)
					.attr('x', x).attr('y', rowY)
					.attr('width', slotW).attr('height', slotH)
					.attr('fill', slotColors[col]).attr('fill-opacity', 0.5)
					.attr('stroke', slotColors[col]).attr('stroke-width', 1)
					.attr('rx', 2);

				// Only label first row
				if (row === 0) {
					slotsG.append('text')
						.attr('x', x + slotW / 2).attr('y', rowY - 5)
						.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
						.attr('font-size', '8px')
						.text(`TS${col}`);
				}
			}
		}

		// "×8" label
		slotsG.append('text')
			.attr('x', slotStartX + 4 * (slotW + slotGapX)).attr('y', carrierY + 5 * (carrierH + carrierGap) + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('8 slots each');

		// Total label
		svgEl.append('text')
			.attr('class', 'total-label')
			.attr('x', slotStartX + 8 * (slotW + slotGapX) + 15)
			.attr('y', carrierY + 2.5 * (carrierH + carrierGap))
			.attr('text-anchor', 'start').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('= 40');

		// Control channel label
		svgEl.append('text')
			.attr('class', 'control-label')
			.attr('x', slotStartX + slotW).attr('y', carrierY - 18)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('control');

		// Result group
		const resultG = svgEl.append('g').attr('class', 'result-group').attr('opacity', 0);

		resultG.append('rect')
			.attr('x', width / 2 - 110).attr('y', height - 45)
			.attr('width', 220).attr('height', 32)
			.attr('fill', colors.bg)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 4);

		resultG.append('text')
			.attr('x', width / 2).attr('y', height - 24)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('40 − 2 control ≈ 38 calls');

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
