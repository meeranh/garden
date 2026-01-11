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
	const width = 500;
	const height = 200;

	// Correct codeword: 1 1 1 0 0 0 1 1 1 0 1 1 0 1 1
	// Error at position 10: bit flips from 0 to 1
	const correct =  [1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1];
	const received = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1];
	const errorPos = 10;

	const p1Covers = [1, 3, 5, 7, 9, 11, 13, 15];
	const p2Covers = [2, 3, 6, 7, 10, 11, 14, 15];
	const p4Covers = [4, 5, 6, 7, 12, 13, 14, 15];
	const p8Covers = [8, 9, 10, 11, 12, 13, 14, 15];

	const boxSize = 26;
	const startX = 20;
	const boxY = 45;
	const gap = 5;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show received codeword, highlight error
		// Step 1: Check P1 - ok
		// Step 2: Check P2 - error!
		// Step 3: Check P4 - ok
		// Step 4: Check P8 - error!
		// Step 5: Show syndrome = 2 + 8 = 10, correct it

		const activeCovers = step === 1 ? p1Covers : step === 2 ? p2Covers : step === 3 ? p4Covers : step === 4 ? p8Covers : [];

		svgEl.select('.title-text')
			.text(
				step === 0 ? 'Received with error at position 10' :
				step === 1 ? 'P1 check (1,3,5,7,9,11,13,15): 1+1+0+1+1+1+0+1 = 6 ✓ even' :
				step === 2 ? 'P2 check (2,3,6,7,10,11,14,15): 1+1+0+1+1+1+1+1 = 7 ✗ odd!' :
				step === 3 ? 'P4 check (4,5,6,7,12,13,14,15): 0+0+0+1+1+0+1+1 = 4 ✓ even' :
				step === 4 ? 'P8 check (8,9,10,11,12,13,14,15): 1+1+1+1+1+0+1+1 = 7 ✗ odd!' :
				'Syndrome: P2 + P8 = 2 + 8 = 10 → Flip bit 10!'
			)
			.attr('fill',
				step === 2 || step === 4 ? '#fb4934' :
				step === 5 ? '#8ec07c' :
				colors.fg
			);

		received.forEach((bit, i) => {
			const pos = i + 1;
			const inGroup = activeCovers.includes(pos);
			const isError = pos === errorPos;

			let fillColor = colors.fgMuted;
			let opacity = 0.4;
			let bitValue = bit;

			if (step === 0 && isError) {
				fillColor = '#fb4934';
				opacity = 1;
			} else if (step >= 1 && step <= 4 && inGroup) {
				fillColor = step === 2 || step === 4 ? '#fb4934' : '#8ec07c';
				opacity = 1;
			} else if (step === 5) {
				if (isError) {
					fillColor = '#8ec07c';
					opacity = 1;
					bitValue = 0; // Corrected!
				}
			}

			svgEl.select(`.box-${pos}`)
				.transition().duration(300)
				.attr('fill', fillColor)
				.attr('opacity', opacity);

			svgEl.select(`.bit-${pos}`)
				.transition().duration(300)
				.text(step === 5 && isError ? '0' : bit);
		});

		// Status indicators
		svgEl.select('.p1-status').attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.p2-status').attr('opacity', step >= 2 ? 1 : 0);
		svgEl.select('.p4-status').attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.p8-status').attr('opacity', step >= 4 ? 1 : 0);
		svgEl.select('.result-group').attr('opacity', step >= 5 ? 1 : 0);
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
			.text('Received with error at position 10');

		// Position labels row
		received.forEach((bit, i) => {
			const pos = i + 1;
			const x = startX + i * (boxSize + gap);

			// Position number
			svgEl.append('text')
				.attr('x', x + boxSize / 2).attr('y', boxY - 5)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '8px').attr('font-family', 'monospace')
				.text(pos);

			// Box
			svgEl.append('rect')
				.attr('class', `box-${pos}`)
				.attr('x', x).attr('y', boxY)
				.attr('width', boxSize).attr('height', boxSize)
				.attr('fill', colors.fgMuted).attr('rx', 3)
				.attr('opacity', 0.4);

			// Bit value
			svgEl.append('text')
				.attr('class', `bit-${pos}`)
				.attr('x', x + boxSize / 2).attr('y', boxY + boxSize / 2 + 5)
				.attr('text-anchor', 'middle').attr('fill', colors.bg)
				.attr('font-size', '13px').attr('font-weight', 'bold').attr('font-family', 'monospace')
				.text(bit);
		});

		// Status row
		const statusY = 115;

		svgEl.append('text')
			.attr('class', 'p1-status')
			.attr('x', 50).attr('y', statusY)
			.attr('fill', '#8ec07c').attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('P1: ✓');

		svgEl.append('text')
			.attr('class', 'p2-status')
			.attr('x', 130).attr('y', statusY)
			.attr('fill', '#fb4934').attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('P2: ✗ (+2)');

		svgEl.append('text')
			.attr('class', 'p4-status')
			.attr('x', 230).attr('y', statusY)
			.attr('fill', '#8ec07c').attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('P4: ✓');

		svgEl.append('text')
			.attr('class', 'p8-status')
			.attr('x', 310).attr('y', statusY)
			.attr('fill', '#fb4934').attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('P8: ✗ (+8)');

		svgEl.append('text')
			.attr('x', 410).attr('y', statusY)
			.attr('fill', '#fabd2f').attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.attr('class', 'result-group')
			.text('= 10');

		// Result box
		const resultGroup = svgEl.append('g').attr('class', 'result-group').attr('opacity', 0);

		resultGroup.append('rect')
			.attr('x', 50).attr('y', 140)
			.attr('width', 400).attr('height', 35)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.15)
			.attr('stroke', '#8ec07c').attr('stroke-width', 1)
			.attr('rx', 4);

		resultGroup.append('text')
			.attr('x', width / 2).attr('y', 163)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('Error at position 10! Flip 1→0. Corrected!');

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
