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
	const width = 700;
	const height = 380;

	const allElements = [
		'ue', 'gnb', 'service-bus', 'amf', 'smf', 'upf', 'udm', 'ausf', 'pcf', 'nrf', 'nssf',
		'dn', 'n1', 'n2', 'n3', 'n4', 'n6', 'control-label', 'user-label'
	];

	const stepVisibility: Record<number, string[]> = {
		0: ['ue', 'gnb', 'dn'],
		1: ['ue', 'gnb', 'dn', 'service-bus', 'amf', 'smf', 'udm', 'ausf', 'pcf', 'nrf', 'nssf', 'control-label'],
		2: ['ue', 'gnb', 'dn', 'service-bus', 'amf', 'smf', 'udm', 'ausf', 'pcf', 'nrf', 'nssf', 'upf', 'control-label', 'user-label'],
		3: ['ue', 'gnb', 'dn', 'service-bus', 'amf', 'smf', 'udm', 'ausf', 'pcf', 'nrf', 'nssf', 'upf', 'n1', 'n2', 'n3', 'n4', 'n6', 'control-label', 'user-label'],
		4: ['ue', 'gnb', 'dn', 'service-bus', 'amf', 'smf', 'udm', 'ausf', 'pcf', 'nrf', 'nssf', 'upf', 'n1', 'n2', 'n3', 'n4', 'n6', 'control-label', 'user-label']
	};

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => { timeouts.push(setTimeout(r, ms)); });
	}
	function clearTimeouts() { timeouts.forEach(clearTimeout); timeouts = []; }

	function applyStep(step: number) {
		const visible = stepVisibility[step] || [];
		allElements.forEach((el) => {
			svgEl.selectAll(`.${el}`).transition().duration(400).attr('opacity', visible.includes(el) ? 1 : 0);
		});
		currentStep = step;
	}

	async function runAnimation() {
		if (!isPlaying) return;
		for (let i = currentStep; i <= maxStep; i++) {
			if (!isPlaying) return;
			applyStep(i);
			await sleep(2000);
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
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle').attr('fill', colors.fg)
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('5G Network Architecture');

		// ===== UE =====
		const ueG = svgEl.append('g').attr('class', 'ue');
		ueG.append('rect')
			.attr('x', 20).attr('y', 170)
			.attr('width', 50).attr('height', 70)
			.attr('fill', '#458588').attr('fill-opacity', 0.2)
			.attr('stroke', '#83a598').attr('stroke-width', 2)
			.attr('rx', 8);
		ueG.append('text')
			.attr('x', 45).attr('y', 210)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('UE');

		// ===== gNB =====
		const gnbG = svgEl.append('g').attr('class', 'gnb');
		gnbG.append('rect')
			.attr('x', 100).attr('y', 160)
			.attr('width', 60).attr('height', 90)
			.attr('fill', '#689d6a').attr('fill-opacity', 0.2)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2)
			.attr('rx', 6);
		gnbG.append('text')
			.attr('x', 130).attr('y', 200)
			.attr('text-anchor', 'middle').attr('fill', '#8ec07c')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('gNB');
		gnbG.append('text')
			.attr('x', 130).attr('y', 215)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '8px')
			.text('Base Station');

		// ===== SERVICE BUS =====
		const busG = svgEl.append('g').attr('class', 'service-bus').attr('opacity', 0);
		busG.append('rect')
			.attr('x', 200).attr('y', 55)
			.attr('width', 400).attr('height', 8)
			.attr('fill', '#fabd2f').attr('rx', 4);
		busG.append('text')
			.attr('x', 400).attr('y', 48)
			.attr('text-anchor', 'middle').attr('fill', '#fabd2f')
			.attr('font-size', '10px')
			.text('Service Bus (SBI)');

		// Control plane label
		svgEl.append('text')
			.attr('class', 'control-label')
			.attr('x', 615).attr('y', 95)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('CONTROL');
		svgEl.append('text')
			.attr('class', 'control-label')
			.attr('x', 615).attr('y', 107)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('PLANE');

		// ===== CONTROL PLANE NFs =====
		const nfData = [
			{ id: 'amf', x: 200, label: 'AMF', sub: 'Access &', sub2: 'Mobility', color: '#fb4934' },
			{ id: 'smf', x: 270, label: 'SMF', sub: 'Session', sub2: 'Mgmt', color: '#fe8019' },
			{ id: 'udm', x: 340, label: 'UDM', sub: 'User Data', sub2: 'Mgmt', color: '#b8bb26' },
			{ id: 'ausf', x: 410, label: 'AUSF', sub: 'Auth', sub2: 'Server', color: '#83a598' },
			{ id: 'pcf', x: 480, label: 'PCF', sub: 'Policy', sub2: 'Control', color: '#d3869b' },
			{ id: 'nrf', x: 550, label: 'NRF', sub: 'Repository', sub2: '', color: '#8ec07c' }
		];

		nfData.forEach(nf => {
			const g = svgEl.append('g').attr('class', nf.id).attr('opacity', 0);

			// Connector to bus
			g.append('line')
				.attr('x1', nf.x + 25).attr('y1', 63)
				.attr('x2', nf.x + 25).attr('y2', 80)
				.attr('stroke', nf.color).attr('stroke-width', 2);

			// Box
			g.append('rect')
				.attr('x', nf.x).attr('y', 80)
				.attr('width', 50).attr('height', 55)
				.attr('fill', nf.color).attr('fill-opacity', 0.15)
				.attr('stroke', nf.color).attr('stroke-width', 1.5)
				.attr('rx', 5);

			// Label
			g.append('text')
				.attr('x', nf.x + 25).attr('y', 100)
				.attr('text-anchor', 'middle').attr('fill', nf.color)
				.attr('font-size', '11px').attr('font-weight', 'bold')
				.text(nf.label);

			// Sublabel
			g.append('text')
				.attr('x', nf.x + 25).attr('y', 115)
				.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
				.attr('font-size', '7px')
				.text(nf.sub);
			if (nf.sub2) {
				g.append('text')
					.attr('x', nf.x + 25).attr('y', 125)
					.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
					.attr('font-size', '7px')
					.text(nf.sub2);
			}
		});

		// NSSF (smaller, below)
		const nssfG = svgEl.append('g').attr('class', 'nssf').attr('opacity', 0);
		nssfG.append('line')
			.attr('x1', 400).attr('y1', 63)
			.attr('x2', 400).attr('y2', 145)
			.attr('stroke', '#928374').attr('stroke-width', 1).attr('stroke-dasharray', '3,2');
		nssfG.append('rect')
			.attr('x', 375).attr('y', 145)
			.attr('width', 50).attr('height', 30)
			.attr('fill', '#928374').attr('fill-opacity', 0.15)
			.attr('stroke', '#928374').attr('stroke-width', 1)
			.attr('rx', 4);
		nssfG.append('text')
			.attr('x', 400).attr('y', 164)
			.attr('text-anchor', 'middle').attr('fill', '#a89984')
			.attr('font-size', '9px').attr('font-weight', 'bold')
			.text('NSSF');

		// ===== UPF (User Plane) =====
		const upfG = svgEl.append('g').attr('class', 'upf').attr('opacity', 0);
		upfG.append('rect')
			.attr('x', 280).attr('y', 195)
			.attr('width', 80).attr('height', 55)
			.attr('fill', '#b16286').attr('fill-opacity', 0.2)
			.attr('stroke', '#d3869b').attr('stroke-width', 2)
			.attr('rx', 6);
		upfG.append('text')
			.attr('x', 320).attr('y', 222)
			.attr('text-anchor', 'middle').attr('fill', '#d3869b')
			.attr('font-size', '14px').attr('font-weight', 'bold')
			.text('UPF');
		upfG.append('text')
			.attr('x', 320).attr('y', 240)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '8px')
			.text('User Plane');

		// User plane label
		svgEl.append('text')
			.attr('class', 'user-label')
			.attr('x', 370).attr('y', 220)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('USER');
		svgEl.append('text')
			.attr('class', 'user-label')
			.attr('x', 370).attr('y', 232)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '9px')
			.attr('opacity', 0)
			.text('PLANE');

		// ===== DN (Data Network) =====
		const dnG = svgEl.append('g').attr('class', 'dn');
		dnG.append('ellipse')
			.attr('cx', 550).attr('cy', 220)
			.attr('rx', 55).attr('ry', 40)
			.attr('fill', '#458588').attr('fill-opacity', 0.15)
			.attr('stroke', '#83a598').attr('stroke-width', 2);
		dnG.append('text')
			.attr('x', 550).attr('y', 215)
			.attr('text-anchor', 'middle').attr('fill', '#83a598')
			.attr('font-size', '12px').attr('font-weight', 'bold')
			.text('DN');
		dnG.append('text')
			.attr('x', 550).attr('y', 230)
			.attr('text-anchor', 'middle').attr('fill', colors.fgMuted)
			.attr('font-size', '8px')
			.text('(Internet)');

		// ===== INTERFACE LINES =====

		// N1: UE to AMF (control signaling)
		const n1G = svgEl.append('g').attr('class', 'n1').attr('opacity', 0);
		n1G.append('path')
			.attr('d', 'M 70 190 L 90 190 L 90 107 L 200 107')
			.attr('fill', 'none')
			.attr('stroke', '#fb4934').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2');
		n1G.append('text')
			.attr('x', 140).attr('y', 100)
			.attr('fill', '#fb4934').attr('font-size', '9px')
			.text('N1');

		// N2: gNB to AMF
		const n2G = svgEl.append('g').attr('class', 'n2').attr('opacity', 0);
		n2G.append('line')
			.attr('x1', 160).attr('y1', 180)
			.attr('x2', 200).attr('y2', 120)
			.attr('stroke', '#fe8019').attr('stroke-width', 1.5);
		n2G.append('text')
			.attr('x', 172).attr('y', 145)
			.attr('fill', '#fe8019').attr('font-size', '9px')
			.text('N2');

		// N3: gNB to UPF (user data)
		const n3G = svgEl.append('g').attr('class', 'n3').attr('opacity', 0);
		n3G.append('line')
			.attr('x1', 160).attr('y1', 220)
			.attr('x2', 280).attr('y2', 220)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2);
		n3G.append('text')
			.attr('x', 220).attr('y', 215)
			.attr('fill', '#8ec07c').attr('font-size', '9px')
			.text('N3');

		// N4: SMF to UPF (control)
		const n4G = svgEl.append('g').attr('class', 'n4').attr('opacity', 0);
		n4G.append('line')
			.attr('x1', 295).attr('y1', 135)
			.attr('x2', 305).attr('y2', 195)
			.attr('stroke', '#fabd2f').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2');
		n4G.append('text')
			.attr('x', 285).attr('y', 168)
			.attr('fill', '#fabd2f').attr('font-size', '9px')
			.text('N4');

		// N6: UPF to DN (user data)
		const n6G = svgEl.append('g').attr('class', 'n6').attr('opacity', 0);
		n6G.append('line')
			.attr('x1', 360).attr('y1', 220)
			.attr('x2', 495).attr('y2', 220)
			.attr('stroke', '#8ec07c').attr('stroke-width', 2);
		n6G.append('text')
			.attr('x', 430).attr('y', 215)
			.attr('fill', '#8ec07c').attr('font-size', '9px')
			.text('N6');

		// Legend
		svgEl.append('text')
			.attr('x', 20).attr('y', 300)
			.attr('fill', colors.fgMuted).attr('font-size', '9px')
			.text('Interfaces:');

		const legendData = [
			{ x: 85, color: '#8ec07c', label: 'N3/N6 (User data)' },
			{ x: 210, color: '#fabd2f', label: 'N4 (Control)' },
			{ x: 310, color: '#fb4934', label: 'N1/N2 (Signaling)' }
		];
		legendData.forEach(l => {
			svgEl.append('line')
				.attr('x1', l.x).attr('y1', 297)
				.attr('x2', l.x + 20).attr('y2', 297)
				.attr('stroke', l.color).attr('stroke-width', 2);
			svgEl.append('text')
				.attr('x', l.x + 25).attr('y', 300)
				.attr('fill', colors.fgMuted).attr('font-size', '8px')
				.text(l.label);
		});

		// Component legend
		svgEl.append('text')
			.attr('x', 20).attr('y', 330)
			.attr('fill', colors.fgMuted).attr('font-size', '8px')
			.text('AMF: Access & Mobility | SMF: Session Mgmt | UPF: User Plane | UDM: User Data | AUSF: Auth | PCF: Policy | NRF: Repository | NSSF: Slice Selection');

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
