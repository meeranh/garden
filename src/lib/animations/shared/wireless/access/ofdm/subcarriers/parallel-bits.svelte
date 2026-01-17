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
	let animationId: number;
	let transmitCol = 0;
	let lastTransmit = 0;

	const maxStep = 2;
	const width = 420;
	const height = 240;

	// 12 bits split across 4 frequencies, 3 bits each
	const frequencies = [
		['1', '0', '1'],
		['1', '0', '0'],
		['1', '1', '1'],
		['0', '1', '0']
	];
	const freqColors = ['#fb4934', '#b8bb26', '#83a598', '#d3869b'];
	const bitWidth = 50;
	const bitHeight = 28;
	const startX = 100;
	const startY = 55;
	const rowGap = 35;

	let bitElements: SVGGElement[][] = [];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.grid-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.bits-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.timing-label')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		if (step === 1) {
			transmitCol = 0;
		}

		const messages = [
			'',
			'',
			''
		];
		svgEl.select('.message').text(messages[step]);
	}

	function animate() {
		const now = Date.now();

		// Animate column-by-column transmission
		if (currentStep >= 1 && now - lastTransmit > 500) {
			lastTransmit = now;
			transmitCol = (transmitCol + 1) % 3;

			// Highlight current column across all frequencies
			bitElements.forEach((row, r) => {
				row.forEach((el, c) => {
					const isActive = c === transmitCol;
					d3.select(el).select('rect')
						.attr('stroke', isActive ? '#fabd2f' : 'none')
						.attr('stroke-width', isActive ? 3 : 0);
				});
			});

			// Update column indicator
			const indicatorX = startX + transmitCol * bitWidth + bitWidth / 2;
			svgEl.select('.col-indicator')
				.attr('x1', indicatorX)
				.attr('x2', indicatorX)
				.attr('opacity', 1);
		}

		animationId = requestAnimationFrame(animate);
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
	function replay() { pause(); currentStep = 0; transmitCol = 0; applyStep(0); isPlaying = true; runAnimation(); }
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
			.attr('y', 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('Parallel Transmission: Four Frequencies');

		// Grid group
		const gridGroup = svgEl.append('g').attr('class', 'grid-group').attr('opacity', 0);

		// Frequency labels
		frequencies.forEach((_, i) => {
			const y = startY + i * rowGap + bitHeight / 2 + 4;
			gridGroup.append('text')
				.attr('x', startX - 15)
				.attr('y', y)
				.attr('text-anchor', 'end')
				.attr('fill', freqColors[i])
				.attr('font-size', '11px')
				.attr('font-weight', 'bold')
				.text(`f${i + 1}`);
		});

		// "Frequency" label
		gridGroup.append('text')
			.attr('x', 15)
			.attr('y', startY + 2 * rowGap)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('transform', `rotate(-90, 15, ${startY + 2 * rowGap})`)
			.text('Frequency');

		// Time arrow
		gridGroup.append('line')
			.attr('x1', startX)
			.attr('x2', startX + 3 * bitWidth + 20)
			.attr('y1', startY + 4 * rowGap - 5)
			.attr('y2', startY + 4 * rowGap - 5)
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('marker-end', 'url(#arrow2)');

		gridGroup.append('text')
			.attr('x', startX + 3 * bitWidth + 25)
			.attr('y', startY + 4 * rowGap - 1)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Time');

		// Arrow marker
		svgEl.append('defs').append('marker')
			.attr('id', 'arrow2')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', colors.fgMuted);

		// Bits group
		const bitsGroup = svgEl.append('g').attr('class', 'bits-group').attr('opacity', 0);

		frequencies.forEach((row, r) => {
			const rowElements: SVGGElement[] = [];
			row.forEach((bit, c) => {
				const x = startX + c * bitWidth;
				const y = startY + r * rowGap;
				const g = bitsGroup.append('g');

				g.append('rect')
					.attr('x', x)
					.attr('y', y)
					.attr('width', bitWidth - 4)
					.attr('height', bitHeight)
					.attr('fill', freqColors[r])
					.attr('rx', 4);

				g.append('text')
					.attr('x', x + bitWidth / 2 - 2)
					.attr('y', y + bitHeight / 2 + 5)
					.attr('text-anchor', 'middle')
					.attr('fill', colors.bg)
					.attr('font-size', '13px')
					.attr('font-weight', 'bold')
					.text(bit);

				rowElements.push(g.node() as SVGGElement);
			});
			bitElements.push(rowElements);
		});

		// Column indicator line
		bitsGroup.append('line')
			.attr('class', 'col-indicator')
			.attr('x1', startX + bitWidth / 2)
			.attr('x2', startX + bitWidth / 2)
			.attr('y1', startY - 8)
			.attr('y2', startY + 4 * rowGap - 15)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '4,3')
			.attr('opacity', 0);

		// "Simultaneous" bracket
		bitsGroup.append('text')
			.attr('x', startX + 3 * bitWidth + 15)
			.attr('y', startY + 2 * rowGap)
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('4 bits');

		bitsGroup.append('text')
			.attr('x', startX + 3 * bitWidth + 15)
			.attr('y', startY + 2 * rowGap + 12)
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('at once!');

		// Timing label
		svgEl.append('text')
			.attr('class', 'timing-label')
			.attr('x', width / 2)
			.attr('y', startY + 4 * rowGap + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.text('↑ Wider time slots = resistant to reflections')
			.attr('opacity', 0);

		// Message (hidden, no longer needed)
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('');

		animate();
		applyStep(0);
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => {
		clearTimeouts();
		if (animationId) cancelAnimationFrame(animationId);
	});
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
