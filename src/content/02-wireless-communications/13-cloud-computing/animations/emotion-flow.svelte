<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let animationFrame: number;
	let colors: Record<string, string>;
	let offset = 0;
	let emotionIndex = 0;
	let lastEmotionChange = 0;

	const width = 650;
	const height = 300;

	const emotions = ['Happy', 'Sad', 'Angry', 'Stressed', 'Tired'];

	function drawPhone(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const p = g.append('g').attr('transform', `translate(${x}, ${y})`);
		p.append('rect').attr('x', -18).attr('y', -30).attr('width', 36).attr('height', 60)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 5);
		p.append('rect').attr('x', -14).attr('y', -25).attr('width', 28).attr('height', 42)
			.attr('fill', '#1d2021').attr('rx', 2);
		p.append('circle').attr('cx', 0).attr('cy', 22).attr('r', 4).attr('fill', color);
		// Camera dot
		p.append('circle').attr('cx', 0).attr('cy', -27).attr('r', 2).attr('fill', color);
	}

	function drawCloud(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const c = g.append('g').attr('transform', `translate(${x}, ${y})`);
		// Cloud shape
		c.append('ellipse').attr('cx', 0).attr('cy', 0).attr('rx', 50).attr('ry', 30)
			.attr('fill', '#3c3836').attr('stroke', color).attr('stroke-width', 2);
		c.append('ellipse').attr('cx', -30).attr('cy', 10).attr('rx', 25).attr('ry', 18)
			.attr('fill', '#3c3836').attr('stroke', color).attr('stroke-width', 2);
		c.append('ellipse').attr('cx', 30).attr('cy', 10).attr('rx', 25).attr('ry', 18)
			.attr('fill', '#3c3836').attr('stroke', color).attr('stroke-width', 2);
		// Fill gaps
		c.append('ellipse').attr('cx', 0).attr('cy', 5).attr('rx', 45).attr('ry', 25)
			.attr('fill', '#3c3836');
	}

	function animate() {
		offset += 0.5;
		svgEl.selectAll('.data-flow').attr('stroke-dashoffset', -offset);
		svgEl.selectAll('.response-flow').attr('stroke-dashoffset', offset);

		// Cycle through emotions
		const now = Date.now();
		if (now - lastEmotionChange > 2000) {
			lastEmotionChange = now;
			emotionIndex = (emotionIndex + 1) % emotions.length;
			svgEl.select('.emotion-text').text(emotions[emotionIndex]);
		}

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
		lastEmotionChange = Date.now();

		// Title
		svgEl.append('text')
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('Emotion-Aware Mobile Cloud Computing');

		// Phone (left)
		const phoneX = 100, phoneY = 150;
		drawPhone(svgEl, phoneX, phoneY, '#8ec07c');
		svgEl.append('text')
			.attr('x', phoneX).attr('y', phoneY + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Phone');
		svgEl.append('text')
			.attr('x', phoneX).attr('y', phoneY + 63)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Captures Data)');

		// Cloud (center)
		const cloudX = 325, cloudY = 140;
		drawCloud(svgEl, cloudX, cloudY, '#83a598');
		svgEl.append('text')
			.attr('x', cloudX).attr('y', cloudY + 3)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Cloud');
		svgEl.append('text')
			.attr('x', cloudX).attr('y', cloudY + 55)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Processes Emotions)');

		// App response (right)
		const appX = 550, appY = 150;
		svgEl.append('rect')
			.attr('x', appX - 40).attr('y', appY - 35)
			.attr('width', 80).attr('height', 70)
			.attr('fill', '#3c3836')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('rx', 8);
		svgEl.append('text')
			.attr('x', appX).attr('y', appY - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('App');
		svgEl.append('text')
			.attr('class', 'emotion-text')
			.attr('x', appX).attr('y', appY + 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.text(emotions[0]);
		svgEl.append('text')
			.attr('x', appX).attr('y', appY + 55)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Adapts)');

		// Data flow: Phone to Cloud
		svgEl.append('line')
			.attr('class', 'data-flow')
			.attr('x1', phoneX + 25).attr('y1', phoneY - 15)
			.attr('x2', cloudX - 55).attr('y2', cloudY)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		// Data labels
		svgEl.append('text')
			.attr('x', (phoneX + cloudX) / 2 - 20).attr('y', phoneY - 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('Face, Voice,');
		svgEl.append('text')
			.attr('x', (phoneX + cloudX) / 2 - 20).attr('y', phoneY - 33)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('Heart Rate');

		// Response flow: Cloud to App
		svgEl.append('line')
			.attr('class', 'response-flow')
			.attr('x1', cloudX + 55).attr('y1', cloudY)
			.attr('x2', appX - 45).attr('y2', appY)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '10,6');

		// Response label
		svgEl.append('text')
			.attr('x', (cloudX + appX) / 2 + 10).attr('y', cloudY - 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('Detected');
		svgEl.append('text')
			.attr('x', (cloudX + appX) / 2 + 10).attr('y', cloudY - 23)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('Emotion');

		// Input labels on phone
		svgEl.append('text')
			.attr('x', phoneX - 45).attr('y', phoneY - 12)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Camera');
		svgEl.append('text')
			.attr('x', phoneX - 45).attr('y', phoneY + 3)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Mic');
		svgEl.append('text')
			.attr('x', phoneX - 45).attr('y', phoneY + 18)
			.attr('text-anchor', 'end')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Sensors');

		// Bottom explanation
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Phone captures → Cloud processes → App adapts to your emotion');

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
