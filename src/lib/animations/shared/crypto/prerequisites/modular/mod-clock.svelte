<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let animationTimeout: ReturnType<typeof setTimeout> | null = null;
	let isPlaying = $state(false);
	let currentStep = $state(0);

	let hand: d3.Selection<SVGLineElement, unknown, null, undefined>;
	let titleText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let resultText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let countText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let numberHighlights: d3.Selection<SVGCircleElement, unknown, null, undefined>[] = [];

	const width = 350;
	const height = 370;
	const radius = 85;
	const centerX = width / 2;
	const centerY = 165;

	// Animation phases with tick-by-tick motion
	type Phase = {
		title: string;
		subtitle: string;
		result: string;
		tickTo?: number; // If set, animate tick-by-tick to this position
		holdAt?: number; // Just hold at this position (no ticking)
		highlight?: number; // Highlight this number
	};

	const phases: Phase[] = [
		// Intro
		{ title: 'The Mod Clock', subtitle: 'Numbers wrap around after 11', result: 'Just like a real clock!', holdAt: 0 },

		// Example 1: 5 mod 12
		{ title: '5 mod 12 = ?', subtitle: 'Starting at 0...', result: '', holdAt: 0 },
		{ title: '5 mod 12 = ?', subtitle: 'Count 5 steps clockwise', result: '', tickTo: 5 },
		{ title: '5 mod 12 = 5', subtitle: 'We landed on 5', result: 'No wrapping needed!', holdAt: 5, highlight: 5 },

		// Example 2: 12 mod 12
		{ title: '12 mod 12 = ?', subtitle: 'Starting at 0...', result: '', holdAt: 0 },
		{ title: '12 mod 12 = ?', subtitle: 'Count 12 steps...', result: '', tickTo: 12 },
		{ title: '12 mod 12 = 0', subtitle: 'Full circle! Back to start', result: 'Wrapped around exactly once', holdAt: 0, highlight: 0 },

		// Example 3: 15 mod 12
		{ title: '15 mod 12 = ?', subtitle: 'Starting at 0...', result: '', holdAt: 0 },
		{ title: '15 mod 12 = ?', subtitle: 'Count 15 steps...', result: '', tickTo: 15 },
		{ title: '15 mod 12 = 3', subtitle: '12 steps (full lap) + 3 more', result: '15 = 12 + 3, remainder is 3', holdAt: 3, highlight: 3 },

		// Pattern
		{ title: 'The Pattern', subtitle: 'Divide, keep the remainder', result: 'That remainder is the answer!', holdAt: 3 },
	];

	const totalSteps = phases.length;
	const maxStep = totalSteps - 1;

	function getAngle(num: number) {
		return (num / 12) * 2 * Math.PI - Math.PI / 2;
	}

	function getNumberPosition(num: number) {
		const angle = getAngle(num % 12);
		return {
			x: centerX + (radius + 18) * Math.cos(angle),
			y: centerY + (radius + 18) * Math.sin(angle)
		};
	}

	function getHandEndPosition(num: number) {
		const angle = getAngle(num % 12);
		const handLength = radius - 20;
		return {
			x: centerX + handLength * Math.cos(angle),
			y: centerY + handLength * Math.sin(angle)
		};
	}

	let colors: Record<string, string>;
	let currentHandPos = 0;

	async function animateTicksTo(target: number) {
		const startPos = currentHandPos;
		const steps = target - startPos;

		for (let i = 1; i <= steps; i++) {
			if (!isPlaying) return;
			const nextPos = startPos + i;
			const displayPos = nextPos % 12;

			// Update count display
			countText.text(nextPos.toString());

			// Animate hand to next position
			const pos = getHandEndPosition(displayPos);
			await new Promise<void>((resolve) => {
				hand.transition()
					.duration(200)
					.attr('x2', pos.x)
					.attr('y2', pos.y)
					.on('end', () => resolve());
			});

			currentHandPos = nextPos;

			// Brief pause between ticks
			await new Promise((resolve) => setTimeout(resolve, 150));
		}
	}

	function setHandPosition(pos: number, animate: boolean = true) {
		const endPos = getHandEndPosition(pos % 12);
		currentHandPos = pos;
		if (animate) {
			hand.transition().duration(400).attr('x2', endPos.x).attr('y2', endPos.y);
		} else {
			hand.attr('x2', endPos.x).attr('y2', endPos.y);
		}
	}

	function clearHighlights() {
		numberHighlights.forEach(h => h.attr('opacity', 0));
	}

	function highlightNumber(num: number) {
		clearHighlights();
		if (num >= 0 && num < 12) {
			numberHighlights[num].attr('opacity', 1);
		}
	}

	async function runPhase(phaseIndex: number) {
		const phase = phases[phaseIndex];

		titleText.text(phase.title);
		stepText.text(phase.subtitle);
		resultText.text(phase.result);
		countText.text('');

		clearHighlights();

		if (phase.tickTo !== undefined) {
			// Reset to 0 first, then tick
			setHandPosition(0, false);
			currentHandPos = 0;
			await new Promise((resolve) => setTimeout(resolve, 300));
			await animateTicksTo(phase.tickTo);
		} else if (phase.holdAt !== undefined) {
			setHandPosition(phase.holdAt, true);
		}

		if (phase.highlight !== undefined) {
			highlightNumber(phase.highlight);
		}
	}

	async function animate() {
		if (!isPlaying) return;

		await runPhase(currentStep);

		if (currentStep < maxStep && isPlaying) {
			animationTimeout = setTimeout(() => {
				if (!isPlaying) return;
				currentStep++;
				animate();
			}, 2500);
		} else {
			isPlaying = false;
		}
	}

	function play() {
		if (isPlaying) return;
		if (animationTimeout) clearTimeout(animationTimeout);
		isPlaying = true;
		currentStep = 0;
		currentHandPos = 0;
		runPhase(0);
		animationTimeout = setTimeout(() => {
			currentStep++;
			animate();
		}, 2000);
	}

	function pause() {
		isPlaying = false;
		if (animationTimeout) {
			clearTimeout(animationTimeout);
			animationTimeout = null;
		}
	}

	function next() {
		if (currentStep < maxStep) {
			currentStep++;
			runPhase(currentStep);
		}
	}

	function prev() {
		if (currentStep > 0) {
			currentStep--;
			runPhase(currentStep);
		}
	}

	function skip() {
		if (animationTimeout) clearTimeout(animationTimeout);
		isPlaying = false;
		currentStep = maxStep;
		runPhase(maxStep);
	}

	function replay() {
		play();
	}

	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

	onMount(() => {
		const styles = getComputedStyle(document.documentElement);
		colors = {
			bg: styles.getPropertyValue('--color-bg').trim() || '#1d2021',
			fg: styles.getPropertyValue('--color-fg').trim() || '#fbf1c7',
			fgMuted: styles.getPropertyValue('--color-fg-muted').trim() || '#d5c4a1',
			yellow: styles.getPropertyValue('--color-math').trim() || '#fabd2f',
			accent: styles.getPropertyValue('--color-accent').trim() || '#8ec07c',
			border: styles.getPropertyValue('--color-border').trim() || '#3c3836'
		};

		const svgEl = d3
			.select(svg)
			.attr('width', width)
			.attr('height', height)
			.attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		titleText = svgEl
			.append('text')
			.attr('x', centerX)
			.attr('y', 20)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '16px')
			.attr('font-weight', 'bold')
			.text(phases[0].title);

		// Clock circle
		svgEl
			.append('circle')
			.attr('cx', centerX)
			.attr('cy', centerY)
			.attr('r', radius)
			.attr('fill', 'none')
			.attr('stroke', colors.border)
			.attr('stroke-width', 2);

		// Arrowhead marker
		svgEl
			.append('defs')
			.append('marker')
			.attr('id', 'clock-arrow')
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 8)
			.attr('refY', 0)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M0,-4L10,0L0,4')
			.attr('fill', colors.accent);

		// Number highlights (circles behind numbers)
		numberHighlights = d3.range(0, 12).map((num) => {
			const pos = getNumberPosition(num);
			return svgEl
				.append('circle')
				.attr('cx', pos.x)
				.attr('cy', pos.y)
				.attr('r', 14)
				.attr('fill', colors.accent)
				.attr('opacity', 0);
		});

		// Numbers around the clock
		d3.range(0, 12).forEach((num) => {
			const pos = getNumberPosition(num);
			svgEl
				.append('text')
				.attr('x', pos.x)
				.attr('y', pos.y)
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '14px')
				.attr('font-weight', '500')
				.text(num);
		});

		// Center dot
		svgEl
			.append('circle')
			.attr('cx', centerX)
			.attr('cy', centerY)
			.attr('r', 5)
			.attr('fill', colors.accent);

		// Clock hand
		const initPos = getHandEndPosition(0);
		hand = svgEl
			.append('line')
			.attr('x1', centerX)
			.attr('y1', centerY)
			.attr('x2', initPos.x)
			.attr('y2', initPos.y)
			.attr('stroke', colors.accent)
			.attr('stroke-width', 4)
			.attr('stroke-linecap', 'round')
			.attr('marker-end', 'url(#clock-arrow)');

		// Count display (shows current count during ticking)
		countText = svgEl
			.append('text')
			.attr('x', centerX)
			.attr('y', centerY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '20px')
			.attr('font-weight', 'bold')
			.text('');

		// Step explanation
		stepText = svgEl
			.append('text')
			.attr('x', centerX)
			.attr('y', height - 50)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.accent)
			.attr('font-size', '14px')
			.text(phases[0].subtitle);

		// Result
		resultText = svgEl
			.append('text')
			.attr('x', centerX)
			.attr('y', height - 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '13px')
			.text(phases[0].result);

		if (register) {
			register({ play, pause, next, prev, skip, replay, getState });
		}
	});

	onDestroy(() => {
		if (animationTimeout) clearTimeout(animationTimeout);
	});
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
	.diagram {
		display: block;
		margin: 0 auto;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
</style>
