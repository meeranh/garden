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
	let crashTriggered = false;

	const maxStep = 3;
	const width = 560;
	const height = 360;

	// Car data
	let singleLaneCars: { x: number; crashed: boolean; piling: boolean; el?: SVGGElement }[] = [];
	let multiLaneCars: { lane: number; x: number; el?: SVGGElement }[] = [];

	const singleLaneY = 70;
	const multiLaneStartY = 175;
	const laneHeight = 28;
	const carWidth = 40;
	const carHeight = 18;
	const laneColors = ['#fb4934', '#b8bb26', '#83a598', '#d3869b'];
	const crashX = 250;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function initCars() {
		singleLaneCars = [
			{ x: 50, crashed: false, piling: false },
			{ x: 120, crashed: false, piling: false },
			{ x: 190, crashed: false, piling: false },
			{ x: 260, crashed: false, piling: false },
			{ x: 330, crashed: false, piling: false }
		];
		multiLaneCars = [
			{ lane: 0, x: 70 },
			{ lane: 0, x: 220 },
			{ lane: 0, x: 370 },
			{ lane: 1, x: 120 },
			{ lane: 1, x: 270 },
			{ lane: 1, x: 420 },
			{ lane: 2, x: 80 },
			{ lane: 2, x: 230 },
			{ lane: 2, x: 380 },
			{ lane: 3, x: 150 },
			{ lane: 3, x: 300 },
			{ lane: 3, x: 450 }
		];
	}

	function resetPositions() {
		singleLaneCars.forEach((car, i) => {
			car.x = 50 + i * 70;
			car.crashed = false;
			car.piling = false;
		});
		multiLaneCars.forEach((car, i) => {
			const laneOffset = [70, 120, 80, 150];
			const idx = i % 3;
			car.x = laneOffset[car.lane] + idx * 150;
		});
		crashTriggered = false;
	}

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.single-lane-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 0 ? 1 : 0);

		svgEl.select('.multi-lane-group')
			.transition()
			.duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		svgEl.select('.crash-marker')
			.transition()
			.duration(400)
			.attr('opacity', step >= 1 ? 1 : 0);

		svgEl.select('.success-marker')
			.transition()
			.duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		if (step >= 1) {
			crashTriggered = true;
		} else {
			resetPositions();
		}

		const messages = [
			'Single lane: Cars moving fast, close together',
			'One crash → everyone behind is stuck!',
			'Multiple lanes: Cars moving slower, but independent',
			'Problem in one lane? Others keep moving!'
		];
		svgEl.select('.message').text(messages[step]);
	}

	function createCarElement(parent: d3.Selection<SVGGElement, unknown, null, undefined>, color: string): SVGGElement {
		const g = parent.append('g');

		// Car body
		g.append('rect')
			.attr('class', 'car-body')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', carWidth)
			.attr('height', carHeight)
			.attr('fill', color)
			.attr('rx', 4);

		// Windshield
		g.append('rect')
			.attr('x', carWidth - 12)
			.attr('y', 3)
			.attr('width', 8)
			.attr('height', carHeight - 6)
			.attr('fill', 'rgba(0,0,0,0.3)')
			.attr('rx', 2);

		// Wheels
		g.append('circle')
			.attr('cx', 8)
			.attr('cy', carHeight)
			.attr('r', 4)
			.attr('fill', '#1d2021');

		g.append('circle')
			.attr('cx', carWidth - 8)
			.attr('cy', carHeight)
			.attr('r', 4)
			.attr('fill', '#1d2021');

		// Crash indicator (hidden by default)
		g.append('text')
			.attr('class', 'crash-icon')
			.attr('x', carWidth / 2)
			.attr('y', -5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '14px')
			.attr('opacity', 0)
			.text('💥');

		return g.node() as SVGGElement;
	}

	function animate() {
		// Update single lane car positions
		if (crashTriggered) {
			let hasCrashedCar = singleLaneCars.some(c => c.crashed);

			if (!hasCrashedCar) {
				let closestIdx = 0;
				let closestDist = Infinity;
				singleLaneCars.forEach((car, i) => {
					const dist = Math.abs(car.x - crashX);
					if (dist < closestDist && !car.piling) {
						closestDist = dist;
						closestIdx = i;
					}
				});
				if (closestDist < 60) {
					singleLaneCars[closestIdx].crashed = true;
					singleLaneCars[closestIdx].x = crashX;
				}
			}

			singleLaneCars.forEach((car) => {
				if (car.crashed) {
					// Stay put
				} else if (car.x < crashX && car.x > crashX - 200) {
					car.piling = true;
					const targetX = crashX - 50;
					if (car.x < targetX) {
						car.x += 1.5;
					}
				} else if (car.piling) {
					if (car.x < crashX - 50) {
						car.x += 0.5;
					}
				} else {
					car.x += 3;
					if (car.x > width - 50) car.x = -carWidth - 100;
				}
			});
		} else {
			singleLaneCars.forEach((car) => {
				car.x += 3;
				if (car.x > width - 50) car.x = -carWidth;
			});
		}

		// Update single lane car transforms (no DOM creation!)
		singleLaneCars.forEach((car) => {
			if (car.el) {
				d3.select(car.el).attr('transform', `translate(${car.x}, ${singleLaneY})`);
				d3.select(car.el).select('.car-body').attr('fill', car.crashed ? '#fb4934' : '#fabd2f');
				d3.select(car.el).select('.crash-icon').attr('opacity', car.crashed ? 1 : 0);
			}
		});

		// Update multi lane car positions
		multiLaneCars.forEach((car) => {
			car.x += 1.2;
			if (car.x > width - 60) car.x = 20;
		});

		// Update multi lane car transforms (no DOM creation!)
		multiLaneCars.forEach((car) => {
			if (car.el) {
				const y = multiLaneStartY + car.lane * laneHeight + 5;
				d3.select(car.el).attr('transform', `translate(${car.x}, ${y})`);
			}
		});

		animationId = requestAnimationFrame(animate);
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
	function replay() { pause(); currentStep = 0; resetPositions(); applyStep(0); isPlaying = true; runAnimation(); }
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

		initCars();

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Single Lane vs Multiple Lanes');

		// Single lane section
		const singleLaneGroup = svgEl.append('g').attr('class', 'single-lane-group').attr('opacity', 0);

		singleLaneGroup.append('text')
			.attr('x', 15)
			.attr('y', 50)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Serial:');

		// Road
		singleLaneGroup.append('rect')
			.attr('x', 60)
			.attr('y', singleLaneY - 10)
			.attr('width', width - 120)
			.attr('height', 45)
			.attr('fill', '#504945')
			.attr('rx', 4);

		// Lane markings
		for (let x = 70; x < width - 70; x += 40) {
			singleLaneGroup.append('rect')
				.attr('x', x)
				.attr('y', singleLaneY + 10)
				.attr('width', 20)
				.attr('height', 3)
				.attr('fill', '#fabd2f')
				.attr('opacity', 0.5);
		}

		// Create single lane car elements ONCE
		const singleCarsGroup = singleLaneGroup.append('g').attr('class', 'single-lane-cars');
		singleLaneCars.forEach((car) => {
			car.el = createCarElement(singleCarsGroup as any, '#fabd2f');
		});

		// Speed label
		singleLaneGroup.append('text')
			.attr('x', width - 55)
			.attr('y', singleLaneY + 15)
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('FAST →');

		// Crash marker
		svgEl.append('text')
			.attr('class', 'crash-marker')
			.attr('x', width / 2)
			.attr('y', singleLaneY + 60)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('❌ One problem blocks everything!')
			.attr('opacity', 0);

		// Multi lane section
		const multiLaneGroup = svgEl.append('g').attr('class', 'multi-lane-group').attr('opacity', 0);

		multiLaneGroup.append('text')
			.attr('x', 15)
			.attr('y', multiLaneStartY - 15)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Parallel:');

		// Roads (4 lanes)
		for (let i = 0; i < 4; i++) {
			const y = multiLaneStartY + i * laneHeight;

			multiLaneGroup.append('rect')
				.attr('x', 60)
				.attr('y', y)
				.attr('width', width - 120)
				.attr('height', laneHeight - 2)
				.attr('fill', '#504945')
				.attr('rx', 3);

			// Lane label
			multiLaneGroup.append('text')
				.attr('x', 55)
				.attr('y', y + laneHeight / 2 + 3)
				.attr('text-anchor', 'end')
				.attr('fill', laneColors[i])
				.attr('font-size', '9px')
				.text(`f${i + 1}`);
		}

		// Create multi lane car elements ONCE
		const multiCarsGroup = multiLaneGroup.append('g').attr('class', 'multi-lane-cars');
		multiLaneCars.forEach((car) => {
			car.el = createCarElement(multiCarsGroup as any, laneColors[car.lane]);
		});

		// Speed label
		multiLaneGroup.append('text')
			.attr('x', width - 55)
			.attr('y', multiLaneStartY + 55)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('slower →');

		// Success marker
		svgEl.append('text')
			.attr('class', 'success-marker')
			.attr('x', width / 2)
			.attr('y', multiLaneStartY + 4 * laneHeight + 25)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('✓ Lanes are independent, more robust!')
			.attr('opacity', 0);

		// Message
		svgEl.append('text')
			.attr('class', 'message')
			.attr('x', width / 2)
			.attr('y', height - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text('Single lane: Cars moving fast, close together');

		// Start animation loop
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
