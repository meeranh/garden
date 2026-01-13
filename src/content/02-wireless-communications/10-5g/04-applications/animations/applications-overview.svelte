<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let animationFrame: number;
	let pulsePhase = 0;
	let colors: Record<string, string>;

	const width = 700;
	const height = 300;

	const pillars = [
		{
			name: 'eMBB',
			subtitle: 'Speed',
			color: '#8ec07c',
			x: 120,
			apps: ['4K/8K Streaming', 'Cloud Gaming', 'AR/VR']
		},
		{
			name: 'URLLC',
			subtitle: 'Reliability',
			color: '#fabd2f',
			x: 350,
			apps: ['Self-Driving Cars', 'Remote Surgery', 'Factory Robots']
		},
		{
			name: 'mMTC',
			subtitle: 'Scale',
			color: '#83a598',
			x: 580,
			apps: ['Smart Cities', 'Agriculture', 'Wearables']
		}
	];

	function animate() {
		pulsePhase += 0.03;
		const scale = 1 + Math.sin(pulsePhase) * 0.05;

		pillars.forEach((_, i) => {
			svgEl.select(`.pillar-circle-${i}`)
				.attr('transform', `scale(${scale})`);
		});

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
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('5G Pillars → Applications');

		const baseY = 100;

		pillars.forEach((pillar, i) => {
			const g = svgEl.append('g').attr('transform', `translate(${pillar.x}, ${baseY})`);

			// Glow effect
			g.append('circle')
				.attr('r', 42)
				.attr('fill', pillar.color)
				.attr('fill-opacity', 0.15);

			// Main circle with transform origin at center
			const circleG = g.append('g').attr('class', `pillar-circle-${i}`);
			circleG.append('circle')
				.attr('r', 35)
				.attr('fill', pillar.color)
				.attr('fill-opacity', 0.3)
				.attr('stroke', pillar.color)
				.attr('stroke-width', 2);

			// Pillar name
			g.append('text')
				.attr('y', -5)
				.attr('text-anchor', 'middle')
				.attr('fill', pillar.color)
				.attr('font-size', '13px')
				.attr('font-weight', 'bold')
				.text(pillar.name);

			// Subtitle
			g.append('text')
				.attr('y', 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(pillar.subtitle);

			// Arrow down
			g.append('path')
				.attr('d', 'M0,45 L0,65 M-6,59 L0,65 L6,59')
				.attr('fill', 'none')
				.attr('stroke', pillar.color)
				.attr('stroke-width', 2);

			// Applications box
			const boxY = 80;
			const boxHeight = 70;

			g.append('rect')
				.attr('x', -70).attr('y', boxY)
				.attr('width', 140).attr('height', boxHeight)
				.attr('fill', pillar.color)
				.attr('fill-opacity', 0.08)
				.attr('stroke', pillar.color)
				.attr('stroke-opacity', 0.3)
				.attr('rx', 6);

			// Application items
			pillar.apps.forEach((app, j) => {
				g.append('text')
					.attr('x', 0).attr('y', boxY + 20 + j * 18)
					.attr('text-anchor', 'middle')
					.attr('fill', colors.fg)
					.attr('font-size', '10px')
					.text(app);
			});
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
