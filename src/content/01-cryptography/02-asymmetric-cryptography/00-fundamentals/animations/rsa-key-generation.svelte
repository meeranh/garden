<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let timeouts: ReturnType<typeof setTimeout>[] = [];

	// Colors fetched from CSS variables in onMount
	let colors: Record<string, string>;

	// Simple example: p=5, q=11, n=55, φ(n)=40, e=3, d=27
	const steps = [
		{ text: 'Alice wants to generate RSA keys', duration: 1500 },
		{ text: 'Step 1: Choose two prime numbers', duration: 1800 },
		{ text: 'p = 5, q = 11', duration: 1500 },
		{ text: 'Step 2: Compute n = p × q', duration: 1800 },
		{ text: 'n = 5 × 11 = 55', duration: 1500 },
		{ text: 'Step 3: Compute φ(n) = (p-1)(q-1)', duration: 1800 },
		{ text: 'φ(n) = 4 × 10 = 40', duration: 1500 },
		{ text: 'Step 4: Choose e coprime to φ(n)', duration: 1800 },
		{ text: 'e = 3 (gcd(3, 40) = 1) ✓', duration: 1500 },
		{ text: 'Step 5: Compute d where e×d mod φ(n) = 1', duration: 2000 },
		{ text: '3 × 27 = 81, and 81 mod 40 = 1, so d = 27', duration: 2000 },
		{ text: 'Keys generated! Public: (e,n) Private: (d,n)', duration: 2000 },
		{ text: 'Alice shares public key with Bob', duration: 2000 }
	];

	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let svgEl: d3.Selection<SVGSVGElement, unknown, null, undefined>;

	const width = 560;
	const height = 365;
	const totalSteps = steps.length;
	const maxStep = totalSteps - 1;

	// Define which elements are visible at each step (cumulative)
	const stepVisibility: Record<number, string[]> = {
		0: ['alice'],
		1: ['alice'],
		2: ['alice', 'prime-p', 'prime-q'],
		3: ['alice', 'prime-p', 'prime-q', 'multiply-op'],
		4: ['alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n'],
		5: ['alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n', 'phi-calc'],
		6: ['alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n', 'phi-calc', 'result-phi'],
		7: ['alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n', 'phi-calc', 'result-phi', 'choose-e'],
		8: ['alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n', 'phi-calc', 'result-phi', 'choose-e', 'result-e'],
		9: ['alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n', 'phi-calc', 'result-phi', 'choose-e', 'result-e', 'compute-d'],
		10: ['alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n', 'phi-calc', 'result-phi', 'choose-e', 'result-e', 'compute-d', 'result-d'],
		11: ['alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n', 'phi-calc', 'result-phi', 'choose-e', 'result-e', 'compute-d', 'result-d', 'public-key', 'private-key'],
		12: ['alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n', 'phi-calc', 'result-phi', 'choose-e', 'result-e', 'compute-d', 'result-d', 'public-key', 'private-key', 'bob']
	};

	const allElements = [
		'alice', 'prime-p', 'prime-q', 'multiply-op', 'result-n',
		'phi-calc', 'result-phi', 'choose-e', 'result-e',
		'compute-d', 'result-d', 'public-key', 'private-key', 'bob'
	];

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

	// Apply visibility for a specific step (used by next/prev)
	function applyStep(step: number, animate = true) {
		if (!svgEl) return;

		const visible = stepVisibility[step] || [];
		const duration = animate ? 300 : 0;

		// Hide particles
		svgEl.selectAll('.data-particle').attr('opacity', 0);

		// Show/hide elements based on step
		allElements.forEach((el) => {
			const isVisible = visible.includes(el);
			if (animate) {
				svgEl.select(`.${el}`).transition().duration(duration).attr('opacity', isVisible ? 1 : 0);
			} else {
				svgEl.select(`.${el}`).attr('opacity', isVisible ? 1 : 0);
			}
		});

		// Update step text
		stepText?.text(steps[step]?.text || '');
		currentStep = step;
	}

	function resetAnimation() {
		if (!svgEl) return;
		svgEl.selectAll('.animated').attr('opacity', 0);
		svgEl.selectAll('.data-particle').attr('opacity', 0);
		stepText?.text('');
		currentStep = 0;
	}

	function showFinalState() {
		applyStep(maxStep, false);
	}

	async function runAnimation() {
		if (!isPlaying || !svgEl) return;

		// Start from current step or beginning
		const startStep = currentStep;

		// Step 0: Alice appears
		if (startStep <= 0) {
			currentStep = 0;
			stepText?.text(steps[0].text);
			svgEl.select('.alice').transition().duration(500).attr('opacity', 1);
			await sleep(steps[0].duration);
			if (!isPlaying) return;
		}

		// Step 1: Choose primes text
		if (startStep <= 1) {
			currentStep = 1;
			stepText?.text(steps[1].text);
			await sleep(steps[1].duration);
			if (!isPlaying) return;
		}

		// Step 2: Show primes p and q
		if (startStep <= 2) {
			currentStep = 2;
			stepText?.text(steps[2].text);
			svgEl.select('.prime-p').transition().duration(400).attr('opacity', 1);
			await sleep(600);
			if (!isPlaying) return;
			svgEl.select('.prime-q').transition().duration(400).attr('opacity', 1);
			await sleep(steps[2].duration - 600);
			if (!isPlaying) return;
		}

		// Step 3: Compute n text
		if (startStep <= 3) {
			currentStep = 3;
			stepText?.text(steps[3].text);
			svgEl.select('.multiply-op').transition().duration(400).attr('opacity', 1);
			await sleep(steps[3].duration);
			if (!isPlaying) return;
		}

		// Step 4: Show n result with particles merging
		if (startStep <= 4) {
			currentStep = 4;
			stepText?.text(steps[4].text);

			// Animate particles from p and q to n
			const pParticle = svgEl.select('.p-particle');
			const qParticle = svgEl.select('.q-particle');
			pParticle.attr('opacity', 1);
			qParticle.attr('opacity', 1);

			pParticle.transition().duration(600).attr('cx', 280).attr('cy', 130);
			qParticle.transition().duration(600).attr('cx', 280).attr('cy', 130);

			await sleep(700);
			if (!isPlaying) return;

			pParticle.attr('opacity', 0);
			qParticle.attr('opacity', 0);
			svgEl.select('.result-n').transition().duration(400).attr('opacity', 1);

			// Flash effect
			svgEl
				.select('.result-n rect')
				.transition()
				.duration(150)
				.attr('fill', colors.purple)
				.transition()
				.duration(150)
				.attr('fill', colors.dark);

			await sleep(steps[4].duration - 700);
			if (!isPlaying) return;
		}

		// Step 5: Compute φ(n) text
		if (startStep <= 5) {
			currentStep = 5;
			stepText?.text(steps[5].text);
			svgEl.select('.phi-calc').transition().duration(400).attr('opacity', 1);
			await sleep(steps[5].duration);
			if (!isPlaying) return;
		}

		// Step 6: Show φ(n) result
		if (startStep <= 6) {
			currentStep = 6;
			stepText?.text(steps[6].text);
			svgEl.select('.result-phi').transition().duration(400).attr('opacity', 1);

			svgEl
				.select('.result-phi rect')
				.transition()
				.duration(150)
				.attr('fill', colors.orange)
				.transition()
				.duration(150)
				.attr('fill', colors.dark);

			await sleep(steps[6].duration);
			if (!isPlaying) return;
		}

		// Step 7: Choose e text
		if (startStep <= 7) {
			currentStep = 7;
			stepText?.text(steps[7].text);
			svgEl.select('.choose-e').transition().duration(400).attr('opacity', 1);
			await sleep(steps[7].duration);
			if (!isPlaying) return;
		}

		// Step 8: Show e result
		if (startStep <= 8) {
			currentStep = 8;
			stepText?.text(steps[8].text);
			svgEl.select('.result-e').transition().duration(400).attr('opacity', 1);

			svgEl
				.select('.result-e rect')
				.transition()
				.duration(150)
				.attr('fill', colors.green)
				.transition()
				.duration(150)
				.attr('fill', colors.dark);

			await sleep(steps[8].duration);
			if (!isPlaying) return;
		}

		// Step 9: Compute d text
		if (startStep <= 9) {
			currentStep = 9;
			stepText?.text(steps[9].text);
			svgEl.select('.compute-d').transition().duration(400).attr('opacity', 1);
			await sleep(steps[9].duration);
			if (!isPlaying) return;
		}

		// Step 10: Show d result
		if (startStep <= 10) {
			currentStep = 10;
			stepText?.text(steps[10].text);
			svgEl.select('.result-d').transition().duration(400).attr('opacity', 1);

			svgEl
				.select('.result-d rect')
				.transition()
				.duration(150)
				.attr('fill', colors.red)
				.transition()
				.duration(150)
				.attr('fill', colors.dark);

			await sleep(steps[10].duration);
			if (!isPlaying) return;
		}

		// Step 11: Show keys
		if (startStep <= 11) {
			currentStep = 11;
			stepText?.text(steps[11].text);
			svgEl.select('.public-key').transition().duration(500).attr('opacity', 1);
			await sleep(400);
			if (!isPlaying) return;
			svgEl.select('.private-key').transition().duration(500).attr('opacity', 1);
			await sleep(steps[11].duration - 400);
			if (!isPlaying) return;
		}

		// Step 12: Bob appears and receives key
		if (startStep <= 12) {
			currentStep = 12;
			stepText?.text(steps[12].text);
			svgEl.select('.bob').transition().duration(500).attr('opacity', 1);

			await sleep(500);
			if (!isPlaying) return;

			// Animate key flying to Bob
			const keyParticle = svgEl.select('.key-particle');
			keyParticle.attr('cx', 170).attr('cy', 310).attr('opacity', 1);
			keyParticle.transition().duration(1200).ease(d3.easeCubicInOut).attr('cx', 480);

			await sleep(steps[12].duration);
			keyParticle.attr('opacity', 0);
		}

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
		if (currentStep < maxStep) {
			applyStep(currentStep + 1);
		}
	}

	function prev() {
		pause();
		if (currentStep > 0) {
			applyStep(currentStep - 1);
		}
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
		// Fetch colors from CSS variables
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
			// Extra gruvbox colors (no CSS vars)
			purple: '#d3869b',
			orange: '#fe8019',
			blue: '#83a598'
		};

		svgEl = d3
			.select(svg)
			.attr('width', width)
			.attr('height', height)
			.attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl
			.append('text')
			.attr('x', width / 2)
			.attr('y', 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.yellow)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('RSA Key Generation');

		// Step text
		stepText = svgEl
			.append('text')
			.attr('x', width / 2)
			.attr('y', 353)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px');

		// Create particles first (behind everything)
		svgEl
			.append('circle')
			.attr('class', 'data-particle p-particle')
			.attr('r', 8)
			.attr('fill', colors.aqua)
			.attr('opacity', 0)
			.attr('cx', 130)
			.attr('cy', 75);
		svgEl
			.append('circle')
			.attr('class', 'data-particle q-particle')
			.attr('r', 8)
			.attr('fill', colors.aqua)
			.attr('opacity', 0)
			.attr('cx', 230)
			.attr('cy', 75);
		svgEl
			.append('circle')
			.attr('class', 'data-particle key-particle')
			.attr('r', 10)
			.attr('fill', colors.green)
			.attr('opacity', 0);

		// Alice (left side)
		const alice = svgEl.append('g').attr('class', 'alice animated').attr('opacity', 0);
		// Simple stick figure
		alice
			.append('circle')
			.attr('cx', 50)
			.attr('cy', 60)
			.attr('r', 15)
			.attr('fill', colors.dark)
			.attr('stroke', colors.aqua)
			.attr('stroke-width', 2);
		alice
			.append('line')
			.attr('x1', 50)
			.attr('y1', 75)
			.attr('x2', 50)
			.attr('y2', 110)
			.attr('stroke', colors.aqua)
			.attr('stroke-width', 2);
		alice
			.append('line')
			.attr('x1', 50)
			.attr('y1', 85)
			.attr('x2', 30)
			.attr('y2', 100)
			.attr('stroke', colors.aqua)
			.attr('stroke-width', 2);
		alice
			.append('line')
			.attr('x1', 50)
			.attr('y1', 85)
			.attr('x2', 70)
			.attr('y2', 100)
			.attr('stroke', colors.aqua)
			.attr('stroke-width', 2);
		alice
			.append('text')
			.attr('x', 50)
			.attr('y', 130)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.aqua)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Alice');

		// Bob (right side)
		const bob = svgEl.append('g').attr('class', 'bob animated').attr('opacity', 0);
		bob.append('circle')
			.attr('cx', 510)
			.attr('cy', 60)
			.attr('r', 15)
			.attr('fill', colors.dark)
			.attr('stroke', colors.blue)
			.attr('stroke-width', 2);
		bob.append('line')
			.attr('x1', 510)
			.attr('y1', 75)
			.attr('x2', 510)
			.attr('y2', 110)
			.attr('stroke', colors.blue)
			.attr('stroke-width', 2);
		bob.append('line')
			.attr('x1', 510)
			.attr('y1', 85)
			.attr('x2', 490)
			.attr('y2', 100)
			.attr('stroke', colors.blue)
			.attr('stroke-width', 2);
		bob.append('line')
			.attr('x1', 510)
			.attr('y1', 85)
			.attr('x2', 530)
			.attr('y2', 100)
			.attr('stroke', colors.blue)
			.attr('stroke-width', 2);
		bob.append('text')
			.attr('x', 510)
			.attr('y', 130)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.blue)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold')
			.text('Bob');

		// === CALCULATION AREA (center) ===
		const calcX = 100;
		const calcY = 50;

		// Prime p box
		const primeP = svgEl.append('g').attr('class', 'prime-p animated').attr('opacity', 0);
		primeP
			.append('rect')
			.attr('x', calcX)
			.attr('y', calcY)
			.attr('width', 55)
			.attr('height', 35)
			.attr('rx', 4)
			.attr('fill', colors.dark)
			.attr('stroke', colors.aqua)
			.attr('stroke-width', 2);
		primeP
			.append('text')
			.attr('x', calcX + 27)
			.attr('y', calcY + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '9px')
			.text('prime');
		primeP
			.append('text')
			.attr('x', calcX + 27)
			.attr('y', calcY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.aqua)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('p = 5');

		// Multiply operator
		const multiplyOp = svgEl.append('g').attr('class', 'multiply-op animated').attr('opacity', 0);
		multiplyOp
			.append('text')
			.attr('x', calcX + 75)
			.attr('y', calcY + 24)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '16px')
			.text('×');

		// Prime q box
		const primeQ = svgEl.append('g').attr('class', 'prime-q animated').attr('opacity', 0);
		primeQ
			.append('rect')
			.attr('x', calcX + 95)
			.attr('y', calcY)
			.attr('width', 60)
			.attr('height', 35)
			.attr('rx', 4)
			.attr('fill', colors.dark)
			.attr('stroke', colors.aqua)
			.attr('stroke-width', 2);
		primeQ
			.append('text')
			.attr('x', calcX + 125)
			.attr('y', calcY + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '9px')
			.text('prime');
		primeQ
			.append('text')
			.attr('x', calcX + 125)
			.attr('y', calcY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.aqua)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('q = 11');

		// Result n
		const resultN = svgEl.append('g').attr('class', 'result-n animated').attr('opacity', 0);
		resultN
			.append('rect')
			.attr('x', calcX + 175)
			.attr('y', calcY)
			.attr('width', 70)
			.attr('height', 35)
			.attr('rx', 4)
			.attr('fill', colors.dark)
			.attr('stroke', colors.purple)
			.attr('stroke-width', 2);
		resultN
			.append('text')
			.attr('x', calcX + 210)
			.attr('y', calcY + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '9px')
			.text('modulus');
		resultN
			.append('text')
			.attr('x', calcX + 210)
			.attr('y', calcY + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.purple)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('n = 55');

		// Row 2: φ(n) calculation
		const row2Y = calcY + 55;

		const phiCalc = svgEl.append('g').attr('class', 'phi-calc animated').attr('opacity', 0);
		phiCalc
			.append('text')
			.attr('x', calcX + 27)
			.attr('y', row2Y + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('(5-1)');
		phiCalc
			.append('text')
			.attr('x', calcX + 75)
			.attr('y', row2Y + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '14px')
			.text('×');
		phiCalc
			.append('text')
			.attr('x', calcX + 125)
			.attr('y', row2Y + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '11px')
			.text('(11-1)');

		const resultPhi = svgEl.append('g').attr('class', 'result-phi animated').attr('opacity', 0);
		resultPhi
			.append('rect')
			.attr('x', calcX + 175)
			.attr('y', row2Y)
			.attr('width', 70)
			.attr('height', 35)
			.attr('rx', 4)
			.attr('fill', colors.dark)
			.attr('stroke', colors.orange)
			.attr('stroke-width', 2);
		resultPhi
			.append('text')
			.attr('x', calcX + 210)
			.attr('y', row2Y + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '9px')
			.text('totient');
		resultPhi
			.append('text')
			.attr('x', calcX + 210)
			.attr('y', row2Y + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.orange)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('φ = 40');

		// Row 3: Choose e
		const row3Y = row2Y + 55;

		const chooseE = svgEl.append('g').attr('class', 'choose-e animated').attr('opacity', 0);
		chooseE
			.append('text')
			.attr('x', calcX + 75)
			.attr('y', row3Y + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('gcd(e, 40) = 1');

		const resultE = svgEl.append('g').attr('class', 'result-e animated').attr('opacity', 0);
		resultE
			.append('rect')
			.attr('x', calcX + 175)
			.attr('y', row3Y)
			.attr('width', 70)
			.attr('height', 35)
			.attr('rx', 4)
			.attr('fill', colors.dark)
			.attr('stroke', colors.green)
			.attr('stroke-width', 2);
		resultE
			.append('text')
			.attr('x', calcX + 210)
			.attr('y', row3Y + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '9px')
			.text('public exp');
		resultE
			.append('text')
			.attr('x', calcX + 210)
			.attr('y', row3Y + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.green)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('e = 3');

		// Row 4: Compute d
		const row4Y = row3Y + 55;

		const computeD = svgEl.append('g').attr('class', 'compute-d animated').attr('opacity', 0);
		computeD
			.append('text')
			.attr('x', calcX + 75)
			.attr('y', row4Y + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('3×d mod 40 = 1');

		const resultD = svgEl.append('g').attr('class', 'result-d animated').attr('opacity', 0);
		resultD
			.append('rect')
			.attr('x', calcX + 175)
			.attr('y', row4Y)
			.attr('width', 70)
			.attr('height', 35)
			.attr('rx', 4)
			.attr('fill', colors.dark)
			.attr('stroke', colors.red)
			.attr('stroke-width', 2);
		resultD
			.append('text')
			.attr('x', calcX + 210)
			.attr('y', row4Y + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '9px')
			.text('private exp');
		resultD
			.append('text')
			.attr('x', calcX + 210)
			.attr('y', row4Y + 28)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.red)
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text('d = 27');

		// === KEYS OUTPUT ===
		const keyY = 290;

		// Public key (left-center)
		const publicKey = svgEl.append('g').attr('class', 'public-key animated').attr('opacity', 0);
		publicKey
			.append('rect')
			.attr('x', 120)
			.attr('y', keyY)
			.attr('width', 100)
			.attr('height', 40)
			.attr('rx', 5)
			.attr('fill', colors.dark)
			.attr('stroke', colors.green)
			.attr('stroke-width', 2);
		publicKey
			.append('text')
			.attr('x', 170)
			.attr('y', keyY + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.green)
			.attr('font-size', '9px')
			.attr('font-weight', 'bold')
			.text('PUBLIC KEY');

		// e: value
		publicKey
			.append('text')
			.attr('x', 138)
			.attr('y', keyY + 30)
			.attr('text-anchor', 'start')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('e: ');
		publicKey
			.append('text')
			.attr('x', 148)
			.attr('y', keyY + 30)
			.attr('text-anchor', 'start')
			.attr('fill', colors.green)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('3');

		// and n: value
		publicKey
			.append('text')
			.attr('x', 156)
			.attr('y', keyY + 30)
			.attr('text-anchor', 'start')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text(' and n: ');
		publicKey
			.append('text')
			.attr('x', 193)
			.attr('y', keyY + 30)
			.attr('text-anchor', 'start')
			.attr('fill', colors.green)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('55');

		// Private key (center-right)
		const privateKey = svgEl.append('g').attr('class', 'private-key animated').attr('opacity', 0);
		privateKey
			.append('rect')
			.attr('x', 240)
			.attr('y', keyY)
			.attr('width', 100)
			.attr('height', 40)
			.attr('rx', 5)
			.attr('fill', colors.dark)
			.attr('stroke', colors.red)
			.attr('stroke-width', 2);
		privateKey
			.append('text')
			.attr('x', 290)
			.attr('y', keyY + 14)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.red)
			.attr('font-size', '9px')
			.attr('font-weight', 'bold')
			.text('PRIVATE KEY');

		// d: value
		privateKey
			.append('text')
			.attr('x', 253)
			.attr('y', keyY + 30)
			.attr('text-anchor', 'start')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text('d: ');
		privateKey
			.append('text')
			.attr('x', 264)
			.attr('y', keyY + 30)
			.attr('text-anchor', 'start')
			.attr('fill', colors.red)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('27');

		// and n: value
		privateKey
			.append('text')
			.attr('x', 280)
			.attr('y', keyY + 30)
			.attr('text-anchor', 'start')
			.attr('fill', colors.fg)
			.attr('font-size', '10px')
			.text(' and n: ');
		privateKey
			.append('text')
			.attr('x', 317)
			.attr('y', keyY + 30)
			.attr('text-anchor', 'start')
			.attr('fill', colors.red)
			.attr('font-size', '10px')
			.attr('font-weight', 'bold')
			.text('55');

		// Register controller
		register?.({ play, pause, next, prev, skip, replay, getState });
	});

	onDestroy(() => {
		clearTimeouts();
	});
</script>

<svg bind:this={svg} class="diagram"></svg>

<style>
	.diagram {
		display: block;
		margin: 0 auto;
		background: #1d2021;
		border-radius: 0.5rem;
		max-width: 100%;
	}
</style>
