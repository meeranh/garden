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
	const width = 580;
	const height = 320;

	const components = [
		{ id: 'amf', name: 'AMF', color: '#fb4934', x: 80 },
		{ id: 'smf', name: 'SMF', color: '#fe8019', x: 180 },
		{ id: 'udm', name: 'UDM', color: '#fabd2f', x: 280 },
		{ id: 'pcf', name: 'PCF', color: '#8ec07c', x: 380 },
		{ id: 'nrf', name: 'NRF', color: '#83a598', x: 480 }
	];

	const titles = [
		'4G Architecture: Fixed point-to-point connections',
		'Problem: Adding features requires rewiring',
		'5G Solution: Service-Based Architecture (SBA)',
		'Components connect to a common service bus',
		'Any component can call any service via HTTP/REST',
		'Result: Flexible, cloud-native, easy to extend'
	];

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		currentStep = step;
		svgEl.select('.title-text').text(titles[step]);

		// 4G view (steps 0-1)
		const show4G = step <= 1;
		svgEl.select('.four-g-group')
			.transition().duration(500)
			.attr('opacity', show4G ? 1 : 0);

		// 5G view (steps 2+)
		const show5G = step >= 2;
		svgEl.select('.five-g-group')
			.transition().duration(500)
			.attr('opacity', show5G ? 1 : 0);

		// Service bus glow (step 3+)
		svgEl.select('.service-bus')
			.transition().duration(600)
			.attr('stroke-width', step >= 3 ? 4 : 2)
			.attr('filter', step >= 3 ? 'url(#glow)' : 'none');

		// Show connections to bus (step 3+)
		svgEl.selectAll('.bus-connection')
			.transition().duration(400)
			.attr('opacity', step >= 3 ? 1 : 0);

		// API calls animation (step 4)
		if (step === 4) {
			animateApiCalls();
		} else {
			svgEl.selectAll('.api-call').attr('opacity', 0);
		}

		// Final state highlight (step 5)
		svgEl.selectAll('.component-box-5g')
			.transition().duration(400)
			.attr('stroke-width', step === 5 ? 2.5 : 1.5);

		svgEl.select('.benefits-text')
			.transition().duration(400)
			.attr('opacity', step === 5 ? 1 : 0);
	}

	function animateApiCalls() {
		// Animate a few API call indicators
		const calls = [
			{ from: 0, to: 2 },  // AMF to UDM
			{ from: 1, to: 3 },  // SMF to PCF
			{ from: 0, to: 1 }   // AMF to SMF
		];

		calls.forEach((call, i) => {
			const fromX = components[call.from].x;
			const toX = components[call.to].x;
			const busY = 180;

			svgEl.select(`.api-call-${i}`)
				.attr('cx', fromX)
				.attr('cy', busY)
				.attr('opacity', 1)
				.transition()
				.duration(800)
				.delay(i * 400)
				.attr('cx', toX)
				.transition()
				.duration(200)
				.attr('opacity', 0);
		});
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

		// Glow filter for service bus
		const defs = svgEl.append('defs');
		const filter = defs.append('filter').attr('id', 'glow');
		filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
		const feMerge = filter.append('feMerge');
		feMerge.append('feMergeNode').attr('in', 'coloredBlur');
		feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

		// Title
		svgEl.append('text')
			.attr('class', 'title-text')
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text(titles[0]);

		// ========== 4G VIEW ==========
		const fourGGroup = svgEl.append('g').attr('class', 'four-g-group');

		const fourGComponents = [
			{ name: 'MME', x: 120, color: '#fb4934' },
			{ name: 'SGW', x: 280, color: '#fe8019' },
			{ name: 'PGW', x: 440, color: '#8ec07c' }
		];

		// 4G boxes
		fourGComponents.forEach((comp) => {
			fourGGroup.append('rect')
				.attr('x', comp.x - 40).attr('y', 100)
				.attr('width', 80).attr('height', 50)
				.attr('fill', comp.color).attr('fill-opacity', 0.2)
				.attr('stroke', comp.color).attr('stroke-width', 2)
				.attr('rx', 6);

			fourGGroup.append('text')
				.attr('x', comp.x).attr('y', 130)
				.attr('text-anchor', 'middle').attr('fill', comp.color)
				.attr('font-size', '14px').attr('font-weight', 'bold')
				.text(comp.name);
		});

		// 4G fixed connections (arrows)
		fourGGroup.append('line')
			.attr('x1', 160).attr('y1', 125)
			.attr('x2', 240).attr('y2', 125)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrow-4g)');

		fourGGroup.append('line')
			.attr('x1', 320).attr('y1', 125)
			.attr('x2', 400).attr('y2', 125)
			.attr('stroke', colors.fgMuted).attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrow-4g)');

		// Arrow marker for 4G
		defs.append('marker')
			.attr('id', 'arrow-4g')
			.attr('markerWidth', 10).attr('markerHeight', 7)
			.attr('refX', 9).attr('refY', 3.5)
			.attr('orient', 'auto')
			.append('polygon')
			.attr('points', '0 0, 10 3.5, 0 7')
			.attr('fill', colors.fgMuted);

		// 4G label
		fourGGroup.append('text')
			.attr('x', width / 2).attr('y', 180)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '10px')
			.text('Fixed point-to-point connections');

		fourGGroup.append('text')
			.attr('x', width / 2).attr('y', 220)
			.attr('text-anchor', 'middle').attr('fill', '#fb4934')
			.attr('font-size', '11px')
			.text('Adding new features requires changing connections');

		// ========== 5G VIEW ==========
		const fiveGGroup = svgEl.append('g').attr('class', 'five-g-group').attr('opacity', 0);

		// Service bus (the main horizontal line)
		fiveGGroup.append('rect')
			.attr('class', 'service-bus')
			.attr('x', 50).attr('y', 170)
			.attr('width', width - 100).attr('height', 20)
			.attr('fill', '#458588').attr('fill-opacity', 0.3)
			.attr('stroke', '#83a598').attr('stroke-width', 2)
			.attr('rx', 10);

		fiveGGroup.append('text')
			.attr('x', width / 2).attr('y', 184)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '10px').attr('font-weight', 'bold')
			.text('Service Bus (HTTP/REST APIs)');

		// 5G component boxes
		components.forEach((comp, i) => {
			// Connection line to bus
			fiveGGroup.append('line')
				.attr('class', 'bus-connection')
				.attr('x1', comp.x).attr('y1', 130)
				.attr('x2', comp.x).attr('y2', 170)
				.attr('stroke', comp.color).attr('stroke-width', 2)
				.attr('stroke-dasharray', '4,2')
				.attr('opacity', 0);

			// Box
			fiveGGroup.append('rect')
				.attr('class', `component-box-5g component-box-${i}`)
				.attr('x', comp.x - 35).attr('y', 80)
				.attr('width', 70).attr('height', 50)
				.attr('fill', comp.color).attr('fill-opacity', 0.2)
				.attr('stroke', comp.color).attr('stroke-width', 1.5)
				.attr('rx', 6);

			// Label
			fiveGGroup.append('text')
				.attr('x', comp.x).attr('y', 110)
				.attr('text-anchor', 'middle').attr('fill', comp.color)
				.attr('font-size', '13px').attr('font-weight', 'bold')
				.text(comp.name);
		});

		// API call indicators (animated circles)
		for (let i = 0; i < 3; i++) {
			fiveGGroup.append('circle')
				.attr('class', `api-call api-call-${i}`)
				.attr('r', 6)
				.attr('fill', '#fabd2f')
				.attr('opacity', 0);
		}

		// UPF at bottom (user plane)
		fiveGGroup.append('rect')
			.attr('x', width / 2 - 50).attr('y', 240)
			.attr('width', 100).attr('height', 40)
			.attr('fill', '#b16286').attr('fill-opacity', 0.2)
			.attr('stroke', '#d3869b').attr('stroke-width', 2)
			.attr('rx', 6);

		fiveGGroup.append('text')
			.attr('x', width / 2).attr('y', 265)
			.attr('text-anchor', 'middle').attr('fill', '#d3869b')
			.attr('font-size', '13px').attr('font-weight', 'bold')
			.text('UPF');

		fiveGGroup.append('text')
			.attr('x', width / 2).attr('y', 300)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.text('User Plane (Data Flow)');

		// Connection from SMF to UPF
		fiveGGroup.append('line')
			.attr('class', 'bus-connection')
			.attr('x1', 180).attr('y1', 190)
			.attr('x2', 180).attr('y2', 220)
			.attr('stroke', '#fe8019').attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '3,2')
			.attr('opacity', 0);

		fiveGGroup.append('line')
			.attr('class', 'bus-connection')
			.attr('x1', 180).attr('y1', 220)
			.attr('x2', width / 2 - 50).attr('y2', 260)
			.attr('stroke', '#fe8019').attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '3,2')
			.attr('opacity', 0);

		// Benefits text (shown at final step)
		const benefitsG = fiveGGroup.append('g').attr('class', 'benefits-text').attr('opacity', 0);

		benefitsG.append('text')
			.attr('x', 50).attr('y', 55)
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('✓ Cloud-native');

		benefitsG.append('text')
			.attr('x', 180).attr('y', 55)
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('✓ Scalable');

		benefitsG.append('text')
			.attr('x', 300).attr('y', 55)
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('✓ Flexible');

		benefitsG.append('text')
			.attr('x', 420).attr('y', 55)
			.attr('fill', '#8ec07c')
			.attr('font-size', '10px')
			.text('✓ Easy to extend');

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
