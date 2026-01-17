<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let svg: SVGSVGElement;
	let isPlaying = $state(false);
	let currentStep = $state(0);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 3;
	const maxStep = totalSteps - 1;

	// Round data - 3 rounds
	const rounds = [
		{ L: 'A3B7', R: '5E91', K: 'K1', fOut: '71DA', xorResult: 'D26D' },
		{ L: '5E91', R: 'D26D', K: 'K2', fOut: '3C12', xorResult: '6283' },
		{ L: 'D26D', R: '6283', K: 'K3', fOut: '9F5E', xorResult: '4D33' }
	];

	// Get CSS variable values
	function getCSSVar(name: string): string {
		if (typeof window === 'undefined') return '#888';
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
	}

	let colors = {
		bg: '#1d2021',
		bgCard: '#282828',
		fg: '#fbf1c7',
		fgMuted: '#d5c4a1',
		accent: '#8ec07c',
		math: '#fabd2f',
		error: '#fb4934',
		border: '#3c3836',
		purple: '#d3869b',
		orange: '#fe8019'
	};

	function updateColors() {
		colors = {
			bg: getCSSVar('--color-bg') || '#1d2021',
			bgCard: getCSSVar('--color-bg-card') || '#282828',
			fg: getCSSVar('--color-fg') || '#fbf1c7',
			fgMuted: getCSSVar('--color-fg-muted') || '#d5c4a1',
			accent: getCSSVar('--color-accent') || '#8ec07c',
			math: getCSSVar('--color-math') || '#fabd2f',
			error: getCSSVar('--color-error') || '#fb4934',
			border: getCSSVar('--color-border') || '#3c3836',
			purple: '#d3869b',
			orange: '#fe8019'
		};
	}

	let stepText: d3.Selection<SVGTextElement, unknown, null, undefined>;
	let roundLabel: d3.Selection<SVGTextElement, unknown, null, undefined>;

	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			animationTimer = setTimeout(resolve, ms);
		});
	}

	async function runAnimation() {
		if (!svg) return;
		isPlaying = true;
		updateColors();

		const width = 520;
		const height = 450;
		const centerX = width / 2;

		const svgEl = d3.select(svg);
		svgEl.selectAll('*').remove();

		svgEl
			.attr('width', '100%')
			.attr('height', 'auto')
			.attr('viewBox', `0 0 ${width} ${height}`);

		// Title
		svgEl
			.append('text')
			.attr('x', centerX)
			.attr('y', 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.math)
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.text('Feistel Network');

		// Round label
		roundLabel = svgEl
			.append('text')
			.attr('x', width - 25)
			.attr('y', 22)
			.attr('text-anchor', 'end')
			.attr('fill', colors.accent)
			.attr('font-size', '11px')
			.attr('font-weight', 'bold');

		// Step text
		stepText = svgEl
			.append('text')
			.attr('x', centerX)
			.attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg)
			.attr('font-size', '10px');

		// Arrow markers
		const defs = svgEl.append('defs');
		const markerColors = [
			{ id: 'arrow-accent', color: colors.accent },
			{ id: 'arrow-orange', color: colors.orange },
			{ id: 'arrow-purple', color: colors.purple },
			{ id: 'arrow-math', color: colors.math },
			{ id: 'arrow-error', color: colors.error }
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

		// Layout constants
		const leftX = centerX - 100;
		const rightX = centerX + 20;
		const boxW = 80;
		const boxH = 40;
		const inputY = 45;
		const funcY = 145;
		const xorY = funcY + boxH + 45;
		const outputY = 355;

		// Run 3 rounds
		for (let round = 0; round < 3; round++) {
			if (!isPlaying) return;

			currentStep = round;
			const data = rounds[round];
			const isLastRound = round === 2;

			// Create a group for this round's elements
			const roundGroup = svgEl.append('g').attr('class', `round-${round}`);

			roundLabel.text(`Round ${round + 1}/3`);

			// ==================== Show input blocks ====================
			stepText.text(`Round ${round + 1}: Start with L${round} and R${round}`);

			// L block
			const lGroup = roundGroup.append('g');
			lGroup
				.append('rect')
				.attr('x', leftX).attr('y', inputY)
				.attr('width', boxW).attr('height', boxH)
				.attr('fill', colors.accent).attr('fill-opacity', 0.2)
				.attr('stroke', colors.accent).attr('stroke-width', 2)
				.attr('rx', 5)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			lGroup
				.append('text')
				.attr('x', leftX + boxW / 2).attr('y', inputY + 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '10px')
				.text(`L${round}`)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			lGroup
				.append('text')
				.attr('x', leftX + boxW / 2).attr('y', inputY + 30)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '12px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(data.L)
				.attr('opacity', 0).transition().delay(150).duration(300).attr('opacity', 1);

			// R block
			const rGroup = roundGroup.append('g');
			rGroup
				.append('rect')
				.attr('x', rightX).attr('y', inputY)
				.attr('width', boxW).attr('height', boxH)
				.attr('fill', colors.orange).attr('fill-opacity', 0.2)
				.attr('stroke', colors.orange).attr('stroke-width', 2)
				.attr('rx', 5)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			rGroup
				.append('text')
				.attr('x', rightX + boxW / 2).attr('y', inputY + 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange).attr('font-size', '10px')
				.text(`R${round}`)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			rGroup
				.append('text')
				.attr('x', rightX + boxW / 2).attr('y', inputY + 30)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '12px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(data.R)
				.attr('opacity', 0).transition().delay(150).duration(300).attr('opacity', 1);

			await sleep(700);
			if (!isPlaying) return;

			// ==================== R goes through F function ====================
			stepText.text(`R${round} enters F function with key ${data.K}`);

			// Line from R down to F
			roundGroup
				.append('line')
				.attr('x1', rightX + boxW / 2).attr('y1', inputY + boxH)
				.attr('x2', rightX + boxW / 2).attr('y2', funcY - 8)
				.attr('stroke', colors.orange).attr('stroke-width', 2)
				.attr('marker-end', 'url(#arrow-orange)')
				.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

			// Animated packet
			const rPacket = roundGroup
				.append('text')
				.attr('x', rightX + boxW / 2).attr('y', inputY + boxH + 18)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange).attr('font-size', '9px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(data.R);

			rPacket
				.transition().duration(450).attr('y', funcY - 12)
				.transition().duration(150).attr('opacity', 0).remove();

			await sleep(450);
			if (!isPlaying) return;

			// F function box
			roundGroup
				.append('rect')
				.attr('x', rightX - 10).attr('y', funcY)
				.attr('width', boxW + 20).attr('height', boxH)
				.attr('fill', colors.bgCard)
				.attr('stroke', colors.purple).attr('stroke-width', 2)
				.attr('rx', 5)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			roundGroup
				.append('text')
				.attr('x', rightX + boxW / 2).attr('y', funcY + 25)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.purple).attr('font-size', '11px').attr('font-weight', 'bold')
				.text(`F(R${round}, ${data.K})`)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			// Key input box
			roundGroup
				.append('rect')
				.attr('x', rightX + boxW + 30).attr('y', funcY + 5)
				.attr('width', 42).attr('height', 30)
				.attr('fill', colors.error).attr('fill-opacity', 0.2)
				.attr('stroke', colors.error).attr('stroke-width', 2)
				.attr('rx', 4)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			roundGroup
				.append('text')
				.attr('x', rightX + boxW + 51).attr('y', funcY + 25)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.error).attr('font-size', '11px').attr('font-weight', 'bold')
				.text(data.K)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			roundGroup
				.append('line')
				.attr('x1', rightX + boxW + 30).attr('y1', funcY + boxH / 2)
				.attr('x2', rightX + boxW + 12).attr('y2', funcY + boxH / 2)
				.attr('stroke', colors.error).attr('stroke-width', 2)
				.attr('marker-end', 'url(#arrow-error)')
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			await sleep(600);
			if (!isPlaying) return;

			// ==================== F output to XOR ====================
			stepText.text(`F output: ${data.fOut} → XOR with L${round}`);

			const xorCenterX = leftX + boxW / 2;

			// F output down and left
			roundGroup
				.append('line')
				.attr('x1', rightX + boxW / 2).attr('y1', funcY + boxH)
				.attr('x2', rightX + boxW / 2).attr('y2', xorY)
				.attr('stroke', colors.purple).attr('stroke-width', 2)
				.attr('opacity', 0).transition().duration(250).attr('opacity', 1);

			roundGroup
				.append('line')
				.attr('x1', rightX + boxW / 2).attr('y1', xorY)
				.attr('x2', xorCenterX + 24).attr('y2', xorY)
				.attr('stroke', colors.purple).attr('stroke-width', 2)
				.attr('marker-end', 'url(#arrow-purple)')
				.attr('opacity', 0).transition().delay(200).duration(300).attr('opacity', 1);

			// Animated F output packet
			const fPacket = roundGroup
				.append('text')
				.attr('x', rightX + boxW / 2).attr('y', funcY + boxH + 18)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.purple).attr('font-size', '9px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(data.fOut);

			fPacket
				.transition().duration(280).attr('y', xorY - 5)
				.transition().duration(350).attr('x', xorCenterX + 35)
				.transition().duration(150).attr('opacity', 0).remove();

			await sleep(550);
			if (!isPlaying) return;

			// L to XOR
			roundGroup
				.append('line')
				.attr('x1', xorCenterX).attr('y1', inputY + boxH)
				.attr('x2', xorCenterX).attr('y2', xorY - 24)
				.attr('stroke', colors.accent).attr('stroke-width', 2)
				.attr('marker-end', 'url(#arrow-accent)')
				.attr('opacity', 0).transition().duration(350).attr('opacity', 1);

			// Animated L packet
			const lPacket = roundGroup
				.append('text')
				.attr('x', xorCenterX).attr('y', inputY + boxH + 18)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '9px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(data.L);

			lPacket
				.transition().duration(450).attr('y', xorY - 28)
				.transition().duration(150).attr('opacity', 0).remove();

			await sleep(350);
			if (!isPlaying) return;

			// XOR circle
			roundGroup
				.append('circle')
				.attr('cx', xorCenterX).attr('cy', xorY)
				.attr('r', 22)
				.attr('fill', colors.bgCard)
				.attr('stroke', colors.math).attr('stroke-width', 2.5)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			roundGroup
				.append('text')
				.attr('x', xorCenterX).attr('y', xorY + 12)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.math).attr('font-size', '34px')
				.text('⊕')
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			await sleep(400);
			if (!isPlaying) return;

			// ==================== XOR calculation box ====================
			stepText.text(`L${round} ⊕ F = ${data.L} ⊕ ${data.fOut} = ${data.xorResult}`);

			const calcBox = roundGroup.append('g');
			calcBox
				.append('rect')
				.attr('x', 20).attr('y', xorY - 28)
				.attr('width', 95).attr('height', 54)
				.attr('fill', colors.bgCard)
				.attr('stroke', colors.math).attr('stroke-width', 1.5)
				.attr('rx', 5)
				.attr('opacity', 0).transition().duration(300).attr('opacity', 1);

			calcBox
				.append('text')
				.attr('x', 67).attr('y', xorY - 10)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '10px').attr('font-family', 'monospace')
				.text(data.L)
				.attr('opacity', 0).transition().delay(150).duration(250).attr('opacity', 1);

			calcBox
				.append('text')
				.attr('x', 35).attr('y', xorY + 8)
				.attr('fill', colors.math).attr('font-size', '20px')
				.text('⊕')
				.attr('opacity', 0).transition().delay(300).duration(250).attr('opacity', 1);

			calcBox
				.append('text')
				.attr('x', 67).attr('y', xorY + 5)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.purple).attr('font-size', '10px').attr('font-family', 'monospace')
				.text(data.fOut)
				.attr('opacity', 0).transition().delay(300).duration(250).attr('opacity', 1);

			calcBox
				.append('line')
				.attr('x1', 30).attr('y1', xorY + 10)
				.attr('x2', 105).attr('y2', xorY + 10)
				.attr('stroke', colors.border).attr('stroke-width', 1)
				.attr('opacity', 0).transition().delay(450).duration(250).attr('opacity', 1);

			calcBox
				.append('text')
				.attr('x', 67).attr('y', xorY + 22)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '10px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(data.xorResult)
				.attr('opacity', 0).transition().delay(600).duration(300).attr('opacity', 1);

			await sleep(1000);
			if (!isPlaying) return;

			// ==================== Swap and output ====================
			stepText.text(`Swap: L${round + 1} = R${round}, R${round + 1} = XOR result`);

			// R becomes L (swap path - dashed)
			roundGroup
				.append('path')
				.attr('d', `M ${rightX + boxW / 2} ${funcY + boxH + 5}
				            C ${rightX + boxW / 2} ${funcY + boxH + 55},
				              ${centerX} ${outputY - 55},
				              ${leftX + boxW / 2} ${outputY - 8}`)
				.attr('fill', 'none')
				.attr('stroke', colors.orange).attr('stroke-width', 2)
				.attr('stroke-dasharray', '5,3')
				.attr('marker-end', 'url(#arrow-orange)')
				.attr('opacity', 0).transition().duration(500).attr('opacity', 1);

			// Swap label
			roundGroup
				.append('text')
				.attr('x', centerX + 65).attr('y', xorY + 65)
				.attr('text-anchor', 'start')
				.attr('fill', colors.orange).attr('font-size', '9px')
				.text(`R${round}→L${round + 1}`)
				.attr('opacity', 0).transition().delay(250).duration(300).attr('opacity', 1);

			// XOR result to R
			roundGroup
				.append('line')
				.attr('x1', xorCenterX).attr('y1', xorY + 24)
				.attr('x2', xorCenterX).attr('y2', xorY + 50)
				.attr('stroke', colors.accent).attr('stroke-width', 2)
				.attr('opacity', 0).transition().delay(200).duration(250).attr('opacity', 1);

			roundGroup
				.append('path')
				.attr('d', `M ${xorCenterX} ${xorY + 50}
				            H ${rightX + boxW / 2}
				            V ${outputY - 8}`)
				.attr('fill', 'none')
				.attr('stroke', colors.accent).attr('stroke-width', 2)
				.attr('marker-end', 'url(#arrow-accent)')
				.attr('opacity', 0).transition().delay(350).duration(350).attr('opacity', 1);

			await sleep(700);
			if (!isPlaying) return;

			// ==================== Output blocks ====================
			const l1Group = roundGroup.append('g').attr('class', 'output-l');
			l1Group
				.append('rect')
				.attr('x', leftX).attr('y', outputY)
				.attr('width', boxW).attr('height', boxH)
				.attr('fill', colors.orange).attr('fill-opacity', 0.2)
				.attr('stroke', colors.orange).attr('stroke-width', 2)
				.attr('rx', 5)
				.attr('opacity', 0).transition().duration(400).attr('opacity', 1);

			l1Group
				.append('text')
				.attr('x', leftX + boxW / 2).attr('y', outputY + 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.orange).attr('font-size', '10px')
				.text(`L${round + 1}`)
				.attr('opacity', 0).transition().duration(400).attr('opacity', 1);

			l1Group
				.append('text')
				.attr('x', leftX + boxW / 2).attr('y', outputY + 30)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '12px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(data.R)
				.attr('opacity', 0).transition().delay(150).duration(300).attr('opacity', 1);

			const r1Group = roundGroup.append('g').attr('class', 'output-r');
			r1Group
				.append('rect')
				.attr('x', rightX).attr('y', outputY)
				.attr('width', boxW).attr('height', boxH)
				.attr('fill', colors.accent).attr('fill-opacity', 0.2)
				.attr('stroke', colors.accent).attr('stroke-width', 2)
				.attr('rx', 5)
				.attr('opacity', 0).transition().duration(400).attr('opacity', 1);

			r1Group
				.append('text')
				.attr('x', rightX + boxW / 2).attr('y', outputY + 15)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.accent).attr('font-size', '10px')
				.text(`R${round + 1}`)
				.attr('opacity', 0).transition().duration(400).attr('opacity', 1);

			r1Group
				.append('text')
				.attr('x', rightX + boxW / 2).attr('y', outputY + 30)
				.attr('text-anchor', 'middle')
				.attr('fill', colors.fg).attr('font-size', '12px')
				.attr('font-family', 'monospace').attr('font-weight', 'bold')
				.text(data.xorResult)
				.attr('opacity', 0).transition().delay(150).duration(300).attr('opacity', 1);

			await sleep(900);
			if (!isPlaying) return;

			// ==================== Transition to next round ====================
			if (!isLastRound) {
				stepText.text(`Round ${round + 1} complete! Moving to Round ${round + 2}...`);

				await sleep(500);
				if (!isPlaying) return;

				// Fade out all elements except output blocks
				roundGroup.selectAll('*:not(.output-l):not(.output-r):not(.output-l *):not(.output-r *)')
					.transition().duration(400).attr('opacity', 0);

				await sleep(450);
				if (!isPlaying) return;

				// Animate output blocks moving up to input position
				l1Group
					.transition().duration(550)
					.attr('transform', `translate(0, ${inputY - outputY})`);

				r1Group
					.transition().duration(550)
					.attr('transform', `translate(0, ${inputY - outputY})`);

				await sleep(600);
				if (!isPlaying) return;

				// Remove the old round group
				roundGroup.remove();
			} else {
				// Final round - show completion message
				stepText.text(`Complete! Final output: L₃ = ${data.R}, R₃ = ${data.xorResult}`);

				svgEl
					.append('text')
					.attr('x', centerX).attr('y', outputY + boxH + 18)
					.attr('text-anchor', 'middle')
					.attr('fill', colors.accent).attr('font-size', '10px')
					.text('✓ 3 rounds complete')
					.attr('opacity', 0).transition().delay(300).duration(500).attr('opacity', 1);
			}
		}

		isPlaying = false;
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
		// Not easily steppable with this animation style
	}

	function prev() {
		// Not easily steppable with this animation style
	}

	function skip() {
		pause();
		// Show a static final state
		if (!svg) return;
		updateColors();

		const svgEl = d3.select(svg);
		svgEl.selectAll('*').remove();

		const width = 520;
		const height = 450;
		const centerX = width / 2;

		svgEl.attr('width', '100%').attr('height', 'auto').attr('viewBox', `0 0 ${width} ${height}`);

		svgEl.append('text')
			.attr('x', centerX).attr('y', 22)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.math).attr('font-size', '13px').attr('font-weight', 'bold')
			.text('Feistel Network');

		svgEl.append('text')
			.attr('x', width - 25).attr('y', 22)
			.attr('text-anchor', 'end')
			.attr('fill', colors.accent).attr('font-size', '11px').attr('font-weight', 'bold')
			.text('Round 3/3');

		svgEl.append('text')
			.attr('x', centerX).attr('y', height - 10)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.fg).attr('font-size', '10px')
			.text('Complete! Final output: L₃ = 6283, R₃ = 4D33');

		svgEl.append('text')
			.attr('x', centerX).attr('y', height / 2)
			.attr('text-anchor', 'middle')
			.attr('fill', colors.accent).attr('font-size', '12px')
			.text('✓ 3 rounds complete - Press replay to see animation');
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
		runAnimation();
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
		max-width: 520px;
		height: auto;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
</style>
