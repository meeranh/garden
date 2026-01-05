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

	const colors = {
		bg: '#1d2021',
		fg: '#fbf1c7',
		yellow: '#fabd2f',
		aqua: '#8ec07c',
		orange: '#fe8019',
		purple: '#d3869b',
		green: '#8ec07c',
		blue: '#83a598',
		dark: '#282828',
		border: '#504945'
	};

	const plaintextBlocks = ['HELLO...', 'WORLD...', 'HELLO...', 'DATA....'];
	const ciphertextBlocks = ['2F8A1C..', '7B3E94..', 'E4C6D8..', '1A5F3B..'];

	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;

	let ivBox: d3.Selection<SVGGElement, unknown, null, undefined>;
	let aesBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let xorCircles: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let plaintextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let ciphertextBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let keyBoxes: d3.Selection<SVGGElement, unknown, null, undefined>[];
	let arrowIV2A: d3.Selection<SVGPathElement, unknown, null, undefined>;
	let feedbackArrows: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let arrowsA2X: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let arrowsP2X: d3.Selection<SVGPathElement, unknown, null, undefined>[];
	let arrowsX2C: d3.Selection<SVGPathElement, unknown, null, undefined>[];

	const aesW = 50;
	const aesH = 32;
	const xorR = 14;
	const ctW = 65;
	const ctH = 32;

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
		ivBox?.attr('opacity', 0);
		aesBoxes?.forEach((b) => b.attr('opacity', 0));
		xorCircles?.forEach((x) => x.attr('opacity', 0));
		plaintextBoxes?.forEach((b) => b.attr('opacity', 0));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 0));
		keyBoxes?.forEach((k) => k.attr('opacity', 0));
		arrowIV2A?.attr('opacity', 0);
		feedbackArrows?.forEach((a) => a.attr('opacity', 0));
		arrowsA2X?.forEach((a) => a.attr('opacity', 0));
		arrowsP2X?.forEach((a) => a.attr('opacity', 0));
		arrowsX2C?.forEach((a) => a.attr('opacity', 0));
		stepText?.text('');
		currentStep = 0;
	}

	function showFinalState() {
		ivBox?.attr('opacity', 1);
		aesBoxes?.forEach((b) => b.attr('opacity', 1));
		xorCircles?.forEach((x) => x.attr('opacity', 1));
		plaintextBoxes?.forEach((b) => b.attr('opacity', 1));
		ciphertextBoxes?.forEach((b) => b.attr('opacity', 1));
		keyBoxes?.forEach((k) => k.attr('opacity', 1));
		arrowIV2A?.attr('opacity', 1);
		feedbackArrows?.forEach((a) => a.attr('opacity', 1));
		arrowsA2X?.forEach((a) => a.attr('opacity', 1));
		arrowsP2X?.forEach((a) => a.attr('opacity', 1));
		arrowsX2C?.forEach((a) => a.attr('opacity', 1));
		stepText?.text('Each keystream block is the previous one encrypted again.');
		currentStep = maxStep;
	}

	async function runAnimation() {
		if (!isPlaying) return;
		resetAnimation();
		await sleep(400);

		// Step 1: Show IV
		currentStep = 1;
		stepText?.text('Start with an Initialization Vector (IV)');
		ivBox?.transition().duration(300).attr('opacity', 1);
		await sleep(700);
		if (!isPlaying) return;

		// Step 2: Show first AES and encrypt IV
		currentStep = 2;
		stepText?.text('Encrypt the IV with AES to get the first keystream block');
		arrowIV2A?.transition().duration(200).attr('opacity', 1);
		await sleep(200);
		aesBoxes[0]?.transition().duration(200).attr('opacity', 1);
		keyBoxes[0]?.transition().duration(200).attr('opacity', 1);
		await sleep(300);
		aesBoxes[0]?.select('rect').transition().duration(150).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
		await sleep(400);
		aesBoxes[0]?.select('rect').transition().duration(150).attr('stroke', colors.purple).attr('stroke-width', 1.5);
		await sleep(300);
		if (!isPlaying) return;

		// Step 3: Show XOR with plaintext for block 0
		stepText?.text('XOR keystream with plaintext → ciphertext');
		arrowsA2X[0]?.transition().duration(200).attr('opacity', 1);
		xorCircles[0]?.transition().duration(200).attr('opacity', 1);
		await sleep(200);
		plaintextBoxes[0]?.transition().duration(200).attr('opacity', 1);
		arrowsP2X[0]?.transition().duration(150).attr('opacity', 1);
		await sleep(200);
		arrowsX2C[0]?.transition().duration(150).attr('opacity', 1);
		ciphertextBoxes[0]?.transition().duration(200).attr('opacity', 1);
		await sleep(500);
		if (!isPlaying) return;

		// Step 4-5: Show feedback chain for remaining blocks
		currentStep = 3;
		for (let i = 1; i < 4; i++) {
			stepText?.text(`Keystream ${i-1} feeds back → encrypt again → keystream ${i}`);

			// Show feedback arrow
			feedbackArrows[i-1]?.transition().duration(250).attr('opacity', 1);
			await sleep(300);

			// Show next AES
			aesBoxes[i]?.transition().duration(200).attr('opacity', 1);
			keyBoxes[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(200);

			// Highlight encryption
			aesBoxes[i]?.select('rect').transition().duration(150).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
			await sleep(300);
			aesBoxes[i]?.select('rect').transition().duration(150).attr('stroke', colors.purple).attr('stroke-width', 1.5);

			// Show XOR and output
			arrowsA2X[i]?.transition().duration(150).attr('opacity', 1);
			xorCircles[i]?.transition().duration(200).attr('opacity', 1);
			await sleep(150);
			plaintextBoxes[i]?.transition().duration(200).attr('opacity', 1);
			arrowsP2X[i]?.transition().duration(150).attr('opacity', 1);
			await sleep(150);
			arrowsX2C[i]?.transition().duration(150).attr('opacity', 1);
			ciphertextBoxes[i]?.transition().duration(200).attr('opacity', 1);

			await sleep(400);
			if (!isPlaying) return;
		}

		// Step 6: Highlight the feedback chain
		currentStep = 5;
		stepText?.text('The feedback chain: IV → KS0 → KS1 → KS2 → KS3');

		// Highlight all feedback arrows
		feedbackArrows?.forEach((a) => {
			a.transition().duration(200).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
		});
		arrowIV2A?.transition().duration(200).attr('stroke', colors.yellow).attr('stroke-width', 2.5);
		await sleep(1500);

		// Reset
		feedbackArrows?.forEach((a) => {
			a.transition().duration(200).attr('stroke', colors.blue).attr('stroke-width', 1.5);
		});
		arrowIV2A?.transition().duration(200).attr('stroke', colors.blue).attr('stroke-width', 1.5);

		// Step 7: Final message
		currentStep = 6;
		stepText?.text('Each keystream block is the previous one encrypted again.');
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
			{ id: 'ofb-arr-gray', color: colors.border },
			{ id: 'ofb-arr-orange', color: colors.orange },
			{ id: 'ofb-arr-blue', color: colors.blue }
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
			.text('OFB Mode — Output Feedback');

		// Layout: AES boxes in a row, with feedback arrows between them
		const startX = 130;
		const colSpacing = 145;
		const aesY = 95;   // Moved down for K arrow visibility
		const xorY = 190;
		const ptY = xorY;
		const ctY = 275;

		aesBoxes = [];
		xorCircles = [];
		plaintextBoxes = [];
		ciphertextBoxes = [];
		keyBoxes = [];
		feedbackArrows = [];
		arrowsA2X = [];
		arrowsP2X = [];
		arrowsX2C = [];

		const colCenters: number[] = [];
		for (let i = 0; i < 4; i++) {
			colCenters.push(startX + i * colSpacing);
		}

		// IV box on the left
		const ivX = 25;
		const ivY = aesY;
		ivBox = svgEl.append('g').attr('opacity', 0);
		ivBox.append('rect')
			.attr('x', ivX)
			.attr('y', ivY)
			.attr('width', 40)
			.attr('height', 32)
			.attr('fill', colors.dark)
			.attr('stroke', colors.blue)
			.attr('stroke-width', 2)
			.attr('rx', 4);
		ivBox.append('text')
			.attr('x', ivX + 20)
			.attr('y', ivY + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.blue)
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text('IV');

		// Arrow from IV to first AES
		const firstAesX = colCenters[0] - aesW / 2;
		arrowIV2A = svgEl.append('path')
			.attr('d', `M ${ivX + 42} ${aesY + 16} L ${firstAesX - 3} ${aesY + 16}`)
			.attr('fill', 'none')
			.attr('stroke', colors.blue)
			.attr('stroke-width', 1.5)
			.attr('marker-end', 'url(#ofb-arr-blue)')
			.attr('opacity', 0);

		for (let i = 0; i < 4; i++) {
			const centerX = colCenters[i];
			const aesLeftX = centerX - aesW / 2;

			// AES box
			const aBox = svgEl.append('g').attr('opacity', 0);
			aBox.append('rect')
				.attr('x', aesLeftX)
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

			// Key box above AES - with enough gap for visible arrow
			const keyGroup = svgEl.append('g').attr('opacity', 0);
			const keyBoxW = 22;
			const keyBoxH = 18;
			const keyBoxX = centerX - keyBoxW / 2;
			const keyBoxY = aesY - keyBoxH - 22;
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
				.attr('d', `M ${centerX} ${keyBoxY + keyBoxH + 2} L ${centerX} ${aesY - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.orange)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ofb-arr-orange)');
			keyBoxes.push(keyGroup);

			// Feedback arrow to next AES (except last)
			if (i < 3) {
				const nextAesX = colCenters[i + 1] - aesW / 2;
				const feedbackY = aesY + aesH / 2;
				const feedbackArr = svgEl.append('path')
					.attr('d', `M ${aesLeftX + aesW + 2} ${feedbackY} L ${nextAesX - 3} ${feedbackY}`)
					.attr('fill', 'none')
					.attr('stroke', colors.blue)
					.attr('stroke-width', 1.5)
					.attr('marker-end', 'url(#ofb-arr-blue)')
					.attr('opacity', 0);
				feedbackArrows.push(feedbackArr);
			}

			// Arrow from AES down to XOR
			const arrA2X = svgEl.append('path')
				.attr('d', `M ${centerX} ${aesY + aesH + 2} L ${centerX} ${xorY - xorR - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ofb-arr-gray)')
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
				.attr('y', xorY + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.blue)
				.attr('font-size', '14px')
				.attr('font-weight', 'bold')
				.text('⊕');
			xorCircles.push(xorG);

			// Plaintext box to the left of XOR
			const ptBoxW = 55;
			const ptBoxH = 26;
			const ptBoxX = centerX - xorR - ptBoxW - 18;
			const ptBoxY = ptY - ptBoxH / 2;
			const pBox = svgEl.append('g').attr('opacity', 0);
			pBox.append('rect')
				.attr('x', ptBoxX)
				.attr('y', ptBoxY)
				.attr('width', ptBoxW)
				.attr('height', ptBoxH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.aqua)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			pBox.append('text')
				.attr('x', ptBoxX + ptBoxW / 2)
				.attr('y', ptBoxY + ptBoxH / 2 + 4)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.aqua)
				.attr('font-size', '8px')
				.attr('font-family', 'monospace')
				.attr('font-weight', 'bold')
				.text(plaintextBlocks[i]);
			plaintextBoxes.push(pBox);

			// Arrow from plaintext to XOR
			const arrP2X = svgEl.append('path')
				.attr('d', `M ${ptBoxX + ptBoxW + 2} ${xorY} L ${centerX - xorR - 3} ${xorY}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ofb-arr-gray)')
				.attr('opacity', 0);
			arrowsP2X.push(arrP2X);

			// Arrow from XOR to ciphertext
			const arrX2C = svgEl.append('path')
				.attr('d', `M ${centerX} ${xorY + xorR + 2} L ${centerX} ${ctY - 3}`)
				.attr('fill', 'none')
				.attr('stroke', colors.border)
				.attr('stroke-width', 1.5)
				.attr('marker-end', 'url(#ofb-arr-gray)')
				.attr('opacity', 0);
			arrowsX2C.push(arrX2C);

			// Ciphertext box
			const cBox = svgEl.append('g').attr('opacity', 0);
			cBox.append('rect')
				.attr('x', centerX - ctW / 2)
				.attr('y', ctY)
				.attr('width', ctW)
				.attr('height', ctH)
				.attr('fill', colors.dark)
				.attr('stroke', colors.green)
				.attr('stroke-width', 1.5)
				.attr('rx', 4);
			cBox.append('text')
				.attr('x', centerX)
				.attr('y', ctY + ctH / 2 + 4)
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
