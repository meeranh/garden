<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let animationFrame: number;
	let offset = 0;
	let armAngle = 0;
	let colors: Record<string, string>;

	const width = 650;
	const height = 300;

	function drawRobotArm(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string, id: string) {
		const robot = g.append('g').attr('class', id).attr('transform', `translate(${x}, ${y})`);

		// Base
		robot.append('rect')
			.attr('x', -20).attr('y', 0)
			.attr('width', 40).attr('height', 15)
			.attr('fill', '#504945')
			.attr('stroke', color)
			.attr('stroke-width', 2)
			.attr('rx', 2);

		// Arm segment 1 (rotating)
		const arm1 = robot.append('g').attr('class', `${id}-arm1`);
		arm1.append('rect')
			.attr('x', -8).attr('y', -45)
			.attr('width', 16).attr('height', 45)
			.attr('fill', '#3c3836')
			.attr('stroke', color)
			.attr('stroke-width', 2)
			.attr('rx', 3);

		// Joint
		arm1.append('circle')
			.attr('cy', -45)
			.attr('r', 8)
			.attr('fill', '#504945')
			.attr('stroke', color)
			.attr('stroke-width', 2);

		// Arm segment 2
		const arm2 = arm1.append('g').attr('class', `${id}-arm2`).attr('transform', 'translate(0, -45)');
		arm2.append('rect')
			.attr('x', -6).attr('y', -35)
			.attr('width', 12).attr('height', 35)
			.attr('fill', '#3c3836')
			.attr('stroke', color)
			.attr('stroke-width', 2)
			.attr('rx', 2);

		// Gripper
		arm2.append('rect')
			.attr('x', -10).attr('y', -42)
			.attr('width', 20).attr('height', 8)
			.attr('fill', color)
			.attr('rx', 2);
	}

	function drawAGV(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const agv = g.append('g').attr('transform', `translate(${x}, ${y})`);

		// Platform
		agv.append('rect')
			.attr('x', -30).attr('y', -15)
			.attr('width', 60).attr('height', 20)
			.attr('fill', '#504945')
			.attr('stroke', color)
			.attr('stroke-width', 2)
			.attr('rx', 3);

		// Cargo
		agv.append('rect')
			.attr('x', -20).attr('y', -35)
			.attr('width', 40).attr('height', 20)
			.attr('fill', '#8ec07c')
			.attr('fill-opacity', 0.3)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 1)
			.attr('rx', 2);

		// Wheels
		agv.append('circle').attr('cx', -20).attr('cy', 8).attr('r', 7).attr('fill', '#282828').attr('stroke', '#7c6f64');
		agv.append('circle').attr('cx', 20).attr('cy', 8).attr('r', 7).attr('fill', '#282828').attr('stroke', '#7c6f64');

		// Sensor
		agv.append('circle')
			.attr('cx', 0).attr('cy', -8)
			.attr('r', 4)
			.attr('fill', color);
	}

	function animate() {
		offset += 0.5;
		armAngle = Math.sin(offset * 0.02) * 15;

		svgEl.selectAll('.comm-line').attr('stroke-dashoffset', -offset);

		// Animate robot arms
		svgEl.select('.robot1-arm1').attr('transform', `rotate(${armAngle})`);
		svgEl.select('.robot2-arm1').attr('transform', `rotate(${-armAngle})`);
		svgEl.select('.robot3-arm1').attr('transform', `rotate(${armAngle * 0.7})`);

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
			.text('Industrial IoT: Wireless Factory');

		// Factory floor
		svgEl.append('rect')
			.attr('x', 30).attr('y', 220)
			.attr('width', width - 60).attr('height', 40)
			.attr('fill', '#3c3836')
			.attr('stroke', '#504945')
			.attr('stroke-width', 2);

		// Grid pattern on floor
		for (let i = 0; i < 15; i++) {
			svgEl.append('line')
				.attr('x1', 70 + i * 40).attr('y1', 220)
				.attr('x2', 70 + i * 40).attr('y2', 260)
				.attr('stroke', '#504945')
				.attr('stroke-width', 1);
		}

		const floorY = 220;

		// Robot arms
		drawRobotArm(svgEl, 120, floorY, '#fabd2f', 'robot1');
		drawRobotArm(svgEl, 320, floorY, '#fabd2f', 'robot2');
		drawRobotArm(svgEl, 520, floorY, '#fabd2f', 'robot3');

		// AGV
		drawAGV(svgEl, 220, floorY - 5, '#83a598');

		// Central controller (5G base station)
		const ctrlX = width / 2;
		const ctrlY = 70;

		svgEl.append('rect')
			.attr('x', ctrlX - 40).attr('y', ctrlY - 25)
			.attr('width', 80).attr('height', 50)
			.attr('fill', '#504945')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2)
			.attr('rx', 5);

		svgEl.append('text')
			.attr('x', ctrlX).attr('y', ctrlY - 5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('5G Controller');

		svgEl.append('text')
			.attr('x', ctrlX).attr('y', ctrlY + 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('<1ms latency');

		// Wireless signals from controller to each device
		const devices = [
			{ x: 120, y: floorY - 90, label: 'Robot 1' },
			{ x: 220, y: floorY - 45, label: 'AGV' },
			{ x: 320, y: floorY - 90, label: 'Robot 2' },
			{ x: 520, y: floorY - 90, label: 'Robot 3' }
		];

		devices.forEach(device => {
			svgEl.append('line')
				.attr('class', 'comm-line')
				.attr('x1', ctrlX).attr('y1', ctrlY + 25)
				.attr('x2', device.x).attr('y2', device.y)
				.attr('stroke', '#8ec07c')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '6,4')
				.attr('opacity', 0.7);
		});

		// "No Wires" callout
		svgEl.append('text')
			.attr('x', 80).attr('y', 80)
			.attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('No Cables!');

		svgEl.append('text')
			.attr('x', 80).attr('y', 95)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Reconfigure');

		svgEl.append('text')
			.attr('x', 80).attr('y', 107)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('in hours');

		// Reliability callout
		svgEl.append('text')
			.attr('x', width - 100).attr('y', 80)
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('99.9999%');

		svgEl.append('text')
			.attr('x', width - 100).attr('y', 95)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Reliability');

		// Bottom note
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('URLLC enables wireless factory automation with wired reliability');

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
