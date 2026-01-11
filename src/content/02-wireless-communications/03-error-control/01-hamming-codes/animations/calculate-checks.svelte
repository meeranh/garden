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
	const height = 160;

	// Data: 10011011011 placed at positions 3,5,6,7,9,10,11,12,13,14,15
	// Check bits at 1,2,4,8
	const positions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
	const dataBits: Record<number, number> = {
		3: 1, 5: 0, 6: 0, 7: 1, 9: 1, 10: 0, 11: 1, 12: 1, 13: 0, 14: 1, 15: 1
	};
	const checkBits: Record<number, number> = { 1: 1, 2: 1, 4: 0, 8: 1 };

	const p1Covers = [1, 3, 5, 7, 9, 11, 13, 15];
	const p2Covers = [2, 3, 6, 7, 10, 11, 14, 15];
	const p4Covers = [4, 5, 6, 7, 12, 13, 14, 15];
	const p8Covers = [8, 9, 10, 11, 12, 13, 14, 15];

	const boxSize = 26;
	const startX = 20;
	const boxY = 50;
	const gap = 5;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function getBitValue(pos: number, step: number): string {
		if (dataBits[pos] !== undefined) return String(dataBits[pos]);
		// Check bits
		if (pos === 1) return step >= 1 ? '1' : '?';
		if (pos === 2) return step >= 2 ? '1' : '?';
		if (pos === 4) return step >= 3 ? '0' : '?';
		if (pos === 8) return step >= 4 ? '1' : '?';
		return '?';
	}

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show data placed, check bits are ?
		// Step 1: Calculate P1 - highlight positions, show result
		// Step 2: Calculate P2
		// Step 3: Calculate P4
		// Step 4: Calculate P8
		// Step 5: Show complete codeword

		const activeCovers = step === 1 ? p1Covers : step === 2 ? p2Covers : step === 3 ? p4Covers : step === 4 ? p8Covers : [];
		const activeCheck = step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 4 : step === 4 ? 8 : 0;

		// Title
		svgEl.select('.title-text')
			.text(
				step === 0 ? 'Data placed. Now calculate check bits...' :
				step === 1 ? 'P1: positions 1,3,5,7,9,11,13,15 → ?+1+0+1+1+1+0+1 = 5 (odd) → P1=1' :
				step === 2 ? 'P2: positions 2,3,6,7,10,11,14,15 → ?+1+0+1+0+1+1+1 = 5 (odd) → P2=1' :
				step === 3 ? 'P4: positions 4,5,6,7,12,13,14,15 → ?+0+0+1+1+0+1+1 = 4 (even) → P4=0' :
				step === 4 ? 'P8: positions 8,9,10,11,12,13,14,15 → ?+1+0+1+1+0+1+1 = 5 (odd) → P8=1' :
				'Complete! Codeword: 110001110110111'
			)
			.attr('fill', step === 5 ? '#8ec07c' : colors.fg);

		positions.forEach((pos) => {
			const inGroup = activeCovers.includes(pos);
			const isCheckPos = [1, 2, 4, 8].includes(pos);
			const isActiveCheck = pos === activeCheck;

			let fillColor = colors.fgMuted;
			let opacity = 0.4;

			if (step >= 1 && step <= 4 && inGroup) {
				fillColor = '#fabd2f';
				opacity = 1;
			}
			if (step === 5) {
				fillColor = isCheckPos ? '#fabd2f' : '#83a598';
				opacity = 1;
			}

			svgEl.select(`.box-${pos}`)
				.transition().duration(300)
				.attr('fill', fillColor)
				.attr('opacity', opacity);

			// Update bit value
			svgEl.select(`.bit-${pos}`)
				.transition().duration(300)
				.text(getBitValue(pos, step))
				.attr('fill', getBitValue(pos, step) === '?' ? colors.fgMuted : colors.bg);
		});

		// Result indicators
		svgEl.select('.p1-result').attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.p2-result').attr('opacity', step >= 2 ? 1 : 0);
		svgEl.select('.p4-result').attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.p8-result').attr('opacity', step >= 4 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2000);
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
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Data placed. Now calculate check bits...');

		// Position boxes
		positions.forEach((pos, i) => {
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
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '12px').attr('font-weight', 'bold').attr('font-family', 'monospace')
				.text(getBitValue(pos, 0));
		});

		// Result indicators
		const resultY = 115;

		svgEl.append('text')
			.attr('class', 'p1-result')
			.attr('x', 60).attr('y', resultY)
			.attr('fill', '#fabd2f').attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('P1=1');

		svgEl.append('text')
			.attr('class', 'p2-result')
			.attr('x', 150).attr('y', resultY)
			.attr('fill', '#fabd2f').attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('P2=1');

		svgEl.append('text')
			.attr('class', 'p4-result')
			.attr('x', 240).attr('y', resultY)
			.attr('fill', '#fabd2f').attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('P4=0');

		svgEl.append('text')
			.attr('class', 'p8-result')
			.attr('x', 330).attr('y', resultY)
			.attr('fill', '#fabd2f').attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('P8=1');

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 10)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Each check bit makes its group have an even number of 1s');

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
