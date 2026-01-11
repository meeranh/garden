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
	const height = 260;

	const titles = [
		'Two gateways, two different jobs',
		'S-GW: Handles mobility WITHIN LTE',
		'P-GW: Connects to OUTSIDE world',
		'Together they route all your data'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		svgEl.select('.sgw-highlight')
			.transition().duration(400)
			.attr('opacity', step === 1 ? 1 : 0);

		svgEl.select('.pgw-highlight')
			.transition().duration(400)
			.attr('opacity', step === 2 ? 1 : 0);

		svgEl.select('.flow-arrows')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		svgEl.select('.summary-group')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2200);
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

		const y = 110;

		// UE
		svgEl.append('rect')
			.attr('x', 30).attr('y', y - 20)
			.attr('width', 50).attr('height', 40)
			.attr('fill', '#83a598').attr('fill-opacity', 0.3)
			.attr('stroke', '#83a598').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 55).attr('y', y + 5)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('UE');

		// eNodeB
		svgEl.append('rect')
			.attr('x', 110).attr('y', y - 20)
			.attr('width', 60).attr('height', 40)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.3)
			.attr('stroke', '#8ec07c').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 140).attr('y', y + 5)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('eNodeB');

		// S-GW
		svgEl.append('rect')
			.attr('x', 210).attr('y', y - 25)
			.attr('width', 80).attr('height', 50)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.3)
			.attr('stroke', '#fabd2f').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 250).attr('y', y + 5)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('S-GW');

		// S-GW highlight
		const sgwHighlight = svgEl.append('g').attr('class', 'sgw-highlight').attr('opacity', 0);
		sgwHighlight.append('rect')
			.attr('x', 200).attr('y', y - 35)
			.attr('width', 100).attr('height', 70)
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f').attr('stroke-width', 3)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 6);
		sgwHighlight.append('text')
			.attr('x', 250).attr('y', y + 55)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('Internal LTE routing');

		// P-GW
		svgEl.append('rect')
			.attr('x', 340).attr('y', y - 25)
			.attr('width', 80).attr('height', 50)
			.attr('fill', '#fe8019').attr('fill-opacity', 0.3)
			.attr('stroke', '#fe8019').attr('stroke-width', 1)
			.attr('rx', 4);
		svgEl.append('text')
			.attr('x', 380).attr('y', y + 5)
			.attr('text-anchor', 'middle').attr('fill', '#fe8019')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('P-GW');

		// P-GW highlight
		const pgwHighlight = svgEl.append('g').attr('class', 'pgw-highlight').attr('opacity', 0);
		pgwHighlight.append('rect')
			.attr('x', 330).attr('y', y - 35)
			.attr('width', 100).attr('height', 70)
			.attr('fill', 'none')
			.attr('stroke', '#fe8019').attr('stroke-width', 3)
			.attr('stroke-dasharray', '5,3')
			.attr('rx', 6);
		pgwHighlight.append('text')
			.attr('x', 380).attr('y', y + 55)
			.attr('text-anchor', 'middle').attr('fill', '#fe8019')
			.attr('font-size', '9px')
			.text('External connection');

		// Internet
		svgEl.append('ellipse')
			.attr('cx', 510).attr('cy', y)
			.attr('rx', 50).attr('ry', 30)
			.attr('fill', colors.fgMuted).attr('fill-opacity', 0.1)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1);
		svgEl.append('text')
			.attr('x', 510).attr('y', y + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Internet');

		// Connection lines
		svgEl.append('line')
			.attr('x1', 80).attr('y1', y)
			.attr('x2', 110).attr('y2', y)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		svgEl.append('line')
			.attr('x1', 170).attr('y1', y)
			.attr('x2', 210).attr('y2', y)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		svgEl.append('line')
			.attr('x1', 290).attr('y1', y)
			.attr('x2', 340).attr('y2', y)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		svgEl.append('line')
			.attr('x1', 420).attr('y1', y)
			.attr('x2', 460).attr('y2', y)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		// LTE boundary
		svgEl.append('rect')
			.attr('x', 20).attr('y', 55)
			.attr('width', 410).attr('height', 120)
			.attr('fill', 'none')
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,2')
			.attr('rx', 8);
		svgEl.append('text')
			.attr('x', 30).attr('y', 70)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('LTE Network');

		// Flow arrows - below the boxes
		const flowArrows = svgEl.append('g').attr('class', 'flow-arrows').attr('opacity', 0);
		flowArrows.append('path')
			.attr('d', 'M 55 155 L 380 155 L 510 155')
			.attr('fill', 'none')
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrowGreen)');
		flowArrows.append('text')
			.attr('x', 280).attr('y', 170)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '9px')
			.text('Data flows through both gateways');

		// Arrow marker
		const defs = svgEl.append('defs');
		defs.append('marker')
			.attr('id', 'arrowGreen')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5).attr('refY', 5)
			.attr('markerWidth', 4).attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', '#8ec07c');

		// Summary
		const summaryG = svgEl.append('g').attr('class', 'summary-group').attr('opacity', 0);
		summaryG.append('rect')
			.attr('x', width / 2 - 150).attr('y', height - 50)
			.attr('width', 300).attr('height', 38)
			.attr('fill', colors.bg)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('rx', 4);
		summaryG.append('text')
			.attr('x', width / 2).attr('y', height - 33)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '9px')
			.text('S-GW: mobility within LTE');
		summaryG.append('text')
			.attr('x', width / 2).attr('y', height - 18)
			.attr('text-anchor', 'middle').attr('fill', '#fe8019')
			.attr('font-size', '9px')
			.text('P-GW: connection to internet');

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
