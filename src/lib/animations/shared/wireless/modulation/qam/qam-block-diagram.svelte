<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	let svg: SVGSVGElement;

	const width = 500;
	const height = 300;

	onMount(() => {
		const s = getComputedStyle(document.documentElement);
		const colors = {
			fg: s.getPropertyValue('--color-fg').trim(),
			fgMuted: s.getPropertyValue('--color-fg-muted').trim(),
			border: s.getPropertyValue('--color-border').trim(),
			yellow: s.getPropertyValue('--color-math').trim()
		};

		const svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', width / 2).attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '15px')
			.attr('font-weight', 'bold')
			.text('QAM Modulator Block Diagram');

		// ===== I INPUT =====
		svgEl.append('circle')
			.attr('cx', 45).attr('cy', 90)
			.attr('r', 8)
			.attr('fill', 'none')
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('text')
			.attr('x', 45).attr('y', 68)
			.attr('text-anchor', 'middle')
			.attr('fill', '#fb4934')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('I Input');
		svgEl.append('line')
			.attr('x1', 53).attr('x2', 100)
			.attr('y1', 90).attr('y2', 90)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);

		// ===== I MIXER =====
		svgEl.append('circle')
			.attr('cx', 125).attr('cy', 90)
			.attr('r', 22)
			.attr('fill', colors.border).attr('fill-opacity', 0.3)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 113).attr('x2', 137)
			.attr('y1', 78).attr('y2', 102)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 137).attr('x2', 113)
			.attr('y1', 78).attr('y2', 102)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('text')
			.attr('x', 125).attr('y', 130)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Mixer');

		// Line from I mixer to summer
		svgEl.append('line')
			.attr('x1', 147).attr('x2', 340)
			.attr('y1', 90).attr('y2', 90)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 340).attr('x2', 340)
			.attr('y1', 90).attr('y2', 135)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);

		// ===== OSCILLATOR =====
		svgEl.append('rect')
			.attr('x', 180).attr('y', 125)
			.attr('width', 90).attr('height', 45)
			.attr('fill', '#d79921').attr('fill-opacity', 0.3)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('rx', 5);
		svgEl.append('text')
			.attr('x', 225).attr('y', 153)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('Oscillator');

		// ===== 90° PHASE SHIFT =====
		svgEl.append('rect')
			.attr('x', 180).attr('y', 185)
			.attr('width', 90).attr('height', 45)
			.attr('fill', '#d79921').attr('fill-opacity', 0.3)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('rx', 5);
		svgEl.append('text')
			.attr('x', 225).attr('y', 205)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('90° Phase');
		svgEl.append('text')
			.attr('x', 225).attr('y', 222)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('Shift');

		// Osc connections
		// Osc to I mixer
		svgEl.append('line')
			.attr('x1', 225).attr('x2', 225)
			.attr('y1', 125).attr('y2', 110)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 225).attr('x2', 150)
			.attr('y1', 110).attr('y2', 110)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 150).attr('x2', 140)
			.attr('y1', 110).attr('y2', 112)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);

		// Osc to phase shift
		svgEl.append('line')
			.attr('x1', 225).attr('x2', 225)
			.attr('y1', 170).attr('y2', 185)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);

		// Phase shift to Q mixer
		svgEl.append('line')
			.attr('x1', 225).attr('x2', 225)
			.attr('y1', 230).attr('y2', 245)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 225).attr('x2', 150)
			.attr('y1', 245).attr('y2', 245)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 150).attr('x2', 140)
			.attr('y1', 245).attr('y2', 243)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2);

		// ===== Q INPUT =====
		svgEl.append('circle')
			.attr('cx', 45).attr('cy', 255)
			.attr('r', 8)
			.attr('fill', 'none')
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('text')
			.attr('x', 45).attr('y', 283)
			.attr('text-anchor', 'middle')
			.attr('fill', '#83a598')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Q Input');
		svgEl.append('line')
			.attr('x1', 53).attr('x2', 100)
			.attr('y1', 255).attr('y2', 255)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);

		// ===== Q MIXER =====
		svgEl.append('circle')
			.attr('cx', 125).attr('cy', 255)
			.attr('r', 22)
			.attr('fill', colors.border).attr('fill-opacity', 0.3)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 113).attr('x2', 137)
			.attr('y1', 243).attr('y2', 267)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 137).attr('x2', 113)
			.attr('y1', 243).attr('y2', 267)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('text')
			.attr('x', 125).attr('y', 295)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('Mixer');

		// Line from Q mixer to summer
		svgEl.append('line')
			.attr('x1', 147).attr('x2', 340)
			.attr('y1', 255).attr('y2', 255)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('line')
			.attr('x1', 340).attr('x2', 340)
			.attr('y1', 255).attr('y2', 210)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);

		// ===== SUMMER =====
		svgEl.append('rect')
			.attr('x', 320).attr('y', 150)
			.attr('width', 45).attr('height', 45)
			.attr('fill', '#d79921').attr('fill-opacity', 0.3)
			.attr('stroke', '#fabd2f')
			.attr('stroke-width', 2)
			.attr('rx', 5);
		svgEl.append('text')
			.attr('x', 342).attr('y', 182)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '22px')
			.attr('font-weight', 'bold')
			.text('+');

		// ===== OUTPUT =====
		svgEl.append('line')
			.attr('x1', 365).attr('x2', 420)
			.attr('y1', 172).attr('y2', 172)
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('circle')
			.attr('cx', 435).attr('cy', 172)
			.attr('r', 8)
			.attr('fill', 'none')
			.attr('stroke', colors.fg)
			.attr('stroke-width', 2);
		svgEl.append('text')
			.attr('x', 470).attr('y', 177)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Output');
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
