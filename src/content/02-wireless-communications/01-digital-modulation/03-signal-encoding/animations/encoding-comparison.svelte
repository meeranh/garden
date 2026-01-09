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
	const width = 500;
	const height = 340;

	const bits = [1, 0, 1, 1, 0, 1];
	const bitWidth = 45;
	const startX = 120;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.nrz-group')
			.transition()
			.duration(500)
			.attr('opacity', step >= 1 ? 1 : 0.2);

		svgEl.select('.manchester-group')
			.transition()
			.duration(500)
			.attr('opacity', step >= 2 ? 1 : 0.2);

		svgEl.select('.ami-group')
			.transition()
			.duration(500)
			.attr('opacity', step >= 3 ? 1 : 0.2);

		const messages = [
			'Same bits, three different encodings',
			'NRZ: Simple but no self-clocking',
			'Manchester: Transition every bit = self-clocking',
			'AMI: Three levels, no DC component'
		];
		svgEl.select('.message').text(messages[step]);
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
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			accent: s.getPropertyValue('--color-accent').trim(),
			yellow: s.getPropertyValue('--color-math').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('Encoding Comparison');

		// Bit labels
		bits.forEach((bit, i) => {
			svgEl.append('text')
				.attr('x', startX + i * bitWidth + bitWidth / 2)
				.attr('y', 50)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '13px')
				.attr('font-weight', 'bold')
				.text(bit);
		});

		// === NRZ ===
		const nrzY = 90;
		const nrzHigh = nrzY - 20;
		const nrzLow = nrzY + 20;

		const nrzGroup = svgEl.append('g').attr('class', 'nrz-group').attr('opacity', 0.2);

		nrzGroup.append('text')
			.attr('x', 20)
			.attr('y', nrzY + 5)
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('NRZ');

		let nrzPath = `M ${startX} ${bits[0] === 1 ? nrzHigh : nrzLow}`;
		bits.forEach((bit, i) => {
			const y = bit === 1 ? nrzHigh : nrzLow;
			const x = startX + i * bitWidth;
			if (i > 0) {
				const prevY = bits[i - 1] === 1 ? nrzHigh : nrzLow;
				if (y !== prevY) {
					nrzPath += ` L ${x} ${prevY} L ${x} ${y}`;
				}
			}
			nrzPath += ` L ${x + bitWidth} ${y}`;
		});

		nrzGroup.append('path')
			.attr('d', nrzPath)
			.attr('fill', 'none')
			.attr('stroke', colors.accent)
			.attr('stroke-width', 2);

		// === Manchester ===
		const manY = 170;
		const manHigh = manY - 20;
		const manLow = manY + 20;

		const manGroup = svgEl.append('g').attr('class', 'manchester-group').attr('opacity', 0.2);

		manGroup.append('text')
			.attr('x', 20)
			.attr('y', manY + 5)
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Manchester');

		let manPath = '';
		bits.forEach((bit, i) => {
			const x = startX + i * bitWidth;
			const midX = x + bitWidth / 2;
			const endX = x + bitWidth;

			if (bit === 1) {
				if (i === 0) {
					manPath = `M ${x} ${manLow}`;
				} else {
					const prevBit = bits[i - 1];
					const prevEndY = prevBit === 1 ? manHigh : manLow;
					if (prevEndY !== manLow) {
						manPath += ` L ${x} ${manLow}`;
					}
				}
				manPath += ` L ${midX} ${manLow} L ${midX} ${manHigh} L ${endX} ${manHigh}`;
			} else {
				if (i === 0) {
					manPath = `M ${x} ${manHigh}`;
				} else {
					const prevBit = bits[i - 1];
					const prevEndY = prevBit === 1 ? manHigh : manLow;
					if (prevEndY !== manHigh) {
						manPath += ` L ${x} ${manHigh}`;
					}
				}
				manPath += ` L ${midX} ${manHigh} L ${midX} ${manLow} L ${endX} ${manLow}`;
			}
		});

		manGroup.append('path')
			.attr('d', manPath)
			.attr('fill', 'none')
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 2);

		// === AMI ===
		const amiY = 260;
		const amiPlus = amiY - 25;
		const amiZero = amiY;
		const amiMinus = amiY + 25;

		const amiGroup = svgEl.append('g').attr('class', 'ami-group').attr('opacity', 0.2);

		amiGroup.append('text')
			.attr('x', 20)
			.attr('y', amiY + 5)
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('AMI');

		let polarity = 1;
		const amiLevels: number[] = [];
		bits.forEach((bit) => {
			if (bit === 0) {
				amiLevels.push(0);
			} else {
				amiLevels.push(polarity);
				polarity *= -1;
			}
		});

		let amiPath = '';
		amiLevels.forEach((level, i) => {
			const x = startX + i * bitWidth;
			const endX = x + bitWidth;
			let y: number;

			if (level === 1) y = amiPlus;
			else if (level === -1) y = amiMinus;
			else y = amiZero;

			if (i === 0) {
				amiPath = `M ${x} ${amiZero} L ${x} ${y}`;
			} else {
				amiPath += ` L ${x} ${y}`;
			}
			amiPath += ` L ${endX} ${y}`;

			if (i < amiLevels.length - 1) {
				amiPath += ` L ${endX} ${amiZero}`;
			}
		});

		amiGroup.append('path')
			.attr('d', amiPath)
			.attr('fill', 'none')
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2);

		// Zero line for AMI
		amiGroup.append('line')
			.attr('x1', startX)
			.attr('x2', startX + bits.length * bitWidth)
			.attr('y1', amiZero)
			.attr('y2', amiZero)
			.attr('stroke', colors.border)
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '2,2');

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Same bits, three different encodings');

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
