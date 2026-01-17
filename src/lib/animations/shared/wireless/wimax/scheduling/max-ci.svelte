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
	const height = 300;

	// Users with varying signals per time slot
	const users = [
		{ name: 'User 1', color: '#fb4934', baseSignal: 0.4 },
		{ name: 'User 2', color: '#fabd2f', baseSignal: 0.7 },
		{ name: 'User 3', color: '#8ec07c', baseSignal: 0.9 },
		{ name: 'User 4', color: '#83a598', baseSignal: 0.5 }
	];

	// Signal quality varies each slot (simulating fading)
	const signals = [
		[0.4, 0.7, 0.9, 0.5], // slot 1: User 3 best
		[0.5, 0.8, 0.6, 0.4], // slot 2: User 2 best
		[0.3, 0.9, 0.7, 0.6], // slot 3: User 2 best
		[0.6, 0.5, 0.8, 0.4], // slot 4: User 3 best
		[0.4, 0.6, 0.9, 0.5], // slot 5: User 3 best
		[0.7, 0.5, 0.6, 0.4], // slot 6: User 1 best
		[0.5, 0.8, 0.7, 0.6], // slot 7: User 2 best
		[0.4, 0.6, 0.9, 0.5], // slot 8: User 3 best
	];

	// Max C/I always picks highest signal
	const schedule = signals.map(s => s.indexOf(Math.max(...s)));
	// Result: [2, 1, 1, 2, 2, 0, 1, 2] - User 3 dominates, User 4 starves

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;

		// Update title
		if (step === 0) {
			svgEl.select('.title-text').text('Max C/I: Always pick best signal');
		} else {
			const userIdx = schedule[step - 1];
			const sig = signals[step - 1][userIdx];
			svgEl.select('.title-text').text(`Slot ${step}: ${users[userIdx].name} wins (${Math.round(sig * 100)}% signal)`);
		}

		// Update signal bars for current slot
		const currentSignals = step === 0 ? users.map(u => u.baseSignal) : signals[step - 1];
		users.forEach((user, i) => {
			const isActive = step > 0 && schedule[step - 1] === i;
			const isBest = step > 0 && currentSignals[i] === Math.max(...currentSignals);

			svgEl.select(`.user-box-${i}`)
				.transition().duration(300)
				.attr('stroke-width', isActive ? 3 : 1)
				.attr('stroke', isActive ? '#fff' : user.color);

			// Update signal bar
			svgEl.select(`.signal-fill-${i}`)
				.transition().duration(300)
				.attr('width', 70 * currentSignals[i]);

			svgEl.select(`.signal-text-${i}`)
				.text(`${Math.round(currentSignals[i] * 100)}%`);

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

		// Title
		svgEl.append('text')
			.attr('class', 'title-text')
			.attr('x', width / 2).attr('y', 22)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Max C/I: Always pick best signal');

		// Users section
		const userStartX = 30;
		const userY = 45;
		const userW = 105;
		const userH = 90;
		const userGap = 12;

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
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(user.name);

			// Signal bar background
			svgEl.append('rect')
				.attr('x', x + 17).attr('y', userY + 32)
				.attr('width', 70).attr('height', 14)
				.attr('fill', colors.fgMuted)
				.attr('fill-opacity', 0.3)
				.attr('rx', 3);

			// Signal bar fill
			svgEl.append('rect')
				.attr('class', `signal-fill-${i}`)
				.attr('x', x + 17).attr('y', userY + 32)
				.attr('width', 70 * user.baseSignal).attr('height', 14)
				.attr('fill', '#8ec07c')
				.attr('rx', 3);

			// Signal text
			svgEl.append('text')
				.attr('class', `signal-text-${i}`)
				.attr('x', x + userW / 2).attr('y', userY + 60)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(`${Math.round(user.baseSignal * 100)}%`);

			// Best indicator
			svgEl.append('text')
				.attr('class', `best-${i}`)
				.attr('x', x + userW / 2).attr('y', userY + 75)
				.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
				.attr('font-size', '9px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text('BEST');

			// Slot count
			svgEl.append('text')
				.attr('class', `count-${i}`)
				.attr('x', x + userW / 2).attr('y', userY + userH - 5)
				.attr('text-anchor', 'middle').attr('fill', colors.fg)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text('0');
		});

		// Time slots section
		const slotY = 165;
		const slotW = 50;
		const slotH = 50;
		const slotGap = 8;
		const slotStartX = (width - (8 * slotW + 7 * slotGap)) / 2;

		svgEl.append('text')
			.attr('x', width / 2).attr('y', slotY - 10)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Time Slots (signal changes each slot)');

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
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '10px')
			.text('Problem: User 3 dominates (5 slots), User 4 starves (0 slots)');

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
