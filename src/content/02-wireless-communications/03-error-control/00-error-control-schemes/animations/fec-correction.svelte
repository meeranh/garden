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
	const width = 400;
	const height = 160;

	// Positions for the "number line" of codewords
	const lineY = 80;
	const pos000 = 80;
	const pos001 = 160;  // Invalid - received with error
	const pos111 = 320;

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		svgEl.select('.valid-codewords').attr('opacity', step >= 0 ? 1 : 0);
		svgEl.select('.received-group').attr('opacity', step >= 1 ? 1 : 0);
		svgEl.select('.distance-lines').attr('opacity', step >= 2 ? 1 : 0);
		svgEl.select('.conclusion').attr('opacity', step >= 3 ? 1 : 0);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1500);
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

		// Valid codewords group
		const validGroup = svgEl.append('g').attr('class', 'valid-codewords').attr('opacity', 0);

		// Horizontal line
		validGroup.append('line')
			.attr('x1', 40).attr('x2', 360)
			.attr('y1', lineY).attr('y2', lineY)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		// 000 (valid)
		validGroup.append('circle')
			.attr('cx', pos000).attr('cy', lineY).attr('r', 20)
			.attr('fill', '#8ec07c');
		validGroup.append('text')
			.attr('x', pos000).attr('y', lineY + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '12px').attr('font-weight', 'bold').attr('font-family', 'monospace')
			.text('000');
		validGroup.append('text')
			.attr('x', pos000).attr('y', lineY - 30)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Valid');

		// 111 (valid)
		validGroup.append('circle')
			.attr('cx', pos111).attr('cy', lineY).attr('r', 20)
			.attr('fill', '#8ec07c');
		validGroup.append('text')
			.attr('x', pos111).attr('y', lineY + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '12px').attr('font-weight', 'bold').attr('font-family', 'monospace')
			.text('111');
		validGroup.append('text')
			.attr('x', pos111).attr('y', lineY - 30)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Valid');

		// Received group (001 - invalid)
		const receivedGroup = svgEl.append('g').attr('class', 'received-group').attr('opacity', 0);

		receivedGroup.append('circle')
			.attr('cx', pos001).attr('cy', lineY).attr('r', 18)
			.attr('fill', '#fb4934');
		receivedGroup.append('text')
			.attr('x', pos001).attr('y', lineY + 5)
			.attr('text-anchor', 'middle').attr('fill', colors.bg)
			.attr('font-size', '11px').attr('font-weight', 'bold').attr('font-family', 'monospace')
			.text('001');
		receivedGroup.append('text')
			.attr('x', pos001).attr('y', lineY - 28)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('Received');
		receivedGroup.append('text')
			.attr('x', pos001).attr('y', lineY - 40)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '9px')
			.text('(invalid!)');

		// Distance lines
		const distanceGroup = svgEl.append('g').attr('class', 'distance-lines').attr('opacity', 0);

		// Distance to 000 (1 bit)
		distanceGroup.append('line')
			.attr('x1', pos000 + 20).attr('x2', pos001 - 18)
			.attr('y1', lineY + 25).attr('y2', lineY + 25)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2);
		distanceGroup.append('text')
			.attr('x', (pos000 + pos001) / 2).attr('y', lineY + 42)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('1 bit away');

		// Distance to 111 (2 bits)
		distanceGroup.append('line')
			.attr('x1', pos001 + 18).attr('x2', pos111 - 20)
			.attr('y1', lineY + 25).attr('y2', lineY + 25)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);
		distanceGroup.append('text')
			.attr('x', (pos001 + pos111) / 2).attr('y', lineY + 42)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('2 bits away');

		// Conclusion
		const conclusionGroup = svgEl.append('g').attr('class', 'conclusion').attr('opacity', 0);

		conclusionGroup.append('text')
			.attr('x', width / 2).attr('y', height - 15)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('Closest to 000 → Decode as 0');

		// Arrow pointing to 000
		conclusionGroup.append('path')
			.attr('d', `M ${pos001} ${lineY + 55} Q ${(pos000 + pos001) / 2} ${lineY + 70} ${pos000} ${lineY + 25}`)
			.attr('fill', 'none').attr('stroke', '#8ec07c')
			.attr('stroke-width', 2).attr('stroke-dasharray', '4,3');

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
