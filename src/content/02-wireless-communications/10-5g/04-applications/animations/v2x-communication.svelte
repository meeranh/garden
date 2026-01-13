<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let animationFrame: number;
	let offset = 0;
	let colors: Record<string, string>;

	const width = 680;
	const height = 300;

	function drawCar(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string, flip = false) {
		const car = g.append('g').attr('transform', `translate(${x}, ${y}) scale(${flip ? -1 : 1}, 1)`);
		// Body
		car.append('rect')
			.attr('x', -30).attr('y', -14)
			.attr('width', 60).attr('height', 24)
			.attr('fill', '#504945')
			.attr('stroke', color)
			.attr('stroke-width', 2)
			.attr('rx', 5);
		// Roof
		car.append('rect')
			.attr('x', -14).attr('y', -26)
			.attr('width', 28).attr('height', 14)
			.attr('fill', '#504945')
			.attr('stroke', color)
			.attr('stroke-width', 2)
			.attr('rx', 4);
		// Wheels
		car.append('circle').attr('cx', -18).attr('cy', 12).attr('r', 7).attr('fill', '#282828').attr('stroke', '#7c6f64');
		car.append('circle').attr('cx', 18).attr('cy', 12).attr('r', 7).attr('fill', '#282828').attr('stroke', '#7c6f64');
		// Headlight
		car.append('rect')
			.attr('x', 27).attr('y', -6)
			.attr('width', 5).attr('height', 8)
			.attr('fill', '#fabd2f');
	}

	function drawTower(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		t.append('path').attr('d', 'M0,-35 L-8,0 L8,0 Z')
			.attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
		t.append('line').attr('x1', -5).attr('y1', -10).attr('x2', 5).attr('y2', -10)
			.attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', -4).attr('y1', -20).attr('x2', 4).attr('y2', -20)
			.attr('stroke', color).attr('stroke-width', 1.5);
		t.append('line').attr('x1', 0).attr('y1', -35).attr('x2', 0).attr('y2', -45)
			.attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -48).attr('r', 4).attr('fill', color);
	}

	function drawTrafficLight(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number) {
		const tl = g.append('g').attr('transform', `translate(${x}, ${y})`);
		// Pole
		tl.append('rect')
			.attr('x', -3).attr('y', 0)
			.attr('width', 6).attr('height', 45)
			.attr('fill', '#504945');
		// Housing
		tl.append('rect')
			.attr('x', -12).attr('y', -40)
			.attr('width', 24).attr('height', 40)
			.attr('fill', '#282828')
			.attr('stroke', '#7c6f64')
			.attr('stroke-width', 2)
			.attr('rx', 3);
		// Lights
		tl.append('circle').attr('cx', 0).attr('cy', -30).attr('r', 6).attr('fill', '#cc241d').attr('opacity', 0.3);
		tl.append('circle').attr('cx', 0).attr('cy', -18).attr('r', 6).attr('fill', '#fabd2f').attr('opacity', 0.3);
		tl.append('circle').attr('cx', 0).attr('cy', -6).attr('r', 6).attr('fill', '#8ec07c');
	}

	function drawPerson(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const p = g.append('g').attr('transform', `translate(${x}, ${y})`);
		// Head
		p.append('circle').attr('cy', -28).attr('r', 9).attr('fill', '#d5c4a1');
		// Body
		p.append('line').attr('y1', -19).attr('y2', 0).attr('stroke', color).attr('stroke-width', 3);
		// Arms
		p.append('line').attr('x1', -12).attr('y1', -12).attr('x2', 12).attr('y2', -12).attr('stroke', color).attr('stroke-width', 2.5);
		// Legs
		p.append('line').attr('y1', 0).attr('x2', -10).attr('y2', 18).attr('stroke', color).attr('stroke-width', 2.5);
		p.append('line').attr('y1', 0).attr('x2', 10).attr('y2', 18).attr('stroke', color).attr('stroke-width', 2.5);
		// Phone in hand
		p.append('rect').attr('x', 8).attr('y', -16).attr('width', 7).attr('height', 12).attr('fill', '#458588').attr('rx', 1);
	}

	function animate() {
		offset += 0.5;
		svgEl.selectAll('.comm-line').attr('stroke-dashoffset', -offset);
		animationFrame = requestAnimationFrame(animate);
	}

	function play() {}
	function pause() {}
	function next() {}
	function prev() {}
	function skip() {}
	function replay() {}
	function getState() { return { isPlaying: false, currentStep: 0, totalSteps: 0 }; }

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
			.attr('x', width / 2).attr('y', 24)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('V2X: Vehicle-to-Everything Communication');

		// Road
		const roadY = 195;
		svgEl.append('rect')
			.attr('x', 80).attr('y', roadY - 30)
			.attr('width', 520).attr('height', 60)
			.attr('fill', '#3c3836');

		// Road center line
		for (let i = 0; i < 8; i++) {
			svgEl.append('rect')
				.attr('x', 110 + i * 60).attr('y', roadY - 2)
				.attr('width', 35).attr('height', 4)
				.attr('fill', '#fabd2f')
				.attr('opacity', 0.6);
		}

		// Sidewalk
		svgEl.append('rect')
			.attr('x', 80).attr('y', roadY + 30)
			.attr('width', 520).attr('height', 25)
			.attr('fill', '#504945');

		// === ELEMENTS ===
		const car1X = 180;
		const car2X = 450;
		const carY = roadY - 12;
		const trafficX = 340;
		const pedestrianX = 560;
		const towerX = 80;
		const towerY = 90;

		// Tower (top left)
		drawTower(svgEl, towerX, towerY, '#83a598');
		svgEl.append('text')
			.attr('x', towerX).attr('y', towerY + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '10px')
			.text('Network');

		// Cars
		drawCar(svgEl, car1X, carY, '#83a598');
		drawCar(svgEl, car2X, carY, '#d3869b', true);

		// Traffic light
		drawTrafficLight(svgEl, trafficX, roadY - 30);

		// Pedestrian
		drawPerson(svgEl, pedestrianX, roadY + 45, '#8ec07c');

		// === COMMUNICATION LINES ===

		// V2V: Car to Car (red)
		svgEl.append('line')
			.attr('class', 'comm-line')
			.attr('x1', car1X + 35).attr('y1', carY - 20)
			.attr('x2', car2X - 35).attr('y2', carY - 20)
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,6');

		svgEl.append('text')
			.attr('x', (car1X + car2X) / 2).attr('y', carY - 32)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('V2V');

		// V2I: Car to Traffic Light (yellow)
		svgEl.append('line')
			.attr('class', 'comm-line')
			.attr('x1', car1X + 20).attr('y1', carY - 30)
			.attr('x2', trafficX - 15).attr('y2', roadY - 55)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,6');

		svgEl.append('text')
			.attr('x', car1X + 65).attr('y', carY - 48)
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('V2I');

		// V2P: Car to Pedestrian (green)
		svgEl.append('line')
			.attr('class', 'comm-line')
			.attr('x1', car2X + 25).attr('y1', carY)
			.attr('x2', pedestrianX - 15).attr('y2', roadY + 35)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,6');

		svgEl.append('text')
			.attr('x', car2X + 65).attr('y', carY + 5)
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('V2P');

		// V2N: Car to Network/Tower (blue)
		svgEl.append('line')
			.attr('class', 'comm-line')
			.attr('x1', car1X - 10).attr('y1', carY - 30)
			.attr('x2', towerX + 10).attr('y2', towerY + 5)
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,6');

		svgEl.append('text')
			.attr('x', car1X - 55).attr('y', carY - 55)
			.attr('fill', '#83a598')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('V2N');

		// Legend at bottom
		const legendY = height - 18;
		const legends = [
			{ label: 'V2V = Vehicle', color: '#fb4934', x: 95 },
			{ label: 'V2I = Infrastructure', color: '#fabd2f', x: 220 },
			{ label: 'V2P = Pedestrian', color: '#8ec07c', x: 370 },
			{ label: 'V2N = Network', color: '#83a598', x: 510 },
		];

		legends.forEach(l => {
			svgEl.append('circle')
				.attr('cx', l.x - 8).attr('cy', legendY - 4)
				.attr('r', 4)
				.attr('fill', l.color);
			svgEl.append('text')
				.attr('x', l.x).attr('y', legendY)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(l.label);
		});

		animate();
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => {
		if (animationFrame) cancelAnimationFrame(animationFrame);
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
