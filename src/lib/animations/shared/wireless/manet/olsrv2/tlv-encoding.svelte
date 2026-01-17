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

	const maxStep = 4;
	const width = 520;
	const height = 280;

	const titles = [
		'TLV: Type-Length-Value encoding',
		'Each TLV has 3 parts: Type, Length, Value',
		'Messages can contain multiple TLVs',
		'New node adds a new TLV type (Link Quality)',
		'Old node skips unknown TLVs (backwards compatible!)',
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Single TLV explanation (steps 0-1)
		svgEl.select('.single-tlv')
			.transition().duration(400)
			.attr('opacity', step <= 1 ? 1 : 0);

		// Field labels
		svgEl.select('.field-labels')
			.transition().duration(400)
			.attr('opacity', step === 1 ? 1 : 0);

		// Multiple TLVs (steps 2+)
		svgEl.select('.multi-tlv')
			.transition().duration(400)
			.attr('opacity', step >= 2 ? 1 : 0);

		// New TLV highlight (step 3)
		svgEl.select('.new-tlv')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);
		svgEl.select('.new-tlv-label')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// Old node processing (step 4)
		svgEl.select('.old-node')
			.transition().duration(400)
			.attr('opacity', step === 4 ? 1 : 0);
		svgEl.select('.skip-indicator')
			.transition().duration(400)
			.attr('opacity', step === 4 ? 1 : 0);
		svgEl.select('.checkmarks')
			.transition().duration(400)
			.attr('opacity', step === 4 ? 1 : 0);
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

		// ========== Single TLV (steps 0-1) ==========
		const singleG = svgEl.append('g').attr('class', 'single-tlv');
		const singleY = 80, boxH = 50;
		const typeW = 80, lenW = 80, valW = 160;
		const startX = (width - typeW - lenW - valW) / 2;

		// Type box
		singleG.append('rect')
			.attr('x', startX).attr('y', singleY)
			.attr('width', typeW).attr('height', boxH)
			.attr('fill', '#fb4934').attr('fill-opacity', 0.2)
			.attr('stroke', '#fb4934').attr('stroke-width', 2);
		singleG.append('text')
			.attr('x', startX + typeW / 2).attr('y', singleY + boxH / 2 + 5)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('Type');

		// Length box
		singleG.append('rect')
			.attr('x', startX + typeW).attr('y', singleY)
			.attr('width', lenW).attr('height', boxH)
			.attr('fill', '#fabd2f').attr('fill-opacity', 0.2)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2);
		singleG.append('text')
			.attr('x', startX + typeW + lenW / 2).attr('y', singleY + boxH / 2 + 5)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('Length');

		// Value box
		singleG.append('rect')
			.attr('x', startX + typeW + lenW).attr('y', singleY)
			.attr('width', valW).attr('height', boxH)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.2)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2);
		singleG.append('text')
			.attr('x', startX + typeW + lenW + valW / 2).attr('y', singleY + boxH / 2 + 5)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('Value');

		// Field labels (step 1)
		const labelsG = svgEl.append('g').attr('class', 'field-labels').attr('opacity', 0);
		labelsG.append('text')
			.attr('x', startX + typeW / 2).attr('y', singleY + boxH + 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('What kind?');
		labelsG.append('text')
			.attr('x', startX + typeW + lenW / 2).attr('y', singleY + boxH + 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('How big?');
		labelsG.append('text')
			.attr('x', startX + typeW + lenW + valW / 2).attr('y', singleY + boxH + 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('The data');

		// ========== Multiple TLVs (steps 2+) ==========
		const multiG = svgEl.append('g').attr('class', 'multi-tlv').attr('opacity', 0);
		const multiY = 70;
		const tlvH = 35, tlvGap = 8;
		const tlvData = [
			{ type: '1', name: 'Address', color: '#83a598' },
			{ type: '2', name: 'Neighbor', color: '#d3869b' },
		];

		// Message container (sized for 3 TLVs)
		multiG.append('rect')
			.attr('class', 'msg-container')
			.attr('x', 60).attr('y', multiY - 15)
			.attr('width', 400).attr('height', 3 * (tlvH + tlvGap) + 25)
			.attr('fill', 'none')
			.attr('stroke', colors.fgMuted).attr('stroke-width', 1)
			.attr('stroke-dasharray', '4,2')
			.attr('rx', 4);
		multiG.append('text')
			.attr('x', 70).attr('y', multiY)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Message:');

		tlvData.forEach((tlv, i) => {
			const y = multiY + 12 + i * (tlvH + tlvGap);
			const tW = 40, lW = 40, vW = 280;

			multiG.append('rect')
				.attr('x', 80).attr('y', y)
				.attr('width', tW).attr('height', tlvH)
				.attr('fill', tlv.color).attr('fill-opacity', 0.2)
				.attr('stroke', tlv.color).attr('stroke-width', 1.5);
			multiG.append('text')
				.attr('x', 80 + tW / 2).attr('y', y + tlvH / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', tlv.color)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(tlv.type);

			multiG.append('rect')
				.attr('x', 80 + tW).attr('y', y)
				.attr('width', lW).attr('height', tlvH)
				.attr('fill', tlv.color).attr('fill-opacity', 0.1)
				.attr('stroke', tlv.color).attr('stroke-width', 1.5);
			multiG.append('text')
				.attr('x', 80 + tW + lW / 2).attr('y', y + tlvH / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', tlv.color)
				.attr('font-size', '10px')
				.text('8');

			multiG.append('rect')
				.attr('x', 80 + tW + lW).attr('y', y)
				.attr('width', vW).attr('height', tlvH)
				.attr('fill', tlv.color).attr('fill-opacity', 0.05)
				.attr('stroke', tlv.color).attr('stroke-width', 1.5);
			multiG.append('text')
				.attr('x', 80 + tW + lW + vW / 2).attr('y', y + tlvH / 2 + 4)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '10px')
				.text(tlv.name + ' data...');
		});

		// New TLV (step 3) - Link Quality
		const newG = svgEl.append('g').attr('class', 'new-tlv').attr('opacity', 0);
		const newY = multiY + 12 + 2 * (tlvH + tlvGap);
		const tW = 40, lW = 40, vW = 280;

		newG.append('rect')
			.attr('x', 80).attr('y', newY)
			.attr('width', tW).attr('height', tlvH)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.3)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2);
		newG.append('text')
			.attr('x', 80 + tW / 2).attr('y', newY + tlvH / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('99');

		newG.append('rect')
			.attr('x', 80 + tW).attr('y', newY)
			.attr('width', lW).attr('height', tlvH)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.15)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2);
		newG.append('text')
			.attr('x', 80 + tW + lW / 2).attr('y', newY + tlvH / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('4');

		newG.append('rect')
			.attr('x', 80 + tW + lW).attr('y', newY)
			.attr('width', vW).attr('height', tlvH)
			.attr('fill', '#8ec07c').attr('fill-opacity', 0.08)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2);
		newG.append('text')
			.attr('x', 80 + tW + lW + vW / 2).attr('y', newY + tlvH / 2 + 4)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Link Quality = 85%');

		svgEl.append('text')
			.attr('class', 'new-tlv-label')
			.attr('x', 80 + tW + lW + vW + 10).attr('y', newY + tlvH / 2 + 4)
			.attr('text-anchor', 'start').attr('fill', '#8ec07c')
			.attr('font-size', '9px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('NEW!');

		// Old node indicator (step 4)
		svgEl.append('text')
			.attr('class', 'old-node')
			.attr('x', width / 2).attr('y', 230)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text('Old node receiving this message:');

		// Checkmarks for known TLVs
		const checksG = svgEl.append('g').attr('class', 'checkmarks').attr('opacity', 0);
		checksG.append('text')
			.attr('x', 140).attr('y', 255)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.text('Type 1: Process');
		checksG.append('text')
			.attr('x', 280).attr('y', 255)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px')
			.text('Type 2: Process');
		checksG.append('text')
			.attr('x', 420).attr('y', 255)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '11px')
			.text('Type 99: Skip');

		// Skip indicator arrow
		svgEl.append('text')
			.attr('class', 'skip-indicator')
			.attr('x', width / 2).attr('y', 272)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('(uses Length field to skip over unknown data)');

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
