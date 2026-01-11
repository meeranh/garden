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

	const maxStep = 8;
	const width = 500;
	const height = 280;

	const users = [
		{ name: 'UGS', color: '#fb4934', signal: 0.5, weight: 4, qos: 'VoIP' },
		{ name: 'rtPS', color: '#fabd2f', signal: 0.8, weight: 2, qos: 'Video' },
		{ name: 'BE', color: '#83a598', signal: 0.9, weight: 1, qos: 'Web' }
	];

	// WFQ: UGS gets 4 slots, rtPS gets 2, BE gets 2 (proportional to weights in 8 slots)
	// Pattern based on weights: 4:2:1 ratio, spread across 8 slots
	const schedule = [0, 0, 1, 0, 2, 0, 1, 2]; // UGS, UGS, rtPS, UGS, BE, UGS, rtPS, BE

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Update title
		if (step === 0) {
			svgEl.select('.title-text').text('WFQ: Higher weight = more slots');
		} else {
			const userIdx = schedule[step - 1];
			svgEl.select('.title-text').text(`Slot ${step}: ${users[userIdx].name} (weight ${users[userIdx].weight})`);
		}

		// Highlight current user
		users.forEach((_, i) => {
			const isActive = step > 0 && schedule[step - 1] === i;
			svgEl.select(`.user-box-${i}`)
				.transition().duration(300)
				.attr('stroke-width', isActive ? 3 : 1)
				.attr('stroke', isActive ? '#fff' : users[i].color);
		});

		// Fill slots
		for (let s = 0; s < 8; s++) {
			const filled = s < step;
			svgEl.select(`.slot-${s}`)
				.transition().duration(300)
				.attr('fill', filled ? users[schedule[s]].color : 'transparent')
				.attr('fill-opacity', filled ? 0.8 : 0);
		}

		// Update slot counts
		const counts = [0, 0, 0];
		for (let s = 0; s < step; s++) {
			counts[schedule[s]]++;
		}
		users.forEach((_, i) => {
			svgEl.select(`.count-${i}`).text(`${counts[i]} slots`);
		});
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1200);
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
			.text('WFQ: Higher weight = more slots');

		// Users section
		const userStartX = 60;
		const userY = 45;
		const userW = 120;
		const userH = 85;
		const userGap = 20;

		users.forEach((user, i) => {
			const x = userStartX + i * (userW + userGap);

			// User box
			svgEl.append('rect')
				.attr('class', `user-box-${i}`)
				.attr('x', x).attr('y', userY)
				.attr('width', userW).attr('height', userH)
				.attr('fill', user.color)
				.attr('fill-opacity', 0.2)
				.attr('stroke', user.color)
				.attr('stroke-width', 1)
				.attr('rx', 6);

			// User name
			svgEl.append('text')
				.attr('x', x + userW / 2).attr('y', userY + 20)
				.attr('text-anchor', 'middle').attr('fill', user.color)
				.attr('font-size', '13px').attr('font-weight', 'bold')
				.text(user.name);

			// QoS type
			svgEl.append('text')
				.attr('x', x + userW / 2).attr('y', userY + 38)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(user.qos);

			// Weight badge
			svgEl.append('rect')
				.attr('x', x + 20).attr('y', userY + 48)
				.attr('width', userW - 40).attr('height', 18)
				.attr('fill', user.color)
				.attr('fill-opacity', 0.4)
				.attr('rx', 4);

			svgEl.append('text')
				.attr('x', x + userW / 2).attr('y', userY + 61)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '10px').attr('font-weight', 'bold')
				.text(`Weight: ${user.weight}`);

			// Slot count
			svgEl.append('text')
				.attr('class', `count-${i}`)
				.attr('x', x + userW / 2).attr('y', userY + 80)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text('0 slots');
		});

		// Time slots section
		const slotY = 155;
		const slotW = 50;
		const slotH = 50;
		const slotGap = 8;
		const slotStartX = (width - (8 * slotW + 7 * slotGap)) / 2;

		svgEl.append('text')
			.attr('x', width / 2).attr('y', slotY - 10)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Time Slots');

		for (let i = 0; i < 8; i++) {
			const x = slotStartX + i * (slotW + slotGap);

			svgEl.append('rect')
				.attr('class', `slot-${i}`)
				.attr('x', x).attr('y', slotY)
				.attr('width', slotW).attr('height', slotH)
				.attr('fill', 'transparent')
				.attr('stroke', colors.fgMuted)
				.attr('stroke-width', 1)
				.attr('rx', 4);

			svgEl.append('text')
				.attr('x', x + slotW / 2).attr('y', slotY + slotH + 15)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(i + 1);
		}

		// Legend
		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Result: UGS 4 slots, rtPS 2 slots, BE 2 slots (4:2:1 ratio)');

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
