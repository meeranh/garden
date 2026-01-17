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
	const width = 550;
	const height = 300;

	const stations = [
		{ name: 'AC_VO', label: 'Voice', color: '#fb4934', aifs: 2, cw: 3 },
		{ name: 'AC_VI', label: 'Video', color: '#fe8019', aifs: 2, cw: 7 },
		{ name: 'AC_BE', label: 'Best Effort', color: '#8ec07c', aifs: 3, cw: 15 },
		{ name: 'AC_BK', label: 'Background', color: '#83a598', aifs: 7, cw: 15 }
	];

	const titles = [
		'Channel Contention: How AIFS determines priority',
		'Channel becomes free. All stations start waiting...',
		'After 2 slots: Voice and Video can compete',
		'After 3 slots: Best Effort joins',
		'After 7 slots: Background finally ready',
		'Voice wins! (Lowest backoff in smallest CW range)'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// Timeline marker position
		const slotWidth = 50;
		const timelineX = 100;
		const markerPositions = [0, 0, 2, 3, 7, 7];
		const markerX = timelineX + markerPositions[step] * slotWidth;

		svgEl.select('.time-marker')
			.transition().duration(step === 0 ? 0 : 600)
			.attr('x1', markerX).attr('x2', markerX)
			.attr('opacity', step > 0 ? 1 : 0);

		svgEl.select('.time-marker-label')
			.transition().duration(step === 0 ? 0 : 600)
			.attr('x', markerX)
			.attr('opacity', step > 0 ? 1 : 0)
			.text(step > 0 ? `${markerPositions[step]} slots` : '');

		// Station states
		stations.forEach((station, i) => {
			const canTransmit = step > 0 && markerPositions[step] >= station.aifs;
			const isWinner = step === 5 && i === 0;

			// Station box highlight
			svgEl.select(`.station-box-${i}`)
				.transition().duration(400)
				.attr('stroke-width', isWinner ? 3 : 1)
				.attr('fill-opacity', canTransmit ? 0.3 : 0.1);

			// Ready indicator
			svgEl.select(`.ready-${i}`)
				.transition().duration(400)
				.attr('opacity', canTransmit ? 1 : 0);

			// Winner indicator
			svgEl.select(`.winner-${i}`)
				.transition().duration(400)
				.attr('opacity', isWinner ? 1 : 0);

			// Waiting indicator
			svgEl.select(`.waiting-${i}`)
				.transition().duration(400)
				.attr('opacity', step > 0 && !canTransmit ? 1 : 0);
		});

		// Channel status
		const channelText = step === 0 ? 'Channel Busy' :
			step === 5 ? 'Voice Transmitting!' : 'Channel Free';
		const channelColor = step === 0 ? '#fb4934' :
			step === 5 ? '#8ec07c' : '#fabd2f';

		svgEl.select('.channel-status')
			.transition().duration(300)
			.attr('fill', channelColor);
		svgEl.select('.channel-status').text(channelText);
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(i === 0 ? 1500 : 2000);
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

		// Timeline
		const timelineX = 100;
		const timelineY = 55;
		const slotWidth = 50;

		svgEl.append('line')
			.attr('x1', timelineX).attr('y1', timelineY)
			.attr('x2', timelineX + 8 * slotWidth).attr('y2', timelineY)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2);

		// Slot markers
		for (let i = 0; i <= 8; i++) {
			const x = timelineX + i * slotWidth;
			svgEl.append('line')
				.attr('x1', x).attr('y1', timelineY - 5)
				.attr('x2', x).attr('y2', timelineY + 5)
				.attr('stroke', colors.fgMuted).attr('stroke-width', 1);
			svgEl.append('text')
				.attr('x', x).attr('y', timelineY + 18)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.text(i.toString());
		}

		svgEl.append('text')
			.attr('x', timelineX - 10).attr('y', timelineY + 4)
			.attr('text-anchor', 'end').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('Time (slots)');

		// Time marker (vertical line showing current time)
		svgEl.append('line')
			.attr('class', 'time-marker')
			.attr('x1', timelineX).attr('y1', timelineY - 10)
			.attr('x2', timelineX).attr('y2', timelineY + 25)
			.attr('stroke', '#fabd2f').attr('stroke-width', 2)
			.attr('opacity', 0);

		svgEl.append('text')
			.attr('class', 'time-marker-label')
			.attr('x', timelineX).attr('y', timelineY + 38)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '9px').attr('font-weight', 'bold')
			.attr('opacity', 0);

		// Channel status
		svgEl.append('text')
			.attr('class', 'channel-status')
			.attr('x', width / 2).attr('y', height - 8)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Channel Busy');

		// Station boxes
		const stationY = 95;
		const stationH = 42;
		const stationGap = 8;

		stations.forEach((station, i) => {
			const y = stationY + i * (stationH + stationGap);

			// Station box
			svgEl.append('rect')
				.attr('class', `station-box-${i}`)
				.attr('x', 20).attr('y', y)
				.attr('width', 70).attr('height', stationH)
				.attr('fill', station.color).attr('fill-opacity', 0.1)
				.attr('stroke', station.color).attr('stroke-width', 1)
				.attr('rx', 4);

			// Station label
			svgEl.append('text')
				.attr('x', 55).attr('y', y + 16)
				.attr('text-anchor', 'middle').attr('fill', station.color)
				.attr('font-size', '10px').attr('font-weight', 'bold')
				.text(station.name);

			svgEl.append('text')
				.attr('x', 55).attr('y', y + 30)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '8px')
				.text(`AIFS: ${station.aifs}`);

			// AIFS bar (shows when this station becomes ready)
			const aifsEndX = timelineX + station.aifs * slotWidth;
			svgEl.append('rect')
				.attr('x', timelineX).attr('y', y + 8)
				.attr('width', station.aifs * slotWidth).attr('height', 26)
				.attr('fill', station.color).attr('fill-opacity', 0.15)
				.attr('rx', 3);

			svgEl.append('line')
				.attr('x1', aifsEndX).attr('y1', y + 8)
				.attr('x2', aifsEndX).attr('y2', y + 34)
				.attr('stroke', station.color).attr('stroke-width', 2)
				.attr('stroke-dasharray', '3,2');

			// Ready indicator
			svgEl.append('text')
				.attr('class', `ready-${i}`)
				.attr('x', aifsEndX + 10).attr('y', y + 24)
				.attr('fill', station.color)
				.attr('font-size', '9px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text('Ready!');

			// Waiting indicator
			svgEl.append('text')
				.attr('class', `waiting-${i}`)
				.attr('x', timelineX + 20).attr('y', y + 24)
				.attr('fill', colors.fgMuted)
				.attr('font-size', '9px')
				.attr('opacity', 0)
				.text('Waiting...');

			// Winner indicator
			svgEl.append('text')
				.attr('class', `winner-${i}`)
				.attr('x', aifsEndX + 60).attr('y', y + 24)
				.attr('fill', '#fabd2f')
				.attr('font-size', '10px').attr('font-weight', 'bold')
				.attr('opacity', 0)
				.text('WINS!');
		});

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
