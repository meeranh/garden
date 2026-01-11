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

	const maxStep = 12;
	const width = 450;
	const height = 240;

	const slotValues = [
		[0, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0],
		[1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0],
		[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0],
	];

	const titles = [
		'Start: all slots are 0',
		'Input bit "1" enters slot 0',
		'G₀ = 1101 → look at slots 0, 2, 3 (where the 1s are)',
		'Slots 0,2,3 have: 1,0,0 → XOR them: 1⊕0⊕0 = 1',
		'G₁ = 1110 → look at slots 0, 1, 2 (where the 1s are)',
		'Slots 0,1,2 have: 1,0,0 → XOR them: 1⊕0⊕0 = 1',
		'First input done! Output so far: 11',
		'Input bit "0" enters, old bits shift right',
		'G₀ = 1101 → look at slots 0, 2, 3',
		'Slots 0,2,3 have: 0,0,0 → XOR them: 0⊕0⊕0 = 0',
		'G₁ = 1110 → look at slots 0, 1, 2',
		'Slots 0,1,2 have: 0,1,0 → XOR them: 0⊕1⊕0 = 1',
		'Done! Input "10" → Output "1101"'
	];

	const g0Slots = [0, 2, 3];
	const g1Slots = [0, 1, 2];

	const boxSize = 45;
	const slotStartX = 120;
	const slotY = 75;
	const gap = 12;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		const slots = slotValues[step];

		svgEl.select('.title-text').text(titles[step]);

		let highlightSlots: number[] = [];
		let highlightColor = colors.fgMuted;
		let activePolynomial = '';

		if (step === 2 || step === 3 || step === 8 || step === 9) {
			highlightSlots = g0Slots;
			highlightColor = '#fabd2f';
			activePolynomial = 'g0';
		} else if (step === 4 || step === 5 || step === 10 || step === 11) {
			highlightSlots = g1Slots;
			highlightColor = '#83a598';
			activePolynomial = 'g1';
		}

		const isNewInput = step === 1 || step === 7;

		// Update polynomial display
		svgEl.select('.poly-g0')
			.attr('opacity', activePolynomial === 'g0' ? 1 : 0.4)
			.attr('font-weight', activePolynomial === 'g0' ? 'bold' : 'normal');
		svgEl.select('.poly-g1')
			.attr('opacity', activePolynomial === 'g1' ? 1 : 0.4)
			.attr('font-weight', activePolynomial === 'g1' ? 'bold' : 'normal');

		// Update slots
		for (let i = 0; i < 4; i++) {
			const val = slots[i];
			const isHighlighted = highlightSlots.includes(i);
			const isNew = isNewInput && i === 0;

			let fill = colors.fgMuted;
			let opacity = 0.4;

			if (isHighlighted) {
				fill = highlightColor;
				opacity = 1;
			} else if (isNew) {
				fill = '#8ec07c';
				opacity = 1;
			} else if (val === 1) {
				opacity = 0.7;
			}

			svgEl.select(`.slot-${i}`)
				.transition().duration(300)
				.attr('fill', fill)
				.attr('opacity', opacity);

			svgEl.select(`.val-${i}`).text(val);

			// Show arrows from polynomial to slots
			svgEl.select(`.arrow-g0-${i}`)
				.attr('opacity', activePolynomial === 'g0' && g0Slots.includes(i) ? 1 : 0);
			svgEl.select(`.arrow-g1-${i}`)
				.attr('opacity', activePolynomial === 'g1' && g1Slots.includes(i) ? 1 : 0);
		}

		// Input arrow
		svgEl.select('.input-arrow')
			.attr('opacity', isNewInput ? 1 : 0);
		svgEl.select('.input-bit-text')
			.text(step === 1 ? '1' : step === 7 ? '0' : '')
			.attr('opacity', isNewInput ? 1 : 0);

		// Output display
		let g0Out = '';
		let g1Out = '';
		if (step >= 3) g0Out = '1';
		if (step >= 5) g1Out = '1';
		if (step >= 9) g0Out = '1, 0';
		if (step >= 11) g1Out = '1, 1';

		svgEl.select('.g0-output').text(g0Out);
		svgEl.select('.g1-output').text(g1Out);

		let combined = '';
		if (step >= 6) combined = '11';
		if (step >= 12) combined = '11 01 = 1101';
		svgEl.select('.combined-output').text(combined);

		svgEl.select('.result-box')
			.transition().duration(300)
			.attr('opacity', step >= 12 ? 1 : 0);
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
			.attr('x', width / 2).attr('y', 20)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// Polynomial labels on left
		svgEl.append('text')
			.attr('class', 'poly-g0')
			.attr('x', 15).attr('y', 50)
			.attr('fill', '#fabd2f').attr('font-size', '10px')
			.attr('opacity', 0.4)
			.text('G₀=1101');

		svgEl.append('text')
			.attr('class', 'poly-g1')
			.attr('x', 15).attr('y', 65)
			.attr('fill', '#83a598').attr('font-size', '10px')
			.attr('opacity', 0.4)
			.text('G₁=1110');

		// Explanation
		svgEl.append('text')
			.attr('x', 15).attr('y', 85)
			.attr('fill', colors.fgMuted).attr('font-size', '8px')
			.text('1 = use slot');
		svgEl.append('text')
			.attr('x', 15).attr('y', 95)
			.attr('fill', colors.fgMuted).attr('font-size', '8px')
			.text('0 = skip');

		// Input arrow and bit
		svgEl.append('text')
			.attr('class', 'input-bit-text')
			.attr('x', slotStartX - 35).attr('y', slotY + boxSize / 2 + 5)
			.attr('fill', '#8ec07c').attr('font-size', '14px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('');

		svgEl.append('text')
			.attr('class', 'input-arrow')
			.attr('x', slotStartX - 18).attr('y', slotY + boxSize / 2 + 5)
			.attr('fill', colors.fgMuted).attr('font-size', '12px')
			.attr('opacity', 0)
			.text('→');

		// Slot boxes
		for (let i = 0; i < 4; i++) {
			const x = slotStartX + i * (boxSize + gap);

			svgEl.append('text')
				.attr('x', x + boxSize / 2).attr('y', slotY - 8)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`Slot ${i}`);

			svgEl.append('rect')
				.attr('class', `slot-${i}`)
				.attr('x', x).attr('y', slotY)
				.attr('width', boxSize).attr('height', boxSize)
				.attr('fill', colors.fgMuted).attr('rx', 4)
				.attr('opacity', 0.4);

			svgEl.append('text')
				.attr('class', `val-${i}`)
				.attr('x', x + boxSize / 2).attr('y', slotY + boxSize / 2 + 7)
				.attr('text-anchor', 'middle').attr('fill', colors.bg)
				.attr('font-size', '18px').attr('font-weight', 'bold')
				.text('0');

			// Arrows from G0 (yellow, from above)
			if (g0Slots.includes(i)) {
				svgEl.append('text')
					.attr('class', `arrow-g0-${i}`)
					.attr('x', x + boxSize / 2).attr('y', slotY - 15)
					.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
					.attr('font-size', '10px')
					.attr('opacity', 0)
					.text('↓');
			}

			// Arrows from G1 (blue, from below)
			if (g1Slots.includes(i)) {
				svgEl.append('text')
					.attr('class', `arrow-g1-${i}`)
					.attr('x', x + boxSize / 2).attr('y', slotY + boxSize + 15)
					.attr('text-anchor', 'middle').attr('fill', '#83a598')
					.attr('font-size', '10px')
					.attr('opacity', 0)
					.text('↑');
			}
		}

		// Output section
		const outputY = slotY + boxSize + 45;

		svgEl.append('text')
			.attr('x', slotStartX).attr('y', outputY)
			.attr('fill', '#fabd2f').attr('font-size', '10px')
			.text('G₀ outputs:');

		svgEl.append('text')
			.attr('class', 'g0-output')
			.attr('x', slotStartX + 65).attr('y', outputY)
			.attr('fill', '#fabd2f').attr('font-size', '11px').attr('font-weight', 'bold')
			.text('');

		svgEl.append('text')
			.attr('x', slotStartX + 110).attr('y', outputY)
			.attr('fill', '#83a598').attr('font-size', '10px')
			.text('G₁ outputs:');

		svgEl.append('text')
			.attr('class', 'g1-output')
			.attr('x', slotStartX + 175).attr('y', outputY)
			.attr('fill', '#83a598').attr('font-size', '11px').attr('font-weight', 'bold')
			.text('');

		// Combined output
		svgEl.append('text')
			.attr('x', slotStartX).attr('y', outputY + 20)
			.attr('fill', colors.fgMuted).attr('font-size', '10px')
			.text('Combined:');

		svgEl.append('text')
			.attr('class', 'combined-output')
			.attr('x', slotStartX + 65).attr('y', outputY + 20)
			.attr('fill', '#8ec07c').attr('font-size', '11px').attr('font-weight', 'bold')
			.text('');

		svgEl.append('rect')
			.attr('class', 'result-box')
			.attr('x', slotStartX + 55).attr('y', outputY + 6)
			.attr('width', 120).attr('height', 22)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.2)
			.attr('stroke', '#8ec07c').attr('stroke-width', 1)
			.attr('rx', 4)
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
