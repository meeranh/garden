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
	const width = 520;
	const height = 320;

	const users = [
		{ name: 'User 1', color: '#fb4934', avgRate: 2 },  // Usually poor signal
		{ name: 'User 2', color: '#fabd2f', avgRate: 5 },  // Usually medium
		{ name: 'User 3', color: '#8ec07c', avgRate: 8 },  // Usually great
		{ name: 'User 4', color: '#83a598', avgRate: 3 }   // Usually below average
	];

	// Current rates per slot (varying channel conditions)
	const currentRates = [
		[3, 5, 8, 4],  // slot 1
		[2, 6, 7, 5],  // slot 2
		[4, 4, 6, 3],  // slot 3 - User 1 doing better than usual!
		[1, 5, 9, 4],  // slot 4
		[3, 7, 6, 6],  // slot 5 - User 4 doing better than usual!
		[2, 4, 8, 3],  // slot 6
		[5, 5, 7, 4],  // slot 7 - User 1 exceptional!
		[2, 6, 8, 5],  // slot 8
	];

	// Proportional fair: pick max(current / average)
	function getSchedule() {
		return currentRates.map(rates => {
			const ratios = rates.map((r, i) => r / users[i].avgRate);
			return ratios.indexOf(Math.max(...ratios));
		});
	}
	const schedule = getSchedule();
	// More balanced: users with "better than usual" get priority

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Update title
		if (step === 0) {
			svgEl.select('.title-text').text('Proportional Fair: Pick who is doing better than usual');
		} else {
			const userIdx = schedule[step - 1];
			const ratio = (currentRates[step - 1][userIdx] / users[userIdx].avgRate).toFixed(1);
			svgEl.select('.title-text').text(`Slot ${step}: ${users[userIdx].name} (ratio ${ratio}x their average)`);
		}

		// Update metrics for current slot
		const rates = step === 0 ? users.map(u => u.avgRate) : currentRates[step - 1];
		users.forEach((user, i) => {
			const isActive = step > 0 && schedule[step - 1] === i;
			const ratio = rates[i] / user.avgRate;
			const isBest = step > 0 && ratio === Math.max(...rates.map((r, j) => r / users[j].avgRate));

			svgEl.select(`.user-box-${i}`)
				.transition().duration(300)
				.attr('stroke-width', isActive ? 3 : 1)
				.attr('stroke', isActive ? '#fff' : user.color);

			// Update current rate
			svgEl.select(`.current-${i}`).text(`Now: ${rates[i]}`);

			// Update ratio
			svgEl.select(`.ratio-${i}`)
				.text(`${ratio.toFixed(1)}x`)
				.attr('fill', ratio >= 1 ? '#8ec07c' : '#fb4934');

			// Best indicator
			svgEl.select(`.best-${i}`)
				.transition().duration(300)
				.attr('opacity', isBest && step > 0 ? 1 : 0);
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
		const counts = [0, 0, 0, 0];
		for (let s = 0; s < step; s++) {
			counts[schedule[s]]++;
		}
		users.forEach((_, i) => {
			svgEl.select(`.count-${i}`).text(`${counts[i]}`);
		});
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(1800);
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
			.text('Proportional Fair: Pick who is doing better than usual');

		// Users section
		const userStartX = 25;
		const userY = 45;
		const userW = 115;
		const userH = 110;
		const userGap = 10;

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
				.attr('x', x + userW / 2).attr('y', userY + 18)
				.attr('text-anchor', 'middle').attr('fill', user.color)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(user.name);

			// Average rate (fixed)
			svgEl.append('text')
				.attr('x', x + userW / 2).attr('y', userY + 38)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`Avg: ${user.avgRate}`);

			// Current rate (changes)
			svgEl.append('text')
				.attr('class', `current-${i}`)
				.attr('x', x + userW / 2).attr('y', userY + 55)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '10px')
				.text(`Now: ${user.avgRate}`);

			// Ratio badge
			svgEl.append('rect')
				.attr('x', x + 25).attr('y', userY + 63)
				.attr('width', userW - 50).attr('height', 20)
				.attr('fill', colors.fgMuted)
				.attr('fill-opacity', 0.2)
				.attr('rx', 4);

			svgEl.append('text')
				.attr('class', `ratio-${i}`)
				.attr('x', x + userW / 2).attr('y', userY + 78)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text('1.0x');

			// Best indicator
			svgEl.append('text')
				.attr('class', `best-${i}`)
				.attr('x', x + userW / 2).attr('y', userY + 95)
				.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
				.attr('font-size', '9px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text('BEST RATIO');

			// Slot count
			svgEl.append('text')
				.attr('class', `count-${i}`)
				.attr('x', x + userW / 2).attr('y', userY + userH - 3)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text('0');
		});

		// Time slots section
		const slotY = 185;
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
			.attr('x', width / 2).attr('y', height - 30)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Formula: current rate / average rate');

		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 12)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('Result: More balanced! Everyone gets some slots.');

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
