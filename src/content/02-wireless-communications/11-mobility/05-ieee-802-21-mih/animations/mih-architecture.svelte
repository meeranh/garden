<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();
	let svg: SVGSVGElement;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let animationFrame: number;
	let colors: Record<string, string>;
	let messageY = 0;
	let messagePhase = 0;
	let currentMessageIndex = 0;
	let lastMessageChange = 0;

	const width = 650;
	const height = 350;

	const messages = [
		'Link_Going_Down',
		'Link_Detected',
		'Link_Up',
		'Link_Down',
		'Link_Parameters_Report'
	];

	function drawPhone(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const p = g.append('g').attr('transform', `translate(${x}, ${y})`);
		p.append('rect').attr('x', -12).attr('y', -20).attr('width', 24).attr('height', 40)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 2).attr('rx', 4);
		p.append('rect').attr('x', -9).attr('y', -16).attr('width', 18).attr('height', 28)
			.attr('fill', '#1d2021').attr('rx', 2);
		p.append('circle').attr('cx', 0).attr('cy', 14).attr('r', 3).attr('fill', color);
	}

	function drawWifiTower(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		// Base
		t.append('rect').attr('x', -4).attr('y', 0).attr('width', 8).attr('height', 30)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 1.5);
		// WiFi waves
		for (let i = 0; i < 3; i++) {
			t.append('path')
				.attr('d', `M${-8 - i * 6},-5 Q0,${-15 - i * 8} ${8 + i * 6},-5`)
				.attr('fill', 'none')
				.attr('stroke', color)
				.attr('stroke-width', 2)
				.attr('opacity', 0.9 - i * 0.25);
		}
	}

	function drawCellTower(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		// Tower structure
		t.append('polygon')
			.attr('points', '-3,-35 3,-35 8,30 -8,30')
			.attr('fill', '#504945')
			.attr('stroke', color)
			.attr('stroke-width', 1.5);
		// Antenna bars
		t.append('line').attr('x1', -12).attr('y1', -30).attr('x2', 12).attr('y2', -30)
			.attr('stroke', color).attr('stroke-width', 2);
		t.append('line').attr('x1', -8).attr('y1', -20).attr('x2', 8).attr('y2', -20)
			.attr('stroke', color).attr('stroke-width', 2);
		// Signal dots
		t.append('circle').attr('cx', -12).attr('cy', -30).attr('r', 3).attr('fill', color);
		t.append('circle').attr('cx', 12).attr('cy', -30).attr('r', 3).attr('fill', color);
	}

	function drawWimaxTower(g: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, color: string) {
		const t = g.append('g').attr('transform', `translate(${x}, ${y})`);
		// Pole
		t.append('rect').attr('x', -3).attr('y', -20).attr('width', 6).attr('height', 50)
			.attr('fill', '#504945').attr('stroke', color).attr('stroke-width', 1.5);
		// Dish
		t.append('ellipse').attr('cx', 0).attr('cy', -25).attr('rx', 15).attr('ry', 8)
			.attr('fill', '#3c3836').attr('stroke', color).attr('stroke-width', 2);
		t.append('circle').attr('cx', 0).attr('cy', -25).attr('r', 4).attr('fill', color);
	}

	function animate() {
		messagePhase += 0.03;
		messageY = Math.sin(messagePhase) * 5;

		// Animate the flowing message
		svgEl.select('.msg-packet')
			.attr('transform', `translate(0, ${messageY})`);

		// Pulse the MIH hub
		const pulse = 0.8 + Math.sin(messagePhase * 2) * 0.2;
		svgEl.select('.mih-hub')
			.attr('opacity', pulse);

		// Cycle through messages every 2 seconds
		const now = Date.now();
		if (now - lastMessageChange > 2000) {
			lastMessageChange = now;
			currentMessageIndex = (currentMessageIndex + 1) % messages.length;
			svgEl.select('.msg-text').text(messages[currentMessageIndex]);
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
		lastMessageChange = Date.now();

		// Title
		svgEl.append('text')
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('MIH: The Universal Translator');

		// === Phone (Upper Layer User) ===
		const phoneX = 80, phoneY = 170;
		drawPhone(svgEl, phoneX, phoneY, '#fabd2f');
		svgEl.append('text')
			.attr('x', phoneX).attr('y', phoneY + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Mobile IP');
		svgEl.append('text')
			.attr('x', phoneX).attr('y', phoneY + 47)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Upper Layer)');

		// === MIH Hub (Center) ===
		const mihX = 325, mihY = 170;

		// Outer glow ring
		svgEl.append('circle')
			.attr('class', 'mih-hub')
			.attr('cx', mihX).attr('cy', mihY)
			.attr('r', 55)
			.attr('fill', 'none')
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '8,4')
			.attr('opacity', 0.5);

		// Inner hub
		svgEl.append('circle')
			.attr('cx', mihX).attr('cy', mihY)
			.attr('r', 40)
			.attr('fill', '#3c3836')
			.attr('stroke', '#83a598')
			.attr('stroke-width', 3);

		svgEl.append('text')
			.attr('x', mihX).attr('y', mihY - 5)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('MIH');
		svgEl.append('text')
			.attr('x', mihX).attr('y', mihY + 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Function');

		// === Network Towers ===
		const towerY = 280;

		// WiFi
		drawWifiTower(svgEl, 480, towerY, '#8ec07c');
		svgEl.append('text')
			.attr('x', 480).attr('y', towerY + 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('WiFi');

		// LTE
		drawCellTower(svgEl, 555, towerY + 5, '#d3869b');
		svgEl.append('text')
			.attr('x', 555).attr('y', towerY + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#d3869b')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('LTE');

		// WiMAX
		drawWimaxTower(svgEl, 620, towerY, '#fe8019');
		svgEl.append('text')
			.attr('x', 620).attr('y', towerY + 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fe8019')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('WiMAX');

		// === Connections from MIH to towers ===
		const towers = [
			{ x: 480, color: '#8ec07c' },
			{ x: 555, color: '#d3869b' },
			{ x: 620, color: '#fe8019' }
		];

		towers.forEach(t => {
			svgEl.append('line')
				.attr('x1', mihX + 35).attr('y1', mihY + 25)
				.attr('x2', t.x).attr('y2', towerY - 40)
				.attr('stroke', t.color)
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '5,5')
				.attr('opacity', 0.6);
		});

		// === Single clean connection from Phone to MIH ===
		svgEl.append('line')
			.attr('x1', phoneX + 15).attr('y1', phoneY)
			.attr('x2', mihX - 42).attr('y2', mihY)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,5');

		// === Animated Message Packet (floats above the line) ===
		const msgX = (phoneX + mihX) / 2 - 20;
		const msgY = 130;
		const msgW = 145, msgH = 28;

		const msgG = svgEl.append('g')
			.attr('class', 'msg-packet')
			.attr('transform', 'translate(0, 0)');

		// Event message bubble
		msgG.append('rect')
			.attr('x', msgX - msgW / 2).attr('y', msgY - msgH / 2)
			.attr('width', msgW).attr('height', msgH)
			.attr('fill', '#1d2021')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 1.5)
			.attr('rx', 4);
		msgG.append('text')
			.attr('class', 'msg-text')
			.attr('x', msgX).attr('y', msgY + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text(messages[0]);

		// Small arrow pointing down to the line
		svgEl.append('path')
			.attr('d', `M${msgX},${msgY + msgH / 2} L${msgX},${msgY + msgH / 2 + 12}`)
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 1.5);
		svgEl.append('path')
			.attr('d', `M${msgX - 5},${msgY + msgH / 2 + 7} L${msgX},${msgY + msgH / 2 + 12} L${msgX + 5},${msgY + msgH / 2 + 7}`)
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 1.5);

		// === Labels ===
		// "Same message format" annotation
		svgEl.append('text')
			.attr('x', 550).attr('y', 55)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Different networks,');
		svgEl.append('text')
			.attr('x', 550).attr('y', 70)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('same events!');

		// Workflow annotation
		svgEl.append('text')
			.attr('x', 30).attr('y', 55)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('WiFi signal dropping...');
		svgEl.append('text')
			.attr('x', 30).attr('y', 70)
			.attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('MIH warns Mobile IP!');

		// Network bracket
		svgEl.append('path')
			.attr('d', 'M450,330 L450,335 L630,335 L630,330')
			.attr('fill', 'none')
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1);
		svgEl.append('text')
			.attr('x', 540).attr('y', 348)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('All speak "MIH language"');

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
