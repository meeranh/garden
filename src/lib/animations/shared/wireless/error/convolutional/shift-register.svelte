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
	const width = 400;
	const height = 140;

	// Memory states at each step
	const memoryStates = [
		['', '', ''],      // Step 0: empty
		['1', '', ''],     // Step 1: first bit enters
		['0', '1', ''],    // Step 2: second bit, first shifts
		['1', '0', '1'],   // Step 3: third bit, all shift
		['1', '1', '0'],   // Step 4: fourth bit
	];

	const inputBits = ['', '1', '0', '1', '1'];
	const outputBits = ['', '1,1', '0,1', '1,0', '0,0'];

	const boxSize = 45;
	const memoryStartX = 120;
	const memoryY = 55;
	const gap = 10;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		const memory = memoryStates[step];

		svgEl.select('.title-text')
			.text(
				step === 0 ? 'Encoder has 3 memory slots (K-1 = 3)' :
				step === 1 ? 'Bit "1" enters → output generated' :
				step === 2 ? 'Bit "0" enters → previous bits shift right' :
				step === 3 ? 'Bit "1" enters → memory holds history' :
				'Each output uses current + memory bits'
			);

		// Update memory slots
		for (let i = 0; i < 3; i++) {
			const val = memory[i];
			const hasValue = val !== '';

			svgEl.select(`.mem-${i}`)
				.transition().duration(300)
				.attr('fill', hasValue ? '#fabd2f' : colors.fgMuted)
				.attr('opacity', hasValue ? 1 : 0.3);

			svgEl.select(`.mem-val-${i}`)
				.text(val)
				.attr('opacity', hasValue ? 1 : 0);
		}

		// Input bit
		svgEl.select('.input-bit')
			.text(inputBits[step])
			.attr('opacity', step > 0 ? 1 : 0);

		// Output
		svgEl.select('.output-bits')
			.text(outputBits[step])
			.attr('opacity', step > 0 ? 1 : 0);

		svgEl.select('.output-label')
			.attr('opacity', step > 0 ? 1 : 0.3);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1500);
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
			.text('Encoder has 3 memory slots (K-1 = 3)');

		// Input arrow and bit
		svgEl.append('text')
			.attr('x', 20).attr('y', memoryY + boxSize / 2 + 5)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('Input');

		svgEl.append('text')
			.attr('class', 'input-bit')
			.attr('x', 70).attr('y', memoryY + boxSize / 2 + 6)
			.attr('fill', '#8ec07c').attr('font-size', '16px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('');

		svgEl.append('text')
			.attr('x', 95).attr('y', memoryY + boxSize / 2 + 5)
			.attr('fill', colors.fgMuted).attr('font-size', '14px')
			.text('→');

		// Memory slots
		for (let i = 0; i < 3; i++) {
			const x = memoryStartX + i * (boxSize + gap);

			svgEl.append('rect')
				.attr('class', `mem-${i}`)
				.attr('x', x).attr('y', memoryY)
				.attr('width', boxSize).attr('height', boxSize)
				.attr('fill', colors.fgMuted).attr('rx', 4)
				.attr('opacity', 0.3);

			svgEl.append('text')
				.attr('class', `mem-val-${i}`)
				.attr('x', x + boxSize / 2).attr('y', memoryY + boxSize / 2 + 7)
				.attr('text-anchor', 'middle').attr('fill', colors.bg)
				.attr('font-size', '18px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text('');

			// Slot label
			svgEl.append('text')
				.attr('x', x + boxSize / 2).attr('y', memoryY + boxSize + 15)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(i === 0 ? 'newest' : i === 2 ? 'oldest' : '');
		}

		// Arrow to output
		svgEl.append('text')
			.attr('x', memoryStartX + 3 * (boxSize + gap) + 5).attr('y', memoryY + boxSize / 2 + 5)
			.attr('fill', colors.fgMuted).attr('font-size', '14px')
			.text('→');

		// Output
		svgEl.append('text')
			.attr('class', 'output-label')
			.attr('x', 340).attr('y', memoryY + boxSize / 2 - 5)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.attr('opacity', 0.3)
			.text('Output');

		svgEl.append('text')
			.attr('class', 'output-bits')
			.attr('x', 340).attr('y', memoryY + boxSize / 2 + 12)
			.attr('fill', '#83a598').attr('font-size', '14px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('');

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
