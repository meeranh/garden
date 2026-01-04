<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let timeouts: ReturnType<typeof setTimeout>[] = [];

	const colors = {
		bg: '#1d2021',
		fg: '#ebdbb2',
		yellow: '#fabd2f',
		aqua: '#8ec07c',
		orange: '#fe8019',
		purple: '#d3869b',
		green: '#b8bb26',
		blue: '#83a598',
		border: '#504945',
		dark: '#282828',
		red: '#fb4934'
	};

	// Tux penguin - 14 wide x 24 tall
	// 0=bg, 1=black body, 2=white, 3=pupil, 4=beak yellow, 5=feet orange
	const penguinPattern = [
		[0,0,0,0,0,1,1,1,1,0,0,0,0,0],
		[0,0,0,0,1,1,1,1,1,1,0,0,0,0],
		[0,0,0,1,1,1,1,1,1,1,1,0,0,0],
		[0,0,0,1,2,2,1,1,2,2,1,0,0,0],
		[0,0,0,1,2,3,1,1,3,2,1,0,0,0],
		[0,0,0,1,2,2,1,1,2,2,1,0,0,0],
		[0,0,0,1,1,1,1,1,1,1,1,0,0,0],
		[0,0,0,0,1,4,4,4,4,1,0,0,0,0],
		[0,0,0,0,1,1,4,4,1,1,0,0,0,0],
		[0,0,0,1,1,1,1,1,1,1,1,0,0,0],
		[0,0,1,1,1,2,2,2,2,1,1,1,0,0],
		[0,1,1,1,2,2,2,2,2,2,1,1,1,0],
		[0,1,1,2,2,2,2,2,2,2,2,1,1,0],
		[1,1,1,2,2,2,2,2,2,2,2,1,1,1],
		[1,1,1,2,2,2,2,2,2,2,2,1,1,1],
		[1,1,1,2,2,2,2,2,2,2,2,1,1,1],
		[0,1,1,2,2,2,2,2,2,2,2,1,1,0],
		[0,1,1,1,2,2,2,2,2,2,1,1,1,0],
		[0,0,1,1,1,2,2,2,2,1,1,1,0,0],
		[0,0,1,1,1,1,1,1,1,1,1,1,0,0],
		[0,0,0,1,1,1,0,0,1,1,1,0,0,0],
		[0,0,0,1,1,0,0,0,0,1,1,0,0,0],
		[0,0,5,5,5,0,0,0,0,5,5,5,0,0],
		[0,5,5,5,5,0,0,0,0,5,5,5,5,0],
	];

	const gridWidth = 14;
	const gridHeight = 24;

	const plainColorMap: Record<number, string> = {
		0: colors.bg,
		1: '#282828',
		2: '#ebdbb2',
		3: '#1d2021',
		4: '#fabd2f',
		5: '#fe8019'
	};

	const ecbColorMap: Record<number, string> = {
		0: '#3c3836',
		1: '#504945',
		2: '#928374',
		3: '#665c54',
		4: '#a89984',
		5: '#bdae93'
	};

	const totalSteps = 5;
	const maxStep = totalSteps - 1;

	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let plainGrid: d3.Selection<SVGGElement, unknown, null, undefined>;
	let ecbGrid: d3.Selection<SVGGElement, unknown, null, undefined>;
	let cbcGrid: d3.Selection<SVGGElement, unknown, null, undefined>;
	let plainLabel: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let ecbLabel: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let cbcLabel: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let arrow1: d3.Selection<SVGGElement, unknown, null, undefined>;
	let arrow2: d3.Selection<SVGGElement, unknown, null, undefined>;
	let warningIcon: d3.Selection<SVGGElement, unknown, null, undefined>;
	let checkIcon: d3.Selection<SVGGElement, unknown, null, undefined>;

	const cellSize = 7;

	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			const t = setTimeout(resolve, ms);
			timeouts.push(t);
		});
	}

	function clearTimeouts() {
		timeouts.forEach((t) => clearTimeout(t));
		timeouts = [];
	}

	function resetAnimation() {
		plainGrid?.selectAll('rect.cell').attr('fill', colors.bg);
		ecbGrid?.selectAll('rect.cell').attr('fill', colors.bg);
		cbcGrid?.selectAll('rect.cell').attr('fill', colors.bg);
		plainLabel?.attr('opacity', 0);
		ecbLabel?.attr('opacity', 0);
		cbcLabel?.attr('opacity', 0);
		arrow1?.attr('opacity', 0);
		arrow2?.attr('opacity', 0);
		warningIcon?.attr('opacity', 0);
		checkIcon?.attr('opacity', 0);
		stepText?.text('');
		currentStep = 0;
	}

	function showFinalState() {
		plainGrid?.selectAll('rect.cell').each(function(d: unknown, i: number) {
			const row = Math.floor(i / gridWidth);
			const col = i % gridWidth;
			const colorIdx = penguinPattern[row][col];
			d3.select(this).attr('fill', plainColorMap[colorIdx]);
		});
		ecbGrid?.selectAll('rect.cell').each(function(d: unknown, i: number) {
			const row = Math.floor(i / gridWidth);
			const col = i % gridWidth;
			const colorIdx = penguinPattern[row][col];
			d3.select(this).attr('fill', ecbColorMap[colorIdx]);
		});
		cbcGrid?.selectAll('rect.cell').each(function(d: unknown, i: number) {
			const randomColors = ['#3c3836', '#504945', '#665c54', '#7c6f64', '#928374', '#a89984', '#bdae93'];
			d3.select(this).attr('fill', randomColors[Math.floor(Math.random() * randomColors.length)]);
		});
		plainLabel?.attr('opacity', 1);
		ecbLabel?.attr('opacity', 1);
		cbcLabel?.attr('opacity', 1);
		arrow1?.attr('opacity', 1);
		arrow2?.attr('opacity', 1);
		warningIcon?.attr('opacity', 1);
		checkIcon?.attr('opacity', 1);
		stepText?.text('CBC produces random-looking output — no pattern leakage');
		currentStep = maxStep;
	}

	async function runAnimation() {
		if (!isPlaying) return;
		resetAnimation();
		await sleep(300);

		// Step 0: Draw original penguin
		currentStep = 1;
		stepText?.text('Original image: Tux the Linux penguin');
		plainLabel?.transition().duration(300).attr('opacity', 1);

		plainGrid?.selectAll('rect.cell').each(function(d: unknown, i: number) {
			const row = Math.floor(i / gridWidth);
			const col = i % gridWidth;
			const colorIdx = penguinPattern[row][col];
			d3.select(this)
				.transition()
				.delay(row * 60 + col * 6)
				.duration(60)
				.attr('fill', plainColorMap[colorIdx]);
		});
		await sleep(2200);
		if (!isPlaying) return;

		// Step 1: Show ECB arrow
		currentStep = 2;
		stepText?.text('ECB encrypts each pixel block independently...');
		arrow1?.transition().duration(400).attr('opacity', 1);
		ecbLabel?.transition().duration(300).attr('opacity', 1);
		await sleep(1500);
		if (!isPlaying) return;

		// Step 2: ECB encryption - pattern preserved
		currentStep = 3;
		stepText?.text('Same pixels → Same ciphertext. Pattern is visible!');

		ecbGrid?.selectAll('rect.cell').each(function(d: unknown, i: number) {
			const row = Math.floor(i / gridWidth);
			const col = i % gridWidth;
			const colorIdx = penguinPattern[row][col];
			d3.select(this)
				.transition()
				.delay(row * 40 + col * 4)
				.duration(40)
				.attr('fill', ecbColorMap[colorIdx]);
		});
		await sleep(1500);
		warningIcon?.transition().duration(300).attr('opacity', 1);
		await sleep(1500);
		if (!isPlaying) return;

		// Step 3: Show CBC
		currentStep = 4;
		stepText?.text('CBC mode: each block XORed with previous ciphertext');
		arrow2?.transition().duration(400).attr('opacity', 1);
		cbcLabel?.transition().duration(300).attr('opacity', 1);

		cbcGrid?.selectAll('rect.cell').each(function(d: unknown, i: number) {
			const randomColors = ['#3c3836', '#504945', '#665c54', '#7c6f64', '#928374', '#a89984', '#bdae93'];
			d3.select(this)
				.transition()
				.delay(i * 3)
				.duration(30)
				.attr('fill', randomColors[Math.floor(Math.random() * randomColors.length)]);
		});
		await sleep(1800);
		if (!isPlaying) return;

		// Step 4: Final
		currentStep = maxStep;
		stepText?.text('CBC produces random-looking output — no pattern leakage');
		checkIcon?.transition().duration(300).attr('opacity', 1);
		await sleep(500);
		isPlaying = false;
	}

	function play() {
		if (isPlaying) return;
		isPlaying = true;
		runAnimation();
	}

	function pause() {
		isPlaying = false;
		clearTimeouts();
	}

	function next() {
		pause();
		showFinalState();
	}

	function prev() {
		pause();
		resetAnimation();
	}

	function skip() {
		pause();
		showFinalState();
	}

	function replay() {
		pause();
		resetAnimation();
		isPlaying = true;
		runAnimation();
	}

	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

	onMount(() => {
		const width = 560;
		const height = 300;
		const gridPixelW = gridWidth * cellSize;
		const gridPixelH = gridHeight * cellSize;

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('The ECB Penguin Problem');

		// Step text
		stepText = svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 288)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px');

		// Grid positions
		const totalGridWidth = gridPixelW * 3 + 100;
		const startX = (width - totalGridWidth) / 2;
		const grid1X = startX;
		const grid2X = startX + gridPixelW + 50;
		const grid3X = startX + gridPixelW * 2 + 100;
		const gridY = 55;

		function createGrid(x: number, y: number): d3.Selection<SVGGElement, unknown, null, undefined> {
			const g = svgEl.append('g').attr('transform', `translate(${x}, ${y})`);

			g.append('rect')
				.attr('x', -3)
				.attr('y', -3)
				.attr('width', gridPixelW + 6)
				.attr('height', gridPixelH + 6)
				.attr('fill', colors.dark)
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('rx', 3);

			for (let row = 0; row < gridHeight; row++) {
				for (let col = 0; col < gridWidth; col++) {
					g.append('rect')
						.attr('class', 'cell')
						.attr('x', col * cellSize)
						.attr('y', row * cellSize)
						.attr('width', cellSize - 1)
						.attr('height', cellSize - 1)
						.attr('fill', colors.bg);
				}
			}
			return g;
		}

		plainGrid = createGrid(grid1X, gridY);
		ecbGrid = createGrid(grid2X, gridY);
		cbcGrid = createGrid(grid3X, gridY);

		// Labels
		plainLabel = svgEl.append('text')
			.attr('x', grid1X + gridPixelW / 2)
			.attr('y', gridY + gridPixelH + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('Original');

		ecbLabel = svgEl.append('text')
			.attr('x', grid2X + gridPixelW / 2)
			.attr('y', gridY + gridPixelH + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.red)
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('ECB Encrypted');

		cbcLabel = svgEl.append('text')
			.attr('x', grid3X + gridPixelW / 2)
			.attr('y', gridY + gridPixelH + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.green)
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('CBC Encrypted');

		// Arrow markers
		const defs = svgEl.append('defs');
		defs.append('marker')
			.attr('id', 'penguin-arrow')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 9)
			.attr('refY', 5)
			.attr('markerWidth', 5)
			.attr('markerHeight', 5)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', colors.border);

		const arrowY = gridY + gridPixelH / 2;

		arrow1 = svgEl.append('g').attr('opacity', 0);
		arrow1.append('line')
			.attr('x1', grid1X + gridPixelW + 8)
			.attr('y1', arrowY)
			.attr('x2', grid2X - 8)
			.attr('y2', arrowY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#penguin-arrow)');

		arrow2 = svgEl.append('g').attr('opacity', 0);
		arrow2.append('line')
			.attr('x1', grid2X + gridPixelW + 8)
			.attr('y1', arrowY)
			.attr('x2', grid3X - 8)
			.attr('y2', arrowY)
			.attr('stroke', colors.border)
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#penguin-arrow)');

		// Warning icon for ECB
		warningIcon = svgEl.append('g').attr('opacity', 0);
		const warnX = grid2X + gridPixelW / 2;
		const warnY = gridY - 18;
		warningIcon.append('circle')
			.attr('cx', warnX)
			.attr('cy', warnY)
			.attr('r', 11)
			.attr('fill', colors.red)
			.attr('fill-opacity', 0.15)
			.attr('stroke', colors.red)
			.attr('stroke-width', 2);
		warningIcon.append('text')
			.attr('x', warnX)
			.attr('y', warnY + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.red)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('✗');

		// Check icon for CBC
		checkIcon = svgEl.append('g').attr('opacity', 0);
		const checkX = grid3X + gridPixelW / 2;
		const checkY = gridY - 18;
		checkIcon.append('circle')
			.attr('cx', checkX)
			.attr('cy', checkY)
			.attr('r', 11)
			.attr('fill', colors.green)
			.attr('fill-opacity', 0.15)
			.attr('stroke', colors.green)
			.attr('stroke-width', 2);
		checkIcon.append('text')
			.attr('x', checkX)
			.attr('y', checkY + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.green)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('✓');

		register?.({ play, pause, next, prev, skip, replay, getState });
		play();
	});

	onDestroy(() => {
		pause();
	});
</script>

<div class="container">
	<svg bind:this={svg} class="diagram"></svg>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
	}

	.diagram {
		width: 100%;
		max-width: 580px;
		height: auto;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
</style>
