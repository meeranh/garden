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

	const width = 650;
	const height = 320;

	// Sensor positions throughout the "city"
	const sensors = [
		// Traffic sensors (on roads)
		{ x: 100, y: 215, type: 'traffic', color: '#fabd2f' },
		{ x: 250, y: 225, type: 'traffic', color: '#fabd2f' },
		{ x: 400, y: 220, type: 'traffic', color: '#fabd2f' },
		{ x: 550, y: 218, type: 'traffic', color: '#fabd2f' },
		// Air quality (on buildings)
		{ x: 80, y: 95, type: 'air', color: '#8ec07c' },
		{ x: 225, y: 85, type: 'air', color: '#8ec07c' },
		{ x: 490, y: 90, type: 'air', color: '#8ec07c' },
		// Parking (on ground)
		{ x: 150, y: 250, type: 'parking', color: '#83a598' },
		{ x: 320, y: 255, type: 'parking', color: '#83a598' },
		{ x: 500, y: 248, type: 'parking', color: '#83a598' },
		// Waste bins
		{ x: 120, y: 270, type: 'waste', color: '#d3869b' },
		{ x: 280, y: 275, type: 'waste', color: '#d3869b' },
		{ x: 450, y: 268, type: 'waste', color: '#d3869b' },
		{ x: 580, y: 272, type: 'waste', color: '#d3869b' },
		// Street lights
		{ x: 170, y: 195, type: 'light', color: '#fe8019' },
		{ x: 350, y: 198, type: 'light', color: '#fe8019' },
		{ x: 520, y: 195, type: 'light', color: '#fe8019' },
	];

	function animate() {
		offset += 0.4;

		// Animate communication lines
		svgEl.selectAll('.data-line').attr('stroke-dashoffset', -offset);

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
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text('Smart City: Millions of Connected Sensors');

		// City background elements (simplified buildings)
		const buildings = [
			{ x: 40, y: 100, w: 50, h: 100 },
			{ x: 100, y: 120, w: 35, h: 80 },
			{ x: 180, y: 90, w: 55, h: 110 },
			{ x: 250, y: 110, w: 40, h: 90 },
			{ x: 420, y: 95, w: 45, h: 105 },
			{ x: 480, y: 115, w: 40, h: 85 },
			{ x: 540, y: 100, w: 55, h: 100 },
		];

		buildings.forEach(b => {
			svgEl.append('rect')
				.attr('x', b.x).attr('y', b.y)
				.attr('width', b.w).attr('height', b.h)
				.attr('fill', '#3c3836')
				.attr('stroke', '#504945')
				.attr('stroke-width', 1)
				.attr('rx', 2);

			// Windows
			for (let row = 0; row < Math.floor(b.h / 20); row++) {
				for (let col = 0; col < Math.floor(b.w / 15); col++) {
					svgEl.append('rect')
						.attr('x', b.x + 5 + col * 12)
						.attr('y', b.y + 8 + row * 18)
						.attr('width', 6).attr('height', 8)
						.attr('fill', Math.random() > 0.3 ? '#fabd2f' : '#1d2021')
						.attr('opacity', 0.4);
				}
			}
		});

		// Ground/roads
		svgEl.append('rect')
			.attr('x', 0).attr('y', 200)
			.attr('width', width).attr('height', 100)
			.attr('fill', '#282828');

		// Road markings
		for (let i = 0; i < 12; i++) {
			svgEl.append('rect')
				.attr('x', 20 + i * 55).attr('y', 235)
				.attr('width', 30).attr('height', 3)
				.attr('fill', '#7c6f64')
				.attr('opacity', 0.5);
		}

		// Central tower (in the gap between buildings)
		const towerX = 350;
		const towerY = 140;

		svgEl.append('path')
			.attr('d', `M${towerX},${towerY} L${towerX - 10},${towerY + 50} L${towerX + 10},${towerY + 50} Z`)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2);

		svgEl.append('line')
			.attr('x1', towerX).attr('y1', towerY)
			.attr('x2', towerX).attr('y2', towerY - 15)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2);

		svgEl.append('circle')
			.attr('cx', towerX).attr('cy', towerY - 18)
			.attr('r', 4)
			.attr('fill', '#8ec07c');

		svgEl.append('text')
			.attr('x', towerX).attr('y', towerY - 30)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('5G mMTC');

		// Draw animated data lines from sensors to tower
		sensors.forEach((sensor) => {
			svgEl.append('line')
				.attr('class', 'data-line')
				.attr('x1', sensor.x).attr('y1', sensor.y)
				.attr('x2', towerX).attr('y2', towerY + 30)
				.attr('stroke', sensor.color)
				.attr('stroke-width', 1.5)
				.attr('stroke-dasharray', '4,4')
				.attr('opacity', 0.5);
		});

		// Draw sensors
		sensors.forEach((sensor) => {
			// Glow
			svgEl.append('circle')
				.attr('cx', sensor.x).attr('cy', sensor.y)
				.attr('r', 8)
				.attr('fill', sensor.color)
				.attr('opacity', 0.2);

			// Sensor dot
			svgEl.append('circle')
				.attr('cx', sensor.x).attr('cy', sensor.y)
				.attr('r', 5)
				.attr('fill', sensor.color);
		});

		// Legend
		const legend = [
			{ type: 'Traffic', color: '#fabd2f' },
			{ type: 'Air Quality', color: '#8ec07c' },
			{ type: 'Parking', color: '#83a598' },
			{ type: 'Waste Bins', color: '#d3869b' },
			{ type: 'Lights', color: '#fe8019' },
		];

		legend.forEach((item, i) => {
			const lx = 50 + i * 120;
			svgEl.append('circle')
				.attr('cx', lx).attr('cy', height - 15)
				.attr('r', 5)
				.attr('fill', item.color);

			svgEl.append('text')
				.attr('x', lx + 10).attr('y', height - 11)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(item.type);
		});

		// Device count (top right, clear area)
		svgEl.append('text')
			.attr('x', width - 60).attr('y', 55)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '20px')
			.attr('font-weight', 'bold')
			.text('1M+');

		svgEl.append('text')
			.attr('x', width - 60).attr('y', 72)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('devices/km²');

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
