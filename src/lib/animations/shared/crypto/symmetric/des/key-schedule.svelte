<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 6;
	const maxStep = totalSteps - 1;

	// Layout constants
	const width = 500;
	const height = 580;
	const centerX = width / 2;
	const bitW = 28;
	const bitH = 32;
	const bitGap = 5;
	const numPerHalf = 7;
	const totalRowWidth = numPerHalf * 2 * bitW + (numPerHalf * 2 - 1) * bitGap;
	const keyY = 70;
	const keyStartX = centerX - totalRowWidth / 2;
	const splitY = 180;

	// Split layout: 7 blocks per group, gap between groups
	const groupWidth = numPerHalf * bitW + (numPerHalf - 1) * bitGap; // 7*28 + 6*5 = 226
	const splitGap = 24; // Gap between C and D groups
	const totalSplitWidth = groupWidth * 2 + splitGap; // 226 + 24 + 226 = 476
	const cGroupX = (width - totalSplitWidth) / 2; // (500 - 476) / 2 = 12
	const dGroupX = cGroupX + groupWidth + splitGap; // 12 + 226 + 24 = 262

	const combineY = splitY + 90;
	const combineStartX = centerX - totalRowWidth / 2;
	const outputY = combineY + 90;
	const outputBlockW = 24;
	const outputBlockGap = 3;
	const numOutputBlocks = 12;
	const outputRowWidth = numOutputBlocks * outputBlockW + (numOutputBlocks - 1) * outputBlockGap;
	const outputStartX = centerX - outputRowWidth / 2;

	const removeIndices = [3, 10];
	const remainingPositions = [0, 1, 2, 4, 5, 6, 7, 8, 9, 11, 12, 13];

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

	const stepLabels = [
		'56-bit key (after removing 8 parity bits)',
		'Split into two 28-bit halves',
		'Rotate both halves left (1 or 2 bits per round)',
		'Combine C and D (56 bits total)',
		'PC-2 selects 48 of 56 bits',
		'48-bit subkey ready for round'
	];

	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let bitBlocks: d3.Selection<SVGGElement, unknown, null, undefined>[] = [];

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
			.attr('y', 24)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.math)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('Key Schedule');

		// Step text
		stepText = svgEl.append('text')
			.attr('x', centerX)
			.attr('y', height - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px');

		return svgEl;
	}

	function createBitBlock(svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, label: string, color: string, opacity = 1) {
		const g = svgEl.append('g').attr('transform', `translate(${x}, ${y})`);
		g.append('rect')
			.attr('width', bitW)
			.attr('height', bitH)
			.attr('rx', 4)
			.attr('fill', color)
			.attr('fill-opacity', 0.3)
			.attr('stroke', color)
			.attr('stroke-width', 2)
			.attr('opacity', opacity);
		g.append('text')
			.attr('x', bitW / 2)
			.attr('y', bitH / 2 + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.attr('font-family', 'monospace')
			.attr('font-weight', 'bold')
			.text(label)
			.attr('opacity', opacity);
		return g;
	}

	async function runAnimation() {
		if (!svg) return;
		isPlaying = true;
		updateColors();

		const svgEl = setupSvg();
		if (!svgEl) return;

		bitBlocks = [];

		// ==================== STAGE 0: Show 56-bit key as blocks ====================
		currentStep = 0;
		stepText.text(stepLabels[0]);

		// Create bit blocks with fade-in
		for (let i = 0; i < 14; i++) {
			const x = keyStartX + i * (bitW + bitGap);
			const isC = i < 7;
			const color = isC ? colors.accent : colors.orange;
			const label = isC ? (i + 1).toString() : (i - 6).toString();

			const g = svgEl.append('g')
				.attr('class', `bit-${i}`)
				.attr('transform', `translate(${x}, ${keyY})`);

			g.append('rect')
				.attr('width', bitW)
				.attr('height', bitH)
				.attr('rx', 4)
				.attr('fill', color)
				.attr('fill-opacity', 0.3)
				.attr('stroke', color)
				.attr('stroke-width', 2)
				.attr('opacity', 0);

			g.append('text')
				.attr('x', bitW / 2)
				.attr('y', bitH / 2 + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '11px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(label)
				.attr('opacity', 0);

			bitBlocks.push(g);
		}

		// Animate blocks appearing
		for (let i = 0; i < 14; i++) {
			bitBlocks[i].selectAll('*')
				.transition()
				.delay(i * 40)
				.duration(300)
				.attr('opacity', 1);
		}

		// Key label
		const keyLabel = svgEl.append('text')
			.attr('x', centerX)
			.attr('y', keyY - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('56-bit Key')
			.attr('opacity', 0);

		keyLabel.transition().delay(400).duration(300).attr('opacity', 1);

		await sleep(800);
		if (!isPlaying) return;

		// C/D brackets
		const cBracket = svgEl.append('text')
			.attr('x', keyStartX + 3.5 * (bitW + bitGap) - bitGap / 2)
			.attr('y', keyY + bitH + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.accent)
			.attr('font-size', '10px')
			.text('← C (28 bits) →')
			.attr('opacity', 0);

		const dBracket = svgEl.append('text')
			.attr('x', keyStartX + 10.5 * (bitW + bitGap) - bitGap / 2)
			.attr('y', keyY + bitH + 18)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.orange)
			.attr('font-size', '10px')
			.text('← D (28 bits) →')
			.attr('opacity', 0);

		cBracket.transition().duration(300).attr('opacity', 1);
		dBracket.transition().duration(300).attr('opacity', 1);

		await sleep(1200);
		if (!isPlaying) return;

		// ==================== STAGE 1: Split into C and D ====================
		currentStep = 1;
		stepText.text(stepLabels[1]);

		// Fade out brackets and key label
		cBracket.transition().duration(200).attr('opacity', 0);
		dBracket.transition().duration(200).attr('opacity', 0);
		keyLabel.transition().duration(200).attr('opacity', 0);

		await sleep(300);
		if (!isPlaying) return;

		// Move C blocks (0-6) to the left
		for (let i = 0; i < 7; i++) {
			const newX = cGroupX + i * (bitW + bitGap);
			bitBlocks[i]
				.transition()
				.duration(600)
				.ease(d3.easeCubicInOut)
				.attr('transform', `translate(${newX}, ${splitY})`);
		}

		// Move D blocks (7-13) to the right
		for (let i = 7; i < 14; i++) {
			const newX = dGroupX + (i - 7) * (bitW + bitGap);
			bitBlocks[i]
				.transition()
				.duration(600)
				.ease(d3.easeCubicInOut)
				.attr('transform', `translate(${newX}, ${splitY})`);
		}

		await sleep(700);
		if (!isPlaying) return;

		// Add C₀ and D₀ labels
		const cLabel = svgEl.append('text')
			.attr('x', cGroupX + 3.5 * (bitW + bitGap) - bitGap / 2)
			.attr('y', splitY - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.accent)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('C₀')
			.attr('opacity', 0);

		const dLabel = svgEl.append('text')
			.attr('x', dGroupX + 3.5 * (bitW + bitGap) - bitGap / 2)
			.attr('y', splitY - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.orange)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('D₀')
			.attr('opacity', 0);

		cLabel.transition().duration(300).attr('opacity', 1);
		dLabel.transition().duration(300).attr('opacity', 1);

		await sleep(900);
		if (!isPlaying) return;

		// ==================== STAGE 2: Rotate Left ====================
		currentStep = 2;
		stepText.text(stepLabels[2]);

		// Show rotation label
		const rotLabel = svgEl.append('text')
			.attr('x', centerX)
			.attr('y', splitY + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.purple)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('↻ Rotate Left')
			.attr('opacity', 0);

		rotLabel.transition().duration(300).attr('opacity', 1);

		await sleep(500);
		if (!isPlaying) return;

		// Animate C rotation - first block arcs over to the end
		const cFirstBlock = bitBlocks[0];
		const cFirstX = cGroupX;
		const cLastX = cGroupX + 6 * (bitW + bitGap);

		// First block arcs up
		cFirstBlock
			.transition()
			.duration(400)
			.ease(d3.easeCubicOut)
			.attr('transform', `translate(${cFirstX}, ${splitY - 40})`);

		await sleep(400);
		if (!isPlaying) return;

		// First block moves across
		cFirstBlock
			.transition()
			.duration(500)
			.ease(d3.easeLinear)
			.attr('transform', `translate(${cLastX}, ${splitY - 40})`);

		// Other C blocks shift left
		for (let i = 1; i < 7; i++) {
			const newX = cGroupX + (i - 1) * (bitW + bitGap);
			bitBlocks[i]
				.transition()
				.delay(200)
				.duration(400)
				.ease(d3.easeCubicInOut)
				.attr('transform', `translate(${newX}, ${splitY})`);
		}

		await sleep(600);
		if (!isPlaying) return;

		// First block drops down to end
		cFirstBlock
			.transition()
			.duration(300)
			.ease(d3.easeCubicIn)
			.attr('transform', `translate(${cLastX}, ${splitY})`);

		// Animate D rotation similarly
		const dFirstBlock = bitBlocks[7];
		const dFirstX = dGroupX;
		const dLastX = dGroupX + 6 * (bitW + bitGap);

		dFirstBlock
			.transition()
			.duration(400)
			.ease(d3.easeCubicOut)
			.attr('transform', `translate(${dFirstX}, ${splitY - 40})`);

		await sleep(400);
		if (!isPlaying) return;

		dFirstBlock
			.transition()
			.duration(500)
			.ease(d3.easeLinear)
			.attr('transform', `translate(${dLastX}, ${splitY - 40})`);

		for (let i = 8; i < 14; i++) {
			const newX = dGroupX + (i - 8) * (bitW + bitGap);
			bitBlocks[i]
				.transition()
				.delay(200)
				.duration(400)
				.ease(d3.easeCubicInOut)
				.attr('transform', `translate(${newX}, ${splitY})`);
		}

		await sleep(600);
		if (!isPlaying) return;

		dFirstBlock
			.transition()
			.duration(300)
			.ease(d3.easeCubicIn)
			.attr('transform', `translate(${dLastX}, ${splitY})`);

		await sleep(500);
		if (!isPlaying) return;

		// Update labels to C₁ and D₁
		cLabel.transition().duration(200).text('C₁');
		dLabel.transition().duration(200).text('D₁');

		await sleep(600);
		if (!isPlaying) return;

		// ==================== STAGE 3: Combine ====================
		currentStep = 3;
		stepText.text(stepLabels[3]);

		rotLabel.transition().duration(200).attr('opacity', 0);
		cLabel.transition().duration(200).attr('opacity', 0);
		dLabel.transition().duration(200).attr('opacity', 0);

		await sleep(300);
		if (!isPlaying) return;

		// Reorder: C rotated is [1,2,3,4,5,6,0], D rotated is [8,9,10,11,12,13,7]
		const newOrder = [1, 2, 3, 4, 5, 6, 0, 8, 9, 10, 11, 12, 13, 7];

		// Move all blocks to combined row
		for (let i = 0; i < 14; i++) {
			const blockIdx = newOrder[i];
			const newX = combineStartX + i * (bitW + bitGap);
			bitBlocks[blockIdx]
				.transition()
				.duration(500)
				.ease(d3.easeCubicInOut)
				.attr('transform', `translate(${newX}, ${combineY})`);
		}

		await sleep(600);
		if (!isPlaying) return;

		// Combined label
		const combLabel = svgEl.append('text')
			.attr('x', centerX)
			.attr('y', combineY - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('56 bits (C₁ + D₁)')
			.attr('opacity', 0);

		combLabel.transition().duration(300).attr('opacity', 1);

		await sleep(800);
		if (!isPlaying) return;

		// ==================== STAGE 4: Compress ====================
		currentStep = 4;
		stepText.text(stepLabels[4]);

		// Add X marks on removed blocks
		const xMarks: d3.Selection<SVGTextElement, unknown, null, undefined>[] = [];
		for (const pos of removeIndices) {
			const blockIdx = newOrder[pos];
			const x = combineStartX + pos * (bitW + bitGap);

			const xMark = svgEl.append('text')
				.attr('x', x + bitW / 2)
				.attr('y', combineY + bitH / 2 + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.error)
				.attr('font-size', '18px')
				.attr('font-weight', 'bold')
				.text('✕')
				.attr('opacity', 0);

			xMark.transition().duration(300).attr('opacity', 1);
			xMarks.push(xMark);
		}

		await sleep(600);
		if (!isPlaying) return;

		// Fade out removed blocks
		const removeBlocks = [newOrder[3], newOrder[10]];
		for (const blockIdx of removeBlocks) {
			bitBlocks[blockIdx]
				.transition()
				.duration(400)
				.style('opacity', 0.2);
		}

		combLabel.transition().duration(300).text('48 bits selected');

		await sleep(800);
		if (!isPlaying) return;

		// ==================== STAGE 5: Output subkey ====================
		currentStep = 5;
		stepText.text(stepLabels[5]);

		combLabel.transition().duration(300).attr('opacity', 0);
		xMarks.forEach(xm => xm.transition().duration(300).attr('opacity', 0));

		// Move remaining blocks down and compress
		let outputIdx = 0;
		for (const pos of remainingPositions) {
			const blockIdx = newOrder[pos];
			const newX = outputStartX + outputIdx * (outputBlockW + outputBlockGap);

			bitBlocks[blockIdx]
				.transition()
				.duration(600)
				.ease(d3.easeCubicInOut)
				.attr('transform', `translate(${newX}, ${outputY})`);

			// Shrink blocks and change color
			bitBlocks[blockIdx].select('rect')
				.transition()
				.duration(600)
				.attr('width', outputBlockW)
				.attr('height', outputBlockW)
				.attr('fill', colors.error)
				.attr('fill-opacity', 0.3)
				.attr('stroke', colors.error);

			bitBlocks[blockIdx].select('text')
				.transition()
				.duration(600)
				.attr('x', outputBlockW / 2)
				.attr('y', outputBlockW / 2 + 4)
				.attr('font-size', '9px');

			outputIdx++;
		}

		// Fade out removed blocks completely
		for (const blockIdx of removeBlocks) {
			bitBlocks[blockIdx]
				.transition()
				.duration(400)
				.style('opacity', 0);
		}

		await sleep(700);
		if (!isPlaying) return;

		// Output label
		const outputLabel = svgEl.append('text')
			.attr('x', centerX)
			.attr('y', outputY - 15)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.error)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('48-bit Subkey K₁')
			.attr('opacity', 0);

		outputLabel.transition().duration(400).attr('opacity', 1);

		await sleep(600);
		if (!isPlaying) return;

		// Repeat indicator
		const repeatLabel = svgEl.append('text')
			.attr('x', centerX)
			.attr('y', outputY + outputBlockW + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fgMuted)
			.attr('font-size', '11px')
			.text('↻ Repeat for K₂, K₃, ... K₁₆')
			.attr('opacity', 0);

		repeatLabel.transition().duration(400).attr('opacity', 1);

		await sleep(500);
		isPlaying = false;
	}

	// Static drawing for step controls (next/prev)
	function drawStepStatic(step: number) {
		if (!svg) return;
		updateColors();

		const svgEl = setupSvg();
		if (!svgEl) return;

		stepText.text(stepLabels[step]);

		if (step === 0) {
			// Show 56-bit key
			for (let i = 0; i < 14; i++) {
				const x = keyStartX + i * (bitW + bitGap);
				const isC = i < 7;
				const color = isC ? colors.accent : colors.orange;
				const label = isC ? (i + 1).toString() : (i - 6).toString();
				createBitBlock(svgEl, x, keyY, label, color);
			}
			svgEl.append('text')
				.attr('x', centerX).attr('y', keyY - 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '12px').attr('font-weight', 'bold')
				.text('56-bit Key');
			svgEl.append('text')
				.attr('x', keyStartX + 3.5 * (bitW + bitGap) - bitGap / 2)
				.attr('y', keyY + bitH + 18)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '10px')
				.text('← C (28 bits) →');
			svgEl.append('text')
				.attr('x', keyStartX + 10.5 * (bitW + bitGap) - bitGap / 2)
				.attr('y', keyY + bitH + 18)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange).attr('font-size', '10px')
				.text('← D (28 bits) →');
		} else if (step === 1) {
			// Split C and D
			for (let i = 0; i < 7; i++) {
				const x = cGroupX + i * (bitW + bitGap);
				createBitBlock(svgEl, x, splitY, (i + 1).toString(), colors.accent);
			}
			for (let i = 0; i < 7; i++) {
				const x = dGroupX + i * (bitW + bitGap);
				createBitBlock(svgEl, x, splitY, (i + 1).toString(), colors.orange);
			}
			svgEl.append('text')
				.attr('x', cGroupX + 3.5 * (bitW + bitGap) - bitGap / 2)
				.attr('y', splitY - 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '12px').attr('font-weight', 'bold')
				.text('C₀');
			svgEl.append('text')
				.attr('x', dGroupX + 3.5 * (bitW + bitGap) - bitGap / 2)
				.attr('y', splitY - 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange).attr('font-size', '12px').attr('font-weight', 'bold')
				.text('D₀');
		} else if (step === 2) {
			// After rotation
			const cLabels = ['2', '3', '4', '5', '6', '7', '1'];
			const dLabels = ['2', '3', '4', '5', '6', '7', '1'];
			for (let i = 0; i < 7; i++) {
				const x = cGroupX + i * (bitW + bitGap);
				createBitBlock(svgEl, x, splitY, cLabels[i], colors.accent);
			}
			for (let i = 0; i < 7; i++) {
				const x = dGroupX + i * (bitW + bitGap);
				createBitBlock(svgEl, x, splitY, dLabels[i], colors.orange);
			}
			svgEl.append('text')
				.attr('x', cGroupX + 3.5 * (bitW + bitGap) - bitGap / 2)
				.attr('y', splitY - 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '12px').attr('font-weight', 'bold')
				.text('C₁');
			svgEl.append('text')
				.attr('x', dGroupX + 3.5 * (bitW + bitGap) - bitGap / 2)
				.attr('y', splitY - 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange).attr('font-size', '12px').attr('font-weight', 'bold')
				.text('D₁');
			svgEl.append('text')
				.attr('x', centerX).attr('y', splitY + 50)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold')
				.text('↻ Rotated Left');
		} else if (step === 3) {
			// Combined
			const labels = ['2', '3', '4', '5', '6', '7', '1', '2', '3', '4', '5', '6', '7', '1'];
			for (let i = 0; i < 14; i++) {
				const x = combineStartX + i * (bitW + bitGap);
				const color = i < 7 ? colors.accent : colors.orange;
				createBitBlock(svgEl, x, combineY, labels[i], color);
			}
			svgEl.append('text')
				.attr('x', centerX).attr('y', combineY - 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '11px')
				.text('56 bits (C₁ + D₁)');
		} else if (step === 4) {
			// Compression with X marks
			const labels = ['2', '3', '4', '5', '6', '7', '1', '2', '3', '4', '5', '6', '7', '1'];
			for (let i = 0; i < 14; i++) {
				const x = combineStartX + i * (bitW + bitGap);
				const color = i < 7 ? colors.accent : colors.orange;
				const isRemoved = removeIndices.includes(i);
				const g = createBitBlock(svgEl, x, combineY, labels[i], color, isRemoved ? 0.3 : 1);
				if (isRemoved) {
					svgEl.append('text')
						.attr('x', x + bitW / 2).attr('y', combineY + bitH / 2 + 5)
						.attr('text-anchor', 'middle')
						.attr('fill', colors.error).attr('font-size', '18px').attr('font-weight', 'bold')
						.text('✕');
				}
			}
			svgEl.append('text')
				.attr('x', centerX).attr('y', combineY - 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '11px')
				.text('48 bits selected');
		} else if (step === 5) {
			// Output
			const labels = ['2', '3', '4', '6', '7', '1', '2', '3', '4', '6', '7', '1'];
			for (let i = 0; i < 12; i++) {
				const x = outputStartX + i * (outputBlockW + outputBlockGap);
				const g = svgEl.append('g').attr('transform', `translate(${x}, ${outputY})`);
				g.append('rect')
					.attr('width', outputBlockW).attr('height', outputBlockW)
					.attr('rx', 4)
					.attr('fill', colors.error).attr('fill-opacity', 0.3)
					.attr('stroke', colors.error).attr('stroke-width', 2);
				g.append('text')
					.attr('x', outputBlockW / 2).attr('y', outputBlockW / 2 + 4)
					.attr('text-anchor', 'middle')
					.attr('fill', colors.fg).attr('font-size', '9px')
					.attr('font-family', 'monospace').attr('font-weight', 'bold')
					.text(labels[i]);
			}
			svgEl.append('text')
				.attr('x', centerX).attr('y', outputY - 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.error).attr('font-size', '13px').attr('font-weight', 'bold')
				.text('48-bit Subkey K₁');
			svgEl.append('text')
				.attr('x', centerX).attr('y', outputY + outputBlockW + 35)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fgMuted).attr('font-size', '11px')
				.text('↻ Repeat for K₂, K₃, ... K₁₆');
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
		max-width: 500px;
		height: auto;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
</style>
