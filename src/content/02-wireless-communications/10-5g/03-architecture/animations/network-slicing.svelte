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
	let animationFrames: number[] = [];
	let colors: Record<string, string>;

	const maxStep = 4;
	const width = 620;
	const height = 340;

	const slices = [
		{ id: 'embb', name: 'eMBB', desc: 'High Bandwidth', use: 'Video Streaming', color: '#fb4934' },
		{ id: 'urllc', name: 'URLLC', desc: 'Low Latency', use: 'Remote Surgery', color: '#8ec07c' },
		{ id: 'mmtc', name: 'mMTC', desc: 'Many Devices', use: 'IoT Sensors', color: '#83a598' }
	];

	const titles = [
		'Network Slicing: One physical network, multiple virtual networks',
		'eMBB Slice: Wide pipes for high-bandwidth video streaming',
		'URLLC Slice: Fast lanes for ultra-low latency applications',
		'mMTC Slice: Handles millions of IoT devices efficiently',
		'All slices share the same physical infrastructure'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }
	function cancelAnimations() { animationFrames.forEach(cancelAnimationFrame); animationFrames = []; }

	function applyStep(step: number) {
		currentStep = step;
		cancelAnimations();
		svgEl.select('.title-text').text(titles[step]);

		// Physical layer - always visible but highlighted at step 4
		svgEl.select('.physical-layer')
			.transition().duration(400)
			.attr('stroke-width', step === 4 ? 3 : 2)
			.attr('fill-opacity', step === 4 ? 0.4 : 0.2);

		svgEl.select('.physical-label')
			.transition().duration(400)
			.attr('fill', step === 4 ? '#fabd2f' : colors.fgMuted);

		// Each slice
		slices.forEach((slice, i) => {
			const isActive = step === 0 || step === i + 1 || step === 4;
			const isCurrent = step === i + 1;

			// Slice lane
			svgEl.select(`.slice-lane-${slice.id}`)
				.transition().duration(500)
				.attr('fill-opacity', isActive ? 0.2 : 0.05)
				.attr('stroke-width', isCurrent ? 2.5 : 1);

			// Slice label
			svgEl.select(`.slice-label-${slice.id}`)
				.transition().duration(400)
				.attr('opacity', isActive ? 1 : 0.3);

			// Device group
			svgEl.select(`.device-group-${slice.id}`)
				.transition().duration(400)
				.attr('opacity', isActive ? 1 : 0.2);

			// Stats panel
			svgEl.select(`.stats-${slice.id}`)
				.transition().duration(400)
				.attr('opacity', isCurrent ? 1 : 0);

			// Connection lines
			svgEl.select(`.conn-line-${slice.id}`)
				.transition().duration(400)
				.attr('opacity', isActive ? 0.6 : 0.1);
		});

		// Start packet animations for current slice
		if (step >= 1 && step <= 3) {
			startPacketAnimation(slices[step - 1].id);
		} else if (step === 0 || step === 4) {
			// Animate all slices
			slices.forEach(slice => startPacketAnimation(slice.id));
		}
	}

	function startPacketAnimation(sliceId: string) {
		const laneY: Record<string, number> = { embb: 95, urllc: 160, mmtc: 225 };
		const y = laneY[sliceId];
		const startX = 140;
		const endX = 520;

		if (sliceId === 'embb') {
			// Large packets, moderate speed
			animatePackets(sliceId, y, startX, endX, 12, 2500, 800);
		} else if (sliceId === 'urllc') {
			// Small packets, very fast
			animatePackets(sliceId, y, startX, endX, 6, 1200, 600);
		} else if (sliceId === 'mmtc') {
			// Tiny packets, many of them
			animateManyPackets(sliceId, y, startX, endX);
		}
	}

	function animatePackets(sliceId: string, y: number, startX: number, endX: number, size: number, duration: number, interval: number) {
		const slice = slices.find(s => s.id === sliceId)!;
		let packetId = 0;

		function createPacket() {
			if (!isPlaying && currentStep !== 0 && currentStep !== 4) return;

			const packet = svgEl.append('rect')
				.attr('class', `packet-${sliceId}-${packetId++}`)
				.attr('x', startX)
				.attr('y', y - size / 2)
				.attr('width', size * 1.5)
				.attr('height', size)
				.attr('fill', slice.color)
				.attr('rx', 2)
				.attr('opacity', 0.8);

			packet.transition()
				.duration(duration)
				.ease(d3.easeLinear)
				.attr('x', endX)
				.remove();

			const timeout = setTimeout(createPacket, interval);
			timeouts.push(timeout);
		}

		createPacket();
	}

	function animateManyPackets(sliceId: string, baseY: number, startX: number, endX: number) {
		const slice = slices.find(s => s.id === sliceId)!;
		let packetId = 0;

		function createSmallPacket() {
			if (!isPlaying && currentStep !== 0 && currentStep !== 4) return;

			const yOffset = (Math.random() - 0.5) * 30;
			const packet = svgEl.append('circle')
				.attr('class', `packet-${sliceId}-${packetId++}`)
				.attr('cx', startX)
				.attr('cy', baseY + yOffset)
				.attr('r', 3)
				.attr('fill', slice.color)
				.attr('opacity', 0.7);

			packet.transition()
				.duration(3000 + Math.random() * 1000)
				.ease(d3.easeLinear)
				.attr('cx', endX)
				.remove();

			const timeout = setTimeout(createSmallPacket, 150);
			timeouts.push(timeout);
		}

		createSmallPacket();
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(3000);
			if (!isPlaying) return;
		}
		isPlaying = false;
	}

	function play() { if (!isPlaying) { isPlaying = true; runAnimation(); } }
	function pause() { isPlaying = false; clearTimeouts(); cancelAnimations(); }
	function next() { pause(); svgEl.selectAll('[class^="packet-"]').remove(); if (currentStep < maxStep) applyStep(currentStep + 1); }
	function prev() { pause(); svgEl.selectAll('[class^="packet-"]').remove(); if (currentStep > 0) applyStep(currentStep - 1); }
	function skip() { pause(); svgEl.selectAll('[class^="packet-"]').remove(); applyStep(maxStep); }
	function replay() { pause(); svgEl.selectAll('[class^="packet-"]').remove(); currentStep = 0; applyStep(0); isPlaying = true; runAnimation(); }
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

		// Physical infrastructure at bottom
		svgEl.append('rect')
			.attr('class', 'physical-layer')
			.attr('x', 30).attr('y', 280)
			.attr('width', width - 60).attr('height', 35)
			.attr('fill', '#504945').attr('fill-opacity', 0.2)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2)
			.attr('rx', 4);

		svgEl.append('text')
			.attr('class', 'physical-label')
			.attr('x', width / 2).attr('y', 302)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('SHARED PHYSICAL INFRASTRUCTURE');

		// Vertical connection lines from slices to physical
		const sliceYs = [95, 160, 225];
		slices.forEach((slice, i) => {
			svgEl.append('line')
				.attr('class', `conn-line-${slice.id}`)
				.attr('x1', width / 2).attr('y1', sliceYs[i] + 20)
				.attr('x2', width / 2).attr('y2', 280)
				.attr('stroke', slice.color)
				.attr('stroke-width', 1.5)
				.attr('stroke-dasharray', '4,3')
				.attr('opacity', 0.6);
		});

		// Draw each slice lane
		slices.forEach((slice, i) => {
			const y = 55 + i * 65;
			const laneH = 50;

			// Lane background
			svgEl.append('rect')
				.attr('class', `slice-lane-${slice.id}`)
				.attr('x', 120).attr('y', y + 15)
				.attr('width', 420).attr('height', laneH)
				.attr('fill', slice.color).attr('fill-opacity', 0.15)
				.attr('stroke', slice.color).attr('stroke-width', 1)
				.attr('rx', 6);

			// Slice label group
			const labelG = svgEl.append('g').attr('class', `slice-label-${slice.id}`);

			// Name badge on left
			labelG.append('rect')
				.attr('x', 30).attr('y', y + 18)
				.attr('width', 75).attr('height', 44)
				.attr('fill', slice.color).attr('fill-opacity', 0.2)
				.attr('stroke', slice.color).attr('stroke-width', 1)
				.attr('rx', 5);

			labelG.append('text')
				.attr('x', 67).attr('y', y + 38)
				.attr('text-anchor', 'middle').attr('fill', slice.color)
				.attr('font-size', '12px').attr('font-weight', 'bold')
				.text(slice.name);

			labelG.append('text')
				.attr('x', 67).attr('y', y + 52)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '8px')
				.text(slice.desc);

			// Device on right side
			const devG = svgEl.append('g').attr('class', `device-group-${slice.id}`);
			const devX = 555;

			if (slice.id === 'embb') {
				// TV/Monitor shape
				devG.append('rect')
					.attr('x', devX).attr('y', y + 22)
					.attr('width', 35).attr('height', 25)
					.attr('fill', slice.color).attr('fill-opacity', 0.3)
					.attr('stroke', slice.color).attr('stroke-width', 1.5)
					.attr('rx', 2);
				devG.append('rect')
					.attr('x', devX + 13).attr('y', y + 47)
					.attr('width', 9).attr('height', 8)
					.attr('fill', slice.color);
				devG.append('text')
					.attr('x', devX + 17).attr('y', y + 38)
					.attr('text-anchor', 'middle').attr('fill', slice.color)
					.attr('font-size', '8px')
					.text('4K');
			} else if (slice.id === 'urllc') {
				// Robot arm shape
				devG.append('rect')
					.attr('x', devX + 5).attr('y', y + 40)
					.attr('width', 25).attr('height', 15)
					.attr('fill', slice.color).attr('fill-opacity', 0.3)
					.attr('stroke', slice.color).attr('stroke-width', 1.5)
					.attr('rx', 2);
				devG.append('line')
					.attr('x1', devX + 17).attr('y1', y + 40)
					.attr('x2', devX + 17).attr('y2', y + 25)
					.attr('stroke', slice.color).attr('stroke-width', 2);
				devG.append('line')
					.attr('x1', devX + 17).attr('y1', y + 25)
					.attr('x2', devX + 30).attr('y2', y + 25)
					.attr('stroke', slice.color).attr('stroke-width', 2);
				devG.append('circle')
					.attr('cx', devX + 32).attr('cy', y + 25)
					.attr('r', 4)
					.attr('fill', slice.color);
			} else {
				// Multiple sensor dots
				for (let j = 0; j < 6; j++) {
					const sx = devX + (j % 3) * 12 + 5;
					const sy = y + 25 + Math.floor(j / 3) * 15;
					devG.append('circle')
						.attr('cx', sx).attr('cy', sy)
						.attr('r', 4)
						.attr('fill', slice.color).attr('fill-opacity', 0.5)
						.attr('stroke', slice.color).attr('stroke-width', 1);
				}
			}

			// Stats panel (shown when slice is highlighted)
			const statsG = svgEl.append('g').attr('class', `stats-${slice.id}`).attr('opacity', 0);

			const statsData: Record<string, { label: string; value: string }[]> = {
				embb: [
					{ label: 'Peak Rate', value: '20 Gbps' },
					{ label: 'Use Case', value: 'Video, VR, AR' }
				],
				urllc: [
					{ label: 'Latency', value: '< 1 ms' },
					{ label: 'Reliability', value: '99.999%' }
				],
				mmtc: [
					{ label: 'Density', value: '1M devices/km²' },
					{ label: 'Battery', value: '10+ years' }
				]
			};

			const stats = statsData[slice.id];
			statsG.append('rect')
				.attr('x', 170).attr('y', y + 20)
				.attr('width', 180).attr('height', 40)
				.attr('fill', '#1d2021')
				.attr('stroke', slice.color)
				.attr('stroke-width', 1)
				.attr('rx', 4);

			stats.forEach((stat, j) => {
				statsG.append('text')
					.attr('x', 180).attr('y', y + 35 + j * 14)
					.attr('fill', colors.fgMuted)
					.attr('font-size', '9px')
					.text(`${stat.label}:`);
				statsG.append('text')
					.attr('x', 255).attr('y', y + 35 + j * 14)
					.attr('fill', slice.color)
					.attr('font-size', '9px').attr('font-weight', 'bold')
					.text(stat.value);
			});
		});

		applyStep(0);
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => { clearTimeouts(); cancelAnimations(); });
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
