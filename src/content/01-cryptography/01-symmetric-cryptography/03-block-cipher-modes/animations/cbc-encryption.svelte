<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let timeouts: ReturnType<typeof setTimeout>[] = [];

	const width = 700;
	const height = 340;

	let colors: Record<string, string>;

	// Block data - note blocks 0 and 2 are identical (same as ECB example)
	const plaintextBlocks = ['HELLO...', 'WORLD...', 'HELLO...', 'DATA....'];
	// In CBC, identical plaintext blocks produce DIFFERENT ciphertext
	const ciphertextBlocks = ['A3F29B..', '7B1CE4..', '9E4D8F..', '2F8A71..'];

	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;

	let plaintextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let xorCircles: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let aesBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let ciphertextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let ivBox: d3.Selection<SVGGElement, unknown, null, undefined>;
	let keyBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let arrowsP2X: d3.Selection<SVGPathElement, unknown, null, undefined>[]; // plaintext to XOR
	let arrowsX2A: d3.Selection<SVGPathElement, unknown, null, undefined>[]; // XOR to AES
	let arrowsA2C: d3.Selection<SVGPathElement, unknown, null, undefined>[]; // AES to ciphertext
	let arrowIV: d3.Selection<SVGPathElement, unknown, null, undefined>; // IV to first XOR
	let chainArrows: d3.Selection<SVGPathElement, unknown, null, undefined>[]; // ciphertext to next XOR

	const blockW = 80;
	const blockH = 40;
	const aesW = 55;
	const aesH = 32;
	const xorR = 14;

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
		xorCircles?.forEach((x) => x.attr('opacity', 0));
		aesBoxes?.forEach((b) => b.attr('opacity', 0));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 0));
		ivBox?.attr('opacity', 0);
		keyBoxes?.forEach((k) => k.attr('opacity', 0));
		arrowsP2X?.forEach((a) => a.attr('opacity', 0));
		arrowsX2A?.forEach((a) => a.attr('opacity', 0));
		arrowsA2C?.forEach((a) => a.attr('opacity', 0));
		arrowIV?.attr('opacity', 0);
		chainArrows?.forEach((a) => a.attr('opacity', 0));
		stepText?.text('');
		currentStep = 0;
	}

	function showFinalState() {
		plaintextBoxes?.forEach((b) => b.attr('opacity', 1));
		xorCircles?.forEach((x) => x.attr('opacity', 1));
		aesBoxes?.forEach((b) => b.attr('opacity', 1));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 1));
		ivBox?.attr('opacity', 1);
		keyBoxes?.forEach((k) => k.attr('opacity', 1));
		arrowsP2X?.forEach((a) => a.attr('opacity', 1));
		arrowsX2A?.forEach((a) => a.attr('opacity', 1));
		arrowsA2C?.forEach((a) => a.attr('opacity', 1));
		arrowIV?.attr('opacity', 1);
		chainArrows?.forEach((a) => a.attr('opacity', 1));
		stepText?.text('Identical plaintext blocks → Different ciphertext! Pattern hidden.');
		currentStep = maxStep;
	}

	async function runAnimation() {
		if (!isPlaying) return;
		resetAnimation();
		await sleep(400);

		// Step 1: Show plaintext blocks
		currentStep = 1;
		stepText?.text('Same plaintext as ECB (blocks 1 and 3 are identical)');
		for (let i = 0; i < 4; i++) {
			plaintextBoxes[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(200);
			if (!isPlaying) return;
		}
		await sleep(600);

		// Step 2: Show IV
		currentStep = 2;
		stepText?.text('Random IV starts the chain');
		ivBox?.transition().duration(300).attr('opacity', 1);
		await sleep(500);
		if (!isPlaying) return;

		// Step 3: Show XOR circles and structure
		currentStep = 3;
		stepText?.text('XOR circles mix plaintext with previous ciphertext');
		for (let i = 0; i < 4; i++) {
			xorCircles[i]?.transition().duration(200).attr('opacity', 1);
			arrowsP2X[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(150);
		}
		await sleep(400);
		if (!isPlaying) return;

		// Step 4: Show AES boxes and keys
		currentStep = 4;
		stepText?.text('Each XOR result is encrypted with AES');
		for (let i = 0; i < 4; i++) {
			aesBoxes[i]?.transition().duration(200).attr('opacity', 1);
			keyBoxes[i]?.transition().duration(200).attr('opacity', 1);
			arrowsX2A[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(150);
		}
		await sleep(400);
		if (!isPlaying) return;

		// Step 5: Encrypt block by block, showing the chain
		currentStep = 5;

		for (let i = 0; i < 4; i++) {
			if (i === 0) {
				stepText?.text('Block 1: XOR with IV, then encrypt');
				arrowIV?.transition().duration(200).attr('opacity', 1);
			} else {
				stepText?.text(`Block ${i + 1}: XOR with previous ciphertext, then encrypt`);
				chainArrows[i - 1]?.transition().duration(300).attr('opacity', 1);
			}
			await sleep(400);

			// Highlight current XOR and AES
			xorCircles[i]?.select('circle').transition().duration(100).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
			aesBoxes[i]?.select('rect').transition().duration(100).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
			await sleep(300);

			// Show output
			arrowsA2C[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(150);
			ciphertextBoxes[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(300);

			// Reset highlight
			xorCircles[i]?.select('circle').transition().duration(100).attr('stroke', colors.blue).attr('stroke-width', 2);
			aesBoxes[i]?.select('rect').transition().duration(100).attr('stroke', colors.purple).attr('stroke-width', 1.5);

			if (!isPlaying) return;
			await sleep(300);
		}

		// Step 6: Final message
		currentStep = 6;
		stepText?.text('Identical plaintext blocks → Different ciphertext! Pattern hidden.');

		// Highlight the two identical plaintext blocks and their different ciphertexts
		plaintextBoxes[0]?.select('rect').transition().duration(200).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
		plaintextBoxes[2]?.select('rect').transition().duration(200).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
		ciphertextBoxes[0]?.select('rect').transition().duration(200).attr('stroke', colors.green).attr('stroke-width', 2.5);
		ciphertextBoxes[2]?.select('rect').transition().duration(200).attr('stroke', colors.green).attr('stroke-width', 2.5);

		await sleep(2000);
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
		const s = getComputedStyle(document.documentElement);
		colors = {
			bg: s.getPropertyValue('--color-bg').trim(),
			dark: s.getPropertyValue('--color-bg-card').trim(),
			fg: s.getPropertyValue('--color-fg').trim(),
			border: s.getPropertyValue('--color-border').trim(),
			yellow: s.getPropertyValue('--color-math').trim(),
			aqua: s.getPropertyValue('--color-accent').trim(),
			green: s.getPropertyValue('--color-accent').trim(),
			red: s.getPropertyValue('--color-error').trim(),
			purple: '#d3869b',
			orange: '#fe8019',
			blue: '#83a598'
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		const defs = svgEl.append('defs');

		// Arrow markers
		const markerColors = [
			{ id: 'cbc-arr-gray', color: colors.border },
			{ id: 'cbc-arr-orange', color: colors.orange },
			{ id: 'cbc-arr-blue', color: colors.blue }
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
			.attr('y', 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('CBC Mode — Cipher Block Chaining');

		// Layout calculations
		const startX = 95;
		const blockSpacing = (width - startX - 30 - blockW) / 3;
		const row1Y = 45; // Plaintext
		const row2Y = 125; // XOR circles (centered between plaintext bottom and AES top)
		const row3Y = 175; // AES boxes
		const row4Y = 255; // Ciphertext

		plaintextBoxes = [];
		xorCircles = [];
		aesBoxes = [];
		ciphertextBoxes = [];
		keyBoxes = [];
		arrowsP2X = [];
		arrowsX2A = [];
		arrowsA2C = [];
		chainArrows = [];

		const blockCenters: number[] = [];
		for (let i = 0; i < 4; i++) {
			blockCenters.push(startX + i * blockSpacing + blockW / 2);
		}

		// IV box on the left
		const ivX = 15;
		const ivY = row2Y - 15;
		ivBox = svgEl.append('g').attr('opacity', 0);
		ivBox.append('rect')
			.attr('x', ivX)
			.attr('y', ivY)
			.attr('width', 40)
			.attr('height', 30)
			.attr('fill', colors.dark)
			.attr('stroke', colors.blue)
			.attr('stroke-width', 2)
			.attr('rx', 4);
		ivBox.append('text')
			.attr('x', ivX + 20)
			.attr('y', ivY + 19)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.blue)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('IV');

		// Arrow from IV to first XOR
		const firstXorX = blockCenters[0];
		arrowIV = svgEl.append('path')
			.attr('d', `M ${ivX + 42} ${row2Y} L ${firstXorX - xorR - 3} ${row2Y}`)
			.attr('fill', 'none')
			.attr('stroke', colors.blue)
			.attr('stroke-width', 1.5)
			.attr('marker-end', 'url(#cbc-arr-blue)')
			.attr('opacity', 0);

		for (let i = 0; i < 4; i++) {
			const x = startX + i * blockSpacing;
			const centerX = blockCenters[i];

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
				.attr('font-size', '9px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(plaintextBlocks[i]);
			pBox.append('text')
				.attr('x', centerX)
				.attr('y', row1Y - 6)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg)
				.attr('font-size', '9px')
				.text(`Block ${i + 1}`);
			plaintextBoxes.push(pBox);

			// XOR circle
			const xorG = svgEl.append('g').attr('opacity', 0);
			xorG.append('circle')
				.attr('cx', centerX)
				.attr('cy', row2Y)
				.attr('r', xorR)
				.attr('fill', colors.dark)
				.attr('stroke', colors.blue)
				.attr('stroke-width', 2);
			xorG.append('text')
				.attr('x', centerX)
				.attr('y', row2Y + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.blue)
				.attr('font-size', '14px')
				.attr('font-weight', 'bold')
				.text('⊕');
			xorCircles.push(xorG);

			// Arrow from plaintext to XOR
			const arrP2X = svgEl.append('path')
				.attr('d', `M ${centerX} ${row1Y + blockH + 2} L ${centerX} ${row2Y - xorR - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#cbc-arr-gray)')
				.attr('opacity', 0);
			arrowsP2X.push(arrP2X);

			// AES box
			const aesLeftX = centerX - aesW / 2;
			const aBox = svgEl.append('g').attr('opacity', 0);
			aBox.append('rect')
				.attr('x', aesLeftX)
				.attr('y', row3Y)
				.attr('width', aesW)
				.attr('height', aesH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.purple)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			aBox.append('text')
				.attr('x', centerX)
				.attr('y', row3Y + aesH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.purple)
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text('AES');
			aesBoxes.push(aBox);

			// Arrow from XOR to AES
			const arrX2A = svgEl.append('path')
				.attr('d', `M ${centerX} ${row2Y + xorR + 2} L ${centerX} ${row3Y - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#cbc-arr-gray)')
				.attr('opacity', 0);
			arrowsX2A.push(arrX2A);

			// Key box
			const keyGroup = svgEl.append('g').attr('opacity', 0);
			const keyBoxX = aesLeftX - 32;
			const keyBoxY = row3Y + aesH / 2 - 9;
			keyGroup.append('rect')
				.attr('x', keyBoxX)
				.attr('y', keyBoxY)
				.attr('width', 20)
				.attr('height', 18)
				.attr('fill', colors.dark)
				.attr('stroke', colors.orange)
				.attr('stroke-width', 1.5)
				.attr('rx', 3);
			keyGroup.append('text')
				.attr('x', keyBoxX + 10)
				.attr('y', keyBoxY + 13)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange)
				.attr('font-size', '9px')
				.attr('font-weight', 'bold')
				.text('K');
			keyGroup.append('path')
				.attr('d', `M ${keyBoxX + 22} ${row3Y + aesH / 2} L ${aesLeftX - 2} ${row3Y + aesH / 2}`)
				.attr('fill', 'none')
				.attr('stroke', colors.orange)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#cbc-arr-orange)');
			keyBoxes.push(keyGroup);

			// Ciphertext box
			const cBox = svgEl.append('g').attr('opacity', 0);
			cBox.append('rect')
				.attr('x', x)
				.attr('y', row4Y)
				.attr('width', blockW)
				.attr('height', blockH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.green)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			cBox.append('text')
				.attr('x', centerX)
				.attr('y', row4Y + blockH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.green)
				.attr('font-size', '9px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(ciphertextBlocks[i]);
			ciphertextBoxes.push(cBox);

			// Arrow from AES to ciphertext
			const arrA2C = svgEl.append('path')
				.attr('d', `M ${centerX} ${row3Y + aesH + 2} L ${centerX} ${row4Y - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#cbc-arr-gray)')
				.attr('opacity', 0);
			arrowsA2C.push(arrA2C);

			// Chain arrow from AES output to next XOR (except last block)
			// Path goes through the gap BETWEEN columns to avoid overlapping boxes
			if (i < 3) {
				const nextXorX = blockCenters[i + 1];
				// Gap midpoint between current column right edge and next column left edge
				const gapX = (centerX + blockW / 2 + nextXorX - blockW / 2) / 2;
				// Branch point on the AES-to-ciphertext line
				const branchY = row3Y + aesH + 18;

				const chainArr = svgEl.append('path')
					.attr('d', `M ${centerX} ${branchY}
						L ${gapX} ${branchY}
						L ${gapX} ${row2Y}
						L ${nextXorX - xorR - 3} ${row2Y}`)
					.attr('fill', 'none')
					.attr('stroke', colors.blue)
					.attr('stroke-width', 1.5)
					.attr('marker-end', 'url(#cbc-arr-blue)')
					.attr('opacity', 0);
				chainArrows.push(chainArr);
			}
		}

		// Step text
		stepText = svgEl.append('text')
			.attr('x', width / 2)
			.attr('y', height - 10)
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
		max-width: 720px;
		height: auto;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
</style>
