<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let timeouts: ReturnType<typeof setTimeout>[] = [];

	const width = 650;
	const height = 320;

	const colors = {
		bg: '#1d2021',
		fg: '#fbf1c7',
		yellow: '#fabd2f',
		aqua: '#8ec07c',
		orange: '#fe8019',
		purple: '#d3869b',
		green: '#8ec07c',
		red: '#fb4934',
		dark: '#282828',
		border: '#504945'
	};

	// Block data - note blocks 0 and 2 are identical
	const plaintextBlocks = ['HELLO...', 'WORLD...', 'HELLO...', 'DATA....'];
	const ciphertextBlocks = ['7F3A9C..', 'E2B1D4..', '7F3A9C..', '9D5E82..'];

	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;

	let plaintextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let aesBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let ciphertextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let arrows1: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let arrows2: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let keyBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let highlightBox1: d3.Selection<SVGRectElement, unknown, null, undefined>;
	let highlightBox2: d3.Selection<SVGRectElement, unknown, null, undefined>;

	const blockW = 85;
	const blockH = 45;
	const aesW = 65;
	const aesH = 35;

	const totalSteps = 8;
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

	function resetAnimation() {
		plaintextBoxes?.forEach((b) => b.attr('opacity', 0));
		aesBoxes?.forEach((b) => b.attr('opacity', 0));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 0));
		arrows1?.forEach((a) => a.attr('opacity', 0));
		arrows2?.forEach((a) => a.attr('opacity', 0));
		keyBoxes?.forEach((k) => k.attr('opacity', 0));
		highlightBox1?.attr('opacity', 0);
		highlightBox2?.attr('opacity', 0);
		stepText?.text('');
		currentStep = 0;
	}

	function showFinalState() {
		plaintextBoxes?.forEach((b) => b.attr('opacity', 1));
		aesBoxes?.forEach((b) => b.attr('opacity', 1));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 1));
		arrows1?.forEach((a) => a.attr('opacity', 1));
		arrows2?.forEach((a) => a.attr('opacity', 1));
		keyBoxes?.forEach((k) => k.attr('opacity', 1));
		highlightBox1?.attr('opacity', 1);
		highlightBox2?.attr('opacity', 1);
		stepText?.text('Identical plaintext blocks → Identical ciphertext blocks!');
		currentStep = maxStep;
	}

	async function runAnimation() {
		if (!isPlaying) return;
		resetAnimation();
		await sleep(400);

		// Step 1: Show plaintext blocks
		currentStep = 1;
		stepText?.text('Plaintext split into 4 blocks (notice blocks 1 and 3 are identical)');
		for (let i = 0; i < 4; i++) {
			plaintextBoxes[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(250);
			if (!isPlaying) return;
		}
		await sleep(800);

		// Step 2: Show AES boxes with their independent key inputs
		currentStep = 2;
		stepText?.text('Same key K used independently for each block');
		for (let i = 0; i < 4; i++) {
			aesBoxes[i]?.transition().duration(200).attr('opacity', 1);
			keyBoxes[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(200);
			if (!isPlaying) return;
		}
		await sleep(500);
		if (!isPlaying) return;

		// Step 4: Show input arrows
		currentStep = 4;
		stepText?.text('Plaintext blocks enter AES...');
		for (let i = 0; i < 4; i++) {
			arrows1[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(100);
		}
		await sleep(400);
		if (!isPlaying) return;

		// Step 5-6: Encrypt each block with visual feedback
		currentStep = 5;
		for (let i = 0; i < 4; i++) {
			stepText?.text(`Encrypting block ${i + 1}: ${plaintextBlocks[i]} → ${ciphertextBlocks[i]}`);

			// Highlight current block
			plaintextBoxes[i]?.select('rect').transition().duration(100).attr('stroke-width', 3).attr('stroke', colors.yellow);
			aesBoxes[i]?.select('rect').transition().duration(100).attr('stroke-width', 3).attr('stroke', colors.yellow);
			await sleep(300);

			// Show output arrow and ciphertext
			arrows2[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(150);
			ciphertextBoxes[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(300);

			// Reset highlight
			plaintextBoxes[i]?.select('rect').transition().duration(100).attr('stroke-width', 1.5).attr('stroke', colors.aqua);
			aesBoxes[i]?.select('rect').transition().duration(100).attr('stroke-width', 1.5).attr('stroke', colors.purple);

			if (!isPlaying) return;
			await sleep(400);
		}

		// Step 7: Highlight identical blocks
		currentStep = 6;
		stepText?.text('Identical plaintext blocks → Identical ciphertext blocks!');

		// Highlight block 0 and 2 (identical)
		highlightBox1?.transition().duration(300).attr('opacity', 1);
		highlightBox2?.transition().duration(300).attr('opacity', 1);

		// Pulse the identical blocks
		plaintextBoxes[0]?.select('rect').transition().duration(200).attr('stroke', colors.red).attr('stroke-width', 3);
		plaintextBoxes[2]?.select('rect').transition().duration(200).attr('stroke', colors.red).attr('stroke-width', 3);
		ciphertextBoxes[0]?.select('rect').transition().duration(200).attr('stroke', colors.red).attr('stroke-width', 3);
		ciphertextBoxes[2]?.select('rect').transition().duration(200).attr('stroke', colors.red).attr('stroke-width', 3);

		await sleep(1500);
		currentStep = maxStep;
		isPlaying = false;
	}

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
		pause();
		showFinalState();
	}

	function prev() {
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
		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		const defs = svgEl.append('defs');

		// Arrow markers
		const markerColors = [
			{ id: 'ecb-arr-gray', color: colors.border },
			{ id: 'ecb-arr-orange', color: colors.orange }
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
		svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('ECB Mode — Electronic Codebook');

		// Layout calculations
		const startX = 45;
		const blockSpacing = (width - startX - 20 - blockW) / 3;
		const row1Y = 55;
		const row2Y = 145;
		const row3Y = 235;

		plaintextBoxes = [];
		aesBoxes = [];
		ciphertextBoxes = [];
		arrows1 = [];
		arrows2 = [];
		keyBoxes = [];

		// Calculate all block positions first
		const blockCenters: number[] = [];
		for (let i = 0; i < 4; i++) {
			blockCenters.push(startX + i * blockSpacing + blockW / 2);
		}

		for (let i = 0; i < 4; i++) {
			const x = startX + i * blockSpacing;
			const centerX = blockCenters[i];
			const aesLeftX = centerX - aesW / 2;

			// Plaintext box
			const pBox = svgEl.append('g').attr('opacity', 0);
			pBox.append('rect')
				.attr('x', x)
				.attr('y', row1Y)
				.attr('width', blockW)
				.attr('height', blockH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.aqua)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			pBox.append('text')
				.attr('x', centerX)
				.attr('y', row1Y + blockH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.aqua)
				.attr('font-size', '10px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(plaintextBlocks[i]);
			pBox.append('text')
				.attr('x', centerX)
				.attr('y', row1Y - 8)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '9px')
				.text(`Block ${i + 1}`);
			plaintextBoxes.push(pBox);

			// AES box
			const aBox = svgEl.append('g').attr('opacity', 0);
			aBox.append('rect')
				.attr('x', aesLeftX)
				.attr('y', row2Y)
				.attr('width', aesW)
				.attr('height', aesH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.purple)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			aBox.append('text')
				.attr('x', centerX)
				.attr('y', row2Y + aesH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.purple)
				.attr('font-size', '11px')
				.attr('font-weight', 'bold')
				.text('AES');
			aesBoxes.push(aBox);

			// Ciphertext box
			const cBox = svgEl.append('g').attr('opacity', 0);
			cBox.append('rect')
				.attr('x', x)
				.attr('y', row3Y)
				.attr('width', blockW)
				.attr('height', blockH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.green)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			cBox.append('text')
				.attr('x', centerX)
				.attr('y', row3Y + blockH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.green)
				.attr('font-size', '10px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(ciphertextBlocks[i]);
			ciphertextBoxes.push(cBox);

			// Arrow from plaintext to AES
			const arr1 = svgEl.append('path')
				.attr('d', `M ${centerX} ${row1Y + blockH + 3} L ${centerX} ${row2Y - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 2)
				.attr('marker-end', 'url(#ecb-arr-gray)')
				.attr('opacity', 0);
			arrows1.push(arr1);

			// Arrow from AES to ciphertext
			const arr2 = svgEl.append('path')
				.attr('d', `M ${centerX} ${row2Y + aesH + 3} L ${centerX} ${row3Y - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 2)
				.attr('marker-end', 'url(#ecb-arr-gray)')
				.attr('opacity', 0);
			arrows2.push(arr2);

			// Independent K box with arrow for this AES (no connection to other blocks)
			const keyGroup = svgEl.append('g').attr('opacity', 0);
			const keyBoxX = aesLeftX - 38;
			const keyBoxY = row2Y + aesH / 2 - 10;
			const keyBoxW = 24;
			const keyBoxH = 20;

			keyGroup.append('rect')
				.attr('x', keyBoxX)
				.attr('y', keyBoxY)
				.attr('width', keyBoxW)
				.attr('height', keyBoxH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.orange)
				.attr('stroke-width', 1.5)
				.attr('rx', 3);
			keyGroup.append('text')
				.attr('x', keyBoxX + keyBoxW / 2)
				.attr('y', keyBoxY + keyBoxH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange)
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text('K');
			keyGroup.append('path')
				.attr('d', `M ${keyBoxX + keyBoxW + 2} ${row2Y + aesH / 2} L ${aesLeftX - 3} ${row2Y + aesH / 2}`)
				.attr('fill', 'none')
				.attr('stroke', colors.orange)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ecb-arr-orange)');
			keyBoxes.push(keyGroup);
		}

		// Highlight boxes for identical blocks (blocks 0 and 2)
		const x0 = startX;
		const x2 = startX + 2 * blockSpacing;

		highlightBox1 = svgEl.append('rect')
			.attr('x', x0 - 5)
			.attr('y', row1Y - 5)
			.attr('width', blockW + 10)
			.attr('height', row3Y + blockH - row1Y + 10)
			.attr('fill', 'none')
			.attr('stroke', colors.red)
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,3')
			.attr('rx', 8)
			.attr('opacity', 0);

		highlightBox2 = svgEl.append('rect')
			.attr('x', x2 - 5)
			.attr('y', row1Y - 5)
			.attr('width', blockW + 10)
			.attr('height', row3Y + blockH - row1Y + 10)
			.attr('fill', 'none')
			.attr('stroke', colors.red)
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,3')
			.attr('rx', 8)
			.attr('opacity', 0);

		// Step text
		stepText = svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', height - 12)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px');

		register?.({ play, pause, next, prev, skip, replay, getState });
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
		width: 100%;
		max-width: 680px;
		height: auto;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
</style>
