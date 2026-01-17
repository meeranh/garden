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
	const height = 280;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => {
			timeouts.push(setTimeout(r, ms));
		});
	}
	function clearTimeouts() {
		timeouts.forEach(clearTimeout);
		timeouts = [];
	}

	function applyStep(step: number) {
		currentStep = step;

		// Step 0: Show both constellations clean
		// Step 1: Add noise cloud to both
		// Step 2: Show QPSK is fine, 64-QAM has overlap
		// Step 3: Highlight the problem

		svgEl.selectAll('.noise-cloud')
			.transition()
			.duration(500)
			.attr('opacity', step >= 1 ? 0.4 : 0);

		svgEl.selectAll('.overlap-indicator')
			.transition()
			.duration(500)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.qpsk-status')
			.transition()
			.duration(400)
			.attr('fill', step >= 2 ? colors.accent : colors.fgMuted)
			.text(step >= 2 ? '✓ Safe' : 'QPSK');

		svgEl.select('.qam-status')
			.transition()
			.duration(400)
			.attr('fill', step >= 2 ? '#fb4934' : colors.fgMuted)
			.text(step >= 2 ? '✗ Overlap!' : '64-QAM');

		const messages = [
			'Two modulation schemes',
			'Same noise affects both signals',
			'QPSK: symbols far apart, safe. 64-QAM: symbols overlap!',
			'More symbols = less noise tolerance'
		];
		svgEl.select('.message').text(messages[step]);
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

	function play() {
		if (!isPlaying) {
			isPlaying = true;
			runAnimation();
		}
	}
	function pause() {
		isPlaying = false;
		clearTimeouts();
	}
	function next() {
		pause();
		if (currentStep < maxStep) applyStep(currentStep + 1);
	}
	function prev() {
		pause();
		if (currentStep > 0) applyStep(currentStep - 1);
	}
	function skip() {
		pause();
		applyStep(maxStep);
	}
	function replay() {
		pause();
		currentStep = 0;
		applyStep(0);
		isPlaying = true;
		runAnimation();
	}
	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

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
			.text('The Noise Tradeoff');

		// QPSK constellation (left)
		const qpskCx = 130;
		const qpskCy = 130;
		const qpskSpacing = 30;

		svgEl.append('text')
			.attr('class', 'qpsk-status')
			.attr('x', qpskCx)
			.attr('y', 55)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('QPSK');

		// QPSK axes
		svgEl.append('line')
			.attr('x1', qpskCx - 50).attr('x2', qpskCx + 50)
			.attr('y1', qpskCy).attr('y2', qpskCy)
			.attr('stroke', colors.border).attr('stroke-width', 1);
		svgEl.append('line')
			.attr('x1', qpskCx).attr('x2', qpskCx)
			.attr('y1', qpskCy - 50).attr('y2', qpskCy + 50)
			.attr('stroke', colors.border).attr('stroke-width', 1);

		// QPSK points with noise clouds
		[[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
			const x = qpskCx + dx * qpskSpacing;
			const y = qpskCy + dy * qpskSpacing;

			// Noise cloud
			svgEl.append('circle')
				.attr('class', 'noise-cloud')
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', 18)
				.attr('fill', colors.yellow)
				.attr('opacity', 0);

			// Symbol
			svgEl.append('circle')
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', 8)
				.attr('fill', colors.accent);
		});

		// 64-QAM constellation (right)
		const qamCx = 370;
		const qamCy = 130;
		const qamSpacing = 10;

		svgEl.append('text')
			.attr('class', 'qam-status')
			.attr('x', qamCx)
			.attr('y', 55)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('64-QAM');

		// QAM axes
		svgEl.append('line')
			.attr('x1', qamCx - 50).attr('x2', qamCx + 50)
			.attr('y1', qamCy).attr('y2', qamCy)
			.attr('stroke', colors.border).attr('stroke-width', 1);
		svgEl.append('line')
			.attr('x1', qamCx).attr('x2', qamCx)
			.attr('y1', qamCy - 50).attr('y2', qamCy + 50)
			.attr('stroke', colors.border).attr('stroke-width', 1);

		// 64-QAM points (8x8 grid)
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const x = qamCx + (col - 3.5) * qamSpacing;
				const y = qamCy + (row - 3.5) * qamSpacing;

				svgEl.append('circle')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 3)
					.attr('fill', colors.accent);
			}
		}

		// Noise clouds for a few 64-QAM points (showing overlap)
		const noisePoints = [
			{ x: qamCx - 1.5 * qamSpacing, y: qamCy - 1.5 * qamSpacing },
			{ x: qamCx + 0.5 * qamSpacing, y: qamCy + 0.5 * qamSpacing },
			{ x: qamCx - 2.5 * qamSpacing, y: qamCy + 1.5 * qamSpacing }
		];

		noisePoints.forEach(p => {
			svgEl.append('circle')
				.attr('class', 'noise-cloud')
				.attr('cx', p.x)
				.attr('cy', p.y)
				.attr('r', 12)
				.attr('fill', colors.yellow)
				.attr('opacity', 0);
		});

		// Overlap indicator
		svgEl.append('circle')
			.attr('class', 'overlap-indicator')
			.attr('cx', qamCx - 1.5 * qamSpacing)
			.attr('cy', qamCy - 1.5 * qamSpacing)
			.attr('r', 15)
			.attr('fill', 'none')
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2)
			.attr('opacity', 0);

		// Noise label
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 210)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '11px')
			.text('Yellow = noise spread around each symbol');

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', 250)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Two modulation schemes');

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
