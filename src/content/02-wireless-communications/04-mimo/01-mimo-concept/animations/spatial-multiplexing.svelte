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

	const maxStep = 5;
	const width = 520;
	const height = 240;

	const titles = [
		'2x2 MIMO: Phone with 2 antennas, Tower with 2 antennas',
		'Tower sends Stream 1 from antenna 1',
		'Tower sends Stream 2 from antenna 2 — same frequency!',
		'Both streams travel through space simultaneously',
		'Phone receives both streams (mixed together)',
		'Phone separates them → 2x the data!'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Tower antenna glows
		svgEl.select('.tower-ant-1-glow')
			.transition().duration(300)
			.attr('opacity', step === 1 ? 0.6 : step >= 3 ? 0.3 : 0);
		svgEl.select('.tower-ant-2-glow')
			.transition().duration(300)
			.attr('opacity', step === 2 ? 0.6 : step >= 3 ? 0.3 : 0);

		// Stream paths
		svgEl.select('.stream-1')
			.transition().duration(500)
			.attr('opacity', step >= 1 ? 1 : 0)
			.attr('stroke-dashoffset', step >= 1 ? 0 : 100);

		svgEl.select('.stream-2')
			.transition().duration(500)
			.attr('opacity', step >= 2 ? 1 : 0)
			.attr('stroke-dashoffset', step >= 2 ? 0 : 100);

		// Phone antenna glows
		svgEl.selectAll('.phone-ant-glow')
			.transition().duration(300)
			.attr('opacity', step >= 4 ? 0.5 : 0);

		// Phone screen content
		svgEl.select('.phone-receiving')
			.transition().duration(300)
			.attr('opacity', step === 4 ? 1 : 0);

		svgEl.select('.phone-separated')
			.transition().duration(300)
			.attr('opacity', step >= 5 ? 1 : 0);

		// Result label
		svgEl.select('.result-label')
			.transition().duration(300)
			.attr('opacity', step >= 5 ? 1 : 0);

		// "Same frequency" label
		svgEl.select('.same-freq-label')
			.transition().duration(300)
			.attr('opacity', step >= 2 && step <= 4 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2000);
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
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// === CELL TOWER (right side) ===
		const towerX = 420;
		const towerBaseY = 200;

		// Tower pole
		svgEl.append('rect')
			.attr('x', towerX - 4).attr('y', 70)
			.attr('width', 8).attr('height', 130)
			.attr('fill', colors.fgMuted);

		// Tower base
		svgEl.append('polygon')
			.attr('points', `${towerX - 25},${towerBaseY} ${towerX + 25},${towerBaseY} ${towerX + 8},${towerBaseY - 30} ${towerX - 8},${towerBaseY - 30}`)
			.attr('fill', colors.fgMuted);

		// Cross bars
		svgEl.append('line')
			.attr('x1', towerX - 20).attr('y1', 100)
			.attr('x2', towerX + 20).attr('y2', 100)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 3);

		svgEl.append('line')
			.attr('x1', towerX - 15).attr('y1', 130)
			.attr('x2', towerX + 15).attr('y2', 130)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		// Tower antenna 1 (top left)
		const ant1X = towerX - 18;
		const ant1Y = 85;

		svgEl.append('circle')
			.attr('class', 'tower-ant-1-glow')
			.attr('cx', ant1X).attr('cy', ant1Y)
			.attr('r', 15)
			.attr('fill', '#fb4934')
			.attr('opacity', 0);

		svgEl.append('rect')
			.attr('x', ant1X - 3).attr('y', ant1Y - 20)
			.attr('width', 6).attr('height', 25)
			.attr('fill', '#fb4934');

		svgEl.append('circle')
			.attr('cx', ant1X).attr('cy', ant1Y - 22)
			.attr('r', 4)
			.attr('fill', '#fb4934');

		// Tower antenna 2 (top right)
		const ant2X = towerX + 18;
		const ant2Y = 85;

		svgEl.append('circle')
			.attr('class', 'tower-ant-2-glow')
			.attr('cx', ant2X).attr('cy', ant2Y)
			.attr('r', 15)
			.attr('fill', '#83a598')
			.attr('opacity', 0);

		svgEl.append('rect')
			.attr('x', ant2X - 3).attr('y', ant2Y - 20)
			.attr('width', 6).attr('height', 25)
			.attr('fill', '#83a598');

		svgEl.append('circle')
			.attr('cx', ant2X).attr('cy', ant2Y - 22)
			.attr('r', 4)
			.attr('fill', '#83a598');

		// Tower label
		svgEl.append('text')
			.attr('x', towerX).attr('y', towerBaseY + 15)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Cell Tower');

		svgEl.append('text')
			.attr('x', towerX).attr('y', towerBaseY + 26)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(2 antennas)');

		// === PHONE (left side) ===
		const phoneX = 70;
		const phoneY = 90;
		const phoneW = 50;
		const phoneH = 90;

		// Phone body
		svgEl.append('rect')
			.attr('x', phoneX).attr('y', phoneY)
			.attr('width', phoneW).attr('height', phoneH)
			.attr('fill', '#282828')
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('rx', 8);

		// Phone screen
		svgEl.append('rect')
			.attr('x', phoneX + 5).attr('y', phoneY + 10)
			.attr('width', phoneW - 10).attr('height', phoneH - 25)
			.attr('fill', '#1d2021')
			.attr('rx', 3);

		// Phone antennas (top corners, subtle)
		const phoneAnt1X = phoneX + 8;
		const phoneAnt1Y = phoneY + 5;
		const phoneAnt2X = phoneX + phoneW - 8;
		const phoneAnt2Y = phoneY + 5;

		svgEl.append('circle')
			.attr('class', 'phone-ant-glow')
			.attr('cx', phoneAnt1X).attr('cy', phoneAnt1Y)
			.attr('r', 10)
			.attr('fill', '#8ec07c')
			.attr('opacity', 0);

		svgEl.append('circle')
			.attr('class', 'phone-ant-glow')
			.attr('cx', phoneAnt2X).attr('cy', phoneAnt2Y)
			.attr('r', 10)
			.attr('fill', '#8ec07c')
			.attr('opacity', 0);

		svgEl.append('circle')
			.attr('cx', phoneAnt1X).attr('cy', phoneAnt1Y)
			.attr('r', 3)
			.attr('fill', colors.fgMuted);

		svgEl.append('circle')
			.attr('cx', phoneAnt2X).attr('cy', phoneAnt2Y)
			.attr('r', 3)
			.attr('fill', colors.fgMuted);

		// Phone label
		svgEl.append('text')
			.attr('x', phoneX + phoneW / 2).attr('y', phoneY + phoneH + 15)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Phone');

		svgEl.append('text')
			.attr('x', phoneX + phoneW / 2).attr('y', phoneY + phoneH + 26)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(2 antennas)');

		// Phone screen: receiving state
		svgEl.append('text')
			.attr('class', 'phone-receiving')
			.attr('x', phoneX + phoneW / 2).attr('y', phoneY + 45)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '8px')
			.attr('opacity', 0)
			.text('receiving...');

		// Phone screen: separated streams
		const separatedG = svgEl.append('g')
			.attr('class', 'phone-separated')
			.attr('opacity', 0);

		separatedG.append('rect')
			.attr('x', phoneX + 8).attr('y', phoneY + 25)
			.attr('width', 15).attr('height', 10)
			.attr('fill', '#fb4934')
			.attr('rx', 2);

		separatedG.append('rect')
			.attr('x', phoneX + 27).attr('y', phoneY + 25)
			.attr('width', 15).attr('height', 10)
			.attr('fill', '#83a598')
			.attr('rx', 2);

		separatedG.append('text')
			.attr('x', phoneX + phoneW / 2).attr('y', phoneY + 55)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '8px').attr('font-weight', 'bold')
			.text('2x DATA');

		// === STREAMS ===
		// Stream 1 (red) - curves from tower ant 1 to phone
		svgEl.append('path')
			.attr('class', 'stream-1')
			.attr('d', `M ${ant1X} ${ant1Y}
			            Q ${250} ${60} ${phoneX + phoneW} ${phoneY + 20}`)
			.attr('fill', 'none')
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 3)
			.attr('stroke-linecap', 'round')
			.attr('stroke-dasharray', '8,4')
			.attr('opacity', 0);

		// Stream 2 (blue) - curves from tower ant 2 to phone
		svgEl.append('path')
			.attr('class', 'stream-2')
			.attr('d', `M ${ant2X} ${ant2Y}
			            Q ${280} ${160} ${phoneX + phoneW} ${phoneY + 40}`)
			.attr('fill', 'none')
			.attr('stroke', '#83a598')
			.attr('stroke-width', 3)
			.attr('stroke-linecap', 'round')
			.attr('stroke-dasharray', '8,4')
			.attr('opacity', 0);

		// "Same frequency" label
		svgEl.append('text')
			.attr('class', 'same-freq-label')
			.attr('x', width / 2 + 20).attr('y', 120)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('Same frequency!');

		// Result label
		const resultG = svgEl.append('g')
			.attr('class', 'result-label')
			.attr('opacity', 0);

		resultG.append('rect')
			.attr('x', 160).attr('y', height - 35)
			.attr('width', 200).attr('height', 26)
			.attr('fill', 'rgba(142, 192, 124, 0.15)')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 1)
			.attr('rx', 5);

		resultG.append('text')
			.attr('x', 260).attr('y', height - 17)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('2 streams = 2x throughput!');

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
