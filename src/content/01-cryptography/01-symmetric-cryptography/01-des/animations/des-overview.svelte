<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	// Layout constants
	const width = 560;
	const height = 980;
	const centerX = width / 2;
	const boxW = 150;
	const boxH = 38;
	const halfBoxW = 75;
	const halfGap = 8;
	const leftX = centerX - halfGap - halfBoxW;
	const rightX = centerX + halfGap;

	// DES data
	const plaintext = '0123456789ABCDEF';
	const rounds = [
		{ L: '14A7D678', R: '18CA18AD', K: '1B02EFFC7072', fOut: '5A78E394', xor: '4EDF35EC' },
		{ L: '18CA18AD', R: '4EDF35EC', K: '79AED9DBC9E5', fOut: '0F55FA33', xor: '179FE29E' },
		{ L: '4EDF35EC', R: '179FE29E', K: '55FC8A42CF99', fOut: 'A2B17C6D', xor: 'EC6E4981' }
	];
	const ciphertext = '85E813540F0AB405';

	const stepLabels = [
		'64-bit plaintext input',
		'Initial Permutation rearranges bits',
		'Split into L₀ (left 32 bits) and R₀ (right 32 bits)',
		'16 Feistel rounds (showing 3)',
		'Rounds 4-16 continue the same pattern',
		'Final Permutation (inverse of IP)',
		'64-bit ciphertext output'
	];

	function getCSSVar(name: string): string {
		if (typeof window === 'undefined') return '#888';
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
	}

	let colors = {
		bg: '#1d2021',
		bgCard: '#282828',
		fg: '#fbf1c7',
		fgMuted: '#d5c4a1',
		border: '#3c3836',
		accent: '#8ec07c',
		math: '#fabd2f',
		error: '#fb4934',
		purple: '#d3869b',
		orange: '#fe8019'
	};

	function updateColors() {
		colors = {
			bg: getCSSVar('--color-bg') || '#1d2021',
			bgCard: getCSSVar('--color-bg-card') || '#282828',
			fg: getCSSVar('--color-fg') || '#fbf1c7',
			fgMuted: getCSSVar('--color-fg-muted') || '#d5c4a1',
			border: getCSSVar('--color-border') || '#3c3836',
			accent: getCSSVar('--color-accent') || '#8ec07c',
			math: getCSSVar('--color-math') || '#fabd2f',
			error: getCSSVar('--color-error') || '#fb4934',
			purple: '#d3869b',
			orange: '#fe8019'
		};
	}

	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;

	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			animationTimer = setTimeout(resolve, ms);
		});
	}

	function setupSvg() {
		if (!svg) return null;
		const svgEl = d3.select(svg);
		svgEl.selectAll('*').remove();
		svgEl.attr('width', '100%').attr('height', 'auto').attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl.append('text')
			.attr('x', centerX)
			.attr('y', 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.math)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('DES Encryption Flow');

		// Step text
		stepText = svgEl.append('text')
			.attr('x', centerX)
			.attr('y', height - 8)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px');

		// Arrow markers
		const defs = svgEl.append('defs');
		const markerColors = [
			{ id: 'arr-border', color: colors.border },
			{ id: 'arr-accent', color: colors.accent },
			{ id: 'arr-purple', color: colors.purple },
			{ id: 'arr-orange', color: colors.orange },
			{ id: 'arr-math', color: colors.math },
			{ id: 'arr-error', color: colors.error }
		];
		markerColors.forEach(({ id, color }) => {
			defs.append('marker')
				.attr('id', id)
				.attr('markerWidth', 8)
				.attr('markerHeight', 6)
				.attr('refX', 6)
				.attr('refY', 3)
				.attr('orient', 'auto')
				.append('polygon')
				.attr('points', '0 0, 8 3, 0 6')
				.attr('fill', color);
		});

		return svgEl;
	}

	async function runAnimation() {
		if (!svg) return;
		isPlaying = true;
		updateColors();

		const svgEl = setupSvg();
		if (!svgEl) return;

		// Layout
		const currentY = 42;
		const ipY = currentY + boxH + 35;
		const splitY = ipY + boxH + 45;
		const roundsBoxY = splitY + boxH + 35;
		const miniRoundHeight = 145;
		const roundsBoxHeight = miniRoundHeight * 3 + 55;
		const miniBoxW = 70;
		const miniBoxH = 32;
		const miniLX = 85;
		const miniRX = miniLX + miniBoxW + 12;
		const xorCenterX = miniLX + miniBoxW / 2 + (miniRX - miniLX) / 2;

		// ==================== STEP 0: PLAINTEXT ====================
		currentStep = 0;
		stepText.text(stepLabels[0]);

		svgEl.append('rect')
			.attr('x', centerX - boxW / 2).attr('y', currentY)
			.attr('width', boxW).attr('height', boxH)
			.attr('fill', colors.accent).attr('fill-opacity', 0.2)
			.attr('stroke', colors.accent).attr('stroke-width', 2).attr('rx', 5)
			.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', centerX).attr('y', currentY + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.accent).attr('font-size', '9px')
			.text('64-bit Plaintext')
			.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', centerX).attr('y', currentY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg).attr('font-size', '11px')
			.attr('font-family', 'monospace').attr('font-weight', 'bold')
			.text(plaintext)
			.attr('opacity', 0).transition().delay(150).duration(350).attr('opacity', 1);

		await sleep(900);
		if (!isPlaying) return;

		// ==================== STEP 1: INITIAL PERMUTATION ====================
		currentStep = 1;
		stepText.text(stepLabels[1]);

		svgEl.append('line')
			.attr('x1', centerX).attr('y1', currentY + boxH + 4)
			.attr('x2', centerX).attr('y2', ipY - 6)
			.attr('stroke', colors.border).attr('stroke-width', 2)
			.attr('marker-end', 'url(#arr-border)')
			.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

		await sleep(300);
		if (!isPlaying) return;

		svgEl.append('rect')
			.attr('x', centerX - boxW / 2).attr('y', ipY)
			.attr('width', boxW).attr('height', boxH)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.purple).attr('stroke-width', 2).attr('rx', 5)
			.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', centerX).attr('y', ipY + 23)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Initial Permutation (IP)')
			.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

		await sleep(700);
		if (!isPlaying) return;

		// ==================== STEP 2: SPLIT INTO L0 AND R0 ====================
		currentStep = 2;
		stepText.text(stepLabels[2]);

		svgEl.append('line')
			.attr('x1', centerX).attr('y1', ipY + boxH + 4)
			.attr('x2', centerX).attr('y2', splitY - 25)
			.attr('stroke', colors.purple).attr('stroke-width', 2)
			.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

		svgEl.append('path')
			.attr('d', `M ${centerX} ${splitY - 25} L ${leftX + halfBoxW / 2} ${splitY - 6}`)
			.attr('fill', 'none')
			.attr('stroke', colors.accent).attr('stroke-width', 2)
			.attr('marker-end', 'url(#arr-accent)')
			.attr('opacity', 0).transition().delay(150).duration(250).attr('opacity', 1);

		svgEl.append('path')
			.attr('d', `M ${centerX} ${splitY - 25} L ${rightX + halfBoxW / 2} ${splitY - 6}`)
			.attr('fill', 'none')
			.attr('stroke', colors.orange).attr('stroke-width', 2)
			.attr('marker-end', 'url(#arr-orange)')
			.attr('opacity', 0).transition().delay(150).duration(250).attr('opacity', 1);

		await sleep(400);
		if (!isPlaying) return;

		// L0 block
		svgEl.append('rect')
			.attr('x', leftX).attr('y', splitY)
			.attr('width', halfBoxW).attr('height', boxH)
			.attr('fill', colors.accent).attr('fill-opacity', 0.2)
			.attr('stroke', colors.accent).attr('stroke-width', 2).attr('rx', 5)
			.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', leftX + halfBoxW / 2).attr('y', splitY + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.accent).attr('font-size', '9px')
			.text('L₀')
			.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', leftX + halfBoxW / 2).attr('y', splitY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg).attr('font-size', '9px')
			.attr('font-family', 'monospace').attr('font-weight', 'bold')
			.text(rounds[0].L)
			.attr('opacity', 0).transition().delay(100).duration(300).attr('opacity', 1);

		// R0 block
		svgEl.append('rect')
			.attr('x', rightX).attr('y', splitY)
			.attr('width', halfBoxW).attr('height', boxH)
			.attr('fill', colors.orange).attr('fill-opacity', 0.2)
			.attr('stroke', colors.orange).attr('stroke-width', 2).attr('rx', 5)
			.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', rightX + halfBoxW / 2).attr('y', splitY + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.orange).attr('font-size', '9px')
			.text('R₀')
			.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', rightX + halfBoxW / 2).attr('y', splitY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg).attr('font-size', '9px')
			.attr('font-family', 'monospace').attr('font-weight', 'bold')
			.text(rounds[0].R)
			.attr('opacity', 0).transition().delay(100).duration(300).attr('opacity', 1);

		await sleep(800);
		if (!isPlaying) return;

		// ==================== STEP 3: 16 ROUNDS BOX ====================
		currentStep = 3;
		stepText.text(stepLabels[3]);

		// Arrows into rounds box
		svgEl.append('path')
			.attr('d', `M ${leftX + halfBoxW / 2} ${splitY + boxH + 4}
			            L ${leftX + halfBoxW / 2} ${roundsBoxY + 12}
			            L ${miniLX + miniBoxW / 2} ${roundsBoxY + 38}`)
			.attr('fill', 'none')
			.attr('stroke', colors.accent).attr('stroke-width', 2)
			.attr('marker-end', 'url(#arr-accent)')
			.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

		svgEl.append('path')
			.attr('d', `M ${rightX + halfBoxW / 2} ${splitY + boxH + 4}
			            L ${rightX + halfBoxW / 2} ${roundsBoxY + 12}
			            L ${miniRX + miniBoxW / 2} ${roundsBoxY + 38}`)
			.attr('fill', 'none')
			.attr('stroke', colors.orange).attr('stroke-width', 2)
			.attr('marker-end', 'url(#arr-orange)')
			.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

		await sleep(350);
		if (!isPlaying) return;

		// Rounds container
		svgEl.append('rect')
			.attr('x', 22).attr('y', roundsBoxY)
			.attr('width', width - 44).attr('height', roundsBoxHeight)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.orange).attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,3').attr('rx', 6)
			.attr('opacity', 0).transition().duration(400).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', 40).attr('y', roundsBoxY + 18)
			.attr('fill', colors.orange).attr('font-size', '10px').attr('font-weight', 'bold')
			.text('16 Feistel Rounds')
			.attr('opacity', 0).transition().duration(400).attr('opacity', 1);

		await sleep(500);
		if (!isPlaying) return;

		// Mini rounds
		const miniRoundStartY = roundsBoxY + 42;

		for (let i = 0; i < 3; i++) {
			if (!isPlaying) return;

			const rd = rounds[i];
			const roundY = miniRoundStartY + i * miniRoundHeight;
			const lCenterX = miniLX + miniBoxW / 2;

			stepText.text(`Round ${i + 1}: F(R${i}, K${i + 1}) ⊕ L${i}`);

			// Round label
			svgEl.append('text')
				.attr('x', 40).attr('y', roundY + 18)
				.attr('fill', colors.math).attr('font-size', '10px').attr('font-weight', 'bold')
				.text(`R${i + 1}`)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			// Mini L
			svgEl.append('rect')
				.attr('x', miniLX).attr('y', roundY)
				.attr('width', miniBoxW).attr('height', miniBoxH)
				.attr('fill', colors.accent).attr('fill-opacity', 0.15)
				.attr('stroke', colors.accent).attr('rx', 4)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('text')
				.attr('x', lCenterX).attr('y', roundY + 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '8px')
				.text(`L${i}`)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('text')
				.attr('x', lCenterX).attr('y', roundY + 24)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '8px').attr('font-family', 'monospace')
				.text(rd.L)
				.attr('opacity', 0).transition().delay(80).duration(250).attr('opacity', 1);

			// Mini R
			svgEl.append('rect')
				.attr('x', miniRX).attr('y', roundY)
				.attr('width', miniBoxW).attr('height', miniBoxH)
				.attr('fill', colors.orange).attr('fill-opacity', 0.15)
				.attr('stroke', colors.orange).attr('rx', 4)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('text')
				.attr('x', miniRX + miniBoxW / 2).attr('y', roundY + 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange).attr('font-size', '8px')
				.text(`R${i}`)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('text')
				.attr('x', miniRX + miniBoxW / 2).attr('y', roundY + 24)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '8px').attr('font-family', 'monospace')
				.text(rd.R)
				.attr('opacity', 0).transition().delay(80).duration(250).attr('opacity', 1);

			await sleep(280);
			if (!isPlaying) return;

			// F function
			const fX = miniRX + miniBoxW + 30;
			const fW = 80;
			const fH = 26;
			const fY = roundY + 3;

			svgEl.append('rect')
				.attr('x', fX).attr('y', fY)
				.attr('width', fW).attr('height', fH)
				.attr('fill', colors.bgCard)
				.attr('stroke', colors.purple).attr('stroke-width', 1.5).attr('rx', 4)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('text')
				.attr('x', fX + fW / 2).attr('y', fY + 17)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.purple).attr('font-size', '9px').attr('font-weight', 'bold')
				.text(`F(R${i}, K${i + 1})`)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			// Arrow R to F
			svgEl.append('line')
				.attr('x1', miniRX + miniBoxW + 4).attr('y1', roundY + miniBoxH / 2)
				.attr('x2', fX - 6).attr('y2', fY + fH / 2)
				.attr('stroke', colors.orange).attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#arr-orange)')
				.attr('opacity', 0).transition().duration(200).attr('opacity', 1);

			// Key box
			const kX = fX + fW + 30;
			const kW = 82;

			svgEl.append('rect')
				.attr('x', kX).attr('y', fY)
				.attr('width', kW).attr('height', fH)
				.attr('fill', colors.error).attr('fill-opacity', 0.15)
				.attr('stroke', colors.error).attr('rx', 4)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('text')
				.attr('x', kX + kW / 2).attr('y', fY + 10)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.error).attr('font-size', '7px')
				.text(`K${i + 1}`)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('text')
				.attr('x', kX + kW / 2).attr('y', fY + 21)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '6px').attr('font-family', 'monospace')
				.text(rd.K.substring(0, 10) + '..')
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			// Arrow K to F
			svgEl.append('line')
				.attr('x1', kX - 4).attr('y1', fY + fH / 2)
				.attr('x2', fX + fW + 6).attr('y2', fY + fH / 2)
				.attr('stroke', colors.error).attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#arr-error)')
				.attr('opacity', 0).transition().duration(200).attr('opacity', 1);

			await sleep(320);
			if (!isPlaying) return;

			// XOR
			const xorY = roundY + 65;

			svgEl.append('circle')
				.attr('cx', xorCenterX).attr('cy', xorY)
				.attr('r', 14)
				.attr('fill', colors.bgCard)
				.attr('stroke', colors.math).attr('stroke-width', 2)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('text')
				.attr('x', xorCenterX).attr('y', xorY + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.math).attr('font-size', '16px')
				.text('⊕')
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			// Arrow F to XOR
			const fCenterX = fX + fW / 2;
			svgEl.append('path')
				.attr('d', `M ${fCenterX} ${fY + fH + 4} L ${fCenterX} ${xorY} L ${xorCenterX + 16} ${xorY}`)
				.attr('fill', 'none')
				.attr('stroke', colors.purple).attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#arr-purple)')
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			// Arrow L to XOR
			svgEl.append('path')
				.attr('d', `M ${lCenterX} ${roundY + miniBoxH + 4} L ${lCenterX} ${xorY} L ${xorCenterX - 16} ${xorY}`)
				.attr('fill', 'none')
				.attr('stroke', colors.accent).attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#arr-accent)')
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			await sleep(280);
			if (!isPlaying) return;

			// Result
			const resW = 75;
			const resH = 24;
			const resX = xorCenterX - resW / 2;
			const resY = xorY + 32;

			svgEl.append('rect')
				.attr('x', resX).attr('y', resY)
				.attr('width', resW).attr('height', resH)
				.attr('fill', colors.accent).attr('fill-opacity', 0.15)
				.attr('stroke', colors.accent).attr('rx', 4)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('text')
				.attr('x', resX + resW / 2).attr('y', resY + 16)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '9px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(rd.xor)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			svgEl.append('line')
				.attr('x1', xorCenterX).attr('y1', xorY + 14)
				.attr('x2', xorCenterX).attr('y2', resY - 5)
				.attr('stroke', colors.accent).attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#arr-accent)')
				.attr('opacity', 0).transition().duration(180).attr('opacity', 1);

			await sleep(250);
			if (!isPlaying) return;

			// Swap arrows to next round
			if (i < 2) {
				const nextRoundY = roundY + miniRoundHeight;
				const rCenterX = miniRX + miniBoxW / 2;
				const resCenterX = resX + resW / 2;

				// R → next L
				svgEl.append('path')
					.attr('d', `M ${rCenterX} ${roundY + miniBoxH + 4}
					            C ${rCenterX - 12} ${roundY + miniBoxH + 40},
					              ${lCenterX + 12} ${nextRoundY - 35},
					              ${lCenterX} ${nextRoundY - 4}`)
					.attr('fill', 'none')
					.attr('stroke', colors.orange).attr('stroke-width', 1.5)
					.attr('stroke-dasharray', '4,2')
					.attr('marker-end', 'url(#arr-orange)')
					.attr('opacity', 0).transition().delay(150).duration(350).attr('opacity', 0.7);

				// XOR result → next R
				svgEl.append('path')
					.attr('d', `M ${resCenterX} ${resY + resH + 4}
					            C ${resCenterX + 12} ${resY + resH + 25},
					              ${rCenterX - 12} ${nextRoundY - 30},
					              ${rCenterX} ${nextRoundY - 4}`)
					.attr('fill', 'none')
					.attr('stroke', colors.accent).attr('stroke-width', 1.5)
					.attr('stroke-dasharray', '4,2')
					.attr('marker-end', 'url(#arr-accent)')
					.attr('opacity', 0).transition().delay(250).duration(350).attr('opacity', 0.7);
			}

			await sleep(450);
			if (!isPlaying) return;
		}

		// ==================== STEP 4: ROUNDS CONTINUE ====================
		currentStep = 4;
		stepText.text(stepLabels[4]);

		svgEl.append('text')
			.attr('x', centerX).attr('y', roundsBoxY + roundsBoxHeight - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted).attr('font-size', '9px')
			.text('... rounds 4-16 continue ...')
			.attr('opacity', 0).transition().duration(350).attr('opacity', 0.6);

		await sleep(800);
		if (!isPlaying) return;

		// ==================== STEP 5: FINAL PERMUTATION ====================
		currentStep = 5;
		stepText.text(stepLabels[5]);
		const fpY = roundsBoxY + roundsBoxHeight + 35;

		svgEl.append('line')
			.attr('x1', centerX).attr('y1', roundsBoxY + roundsBoxHeight + 4)
			.attr('x2', centerX).attr('y2', fpY - 6)
			.attr('stroke', colors.border).attr('stroke-width', 2)
			.attr('marker-end', 'url(#arr-border)')
			.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

		await sleep(300);
		if (!isPlaying) return;

		svgEl.append('rect')
			.attr('x', centerX - boxW / 2).attr('y', fpY)
			.attr('width', boxW).attr('height', boxH)
			.attr('fill', colors.bgCard)
			.attr('stroke', colors.purple).attr('stroke-width', 2).attr('rx', 5)
			.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', centerX).attr('y', fpY + 23)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Final Permutation (IP⁻¹)')
			.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

		await sleep(650);
		if (!isPlaying) return;

		// ==================== STEP 6: CIPHERTEXT ====================
		currentStep = 6;
		stepText.text(stepLabels[6]);
		const outY = fpY + boxH + 35;

		svgEl.append('line')
			.attr('x1', centerX).attr('y1', fpY + boxH + 4)
			.attr('x2', centerX).attr('y2', outY - 6)
			.attr('stroke', colors.accent).attr('stroke-width', 2)
			.attr('marker-end', 'url(#arr-accent)')
			.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

		await sleep(300);
		if (!isPlaying) return;

		svgEl.append('rect')
			.attr('x', centerX - boxW / 2).attr('y', outY)
			.attr('width', boxW).attr('height', 44)
			.attr('fill', colors.accent).attr('fill-opacity', 0.2)
			.attr('stroke', colors.accent).attr('stroke-width', 2).attr('rx', 5)
			.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', centerX).attr('y', outY + 16)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.accent).attr('font-size', '9px')
			.text('64-bit Ciphertext')
			.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

		svgEl.append('text')
			.attr('x', centerX).attr('y', outY + 34)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg).attr('font-size', '11px')
			.attr('font-family', 'monospace').attr('font-weight', 'bold')
			.text(ciphertext)
			.attr('opacity', 0).transition().delay(150).duration(350).attr('opacity', 1);

		await sleep(400);
		stepText.text('DES Encryption Complete');

		isPlaying = false;
	}

	// Static drawing for step controls (next/prev)
	function drawStepStatic(step: number) {
		if (!svg) return;
		updateColors();

		const svgEl = setupSvg();
		if (!svgEl) return;

		stepText.text(stepLabels[step]);

		const currentY = 42;
		const ipY = currentY + boxH + 35;
		const splitY = ipY + boxH + 45;
		const roundsBoxY = splitY + boxH + 35;
		const miniRoundHeight = 145;
		const roundsBoxHeight = miniRoundHeight * 3 + 55;
		const fpY = roundsBoxY + roundsBoxHeight + 35;
		const outY = fpY + boxH + 35;
		const miniBoxW = 70;
		const miniBoxH = 32;
		const miniLX = 85;
		const miniRX = miniLX + miniBoxW + 12;
		const xorCenterX = miniLX + miniBoxW / 2 + (miniRX - miniLX) / 2;

		// Step 0+: Plaintext
		if (step >= 0) {
			svgEl.append('rect')
				.attr('x', centerX - boxW / 2).attr('y', currentY)
				.attr('width', boxW).attr('height', boxH)
				.attr('fill', colors.accent).attr('fill-opacity', 0.2)
				.attr('stroke', colors.accent).attr('stroke-width', 2).attr('rx', 5);
			svgEl.append('text')
				.attr('x', centerX).attr('y', currentY + 14)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '9px')
				.text('64-bit Plaintext');
			svgEl.append('text')
				.attr('x', centerX).attr('y', currentY + 28)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '11px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(plaintext);
		}

		// Step 1+: IP
		if (step >= 1) {
			svgEl.append('line')
				.attr('x1', centerX).attr('y1', currentY + boxH + 4)
				.attr('x2', centerX).attr('y2', ipY - 6)
				.attr('stroke', colors.border).attr('stroke-width', 2)
				.attr('marker-end', 'url(#arr-border)');
			svgEl.append('rect')
				.attr('x', centerX - boxW / 2).attr('y', ipY)
				.attr('width', boxW).attr('height', boxH)
				.attr('fill', colors.bgCard)
				.attr('stroke', colors.purple).attr('stroke-width', 2).attr('rx', 5);
			svgEl.append('text')
				.attr('x', centerX).attr('y', ipY + 23)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold')
				.text('Initial Permutation (IP)');
		}

		// Step 2+: L0/R0
		if (step >= 2) {
			svgEl.append('line')
				.attr('x1', centerX).attr('y1', ipY + boxH + 4)
				.attr('x2', centerX).attr('y2', splitY - 25)
				.attr('stroke', colors.purple).attr('stroke-width', 2);
			svgEl.append('path')
				.attr('d', `M ${centerX} ${splitY - 25} L ${leftX + halfBoxW / 2} ${splitY - 6}`)
				.attr('fill', 'none')
				.attr('stroke', colors.accent).attr('stroke-width', 2)
				.attr('marker-end', 'url(#arr-accent)');
			svgEl.append('path')
				.attr('d', `M ${centerX} ${splitY - 25} L ${rightX + halfBoxW / 2} ${splitY - 6}`)
				.attr('fill', 'none')
				.attr('stroke', colors.orange).attr('stroke-width', 2)
				.attr('marker-end', 'url(#arr-orange)');
			// L0
			svgEl.append('rect')
				.attr('x', leftX).attr('y', splitY)
				.attr('width', halfBoxW).attr('height', boxH)
				.attr('fill', colors.accent).attr('fill-opacity', 0.2)
				.attr('stroke', colors.accent).attr('stroke-width', 2).attr('rx', 5);
			svgEl.append('text')
				.attr('x', leftX + halfBoxW / 2).attr('y', splitY + 14)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '9px')
				.text('L₀');
			svgEl.append('text')
				.attr('x', leftX + halfBoxW / 2).attr('y', splitY + 28)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '9px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(rounds[0].L);
			// R0
			svgEl.append('rect')
				.attr('x', rightX).attr('y', splitY)
				.attr('width', halfBoxW).attr('height', boxH)
				.attr('fill', colors.orange).attr('fill-opacity', 0.2)
				.attr('stroke', colors.orange).attr('stroke-width', 2).attr('rx', 5);
			svgEl.append('text')
				.attr('x', rightX + halfBoxW / 2).attr('y', splitY + 14)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange).attr('font-size', '9px')
				.text('R₀');
			svgEl.append('text')
				.attr('x', rightX + halfBoxW / 2).attr('y', splitY + 28)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '9px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(rounds[0].R);
		}

		// Step 3+: Rounds box
		if (step >= 3) {
			svgEl.append('path')
				.attr('d', `M ${leftX + halfBoxW / 2} ${splitY + boxH + 4} L ${leftX + halfBoxW / 2} ${roundsBoxY + 12} L ${miniLX + miniBoxW / 2} ${roundsBoxY + 38}`)
				.attr('fill', 'none').attr('stroke', colors.accent).attr('stroke-width', 2).attr('marker-end', 'url(#arr-accent)');
			svgEl.append('path')
				.attr('d', `M ${rightX + halfBoxW / 2} ${splitY + boxH + 4} L ${rightX + halfBoxW / 2} ${roundsBoxY + 12} L ${miniRX + miniBoxW / 2} ${roundsBoxY + 38}`)
				.attr('fill', 'none').attr('stroke', colors.orange).attr('stroke-width', 2).attr('marker-end', 'url(#arr-orange)');
			svgEl.append('rect')
				.attr('x', 22).attr('y', roundsBoxY)
				.attr('width', width - 44).attr('height', roundsBoxHeight)
				.attr('fill', colors.bgCard).attr('stroke', colors.orange).attr('stroke-width', 2)
				.attr('stroke-dasharray', '6,3').attr('rx', 6);
			svgEl.append('text')
				.attr('x', 40).attr('y', roundsBoxY + 18)
				.attr('fill', colors.orange).attr('font-size', '10px').attr('font-weight', 'bold')
				.text('16 Feistel Rounds');

			// Draw all 3 mini rounds
			const miniRoundStartY = roundsBoxY + 42;
			for (let i = 0; i < 3; i++) {
				const rd = rounds[i];
				const roundY = miniRoundStartY + i * miniRoundHeight;
				const lCenterX = miniLX + miniBoxW / 2;
				const fX = miniRX + miniBoxW + 30;
				const fW = 80;
				const fH = 26;
				const fY = roundY + 3;
				const kX = fX + fW + 30;
				const kW = 82;
				const xorY = roundY + 65;
				const resW = 75;
				const resH = 24;
				const resX = xorCenterX - resW / 2;
				const resY = xorY + 32;

				// Round label
				svgEl.append('text').attr('x', 40).attr('y', roundY + 18).attr('fill', colors.math).attr('font-size', '10px').attr('font-weight', 'bold').text(`R${i + 1}`);
				// L
				svgEl.append('rect').attr('x', miniLX).attr('y', roundY).attr('width', miniBoxW).attr('height', miniBoxH).attr('fill', colors.accent).attr('fill-opacity', 0.15).attr('stroke', colors.accent).attr('rx', 4);
				svgEl.append('text').attr('x', lCenterX).attr('y', roundY + 12).attr('text-anchor', 'middle').attr('fill', colors.accent).attr('font-size', '8px').text(`L${i}`);
				svgEl.append('text').attr('x', lCenterX).attr('y', roundY + 24).attr('text-anchor', 'middle').attr('fill', colors.fg).attr('font-size', '8px').attr('font-family', 'monospace').text(rd.L);
				// R
				svgEl.append('rect').attr('x', miniRX).attr('y', roundY).attr('width', miniBoxW).attr('height', miniBoxH).attr('fill', colors.orange).attr('fill-opacity', 0.15).attr('stroke', colors.orange).attr('rx', 4);
				svgEl.append('text').attr('x', miniRX + miniBoxW / 2).attr('y', roundY + 12).attr('text-anchor', 'middle').attr('fill', colors.orange).attr('font-size', '8px').text(`R${i}`);
				svgEl.append('text').attr('x', miniRX + miniBoxW / 2).attr('y', roundY + 24).attr('text-anchor', 'middle').attr('fill', colors.fg).attr('font-size', '8px').attr('font-family', 'monospace').text(rd.R);
				// F
				svgEl.append('rect').attr('x', fX).attr('y', fY).attr('width', fW).attr('height', fH).attr('fill', colors.bgCard).attr('stroke', colors.purple).attr('stroke-width', 1.5).attr('rx', 4);
				svgEl.append('text').attr('x', fX + fW / 2).attr('y', fY + 17).attr('text-anchor', 'middle').attr('fill', colors.purple).attr('font-size', '9px').attr('font-weight', 'bold').text(`F(R${i}, K${i + 1})`);
				svgEl.append('line').attr('x1', miniRX + miniBoxW + 4).attr('y1', roundY + miniBoxH / 2).attr('x2', fX - 6).attr('y2', fY + fH / 2).attr('stroke', colors.orange).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-orange)');
				// K
				svgEl.append('rect').attr('x', kX).attr('y', fY).attr('width', kW).attr('height', fH).attr('fill', colors.error).attr('fill-opacity', 0.15).attr('stroke', colors.error).attr('rx', 4);
				svgEl.append('text').attr('x', kX + kW / 2).attr('y', fY + 10).attr('text-anchor', 'middle').attr('fill', colors.error).attr('font-size', '7px').text(`K${i + 1}`);
				svgEl.append('text').attr('x', kX + kW / 2).attr('y', fY + 21).attr('text-anchor', 'middle').attr('fill', colors.fg).attr('font-size', '6px').attr('font-family', 'monospace').text(rd.K.substring(0, 10) + '..');
				svgEl.append('line').attr('x1', kX - 4).attr('y1', fY + fH / 2).attr('x2', fX + fW + 6).attr('y2', fY + fH / 2).attr('stroke', colors.error).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-error)');
				// XOR
				svgEl.append('circle').attr('cx', xorCenterX).attr('cy', xorY).attr('r', 14).attr('fill', colors.bgCard).attr('stroke', colors.math).attr('stroke-width', 2);
				svgEl.append('text').attr('x', xorCenterX).attr('y', xorY + 5).attr('text-anchor', 'middle').attr('fill', colors.math).attr('font-size', '16px').text('⊕');
				svgEl.append('path').attr('d', `M ${fX + fW / 2} ${fY + fH + 4} L ${fX + fW / 2} ${xorY} L ${xorCenterX + 16} ${xorY}`).attr('fill', 'none').attr('stroke', colors.purple).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-purple)');
				svgEl.append('path').attr('d', `M ${lCenterX} ${roundY + miniBoxH + 4} L ${lCenterX} ${xorY} L ${xorCenterX - 16} ${xorY}`).attr('fill', 'none').attr('stroke', colors.accent).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-accent)');
				// Result
				svgEl.append('rect').attr('x', resX).attr('y', resY).attr('width', resW).attr('height', resH).attr('fill', colors.accent).attr('fill-opacity', 0.15).attr('stroke', colors.accent).attr('rx', 4);
				svgEl.append('text').attr('x', resX + resW / 2).attr('y', resY + 16).attr('text-anchor', 'middle').attr('fill', colors.accent).attr('font-size', '9px').attr('font-family', 'monospace').attr('font-weight', 'bold').text(rd.xor);
				svgEl.append('line').attr('x1', xorCenterX).attr('y1', xorY + 14).attr('x2', xorCenterX).attr('y2', resY - 5).attr('stroke', colors.accent).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-accent)');
				// Swap arrows
				if (i < 2) {
					const nextRoundY = roundY + miniRoundHeight;
					const rCenterX = miniRX + miniBoxW / 2;
					const resCenterX = resX + resW / 2;
					svgEl.append('path').attr('d', `M ${rCenterX} ${roundY + miniBoxH + 4} C ${rCenterX - 12} ${roundY + miniBoxH + 40}, ${lCenterX + 12} ${nextRoundY - 35}, ${lCenterX} ${nextRoundY - 4}`).attr('fill', 'none').attr('stroke', colors.orange).attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2').attr('marker-end', 'url(#arr-orange)').attr('opacity', 0.7);
					svgEl.append('path').attr('d', `M ${resCenterX} ${resY + resH + 4} C ${resCenterX + 12} ${resY + resH + 25}, ${rCenterX - 12} ${nextRoundY - 30}, ${rCenterX} ${nextRoundY - 4}`).attr('fill', 'none').attr('stroke', colors.accent).attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2').attr('marker-end', 'url(#arr-accent)').attr('opacity', 0.7);
				}
			}
		}

		// Step 4+: Continue text
		if (step >= 4) {
			svgEl.append('text').attr('x', centerX).attr('y', roundsBoxY + roundsBoxHeight - 15).attr('text-anchor', 'middle').attr('fill', colors.fgMuted).attr('font-size', '9px').text('... rounds 4-16 continue ...').attr('opacity', 0.6);
		}

		// Step 5+: FP
		if (step >= 5) {
			svgEl.append('line').attr('x1', centerX).attr('y1', roundsBoxY + roundsBoxHeight + 4).attr('x2', centerX).attr('y2', fpY - 6).attr('stroke', colors.border).attr('stroke-width', 2).attr('marker-end', 'url(#arr-border)');
			svgEl.append('rect').attr('x', centerX - boxW / 2).attr('y', fpY).attr('width', boxW).attr('height', boxH).attr('fill', colors.bgCard).attr('stroke', colors.purple).attr('stroke-width', 2).attr('rx', 5);
			svgEl.append('text').attr('x', centerX).attr('y', fpY + 23).attr('text-anchor', 'middle').attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold').text('Final Permutation (IP⁻¹)');
		}

		// Step 6: Ciphertext
		if (step >= 6) {
			svgEl.append('line').attr('x1', centerX).attr('y1', fpY + boxH + 4).attr('x2', centerX).attr('y2', outY - 6).attr('stroke', colors.accent).attr('stroke-width', 2).attr('marker-end', 'url(#arr-accent)');
			svgEl.append('rect').attr('x', centerX - boxW / 2).attr('y', outY).attr('width', boxW).attr('height', 44).attr('fill', colors.accent).attr('fill-opacity', 0.2).attr('stroke', colors.accent).attr('stroke-width', 2).attr('rx', 5);
			svgEl.append('text').attr('x', centerX).attr('y', outY + 16).attr('text-anchor', 'middle').attr('fill', colors.accent).attr('font-size', '9px').text('64-bit Ciphertext');
			svgEl.append('text').attr('x', centerX).attr('y', outY + 34).attr('text-anchor', 'middle').attr('fill', colors.fg).attr('font-size', '11px').attr('font-family', 'monospace').attr('font-weight', 'bold').text(ciphertext);
		}
	}

	function play() {
		if (isPlaying) return;
		runAnimation();
	}

	function pause() {
		isPlaying = false;
		if (animationTimer) {
			clearTimeout(animationTimer);
			animationTimer = null;
		}
	}

	function next() {
		pause();
		if (currentStep < maxStep) {
			currentStep++;
			drawStepStatic(currentStep);
		}
	}

	function prev() {
		pause();
		if (currentStep > 0) {
			currentStep--;
			drawStepStatic(currentStep);
		}
	}

	function skip() {
		pause();
		currentStep = maxStep;
		drawStepStatic(maxStep);
	}

	function replay() {
		pause();
		currentStep = 0;
		runAnimation();
	}

	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

	onMount(() => {
		updateColors();
		register?.({ play, pause, next, prev, skip, replay, getState });
		drawStepStatic(0);
	});

	onDestroy(() => {
		pause();
	});
</script>

<div class="container">
	<svg bind:this={svg} class="diagram"></svg>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
	}

	.diagram {
		width: 100%;
		max-width: 560px;
		height: auto;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
</style>
