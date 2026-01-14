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
	const width = 500;
	const height = 320;

	// Positions
	const apX = 90;
	const clientX = 410;
	const centerX = width / 2;

	// Message Y positions (evenly spaced)
	const msgStartY = 100;
	const msgGap = 55;

	const titles = [
		'Four-Way Handshake: Securely establish encryption keys',
		'Step 1: AP sends random number (ANonce)',
		'Step 2: Client sends SNonce + proves it knows password',
		'Step 3: AP sends Group Key (encrypted)',
		'Step 4: Client confirms — handshake complete',
		'Both sides now have the encryption keys!'
	];

	const msgLabels = [
		{ text: 'ANonce', subtext: '(random number)' },
		{ text: 'SNonce + MIC', subtext: '(proof of password)' },
		{ text: 'GTK (encrypted)', subtext: '(group key)' },
		{ text: 'ACK', subtext: '(confirmation)' }
	];

	// Direction: true = AP to Client, false = Client to AP
	const msgDirections = [true, false, true, false];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Show/hide messages based on step
		for (let i = 0; i < 4; i++) {
			const show = step > i;
			svgEl.select(`.msg-${i}`)
				.transition().duration(400)
				.attr('opacity', show ? 1 : 0);

			// Highlight current message
			const isCurrent = step === i + 1;
			svgEl.select(`.msg-arrow-${i}`)
				.transition().duration(300)
				.attr('stroke', isCurrent ? '#fabd2f' : '#8ec07c')
				.attr('stroke-width', isCurrent ? 3 : 2);
		}

		// AP and Client highlights
		svgEl.select('.ap-box')
			.transition().duration(300)
			.attr('stroke', (step === 1 || step === 3) ? '#fabd2f' : colors.fgMuted)
			.attr('stroke-width', (step === 1 || step === 3) ? 2 : 1);

		svgEl.select('.client-box')
			.transition().duration(300)
			.attr('stroke', (step === 2 || step === 4) ? '#fabd2f' : colors.fgMuted)
			.attr('stroke-width', (step === 2 || step === 4) ? 2 : 1);

		// Final state - both have keys
		svgEl.select('.ap-key')
			.transition().duration(300)
			.attr('opacity', step >= 5 ? 1 : 0);
		svgEl.select('.client-key')
			.transition().duration(300)
			.attr('opacity', step >= 5 ? 1 : 0);

		svgEl.select('.success-box')
			.transition().duration(300)
			.attr('opacity', step >= 5 ? 1 : 0);
		svgEl.select('.success-text')
			.transition().duration(300)
			.attr('opacity', step >= 5 ? 1 : 0);
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
			.attr('x', centerX).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text(titles[0]);

		// === AP (Router) ===
		const apBoxY = 55;
		const boxH = 220;
		const boxW = 70;

		svgEl.append('rect')
			.attr('class', 'ap-box')
			.attr('x', apX - boxW/2).attr('y', apBoxY)
			.attr('width', boxW).attr('height', boxH)
			.attr('fill', 'transparent')
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('rx', 6);

		// Router icon (simple)
		svgEl.append('rect')
			.attr('x', apX - 18).attr('y', apBoxY + 12)
			.attr('width', 36).attr('height', 20)
			.attr('fill', colors.fgMuted)
			.attr('rx', 3);

		// Antennas
		svgEl.append('line')
			.attr('x1', apX - 10).attr('y1', apBoxY + 12)
			.attr('x2', apX - 14).attr('y2', apBoxY + 2)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', apX + 10).attr('y1', apBoxY + 12)
			.attr('x2', apX + 14).attr('y2', apBoxY + 2)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		svgEl.append('text')
			.attr('x', apX).attr('y', apBoxY + 50)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('AP');

		svgEl.append('text')
			.attr('x', apX).attr('y', apBoxY + 63)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('(Router)');

		// AP key indicator
		svgEl.append('text')
			.attr('class', 'ap-key')
			.attr('x', apX).attr('y', apBoxY + boxH - 15)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('KEY');

		// === Client ===
		svgEl.append('rect')
			.attr('class', 'client-box')
			.attr('x', clientX - boxW/2).attr('y', apBoxY)
			.attr('width', boxW).attr('height', boxH)
			.attr('fill', 'transparent')
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 1)
			.attr('rx', 6);

		// Phone icon
		svgEl.append('rect')
			.attr('x', clientX - 12).attr('y', apBoxY + 8)
			.attr('width', 24).attr('height', 38)
			.attr('fill', 'transparent')
			.attr('stroke', colors.fgMuted)
			.attr('stroke-width', 2)
			.attr('rx', 4);

		svgEl.append('rect')
			.attr('x', clientX - 8).attr('y', apBoxY + 14)
			.attr('width', 16).attr('height', 22)
			.attr('fill', colors.fgMuted)
			.attr('opacity', 0.3)
			.attr('rx', 1);

		svgEl.append('text')
			.attr('x', clientX).attr('y', apBoxY + 63)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Client');

		// Client key indicator
		svgEl.append('text')
			.attr('class', 'client-key')
			.attr('x', clientX).attr('y', apBoxY + boxH - 15)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('KEY');

		// === Messages ===
		const arrowStartX = apX + boxW/2 + 5;
		const arrowEndX = clientX - boxW/2 - 5;

		for (let i = 0; i < 4; i++) {
			const y = msgStartY + i * msgGap;
			const toRight = msgDirections[i];
			const startX = toRight ? arrowStartX : arrowEndX;
			const endX = toRight ? arrowEndX : arrowStartX;

			const msgG = svgEl.append('g')
				.attr('class', `msg-${i}`)
				.attr('opacity', 0);

			// Arrow line
			msgG.append('line')
				.attr('class', `msg-arrow-${i}`)
				.attr('x1', startX).attr('y1', y)
				.attr('x2', endX).attr('y2', y)
				.attr('stroke', '#8ec07c')
				.attr('stroke-width', 2)
				.attr('marker-end', 'url(#arrowhead)');

			// Message number
			msgG.append('text')
				.attr('x', centerX - 80).attr('y', y - 8)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`${i + 1}.`);

			// Message label
			msgG.append('text')
				.attr('x', centerX).attr('y', y - 8)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '10px').attr('font-weight', 'bold')
				.text(msgLabels[i].text);

			// Message subtext
			msgG.append('text')
				.attr('x', centerX).attr('y', y + 18)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '8px')
				.text(msgLabels[i].subtext);
		}

		// Arrow marker definition
		svgEl.append('defs')
			.append('marker')
			.attr('id', 'arrowhead')
			.attr('markerWidth', 10)
			.attr('markerHeight', 7)
			.attr('refX', 9)
			.attr('refY', 3.5)
			.attr('orient', 'auto')
			.append('polygon')
			.attr('points', '0 0, 10 3.5, 0 7')
			.attr('fill', '#8ec07c');

		// Success box at bottom
		svgEl.append('rect')
			.attr('class', 'success-box')
			.attr('x', centerX - 90).attr('y', height - 28)
			.attr('width', 180).attr('height', 26)
			.attr('fill', 'rgba(142, 192, 124, 0.15)')
			.attr('stroke', '#8ec07c')
			.attr('stroke-width', 1)
			.attr('rx', 5)
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'success-text')
			.attr('x', centerX).attr('y', height - 10)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('Encrypted connection ready!');

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
