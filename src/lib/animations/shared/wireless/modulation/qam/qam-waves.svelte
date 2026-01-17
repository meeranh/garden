<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';

	let svg: SVGSVGElement;
	let animationId: number;
	let time = 0;

	const width = 700;
	const height = 500;
	const waveWidth = 180;
	const waveHeight = 40;

	// I and Q values (simulating changing data)
	let iValue = 3;
	let qValue = 1;

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		const colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			accent: s.getPropertyValue('--color-accent').trim(),
			yellow: s.getPropertyValue('--color-math').trim(),
			border: s.getPropertyValue('--color-border').trim()
		};

		const svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '16px')
			.attr('font-weight', 'bold')
			.text('How QAM Combines Two Signals Into One');

		// Layout: 3 columns
		// Col 1: I path (y=60-220)
		// Col 2: Carriers (y=140)
		// Col 3: Q path (y=280-440)
		// Bottom: Combined output

		const col1X = 30;
		const col2X = 250;
		const col3X = 470;

		// ===== COLUMN 1: I PATH =====

		// I Input label
		svgEl.append('text')
			.attr('x', col1X).attr('y', 70)
			.attr('fill', '#fb4934')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('I Input (amplitude)');

		// I input wave box
		svgEl.append('rect')
			.attr('x', col1X).attr('y', 80)
			.attr('width', waveWidth).attr('height', waveHeight + 20)
			.attr('fill', colors.border).attr('fill-opacity', 0.2)
			.attr('stroke', colors.border).attr('rx', 4);

		// I input path
		const iInputPath = svgEl.append('path')
			.attr('class', 'i-input-wave')
			.attr('fill', 'none')
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2);

		// Arrow
		svgEl.append('text')
			.attr('x', col1X + waveWidth + 15).attr('y', 105)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '20px')
			.text('×');

		// ===== COLUMN 2: CARRIERS =====

		// In-phase carrier label
		svgEl.append('text')
			.attr('x', col2X).attr('y', 70)
			.attr('fill', '#fabd2f')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('In-phase Carrier');

		// Carrier wave box
		svgEl.append('rect')
			.attr('x', col2X).attr('y', 80)
			.attr('width', waveWidth).attr('height', waveHeight + 20)
			.attr('fill', colors.border).attr('fill-opacity', 0.2)
			.attr('stroke', colors.border).attr('rx', 4);

		// Carrier path
		const carrierPath = svgEl.append('path')
			.attr('class', 'carrier-wave')
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);

		// Equals
		svgEl.append('text')
			.attr('x', col2X + waveWidth + 15).attr('y', 105)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '20px')
			.text('=');

		// ===== COLUMN 3: I RESULT =====

		// I result label
		svgEl.append('text')
			.attr('x', col3X).attr('y', 70)
			.attr('fill', '#fb4934')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('I × Carrier');

		// I result wave box
		svgEl.append('rect')
			.attr('x', col3X).attr('y', 80)
			.attr('width', waveWidth).attr('height', waveHeight + 20)
			.attr('fill', colors.border).attr('fill-opacity', 0.2)
			.attr('stroke', colors.border).attr('rx', 4);

		// I result path
		const iResultPath = svgEl.append('path')
			.attr('class', 'i-result-wave')
			.attr('fill', 'none')
			.attr('stroke', '#fb4934')
			.attr('stroke-width', 2);

		// ===== ROW 2: Q PATH =====

		const row2Y = 170;

		// Q Input label
		svgEl.append('text')
			.attr('x', col1X).attr('y', row2Y)
			.attr('fill', '#83a598')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Q Input (amplitude)');

		// Q input wave box
		svgEl.append('rect')
			.attr('x', col1X).attr('y', row2Y + 10)
			.attr('width', waveWidth).attr('height', waveHeight + 20)
			.attr('fill', colors.border).attr('fill-opacity', 0.2)
			.attr('stroke', colors.border).attr('rx', 4);

		// Q input path
		const qInputPath = svgEl.append('path')
			.attr('class', 'q-input-wave')
			.attr('fill', 'none')
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2);

		// Arrow
		svgEl.append('text')
			.attr('x', col1X + waveWidth + 15).attr('y', row2Y + 35)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '20px')
			.text('×');

		// Quadrature carrier label
		svgEl.append('text')
			.attr('x', col2X).attr('y', row2Y)
			.attr('fill', '#fabd2f')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Quadrature (90° shifted)');

		// Quadrature wave box
		svgEl.append('rect')
			.attr('x', col2X).attr('y', row2Y + 10)
			.attr('width', waveWidth).attr('height', waveHeight + 20)
			.attr('fill', colors.border).attr('fill-opacity', 0.2)
			.attr('stroke', colors.border).attr('rx', 4);

		// Quadrature path
		const quadraturePath = svgEl.append('path')
			.attr('class', 'quadrature-wave')
			.attr('fill', 'none')
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);

		// Equals
		svgEl.append('text')
			.attr('x', col2X + waveWidth + 15).attr('y', row2Y + 35)
			.attr('fill', colors.fgMuted)
			.attr('font-size', '20px')
			.text('=');

		// Q result label
		svgEl.append('text')
			.attr('x', col3X).attr('y', row2Y)
			.attr('fill', '#83a598')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Q × Carrier');

		// Q result wave box
		svgEl.append('rect')
			.attr('x', col3X).attr('y', row2Y + 10)
			.attr('width', waveWidth).attr('height', waveHeight + 20)
			.attr('fill', colors.border).attr('fill-opacity', 0.2)
			.attr('stroke', colors.border).attr('rx', 4);

		// Q result path
		const qResultPath = svgEl.append('path')
			.attr('class', 'q-result-wave')
			.attr('fill', 'none')
			.attr('stroke', '#83a598')
			.attr('stroke-width', 2);

		// ===== COMBINING SECTION =====

		const combineY = 290;

		// Plus sign and arrows
		svgEl.append('text')
			.attr('x', width / 2 - 80).attr('y', combineY)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('I result');

		svgEl.append('text')
			.attr('x', width / 2).attr('y', combineY)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '24px')
			.attr('font-weight', 'bold')
			.text('+');

		svgEl.append('text')
			.attr('x', width / 2 + 80).attr('y', combineY)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('Q result');

		svgEl.append('text')
			.attr('x', width / 2).attr('y', combineY + 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '20px')
			.text('↓');

		// ===== OUTPUT =====

		const outputY = 340;

		svgEl.append('text')
			.attr('x', width / 2).attr('y', outputY)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '16px')
			.attr('font-weight', 'bold')
			.text('QAM Output Signal');

		// Output wave box (wider)
		svgEl.append('rect')
			.attr('x', width / 2 - 200).attr('y', outputY + 10)
			.attr('width', 400).attr('height', 80)
			.attr('fill', colors.border).attr('fill-opacity', 0.2)
			.attr('stroke', colors.yellow).attr('stroke-width', 2).attr('rx', 6);

		// Output path
		const outputPath = svgEl.append('path')
			.attr('class', 'output-wave')
			.attr('fill', 'none')
			.attr('stroke', colors.yellow)
			.attr('stroke-width', 2.5);

		// Key insight box
		svgEl.append('rect')
			.attr('x', 50).attr('y', height - 55)
			.attr('width', width - 100).attr('height', 45)
			.attr('fill', '#689d6a').attr('fill-opacity', 0.15)
			.attr('stroke', '#8ec07c').attr('rx', 6);

		svgEl.append('text')
			.attr('x', width / 2).attr('y', height - 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '13px')
			.text('Both signals travel on the SAME frequency! The 90° shift keeps them separate.');

		// Animation loop
		function animate() {
			time += 0.06;

			// Change I and Q values to show DIFFERENT amplitudes
			// High amplitude (I=3, Q=3), Low amplitude (I=1, Q=0), Medium (I=2, Q=1), etc.
			const cycle = Math.floor(time / 2) % 4;
			if (cycle === 0) {
				iValue = 3; qValue = 3;  // High amplitude output
			} else if (cycle === 1) {
				iValue = 1; qValue = 0;  // Low amplitude output
			} else if (cycle === 2) {
				iValue = 0; qValue = 3;  // Medium amplitude, Q only
			} else {
				iValue = 2; qValue = 2;  // Medium amplitude
			}

			// Generate wave data
			const points = 150;
			const iInputData: [number, number][] = [];
			const qInputData: [number, number][] = [];
			const carrierData: [number, number][] = [];
			const quadratureData: [number, number][] = [];
			const iResultData: [number, number][] = [];
			const qResultData: [number, number][] = [];
			const outputData: [number, number][] = [];

			for (let i = 0; i < points; i++) {
				const x = i / points;
				// Time flows from right to left (subtract time for scrolling effect)
				const t = x * 6 * Math.PI - time * 2;

				// Inputs are constant amplitude levels
				const iAmp = iValue / 3;
				const qAmp = qValue / 3;

				// Carriers (scrolling waves)
				const carrier = Math.cos(t);
				const quadrature = Math.sin(t);

				// Results
				const iResult = iAmp * carrier;
				const qResult = qAmp * quadrature;

				// Combined output
				const output = iResult + qResult;

				iInputData.push([col1X + 10 + x * (waveWidth - 20), 100 + waveHeight / 2 - iAmp * waveHeight / 2]);
				qInputData.push([col1X + 10 + x * (waveWidth - 20), row2Y + 30 + waveHeight / 2 - qAmp * waveHeight / 2]);
				carrierData.push([col2X + 10 + x * (waveWidth - 20), 100 + waveHeight / 2 - carrier * waveHeight / 2]);
				quadratureData.push([col2X + 10 + x * (waveWidth - 20), row2Y + 30 + waveHeight / 2 - quadrature * waveHeight / 2]);
				iResultData.push([col3X + 10 + x * (waveWidth - 20), 100 + waveHeight / 2 - iResult * waveHeight / 2]);
				qResultData.push([col3X + 10 + x * (waveWidth - 20), row2Y + 30 + waveHeight / 2 - qResult * waveHeight / 2]);
				// Output wave - scale based on max possible amplitude (when I=3, Q=3)
				outputData.push([width / 2 - 190 + x * 380, outputY + 50 - output * 18]);
			}

			const line = d3.line<[number, number]>().x(d => d[0]).y(d => d[1]);

			iInputPath.attr('d', line(iInputData));
			qInputPath.attr('d', line(qInputData));
			carrierPath.attr('d', line(carrierData));
			quadraturePath.attr('d', line(quadratureData));
			iResultPath.attr('d', line(iResultData));
			qResultPath.attr('d', line(qResultData));
			outputPath.attr('d', line(outputData));

			animationId = requestAnimationFrame(animate);
		}

		animate();
	});

	onDestroy(() => {
		if (animationId) cancelAnimationFrame(animationId);
	});
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
