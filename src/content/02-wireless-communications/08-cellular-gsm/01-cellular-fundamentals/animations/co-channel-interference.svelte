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
	const width = 580;
	const height = 320;

	const titles = [
		'Two towers both use frequency F1',
		'User hears their own tower (wanted signal)',
		'But also hears the distant tower (interference!)',
		'Result: mixed signals, poor call quality',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function drawTower(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		// Tower pole (tall and thin)
		g.append('rect')
			.attr('x', x - 3).attr('y', y - 70)
			.attr('width', 6).attr('height', 70)
			.attr('fill', color);

		// Tower base (wider)
		g.append('rect')
			.attr('x', x - 12).attr('y', y)
			.attr('width', 24).attr('height', 8)
			.attr('fill', color);

		// Cross beams
		g.append('line')
			.attr('x1', x - 10).attr('y1', y - 20)
			.attr('x2', x + 10).attr('y2', y - 20)
			.attr('stroke', color).attr('stroke-width', 2);

		g.append('line')
			.attr('x1', x - 8).attr('y1', y - 40)
			.attr('x2', x + 8).attr('y2', y - 40)
			.attr('stroke', color).attr('stroke-width', 2);

		// Antenna panels at top
		g.append('rect')
			.attr('x', x - 10).attr('y', y - 85)
			.attr('width', 6).attr('height', 15)
			.attr('fill', color);

		g.append('rect')
			.attr('x', x + 4).attr('y', y - 85)
			.attr('width', 6).attr('height', 15)
			.attr('fill', color);

		// Top spike
		g.append('line')
			.attr('x1', x).attr('y1', y - 95)
			.attr('x2', x).attr('y2', y - 85)
			.attr('stroke', color).attr('stroke-width', 3);
	}

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Step 1: Show wanted signal ripples
		svgEl.select('.wanted-ripples')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.wanted-label')
			.transition().duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		// Step 2: Show interference ripples
		svgEl.select('.interference-ripples')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.interference-label')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// Step 3: Show result
		svgEl.select('.result-group')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// User icon changes color based on interference
		if (step >= 3) {
			svgEl.select('.user-icon')
				.transition().duration(400)
				.attr('fill', '#fabd2f');
			svgEl.select('.user-status')
				.transition().duration(400)
				.attr('opacity', 1);
		} else {
			svgEl.select('.user-icon')
				.transition().duration(400)
				.attr('fill', '#8ec07c');
			svgEl.select('.user-status')
				.transition().duration(400)
				.attr('opacity', 0);
		}
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
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		const towerAx = 80, towerBx = 500, towerY = 180;
		const userX = 250, userY = 150;

		// ========== Tower A (left - user's tower) ==========
		const towerAG = svgEl.append('g');
		drawTower(towerAG, towerAx, towerY, '#8ec07c');

		svgEl.append('text')
			.attr('x', towerAx).attr('y', towerY + 25)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Tower A (F1)');

		// ========== Tower B (right - interfering tower) ==========
		const towerBG = svgEl.append('g');
		drawTower(towerBG, towerBx, towerY, '#fb4934');

		svgEl.append('text')
			.attr('x', towerBx).attr('y', towerY + 25)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Tower B (F1)');

		// ========== Wanted signal ripples from Tower A ==========
		const wantedRipples = svgEl.append('g').attr('class', 'wanted-ripples').attr('opacity', 0);

		[40, 70, 100, 130].forEach((r, i) => {
			wantedRipples.append('circle')
				.attr('cx', towerAx).attr('cy', towerY - 50)
				.attr('r', r)
				.attr('fill', 'none')
				.attr('stroke', '#8ec07c')
				.attr('stroke-width', 2)
				.attr('stroke-opacity', 0.6 - i * 0.12);
		});

		// Wanted label
		svgEl.append('text')
			.attr('class', 'wanted-label')
			.attr('x', towerAx + 60).attr('y', 55)
			.attr('text-anchor', 'start').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('Wanted signal (strong)');

		// ========== Interference ripples from Tower B ==========
		const intRipples = svgEl.append('g').attr('class', 'interference-ripples').attr('opacity', 0);

		[40, 70, 100, 130, 160, 190].forEach((r, i) => {
			intRipples.append('circle')
				.attr('cx', towerBx).attr('cy', towerY - 50)
				.attr('r', r)
				.attr('fill', 'none')
				.attr('stroke', '#fb4934')
				.attr('stroke-width', 1.5)
				.attr('stroke-opacity', 0.5 - i * 0.07)
				.attr('stroke-dasharray', '4,4');
		});

		// Interference label
		svgEl.append('text')
			.attr('class', 'interference-label')
			.attr('x', towerBx - 60).attr('y', 55)
			.attr('text-anchor', 'end').attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('Interference (weaker)');

		// ========== User ==========
		svgEl.append('circle')
			.attr('class', 'user-icon')
			.attr('cx', userX).attr('cy', userY)
			.attr('r', 18)
			.attr('fill', '#8ec07c')
			.attr('stroke', colors.fg).attr('stroke-width', 2);

		// User icon (person shape)
		svgEl.append('circle')
			.attr('cx', userX).attr('cy', userY - 5)
			.attr('r', 5)
			.attr('fill', colors.fg);

		svgEl.append('path')
			.attr('d', `M ${userX - 7} ${userY + 10} Q ${userX} ${userY + 2} ${userX + 7} ${userY + 10}`)
			.attr('fill', colors.fg);

		svgEl.append('text')
			.attr('x', userX).attr('y', userY + 38)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('User (in Cell A)');

		// User status (confused)
		svgEl.append('text')
			.attr('class', 'user-status')
			.attr('x', userX + 25).attr('y', userY - 15)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '16px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('?!');

		// ========== Result box ==========
		const resultG = svgEl.append('g').attr('class', 'result-group').attr('opacity', 0);

		resultG.append('rect')
			.attr('x', width / 2 - 150).attr('y', height - 70)
			.attr('width', 300).attr('height', 50)
			.attr('fill', colors.bg)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('rx', 6);

		resultG.append('text')
			.attr('x', width / 2).attr('y', height - 48)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('User receives BOTH signals on F1!');

		resultG.append('text')
			.attr('x', width / 2).attr('y', height - 30)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Signals overlap = noise, dropped calls');

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
