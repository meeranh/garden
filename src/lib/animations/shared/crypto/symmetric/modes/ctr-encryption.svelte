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

	// Block data - blocks 0 and 2 are identical plaintext
	const plaintextBlocks = ['HELLO...', 'WORLD...', 'HELLO...', 'DATA....'];
	// In CTR, identical plaintext blocks produce DIFFERENT ciphertext (like CBC)
	const ciphertextBlocks = ['8A2F1C..', '3E7B94..', 'D4C6E8..', '5F1A3B..'];
	const counterLabels = ['Ctr: 0', 'Ctr: 1', 'Ctr: 2', 'Ctr: 3'];

	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;

	let counterBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let aesBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let xorCircles: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let plaintextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let ciphertextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let keyBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let arrowsC2A: d3.Selection<SVGPathElement, unknown, null, undefined>[]; // counter to AES
	let arrowsA2X: d3.Selection<SVGPathElement, unknown, null, undefined>[]; // AES to XOR
	let arrowsP2X: d3.Selection<SVGPathElement, unknown, null, undefined>[]; // plaintext to XOR
	let arrowsX2C: d3.Selection<SVGPathElement, unknown, null, undefined>[]; // XOR to ciphertext

	const counterW = 55;
	const counterH = 32;
	const aesW = 55;
	const aesH = 32;
	const xorR = 14;
	const ctW = 70;
	const ctH = 36;

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

	function resetAnimation() {
		counterBoxes?.forEach((b) => b.attr('opacity', 0));
		aesBoxes?.forEach((b) => b.attr('opacity', 0));
		xorCircles?.forEach((x) => x.attr('opacity', 0));
		plaintextBoxes?.forEach((b) => b.attr('opacity', 0));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 0));
		keyBoxes?.forEach((k) => k.attr('opacity', 0));
		arrowsC2A?.forEach((a) => a.attr('opacity', 0));
		arrowsA2X?.forEach((a) => a.attr('opacity', 0));
		arrowsP2X?.forEach((a) => a.attr('opacity', 0));
		arrowsX2C?.forEach((a) => a.attr('opacity', 0));
		stepText?.text('');
		currentStep = 0;
	}

	function showFinalState() {
		counterBoxes?.forEach((b) => b.attr('opacity', 1));
		aesBoxes?.forEach((b) => b.attr('opacity', 1));
		xorCircles?.forEach((x) => x.attr('opacity', 1));
		plaintextBoxes?.forEach((b) => b.attr('opacity', 1));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 1));
		keyBoxes?.forEach((k) => k.attr('opacity', 1));
		arrowsC2A?.forEach((a) => a.attr('opacity', 1));
		arrowsA2X?.forEach((a) => a.attr('opacity', 1));
		arrowsP2X?.forEach((a) => a.attr('opacity', 1));
		arrowsX2C?.forEach((a) => a.attr('opacity', 1));
		stepText?.text('No chaining! Each block encrypts independently in parallel.');
		currentStep = maxStep;
	}

	async function runAnimation() {
		if (!isPlaying) return;
		resetAnimation();
		await sleep(400);

		// Step 1: Show counters
		currentStep = 1;
		stepText?.text('Each block gets a unique counter value (0, 1, 2, 3...)');
		for (let i = 0; i < 4; i++) {
			counterBoxes[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(200);
			if (!isPlaying) return;
		}
		await sleep(500);

		// Step 2: Show AES boxes and keys
		currentStep = 2;
		stepText?.text('Encrypt each counter with AES to produce a keystream');
		for (let i = 0; i < 4; i++) {
			arrowsC2A[i]?.transition().duration(150).attr('opacity', 1);
			aesBoxes[i]?.transition().duration(200).attr('opacity', 1);
			keyBoxes[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(150);
		}
		await sleep(400);
		if (!isPlaying) return;

		// Step 3: Encrypt counters (visual feedback)
		currentStep = 3;
		for (let i = 0; i < 4; i++) {
			stepText?.text(`Counter ${i} → AES → Keystream block ${i}`);
			counterBoxes[i]?.select('rect').transition().duration(100).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
			aesBoxes[i]?.select('rect').transition().duration(100).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
			await sleep(300);
			arrowsA2X[i]?.transition().duration(150).attr('opacity', 1);
			xorCircles[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(200);
			counterBoxes[i]?.select('rect').transition().duration(100).attr('stroke', colors.blue).attr('stroke-width', 1.5);
			aesBoxes[i]?.select('rect').transition().duration(100).attr('stroke', colors.purple).attr('stroke-width', 1.5);
			if (!isPlaying) return;
		}
		await sleep(300);

		// Step 4: Show plaintext
		currentStep = 4;
		stepText?.text('Plaintext blocks (notice blocks 1 and 3 are identical)');
		for (let i = 0; i < 4; i++) {
			plaintextBoxes[i]?.transition().duration(200).attr('opacity', 1);
			arrowsP2X[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(150);
		}
		await sleep(500);
		if (!isPlaying) return;

		// Step 5: XOR and produce ciphertext
		currentStep = 5;
		stepText?.text('XOR keystream with plaintext to get ciphertext');
		for (let i = 0; i < 4; i++) {
			xorCircles[i]?.select('circle').transition().duration(100).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
			await sleep(200);
			arrowsX2C[i]?.transition().duration(150).attr('opacity', 1);
			ciphertextBoxes[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(150);
			xorCircles[i]?.select('circle').transition().duration(100).attr('stroke', colors.blue).attr('stroke-width', 2);
			if (!isPlaying) return;
		}
		await sleep(400);

		// Step 6: Highlight identical plaintexts with different ciphertexts
		currentStep = 6;
		stepText?.text('Identical plaintext → Different ciphertext! (different keystreams)');
		plaintextBoxes[0]?.select('rect').transition().duration(200).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
		plaintextBoxes[2]?.select('rect').transition().duration(200).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
		ciphertextBoxes[0]?.select('rect').transition().duration(200).attr('stroke', colors.green).attr('stroke-width', 2.5);
		ciphertextBoxes[2]?.select('rect').transition().duration(200).attr('stroke', colors.green).attr('stroke-width', 2.5);
		await sleep(1500);

		// Step 7: Final message
		stepText?.text('No chaining! Each block encrypts independently in parallel.');
		await sleep(1000);
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
			purple: '#d3869b',
			orange: '#fe8019',
			blue: '#83a598'
		};

		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		const defs = svgEl.append('defs');

		// Arrow markers
		const markerColors = [
			{ id: 'ctr-arr-gray', color: colors.border },
			{ id: 'ctr-arr-orange', color: colors.orange },
			{ id: 'ctr-arr-blue', color: colors.blue }
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
			.text('CTR Mode — Counter Mode');

		// Layout calculations - more spacing for visible arrows
		const startX = 115;
		const blockSpacing = (width - startX - 50) / 3;
		const row1Y = 50;  // Counters
		const row2Y = 120; // AES (more gap from counters)
		const row3Y = 195; // XOR (more gap from AES)
		const row4Y = 265; // Ciphertext

		counterBoxes = [];
		aesBoxes = [];
		xorCircles = [];
		plaintextBoxes = [];
		ciphertextBoxes = [];
		keyBoxes = [];
		arrowsC2A = [];
		arrowsA2X = [];
		arrowsP2X = [];
		arrowsX2C = [];

		const colCenters: number[] = [];
		for (let i = 0; i < 4; i++) {
			colCenters.push(startX + i * blockSpacing);
		}

		// Row labels on the left (positioned to not overlap boxes)
		svgEl.append('text')
			.attr('x', 15)
			.attr('y', row1Y + 20)
			.attr('fill', colors.blue)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('Counters');

		for (let i = 0; i < 4; i++) {
			const centerX = colCenters[i];

			// Counter box
			const ctrBox = svgEl.append('g').attr('opacity', 0);
			ctrBox.append('rect')
				.attr('x', centerX - counterW / 2)
				.attr('y', row1Y)
				.attr('width', counterW)
				.attr('height', counterH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.blue)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			ctrBox.append('text')
				.attr('x', centerX)
				.attr('y', row1Y + counterH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.blue)
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text(counterLabels[i]);
			counterBoxes.push(ctrBox);

			// Arrow from counter to AES
			const arrC2A = svgEl.append('path')
				.attr('d', `M ${centerX} ${row1Y + counterH + 2} L ${centerX} ${row2Y - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ctr-arr-gray)')
				.attr('opacity', 0);
			arrowsC2A.push(arrC2A);

			// AES box
			const aesLeftX = centerX - aesW / 2;
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
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text('AES');
			aesBoxes.push(aBox);

			// Key box - positioned with enough gap for visible arrow
			const keyGroup = svgEl.append('g').attr('opacity', 0);
			const keyBoxW = 22;
			const keyBoxH = 18;
			const keyBoxX = aesLeftX - keyBoxW - 25; // 25px gap for arrow
			const keyBoxY = row2Y + aesH / 2 - keyBoxH / 2;
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
				.attr('font-size', '9px')
				.attr('font-weight', 'bold')
				.text('K');
			keyGroup.append('path')
				.attr('d', `M ${keyBoxX + keyBoxW + 2} ${row2Y + aesH / 2} L ${aesLeftX - 3} ${row2Y + aesH / 2}`)
				.attr('fill', 'none')
				.attr('stroke', colors.orange)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ctr-arr-orange)');
			keyBoxes.push(keyGroup);

			// Arrow from AES to XOR
			const arrA2X = svgEl.append('path')
				.attr('d', `M ${centerX} ${row2Y + aesH + 2} L ${centerX} ${row3Y - xorR - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ctr-arr-gray)')
				.attr('opacity', 0);
			arrowsA2X.push(arrA2X);

			// XOR circle
			const xorG = svgEl.append('g').attr('opacity', 0);
			xorG.append('circle')
				.attr('cx', centerX)
				.attr('cy', row3Y)
				.attr('r', xorR)
				.attr('fill', colors.dark)
				.attr('stroke', colors.blue)
				.attr('stroke-width', 2);
			xorG.append('text')
				.attr('x', centerX)
				.attr('y', row3Y + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.blue)
				.attr('font-size', '14px')
				.attr('font-weight', 'bold')
				.text('⊕');
			xorCircles.push(xorG);

			// Plaintext box (to the left of XOR) - with gap for visible arrow
			const ptBoxW = 55;
			const ptBoxH = 26;
			const ptX = centerX - xorR - ptBoxW - 20; // 20px gap for arrow
			const ptY = row3Y - ptBoxH / 2;
			const pBox = svgEl.append('g').attr('opacity', 0);
			pBox.append('rect')
				.attr('x', ptX)
				.attr('y', ptY)
				.attr('width', ptBoxW)
				.attr('height', ptBoxH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.aqua)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			pBox.append('text')
				.attr('x', ptX + ptBoxW / 2)
				.attr('y', ptY + ptBoxH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.aqua)
				.attr('font-size', '8px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(plaintextBlocks[i]);
			plaintextBoxes.push(pBox);

			// Arrow from plaintext to XOR
			const arrP2X = svgEl.append('path')
				.attr('d', `M ${ptX + ptBoxW + 2} ${row3Y} L ${centerX - xorR - 3} ${row3Y}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ctr-arr-gray)')
				.attr('opacity', 0);
			arrowsP2X.push(arrP2X);

			// Arrow from XOR to ciphertext
			const arrX2C = svgEl.append('path')
				.attr('d', `M ${centerX} ${row3Y + xorR + 2} L ${centerX} ${row4Y - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ctr-arr-gray)')
				.attr('opacity', 0);
			arrowsX2C.push(arrX2C);

			// Ciphertext box
			const cBox = svgEl.append('g').attr('opacity', 0);
			cBox.append('rect')
				.attr('x', centerX - ctW / 2)
				.attr('y', row4Y)
				.attr('width', ctW)
				.attr('height', ctH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.green)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			cBox.append('text')
				.attr('x', centerX)
				.attr('y', row4Y + ctH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.green)
				.attr('font-size', '9px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(ciphertextBlocks[i]);
			ciphertextBoxes.push(cBox);
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
