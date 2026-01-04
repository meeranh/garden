<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let timeouts: ReturnType<typeof setTimeout>[] = [];

	const colors = {
		bg: 'var(--color-bg)',
		fg: 'var(--color-fg)',
		yellow: 'var(--color-math)',
		aqua: '#8ec07c',
		orange: '#fe8019',
		purple: '#d3869b',
		green: 'var(--color-accent)',
		blue: '#83a598',
		border: 'var(--color-border)',
		dark: 'var(--color-bg-card)',
		red: 'var(--color-error)'
	};

	// Layout
	const width = 700;
	const height = 680;

	// Byte array dimensions
	const byteW = 36;
	const byteH = 24;
	const byteGap = 2;
	const arrayWidth = 4 * byteW + 3 * byteGap;

	// Consistent left margin for all sections
	const leftMargin = 25;
	const inputX = 115;

	// Vertical positions
	const titleY = 22;
	const keyRowY = 58;
	const step1Y = 135;
	const step2Y = 230;
	const step3Y = 370;
	const step4Y = 500;
	const resultY = 620;

	// Sample data
	const w3Bytes = ['09', 'CF', '4F', '3C'];
	const rotatedBytes = ['CF', '4F', '3C', '09'];
	const subbedBytes = ['8A', '84', 'EB', '01'];
	const rconBytes = ['01', '00', '00', '00'];
	const afterRconBytes = ['8B', '84', 'EB', '01'];
	const w0Bytes = ['2B', '7E', '15', '16'];
	const w4Bytes = ['A0', 'FA', 'FE', '17'];

	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;

	// Element groups
	let keyWordsGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	let rotWordSection: d3.Selection<SVGGElement, unknown, null, undefined>;
	let subWordSection: d3.Selection<SVGGElement, unknown, null, undefined>;
	let xorRconSection: d3.Selection<SVGGElement, unknown, null, undefined>;
	let xorW0Section: d3.Selection<SVGGElement, unknown, null, undefined>;
	let outputSection: d3.Selection<SVGGElement, unknown, null, undefined>;

	// Animated elements
	let rotInputCells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let rotOutputCells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let rotArrow: d3.Selection<SVGPathElement, unknown, null, undefined>;
	let rotLabel: d3.Selection<SVGGElement, unknown, null, undefined>;

	let subInputCells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let subOutputCells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let sboxGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	let subArrow: d3.Selection<SVGPathElement, unknown, null, undefined>;

	let rconInputCells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let rconCells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let rconOutputCells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let rconXorSymbol: d3.Selection<SVGGElement, unknown, null, undefined>;
	let rconArrows: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let rconExplain: d3.Selection<SVGGElement, unknown, null, undefined>;

	let w0InputCells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let w0Cells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let w0OutputCells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let w0XorSymbol: d3.Selection<SVGGElement, unknown, null, undefined>;
	let w0Arrows: d3.Selection<SVGPathElement, unknown, null, undefined>[];

	let w4Cells: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let finalArrow: d3.Selection<SVGPathElement, unknown, null, undefined>;

	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			const t = setTimeout(resolve, ms);
			timeouts.push(t);
		});
	}

	function clearTimeouts() {
		timeouts.forEach((t) => clearTimeout(t));
		timeouts = [];
	}

	function createByteCell(
		parent: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number,
		value: string,
		color: string
	): d3.Selection<SVGGElement, unknown, null, undefined> {
		const g = parent.append('g').attr('opacity', 0);
		g.append('rect')
			.attr('x', x)
			.attr('y', y)
			.attr('width', byteW)
			.attr('height', byteH)
			.attr('fill', '#282828')
			.attr('stroke', color)
			.attr('stroke-width', 1.5)
			.attr('rx', 3);
		g.append('text')
			.attr('x', x + byteW / 2)
			.attr('y', y + byteH / 2 + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', color)
			.attr('font-size', '10px')
			.attr('font-family', 'monospace')
			.attr('font-weight', 'bold')
			.text(value);
		return g;
	}

	function createByteArray(
		parent: d3.Selection<SVGGElement, unknown, null, undefined>,
		startX: number,
		y: number,
		values: string[],
		color: string
	): d3.Selection<SVGGElement, unknown, null, undefined>[] {
		const cells: d3.Selection<SVGGElement, unknown, null, undefined>[] = [];
		for (let i = 0; i < values.length; i++) {
			const x = startX + i * (byteW + byteGap);
			cells.push(createByteCell(parent, x, y, values[i], color));
		}
		return cells;
	}

	function resetAnimation() {
		keyWordsGroup?.attr('opacity', 0);
		rotWordSection?.attr('opacity', 0);
		subWordSection?.attr('opacity', 0);
		xorRconSection?.attr('opacity', 0);
		xorW0Section?.attr('opacity', 0);
		outputSection?.attr('opacity', 0);

		rotInputCells?.forEach((c) => c.attr('opacity', 0));
		rotOutputCells?.forEach((c) => c.attr('opacity', 0));
		rotArrow?.attr('opacity', 0);
		rotLabel?.attr('opacity', 0);

		subInputCells?.forEach((c) => c.attr('opacity', 0));
		subOutputCells?.forEach((c) => c.attr('opacity', 0));
		sboxGroup?.attr('opacity', 0);
		subArrow?.attr('opacity', 0);

		rconInputCells?.forEach((c) => c.attr('opacity', 0));
		rconCells?.forEach((c) => c.attr('opacity', 0));
		rconOutputCells?.forEach((c) => c.attr('opacity', 0));
		rconXorSymbol?.attr('opacity', 0);
		rconArrows?.forEach((a) => a.attr('opacity', 0));
		rconExplain?.attr('opacity', 0);

		w0InputCells?.forEach((c) => c.attr('opacity', 0));
		w0Cells?.forEach((c) => c.attr('opacity', 0));
		w0OutputCells?.forEach((c) => c.attr('opacity', 0));
		w0XorSymbol?.attr('opacity', 0);
		w0Arrows?.forEach((a) => a.attr('opacity', 0));

		w4Cells?.forEach((c) => c.attr('opacity', 0));
		finalArrow?.attr('opacity', 0);

		stepText?.text('');
		currentStep = 0;
	}

	function showFinalState() {
		keyWordsGroup?.attr('opacity', 1);
		rotWordSection?.attr('opacity', 1);
		subWordSection?.attr('opacity', 1);
		xorRconSection?.attr('opacity', 1);
		xorW0Section?.attr('opacity', 1);
		outputSection?.attr('opacity', 1);

		rotInputCells?.forEach((c) => c.attr('opacity', 1));
		rotOutputCells?.forEach((c) => c.attr('opacity', 1));
		rotArrow?.attr('opacity', 1);
		rotLabel?.attr('opacity', 1);

		subInputCells?.forEach((c) => c.attr('opacity', 1));
		subOutputCells?.forEach((c) => c.attr('opacity', 1));
		sboxGroup?.attr('opacity', 1);
		subArrow?.attr('opacity', 1);

		rconInputCells?.forEach((c) => c.attr('opacity', 1));
		rconCells?.forEach((c) => c.attr('opacity', 1));
		rconOutputCells?.forEach((c) => c.attr('opacity', 1));
		rconXorSymbol?.attr('opacity', 1);
		rconArrows?.forEach((a) => a.attr('opacity', 1));
		rconExplain?.attr('opacity', 1);

		w0InputCells?.forEach((c) => c.attr('opacity', 1));
		w0Cells?.forEach((c) => c.attr('opacity', 1));
		w0OutputCells?.forEach((c) => c.attr('opacity', 1));
		w0XorSymbol?.attr('opacity', 1);
		w0Arrows?.forEach((a) => a.attr('opacity', 1));

		w4Cells?.forEach((c) => c.attr('opacity', 1));
		finalArrow?.attr('opacity', 1);

		stepText?.text('Process repeats: W₅ = W₁ ⊕ W₄, W₆ = W₂ ⊕ W₅, ... generating all 44 words');
		currentStep = maxStep;
	}

	async function runAnimation() {
		if (!isPlaying) return;
		resetAnimation();
		await sleep(300);

		// Step 1: Show original key
		currentStep = 1;
		stepText?.text('Original 128-bit key split into 4 words (W₀-W₃). We will generate W₄ from W₃.');
		keyWordsGroup?.transition().duration(400).attr('opacity', 1);
		await sleep(1600);
		if (!isPlaying) return;

		// Step 2: RotWord
		currentStep = 2;
		rotWordSection?.attr('opacity', 1);
		stepText?.text('Step 1: RotWord — Rotate bytes left by 1 position');

		for (let i = 0; i < 4; i++) {
			rotInputCells[i]?.transition().duration(120).attr('opacity', 1);
			await sleep(80);
		}
		await sleep(300);
		if (!isPlaying) return;

		rotLabel?.transition().duration(250).attr('opacity', 1);
		await sleep(300);
		rotArrow?.transition().duration(250).attr('opacity', 1);
		await sleep(250);

		stepText?.text('First byte (09) moves to the end → [CF, 4F, 3C, 09]');
		rotInputCells[0]?.select('rect').transition().duration(150).attr('stroke-width', 3).transition().duration(150).attr('stroke-width', 1.5);
		await sleep(400);

		for (let i = 0; i < 4; i++) {
			rotOutputCells[i]?.transition().duration(120).attr('opacity', 1);
			await sleep(100);
		}
		await sleep(600);
		if (!isPlaying) return;

		// Step 3: SubWord
		currentStep = 3;
		subWordSection?.attr('opacity', 1);
		stepText?.text('Step 2: SubWord — Each byte substituted via S-box lookup');

		for (let i = 0; i < 4; i++) {
			subInputCells[i]?.transition().duration(120).attr('opacity', 1);
			await sleep(80);
		}
		await sleep(200);

		sboxGroup?.transition().duration(250).attr('opacity', 1);
		await sleep(300);
		subArrow?.transition().duration(250).attr('opacity', 1);
		await sleep(200);
		if (!isPlaying) return;

		const sboxLookups = [
			{ in: 'CF', out: '8A' },
			{ in: '4F', out: '84' },
			{ in: '3C', out: 'EB' },
			{ in: '09', out: '01' }
		];

		for (let i = 0; i < 4; i++) {
			stepText?.text(`S-box: ${sboxLookups[i].in} → ${sboxLookups[i].out}`);
			subInputCells[i]?.select('rect').transition().duration(100).attr('stroke-width', 3).attr('stroke', '#fabd2f');
			await sleep(150);
			subOutputCells[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(200);
			subInputCells[i]?.select('rect').transition().duration(100).attr('stroke-width', 1.5).attr('stroke', colors.orange);
			if (!isPlaying) return;
		}
		await sleep(500);

		// Step 4: XOR with Rcon
		currentStep = 4;
		xorRconSection?.attr('opacity', 1);
		stepText?.text('Step 3: XOR with Rcon[1] — Round constant for diffusion');

		for (let i = 0; i < 4; i++) {
			rconInputCells[i]?.transition().duration(120).attr('opacity', 1);
			await sleep(60);
		}
		await sleep(200);

		rconExplain?.transition().duration(300).attr('opacity', 1);
		await sleep(300);

		for (let i = 0; i < 4; i++) {
			rconCells[i]?.transition().duration(120).attr('opacity', 1);
			await sleep(60);
		}
		await sleep(300);
		if (!isPlaying) return;

		rconXorSymbol?.transition().duration(250).attr('opacity', 1);
		await sleep(150);
		for (const a of rconArrows) {
			a?.transition().duration(120).attr('opacity', 1);
		}
		await sleep(300);

		const xorOps = [
			{ a: '8A', b: '01', r: '8B' },
			{ a: '84', b: '00', r: '84' },
			{ a: 'EB', b: '00', r: 'EB' },
			{ a: '01', b: '00', r: '01' }
		];

		for (let i = 0; i < 4; i++) {
			stepText?.text(`XOR: ${xorOps[i].a} ⊕ ${xorOps[i].b} = ${xorOps[i].r}`);
			rconInputCells[i]?.select('rect').transition().duration(80).attr('stroke-width', 3);
			rconCells[i]?.select('rect').transition().duration(80).attr('stroke-width', 3);
			await sleep(150);
			rconOutputCells[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(180);
			rconInputCells[i]?.select('rect').transition().duration(80).attr('stroke-width', 1.5);
			rconCells[i]?.select('rect').transition().duration(80).attr('stroke-width', 1.5);
			if (!isPlaying) return;
		}
		await sleep(500);

		// Step 5: XOR with W0
		currentStep = 5;
		xorW0Section?.attr('opacity', 1);
		stepText?.text('Step 4: XOR with W₀ — Combine with first original key word');

		for (let i = 0; i < 4; i++) {
			w0InputCells[i]?.transition().duration(120).attr('opacity', 1);
			await sleep(60);
		}
		await sleep(200);

		for (let i = 0; i < 4; i++) {
			w0Cells[i]?.transition().duration(120).attr('opacity', 1);
			await sleep(60);
		}
		await sleep(300);
		if (!isPlaying) return;

		w0XorSymbol?.transition().duration(250).attr('opacity', 1);
		await sleep(150);
		for (const a of w0Arrows) {
			a?.transition().duration(120).attr('opacity', 1);
		}
		await sleep(300);

		const w0XorOps = [
			{ a: '8B', b: '2B', r: 'A0' },
			{ a: '84', b: '7E', r: 'FA' },
			{ a: 'EB', b: '15', r: 'FE' },
			{ a: '01', b: '16', r: '17' }
		];

		for (let i = 0; i < 4; i++) {
			stepText?.text(`XOR: ${w0XorOps[i].a} ⊕ ${w0XorOps[i].b} = ${w0XorOps[i].r}`);
			w0InputCells[i]?.select('rect').transition().duration(80).attr('stroke-width', 3);
			w0Cells[i]?.select('rect').transition().duration(80).attr('stroke-width', 3);
			await sleep(150);
			w0OutputCells[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(180);
			w0InputCells[i]?.select('rect').transition().duration(80).attr('stroke-width', 1.5);
			w0Cells[i]?.select('rect').transition().duration(80).attr('stroke-width', 1.5);
			if (!isPlaying) return;
		}
		await sleep(500);

		// Step 6: Final W4
		currentStep = 6;
		outputSection?.attr('opacity', 1);
		stepText?.text('Result: W₄ = [A0, FA, FE, 17] — First word of Round Key 1!');

		finalArrow?.transition().duration(250).attr('opacity', 1);
		await sleep(250);

		for (let i = 0; i < 4; i++) {
			w4Cells[i]?.transition().duration(150).attr('opacity', 1).transition().duration(80).attr('transform', 'scale(1.1)').transition().duration(80).attr('transform', 'scale(1)');
			await sleep(120);
		}
		await sleep(1200);

		stepText?.text('Process repeats: W₅ = W₁ ⊕ W₄, W₆ = W₂ ⊕ W₅, ... generating all 44 words');
		currentStep = maxStep;
		await sleep(500);
		isPlaying = false;
	}

	// Controller functions
	function play() {
		if (isPlaying) return;
		isPlaying = true;
		runAnimation();
	}

	function pause() {
		isPlaying = false;
		clearTimeouts();
	}

	function next() {
		// This animation is continuous, next shows final state
		pause();
		showFinalState();
	}

	function prev() {
		// This animation is continuous, prev resets
		pause();
		resetAnimation();
	}

	function skip() {
		pause();
		showFinalState();
	}

	function replay() {
		pause();
		resetAnimation();
		isPlaying = true;
		runAnimation();
	}

	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

	onMount(() => {
		svgEl = d3.select(svg).attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

		const defs = svgEl.append('defs');

		// Arrow markers
		const markerColors = [
			{ id: 'arr-aqua', color: colors.aqua },
			{ id: 'arr-orange', color: colors.orange },
			{ id: 'arr-purple', color: colors.purple },
			{ id: 'arr-red', color: '#fb4934' },
			{ id: 'arr-green', color: '#8ec07c' },
			{ id: 'arr-yellow', color: '#fabd2f' }
		];

		markerColors.forEach(({ id, color }) => {
			defs.append('marker')
				.attr('id', id)
				.attr('markerWidth', 8)
				.attr('markerHeight', 6)
				.attr('refX', 7)
				.attr('refY', 3)
				.attr('orient', 'auto')
				.append('polygon')
				.attr('points', '0 0, 8 3, 0 6')
				.attr('fill', color);
		});

		// Title
		svgEl.append('text').attr('x', width / 2).attr('y', titleY).attr('text-anchor', 'middle').attr('fill', '#fabd2f').attr('font-size', '14px').attr('font-weight', 'bold').text('AES Key Schedule — Generating W₄ from W₃');

		// Step text
		stepText = svgEl.append('text').attr('x', width / 2).attr('y', height - 8).attr('text-anchor', 'middle').attr('fill', '#fbf1c7').attr('font-size', '10px');

		// ========== Original Key Words ==========
		keyWordsGroup = svgEl.append('g').attr('opacity', 0);

		const keyWordW = 60;
		const keyWordH = 28;
		const keyGap = 10;
		const keyTotalW = 4 * keyWordW + 3 * keyGap;
		const keyStartX = (width - keyTotalW) / 2;

		keyWordsGroup.append('text').attr('x', width / 2).attr('y', keyRowY - 6).attr('text-anchor', 'middle').attr('fill', '#fbf1c7').attr('font-size', '9px').text('Original 128-bit Key');

		const keyLabels = ['W₀', 'W₁', 'W₂', 'W₃'];
		const keyColors = ['#8ec07c', colors.aqua, colors.aqua, colors.orange];

		for (let i = 0; i < 4; i++) {
			const x = keyStartX + i * (keyWordW + keyGap);
			keyWordsGroup.append('rect').attr('x', x).attr('y', keyRowY).attr('width', keyWordW).attr('height', keyWordH).attr('fill', '#282828').attr('stroke', keyColors[i]).attr('stroke-width', i === 0 || i === 3 ? 2 : 1).attr('rx', 4);
			keyWordsGroup.append('text').attr('x', x + keyWordW / 2).attr('y', keyRowY + keyWordH / 2 + 4).attr('text-anchor', 'middle').attr('fill', keyColors[i]).attr('font-size', '12px').attr('font-weight', 'bold').text(keyLabels[i]);
		}

		keyWordsGroup.append('text').attr('x', keyStartX + keyWordW / 2).attr('y', keyRowY + keyWordH + 12).attr('text-anchor', 'middle').attr('fill', '#8ec07c').attr('font-size', '8px').text('(step 4)');
		keyWordsGroup.append('text').attr('x', keyStartX + 3 * (keyWordW + keyGap) + keyWordW / 2).attr('y', keyRowY + keyWordH + 12).attr('text-anchor', 'middle').attr('fill', colors.orange).attr('font-size', '8px').text('(input)');

		// ========== Step 1: RotWord ==========
		rotWordSection = svgEl.append('g').attr('opacity', 0);

		rotWordSection.append('text').attr('x', leftMargin).attr('y', step1Y - 8).attr('fill', colors.orange).attr('font-size', '11px').attr('font-weight', 'bold').text('1. RotWord');

		rotInputCells = createByteArray(rotWordSection, inputX, step1Y, w3Bytes, colors.orange);

		const rot1ArrowStart = inputX + arrayWidth + 15;
		const rot1ArrowEnd = rot1ArrowStart + 55;
		rotArrow = rotWordSection.append('path').attr('d', `M ${rot1ArrowStart} ${step1Y + byteH / 2} L ${rot1ArrowEnd} ${step1Y + byteH / 2}`).attr('fill', 'none').attr('stroke', colors.orange).attr('stroke-width', 2).attr('marker-end', 'url(#arr-orange)').attr('opacity', 0);

		rotLabel = rotWordSection.append('g').attr('opacity', 0);
		rotLabel.append('text').attr('x', rot1ArrowStart + 27).attr('y', step1Y - 2).attr('text-anchor', 'middle').attr('fill', '#fbf1c7').attr('font-size', '8px').text('rotate left');

		const rotOutX = rot1ArrowEnd + 12;
		rotOutputCells = createByteArray(rotWordSection, rotOutX, step1Y, rotatedBytes, colors.orange);

		rotWordSection.append('text').attr('x', rotOutX + arrayWidth + 12).attr('y', step1Y + byteH / 2 + 3).attr('fill', '#fbf1c7').attr('font-size', '8px').attr('opacity', 0.7).text('← 09 to end');

		// ========== Step 2: SubWord ==========
		subWordSection = svgEl.append('g').attr('opacity', 0);

		subWordSection.append('text').attr('x', leftMargin).attr('y', step2Y - 8).attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold').text('2. SubWord');

		subInputCells = createByteArray(subWordSection, inputX, step2Y, rotatedBytes, colors.orange);

		const sboxX = inputX + arrayWidth + 20;
		sboxGroup = subWordSection.append('g').attr('opacity', 0);

		sboxGroup.append('rect').attr('x', sboxX).attr('y', step2Y - 8).attr('width', 60).attr('height', 40).attr('fill', '#282828').attr('stroke', colors.purple).attr('stroke-width', 2).attr('rx', 5);
		sboxGroup.append('text').attr('x', sboxX + 30).attr('y', step2Y + 8).attr('text-anchor', 'middle').attr('fill', colors.purple).attr('font-size', '10px').attr('font-weight', 'bold').text('S-box');
		sboxGroup.append('text').attr('x', sboxX + 30).attr('y', step2Y + 22).attr('text-anchor', 'middle').attr('fill', '#fbf1c7').attr('font-size', '7px').text('16×16 table');

		const subArrowEnd = sboxX + 60 + 15;
		subArrow = subWordSection.append('path').attr('d', `M ${inputX + arrayWidth + 5} ${step2Y + byteH / 2} L ${sboxX - 5} ${step2Y + byteH / 2} M ${sboxX + 65} ${step2Y + byteH / 2} L ${subArrowEnd + 50} ${step2Y + byteH / 2}`).attr('fill', 'none').attr('stroke', colors.purple).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-purple)').attr('opacity', 0);

		const subOutX = subArrowEnd + 58;
		subOutputCells = createByteArray(subWordSection, subOutX, step2Y, subbedBytes, colors.purple);

		// ========== Step 3: XOR with Rcon ==========
		xorRconSection = svgEl.append('g').attr('opacity', 0);

		xorRconSection.append('text').attr('x', leftMargin).attr('y', step3Y - 30).attr('fill', '#fb4934').attr('font-size', '11px').attr('font-weight', 'bold').text('3. ⊕ Rcon');

		rconInputCells = createByteArray(xorRconSection, inputX, step3Y - 20, subbedBytes, colors.purple);
		rconCells = createByteArray(xorRconSection, inputX, step3Y + 20, rconBytes, '#fb4934');

		xorRconSection.append('text').attr('x', inputX + arrayWidth / 2).attr('y', step3Y + 55).attr('text-anchor', 'middle').attr('fill', '#fb4934').attr('font-size', '8px').text('Rcon[1]');

		const xorX = inputX + arrayWidth + 50;
		rconXorSymbol = xorRconSection.append('g').attr('opacity', 0);
		rconXorSymbol.append('circle').attr('cx', xorX).attr('cy', step3Y).attr('r', 14).attr('fill', '#282828').attr('stroke', '#fabd2f').attr('stroke-width', 2);
		rconXorSymbol.append('text').attr('x', xorX).attr('y', step3Y + 5).attr('text-anchor', 'middle').attr('fill', '#fabd2f').attr('font-size', '14px').attr('font-weight', 'bold').text('⊕');

		rconArrows = [];
		rconArrows.push(xorRconSection.append('path').attr('d', `M ${inputX + arrayWidth + 8} ${step3Y - 8} L ${xorX - 16} ${step3Y - 3}`).attr('fill', 'none').attr('stroke', colors.purple).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-purple)').attr('opacity', 0));
		rconArrows.push(xorRconSection.append('path').attr('d', `M ${inputX + arrayWidth + 8} ${step3Y + 32} L ${xorX - 16} ${step3Y + 3}`).attr('fill', 'none').attr('stroke', '#fb4934').attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-red)').attr('opacity', 0));
		rconArrows.push(xorRconSection.append('path').attr('d', `M ${xorX + 16} ${step3Y} L ${xorX + 45} ${step3Y}`).attr('fill', 'none').attr('stroke', colors.aqua).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-aqua)').attr('opacity', 0));

		const rconOutX = xorX + 55;
		rconOutputCells = createByteArray(xorRconSection, rconOutX, step3Y - byteH / 2, afterRconBytes, colors.aqua);

		rconExplain = xorRconSection.append('g').attr('opacity', 0);
		rconExplain.append('rect').attr('x', rconOutX + arrayWidth + 15).attr('y', step3Y - 30).attr('width', 130).attr('height', 60).attr('fill', '#282828').attr('stroke', '#fb4934').attr('stroke-width', 1).attr('rx', 4);
		rconExplain.append('text').attr('x', rconOutX + arrayWidth + 80).attr('y', step3Y - 14).attr('text-anchor', 'middle').attr('fill', '#fb4934').attr('font-size', '9px').attr('font-weight', 'bold').text('Rcon = Round Constant');
		rconExplain.append('text').attr('x', rconOutX + arrayWidth + 80).attr('y', step3Y + 2).attr('text-anchor', 'middle').attr('fill', '#fbf1c7').attr('font-size', '8px').text('Powers of 2 in GF(2⁸):');
		rconExplain.append('text').attr('x', rconOutX + arrayWidth + 80).attr('y', step3Y + 16).attr('text-anchor', 'middle').attr('fill', '#fbf1c7').attr('font-size', '7px').attr('opacity', 0.8).text('01,02,04,08,10,20,40,80,1B,36');

		// ========== Step 4: XOR with W0 ==========
		xorW0Section = svgEl.append('g').attr('opacity', 0);

		xorW0Section.append('text').attr('x', leftMargin).attr('y', step4Y - 30).attr('fill', '#8ec07c').attr('font-size', '11px').attr('font-weight', 'bold').text('4. ⊕ W₀');

		w0InputCells = createByteArray(xorW0Section, inputX, step4Y - 20, afterRconBytes, colors.aqua);
		w0Cells = createByteArray(xorW0Section, inputX, step4Y + 20, w0Bytes, '#8ec07c');

		xorW0Section.append('text').attr('x', inputX + arrayWidth / 2).attr('y', step4Y + 55).attr('text-anchor', 'middle').attr('fill', '#8ec07c').attr('font-size', '8px').text('W₀ (from key)');

		const xor2X = inputX + arrayWidth + 50;
		w0XorSymbol = xorW0Section.append('g').attr('opacity', 0);
		w0XorSymbol.append('circle').attr('cx', xor2X).attr('cy', step4Y).attr('r', 14).attr('fill', '#282828').attr('stroke', '#fabd2f').attr('stroke-width', 2);
		w0XorSymbol.append('text').attr('x', xor2X).attr('y', step4Y + 5).attr('text-anchor', 'middle').attr('fill', '#fabd2f').attr('font-size', '14px').attr('font-weight', 'bold').text('⊕');

		w0Arrows = [];
		w0Arrows.push(xorW0Section.append('path').attr('d', `M ${inputX + arrayWidth + 8} ${step4Y - 8} L ${xor2X - 16} ${step4Y - 3}`).attr('fill', 'none').attr('stroke', colors.aqua).attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-aqua)').attr('opacity', 0));
		w0Arrows.push(xorW0Section.append('path').attr('d', `M ${inputX + arrayWidth + 8} ${step4Y + 32} L ${xor2X - 16} ${step4Y + 3}`).attr('fill', 'none').attr('stroke', '#8ec07c').attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-green)').attr('opacity', 0));
		w0Arrows.push(xorW0Section.append('path').attr('d', `M ${xor2X + 16} ${step4Y} L ${xor2X + 45} ${step4Y}`).attr('fill', 'none').attr('stroke', '#8ec07c').attr('stroke-width', 1.5).attr('marker-end', 'url(#arr-green)').attr('opacity', 0));

		const w0OutX = xor2X + 55;
		w0OutputCells = createByteArray(xorW0Section, w0OutX, step4Y - byteH / 2, w4Bytes, '#8ec07c');

		// ========== Result ==========
		outputSection = svgEl.append('g').attr('opacity', 0);

		outputSection.append('text').attr('x', leftMargin).attr('y', resultY - 8).attr('fill', '#8ec07c').attr('font-size', '11px').attr('font-weight', 'bold').text('Result:');

		finalArrow = outputSection.append('path').attr('d', `M ${w0OutX + arrayWidth / 2} ${step4Y + byteH / 2 + 5} L ${w0OutX + arrayWidth / 2} ${resultY - 30} L ${inputX + arrayWidth / 2} ${resultY - 30} L ${inputX + arrayWidth / 2} ${resultY - 8}`).attr('fill', 'none').attr('stroke', '#8ec07c').attr('stroke-width', 2).attr('marker-end', 'url(#arr-green)').attr('opacity', 0);

		w4Cells = createByteArray(outputSection, inputX, resultY, w4Bytes, '#8ec07c');

		outputSection.append('text').attr('x', inputX + arrayWidth + 15).attr('y', resultY + byteH / 2 + 3).attr('fill', '#8ec07c').attr('font-size', '11px').attr('font-weight', 'bold').text('= W₄ (First word of Round Key 1)');

		outputSection.append('text').attr('x', inputX + arrayWidth + 15).attr('y', resultY + byteH / 2 + 16).attr('fill', '#fbf1c7').attr('font-size', '8px').attr('opacity', 0.8).text('Next: W₅ = W₁ ⊕ W₄, W₆ = W₂ ⊕ W₅, W₇ = W₃ ⊕ W₆ (simpler)');

		// Register controller
		register?.({ play, pause, next, prev, skip, replay, getState });

		// Auto-play on mount
		play();
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
		display: block;
		width: 100%;
		max-width: 720px;
		height: auto;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
</style>
