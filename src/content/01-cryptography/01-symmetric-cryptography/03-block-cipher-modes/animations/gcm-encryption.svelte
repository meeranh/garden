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
	const height = 380;

	const colors = {
		bg: '#1d2021',
		fg: '#fbf1c7',
		yellow: '#fabd2f',
		aqua: '#8ec07c',
		orange: '#fe8019',
		purple: '#d3869b',
		green: '#8ec07c',
		blue: '#83a598',
		red: '#fb4934',
		dark: '#282828',
		border: '#504945'
	};

	const plaintextBlocks = ['HELLO...', 'WORLD...', 'DATA....'];
	const ciphertextBlocks = ['8A2F1C..', '3E7B94..', '5F1A3B..'];

	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;

	// CTR encryption elements
	let counterBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let aesBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let xorCircles: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let plaintextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let ciphertextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let arrowsC2A: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let arrowsA2X: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let arrowsP2X: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let arrowsX2Ct: d3.Selection<SVGPathElement, unknown, null, undefined>[];

	// Auth elements
	let aadBox: d3.Selection<SVGGElement, unknown, null, undefined>;
	let ghashBox: d3.Selection<SVGGElement, unknown, null, undefined>;
	let tagBox: d3.Selection<SVGGElement, unknown, null, undefined>;
	let arrowsCtToGhash: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let arrowAadToGhash: d3.Selection<SVGPathElement, unknown, null, undefined>;
	let arrowGhashToTag: d3.Selection<SVGPathElement, unknown, null, undefined>;
	let ctrLabel: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let authLabel: d3.Selection<SVGTextElement, unknown, null, undefined>;

	const boxW = 60;
	const boxH = 30;
	const aesW = 45;
	const aesH = 28;
	const xorR = 12;

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
		counterBoxes?.forEach((b) => b.attr('opacity', 0));
		aesBoxes?.forEach((b) => b.attr('opacity', 0));
		xorCircles?.forEach((x) => x.attr('opacity', 0));
		plaintextBoxes?.forEach((b) => b.attr('opacity', 0));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 0));
		arrowsC2A?.forEach((a) => a.attr('opacity', 0));
		arrowsA2X?.forEach((a) => a.attr('opacity', 0));
		arrowsP2X?.forEach((a) => a.attr('opacity', 0));
		arrowsX2Ct?.forEach((a) => a.attr('opacity', 0));
		aadBox?.attr('opacity', 0);
		ghashBox?.attr('opacity', 0);
		tagBox?.attr('opacity', 0);
		arrowsCtToGhash?.forEach((a) => a.attr('opacity', 0));
		arrowAadToGhash?.attr('opacity', 0);
		arrowGhashToTag?.attr('opacity', 0);
		ctrLabel?.attr('opacity', 0);
		authLabel?.attr('opacity', 0);
		stepText?.text('');
		currentStep = 0;
	}

	function showFinalState() {
		counterBoxes?.forEach((b) => b.attr('opacity', 1));
		aesBoxes?.forEach((b) => b.attr('opacity', 1));
		xorCircles?.forEach((x) => x.attr('opacity', 1));
		plaintextBoxes?.forEach((b) => b.attr('opacity', 1));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 1));
		arrowsC2A?.forEach((a) => a.attr('opacity', 1));
		arrowsA2X?.forEach((a) => a.attr('opacity', 1));
		arrowsP2X?.forEach((a) => a.attr('opacity', 1));
		arrowsX2Ct?.forEach((a) => a.attr('opacity', 1));
		aadBox?.attr('opacity', 1);
		ghashBox?.attr('opacity', 1);
		tagBox?.attr('opacity', 1);
		arrowsCtToGhash?.forEach((a) => a.attr('opacity', 1));
		arrowAadToGhash?.attr('opacity', 1);
		arrowGhashToTag?.attr('opacity', 1);
		ctrLabel?.attr('opacity', 1);
		authLabel?.attr('opacity', 1);
		stepText?.text('Tag verifies nothing was tampered with.');
		currentStep = maxStep;
	}

	async function runAnimation() {
		if (!isPlaying) return;
		resetAnimation();
		await sleep(400);

		// Step 1: Show CTR label and counters
		currentStep = 1;
		stepText?.text('Step 1: CTR encryption (you know this part)');
		ctrLabel?.transition().duration(200).attr('opacity', 1);
		for (let i = 0; i < 3; i++) {
			counterBoxes[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(100);
		}
		await sleep(300);
		if (!isPlaying) return;

		// Step 2: Show AES encryption
		currentStep = 2;
		stepText?.text('Encrypt counters with AES...');
		for (let i = 0; i < 3; i++) {
			arrowsC2A[i]?.transition().duration(100).attr('opacity', 1);
			aesBoxes[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(100);
		}
		await sleep(300);
		if (!isPlaying) return;

		// Step 3: XOR with plaintext
		currentStep = 3;
		stepText?.text('XOR with plaintext to get ciphertext');
		for (let i = 0; i < 3; i++) {
			arrowsA2X[i]?.transition().duration(100).attr('opacity', 1);
			xorCircles[i]?.transition().duration(150).attr('opacity', 1);
			plaintextBoxes[i]?.transition().duration(150).attr('opacity', 1);
			arrowsP2X[i]?.transition().duration(100).attr('opacity', 1);
			await sleep(80);
		}
		await sleep(200);
		for (let i = 0; i < 3; i++) {
			arrowsX2Ct[i]?.transition().duration(100).attr('opacity', 1);
			ciphertextBoxes[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(80);
		}
		await sleep(400);
		if (!isPlaying) return;

		// Step 4: Show auth section label
		currentStep = 4;
		stepText?.text('Step 2: Authentication (the new part)');
		authLabel?.transition().duration(200).attr('opacity', 1);
		await sleep(500);
		if (!isPlaying) return;

		// Step 5: Show ciphertext flowing to GHASH
		currentStep = 5;
		stepText?.text('Ciphertext feeds into GHASH (authentication hash)');
		ghashBox?.transition().duration(200).attr('opacity', 1);
		for (let i = 0; i < 3; i++) {
			arrowsCtToGhash[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(150);
		}
		await sleep(400);
		if (!isPlaying) return;

		// Step 6: Show AAD
		currentStep = 6;
		stepText?.text('Additional Authenticated Data (AAD) also feeds in');
		aadBox?.transition().duration(200).attr('opacity', 1);
		await sleep(200);
		arrowAadToGhash?.transition().duration(200).attr('opacity', 1);
		await sleep(500);
		if (!isPlaying) return;

		// Step 7: Show Tag output
		currentStep = 7;
		stepText?.text('GHASH produces the authentication tag');
		arrowGhashToTag?.transition().duration(200).attr('opacity', 1);
		await sleep(200);
		tagBox?.transition().duration(300).attr('opacity', 1);

		// Highlight the tag
		tagBox?.select('rect').transition().duration(200).attr('stroke', colors.yellow).attr('stroke-width', 3);
		await sleep(500);
		tagBox?.select('rect').transition().duration(200).attr('stroke', colors.red).attr('stroke-width', 2);
		await sleep(500);
		if (!isPlaying) return;

		// Step 8: Final message
		stepText?.text('Tag verifies nothing was tampered with.');
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
		svgEl = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);

		const defs = svgEl.append('defs');

		// Arrow markers
		const markerColors = [
			{ id: 'gcm-arr-gray', color: colors.border },
			{ id: 'gcm-arr-blue', color: colors.blue },
			{ id: 'gcm-arr-red', color: colors.red }
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
			.text('GCM Mode — Galois/Counter Mode');

		// Layout - with proper spacing for visible arrows
		const startX = 150;
		const colSpacing = 160;
		const ctrY = 40;
		const aesY = 100;  // 30px gap from counter bottom (ctr ends at 70)
		const xorY = 165;  // 37px gap from AES bottom (AES ends at 128)
		const ctY = 210;   // 33px gap from XOR bottom (XOR ends at 177)
		const authY = 295;
		const tagY = 295;

		counterBoxes = [];
		aesBoxes = [];
		xorCircles = [];
		plaintextBoxes = [];
		ciphertextBoxes = [];
		arrowsC2A = [];
		arrowsA2X = [];
		arrowsP2X = [];
		arrowsX2Ct = [];
		arrowsCtToGhash = [];

		const colCenters: number[] = [];
		for (let i = 0; i < 3; i++) {
			colCenters.push(startX + i * colSpacing);
		}

		// CTR label
		ctrLabel = svgEl.append('text')
			.attr('x', 25)
			.attr('y', 100)
			.attr('fill', colors.blue)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('CTR');

		// Auth label
		authLabel = svgEl.append('text')
			.attr('x', 25)
			.attr('y', authY + 15)
			.attr('fill', colors.red)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text('Auth');

		// Build CTR encryption section
		for (let i = 0; i < 3; i++) {
			const centerX = colCenters[i];

			// Counter box
			const ctrBox = svgEl.append('g').attr('opacity', 0);
			ctrBox.append('rect')
				.attr('x', centerX - boxW / 2)
				.attr('y', ctrY)
				.attr('width', boxW)
				.attr('height', boxH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.blue)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			ctrBox.append('text')
				.attr('x', centerX)
				.attr('y', ctrY + boxH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.blue)
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text(`Ctr: ${i}`);
			counterBoxes.push(ctrBox);

			// Arrow counter to AES
			const arrC2A = svgEl.append('path')
				.attr('d', `M ${centerX} ${ctrY + boxH + 2} L ${centerX} ${aesY - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#gcm-arr-gray)')
				.attr('opacity', 0);
			arrowsC2A.push(arrC2A);

			// AES box
			const aBox = svgEl.append('g').attr('opacity', 0);
			aBox.append('rect')
				.attr('x', centerX - aesW / 2)
				.attr('y', aesY)
				.attr('width', aesW)
				.attr('height', aesH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.purple)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			aBox.append('text')
				.attr('x', centerX)
				.attr('y', aesY + aesH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.purple)
				.attr('font-size', '10px')
				.attr('font-weight', 'bold')
				.text('AES');
			aesBoxes.push(aBox);

			// Arrow AES to XOR
			const arrA2X = svgEl.append('path')
				.attr('d', `M ${centerX} ${aesY + aesH + 2} L ${centerX} ${xorY - xorR - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#gcm-arr-gray)')
				.attr('opacity', 0);
			arrowsA2X.push(arrA2X);

			// XOR circle
			const xorG = svgEl.append('g').attr('opacity', 0);
			xorG.append('circle')
				.attr('cx', centerX)
				.attr('cy', xorY)
				.attr('r', xorR)
				.attr('fill', colors.dark)
				.attr('stroke', colors.blue)
				.attr('stroke-width', 2);
			xorG.append('text')
				.attr('x', centerX)
				.attr('y', xorY + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.blue)
				.attr('font-size', '12px')
				.attr('font-weight', 'bold')
				.text('⊕');
			xorCircles.push(xorG);

			// Plaintext box (to the left) - with gap for visible arrow
			const ptBoxW = 50;
			const ptBoxH = 22;
			const ptX = centerX - xorR - ptBoxW - 25;
			const pBox = svgEl.append('g').attr('opacity', 0);
			pBox.append('rect')
				.attr('x', ptX)
				.attr('y', xorY - ptBoxH / 2)
				.attr('width', ptBoxW)
				.attr('height', ptBoxH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.aqua)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			pBox.append('text')
				.attr('x', ptX + ptBoxW / 2)
				.attr('y', xorY + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.aqua)
				.attr('font-size', '7px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(plaintextBlocks[i]);
			plaintextBoxes.push(pBox);

			// Arrow plaintext to XOR
			const arrP2X = svgEl.append('path')
				.attr('d', `M ${ptX + ptBoxW + 2} ${xorY} L ${centerX - xorR - 3} ${xorY}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#gcm-arr-gray)')
				.attr('opacity', 0);
			arrowsP2X.push(arrP2X);

			// Arrow XOR to ciphertext
			const arrX2Ct = svgEl.append('path')
				.attr('d', `M ${centerX} ${xorY + xorR + 2} L ${centerX} ${ctY - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#gcm-arr-gray)')
				.attr('opacity', 0);
			arrowsX2Ct.push(arrX2Ct);

			// Ciphertext box
			const ctBox = svgEl.append('g').attr('opacity', 0);
			ctBox.append('rect')
				.attr('x', centerX - boxW / 2)
				.attr('y', ctY)
				.attr('width', boxW)
				.attr('height', boxH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.green)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			ctBox.append('text')
				.attr('x', centerX)
				.attr('y', ctY + boxH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.green)
				.attr('font-size', '8px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(ciphertextBlocks[i]);
			ciphertextBoxes.push(ctBox);

			// Arrow from ciphertext to GHASH
			const ghashX = colCenters[1]; // Center GHASH under middle column
			const arrCtToGhash = svgEl.append('path')
				.attr('d', `M ${centerX} ${ctY + boxH + 2} L ${centerX} ${ctY + boxH + 20} L ${ghashX} ${authY - 25} L ${ghashX} ${authY - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.red)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#gcm-arr-red)')
				.attr('opacity', 0);
			arrowsCtToGhash.push(arrCtToGhash);
		}

		// GHASH box (centered)
		const ghashX = colCenters[1];
		const ghashW = 70;
		const ghashH = 35;
		ghashBox = svgEl.append('g').attr('opacity', 0);
		ghashBox.append('rect')
			.attr('x', ghashX - ghashW / 2)
			.attr('y', authY)
			.attr('width', ghashW)
			.attr('height', ghashH)
			.attr('fill', colors.dark)
			.attr('stroke', colors.red)
			.attr('stroke-width', 2)
			.attr('rx', 4);
		ghashBox.append('text')
			.attr('x', ghashX)
			.attr('y', authY + ghashH / 2 + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.red)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('GHASH');

		// AAD box (to the left of GHASH)
		const aadX = ghashX - ghashW / 2 - 80;
		const aadW = 55;
		const aadH = 30;
		aadBox = svgEl.append('g').attr('opacity', 0);
		aadBox.append('rect')
			.attr('x', aadX)
			.attr('y', authY + (ghashH - aadH) / 2)
			.attr('width', aadW)
			.attr('height', aadH)
			.attr('fill', colors.dark)
			.attr('stroke', colors.orange)
			.attr('stroke-width', 1.5)
			.attr('rx', 4);
		aadBox.append('text')
			.attr('x', aadX + aadW / 2)
			.attr('y', authY + ghashH / 2 + 4)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.orange)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('AAD');

		// Arrow AAD to GHASH
		arrowAadToGhash = svgEl.append('path')
			.attr('d', `M ${aadX + aadW + 2} ${authY + ghashH / 2} L ${ghashX - ghashW / 2 - 3} ${authY + ghashH / 2}`)
			.attr('fill', 'none')
			.attr('stroke', colors.orange)
			.attr('stroke-width', 1.5)
			.attr('marker-end', 'url(#gcm-arr-red)')
			.attr('opacity', 0);

		// Tag box (to the right of GHASH)
		const tagX = ghashX + ghashW / 2 + 25;
		const tagW = 55;
		const tagH = 35;
		tagBox = svgEl.append('g').attr('opacity', 0);
		tagBox.append('rect')
			.attr('x', tagX)
			.attr('y', tagY)
			.attr('width', tagW)
			.attr('height', tagH)
			.attr('fill', colors.dark)
			.attr('stroke', colors.red)
			.attr('stroke-width', 2)
			.attr('rx', 4);
		tagBox.append('text')
			.attr('x', tagX + tagW / 2)
			.attr('y', tagY + tagH / 2 + 5)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.red)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Tag');

		// Arrow GHASH to Tag
		arrowGhashToTag = svgEl.append('path')
			.attr('d', `M ${ghashX + ghashW / 2 + 2} ${authY + ghashH / 2} L ${tagX - 3} ${tagY + tagH / 2}`)
			.attr('fill', 'none')
			.attr('stroke', colors.red)
			.attr('stroke-width', 1.5)
			.attr('marker-end', 'url(#gcm-arr-red)')
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
