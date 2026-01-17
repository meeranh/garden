<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

	let { register }: { register?: (controller: AnimationController) => void } = $props();

	let currentStep = $state(0);
	let isPlaying = $state(false);
	let animationTimer: ReturnType<typeof setTimeout> | null = null;

	const totalSteps = 7;
	const maxStep = totalSteps - 1;

	// Step 0: Show P and C (known values)
	// Step 1: Show Double DES structure with M in middle
	// Step 2: Highlight that M is reachable from both sides
	// Step 3: Start building table from left (encrypting P)
	// Step 4: Show table with multiple entries
	// Step 5: Start decrypting from right, checking table
	// Step 6: Match found

	// Example key/M values for visualization
	const tableEntries = [
		{ k: 'K₁ = 0x1A...', m: 'M = 0x7F...' },
		{ k: 'K₁ = 0x2B...', m: 'M = 0x3D...' },
		{ k: 'K₁ = 0x3C...', m: 'M = 0xA2...' },
		{ k: 'K₁ = 0x4D...', m: 'M = 0x9E...' }
	];

	const searchEntries = [
		{ k: 'K₂ = 0x5E...', m: "M' = 0xB1...", match: false },
		{ k: 'K₂ = 0x6F...', m: "M' = 0x3D...", match: true }
	];

	let display = $derived.by(() => {
		const showP = currentStep >= 0;
		const showC = currentStep >= 0;
		const showStructure = currentStep >= 1;
		const showM = currentStep >= 1;
		const highlightBothSides = currentStep >= 2;
		const showTable = currentStep >= 3;
		const tableCount = currentStep === 3 ? 1 : currentStep >= 4 ? 4 : 0;
		const showSearch = currentStep >= 5;
		const searchCount = currentStep === 5 ? 1 : currentStep >= 6 ? 2 : 0;
		const matchFound = currentStep >= 6;

		const labels = [
			'Attacker has a known plaintext P and ciphertext C',
			'Double DES: P is encrypted twice to produce C',
			'M is the intermediate value between the two encryptions',
			'Step 1: Encrypt P with each possible K₁, store results',
			'Build a table of all 2⁵⁶ possible (K₁, M) pairs',
			'Step 2: Decrypt C with each K₂, check if result is in table',
			'Match found! Both keys recovered.'
		];

		return {
			showP,
			showC,
			showStructure,
			showM,
			highlightBothSides,
			showTable,
			tableCount,
			showSearch,
			searchCount,
			matchFound,
			label: labels[currentStep]
		};
	});

	// Layout constants
	const width = 520;
	const height = 380;
	const boxW = 70;
	const boxH = 36;
	const centerY = 90;

	// Positions (evenly spaced across width)
	const pX = 50;
	const e1X = 150;
	const mX = 260;
	const e2X = 370;
	const cX = 470;

	function scheduleNext() {
		if (!isPlaying) return;
		animationTimer = setTimeout(() => {
			if (!isPlaying) return;
			if (currentStep < maxStep) {
				currentStep++;
				scheduleNext();
			} else {
				isPlaying = false;
			}
		}, 2500);
	}

	function play() {
		if (isPlaying) return;
		isPlaying = true;
		if (currentStep >= maxStep) currentStep = 0;
		scheduleNext();
	}

	function pause() {
		isPlaying = false;
		if (animationTimer) {
			clearTimeout(animationTimer);
			animationTimer = null;
		}
	}

	function next() {
		if (currentStep < maxStep) currentStep++;
	}
	function prev() {
		if (currentStep > 0) currentStep--;
	}
	function skip() {
		pause();
		currentStep = maxStep;
	}
	function replay() {
		pause();
		currentStep = 0;
		play();
	}
	function getState() {
		return { isPlaying, currentStep, totalSteps: maxStep };
	}

	onMount(() => register?.({ play, pause, next, prev, skip, replay, getState }));
	onDestroy(() => pause());
</script>

<div class="container">
	<svg viewBox="0 0 {width} {height}" class="scene">
		<!-- Arrow markers -->
		<defs>
			<marker
				id="arrow-left"
				markerWidth="10"
				markerHeight="10"
				refX="8"
				refY="3"
				orient="auto"
				markerUnits="strokeWidth"
			>
				<path d="M0,0 L0,6 L9,3 z" fill="var(--color-accent)" />
			</marker>
			<marker
				id="arrow-right"
				markerWidth="10"
				markerHeight="10"
				refX="8"
				refY="3"
				orient="auto"
				markerUnits="strokeWidth"
			>
				<path d="M0,0 L0,6 L9,3 z" fill="var(--color-error)" />
			</marker>
		</defs>

		<!-- P box (plaintext) -->
		{#if display.showP}
			<g class="fade-in">
				<rect
					x={pX - boxW / 2}
					y={centerY - boxH / 2}
					width={boxW}
					height={boxH}
					rx="6"
					class="box known"
				/>
				<text x={pX} y={centerY + 5} class="box-label">P</text>
				<text x={pX} y={centerY + boxH / 2 + 18} class="sub-label">plaintext</text>
			</g>
		{/if}

		<!-- C box (ciphertext) -->
		{#if display.showC}
			<g class="fade-in">
				<rect
					x={cX - boxW / 2}
					y={centerY - boxH / 2}
					width={boxW}
					height={boxH}
					rx="6"
					class="box known"
				/>
				<text x={cX} y={centerY + 5} class="box-label">C</text>
				<text x={cX} y={centerY + boxH / 2 + 18} class="sub-label">ciphertext</text>
			</g>
		{/if}

		<!-- Encryption structure -->
		{#if display.showStructure}
			<!-- Encrypt box with K₁ entering from above -->
			<g class="fade-in">
				<!-- Key label above -->
				<text x={e1X} y={centerY - boxH / 2 - 24} class="key-label" class:key-left={display.highlightBothSides}>K₁</text>
				<!-- Key arrow pointing down -->
				<line
					x1={e1X}
					y1={centerY - boxH / 2 - 18}
					x2={e1X}
					y2={centerY - boxH / 2 - 4}
					class="key-arrow"
					class:key-left={display.highlightBothSides}
				/>
				<polygon
					points="{e1X},{centerY - boxH / 2 - 2} {e1X - 4},{centerY - boxH / 2 - 8} {e1X + 4},{centerY - boxH / 2 - 8}"
					class="key-arrow-head"
					class:key-left={display.highlightBothSides}
				/>
				<!-- Encrypt box -->
				<rect
					x={e1X - boxW / 2}
					y={centerY - boxH / 2}
					width={boxW}
					height={boxH}
					rx="6"
					class="box encrypt"
					class:highlight-left={display.highlightBothSides}
				/>
				<text x={e1X} y={centerY + 5} class="box-label">Encrypt</text>
			</g>

			<!-- Arrow P to E_K1 -->
			<line
				x1={pX + boxW / 2 + 4}
				y1={centerY}
				x2={e1X - boxW / 2 - 4}
				y2={centerY}
				class="arrow"
				class:arrow-left={display.highlightBothSides}
			/>
			<polygon
				points="{e1X - boxW / 2 - 4},{centerY} {e1X - boxW / 2 - 12},{centerY - 5} {e1X -
					boxW / 2 -
					12},{centerY + 5}"
				class="arrow-head"
				class:arrow-left={display.highlightBothSides}
			/>

			<!-- M box (intermediate) -->
			<g class="fade-in">
				<rect
					x={mX - boxW / 2}
					y={centerY - boxH / 2}
					width={boxW}
					height={boxH}
					rx="6"
					class="box intermediate"
					class:highlight-middle={display.highlightBothSides}
					class:match-glow={display.matchFound}
				/>
				<text x={mX} y={centerY + 5} class="box-label">M</text>
				{#if display.highlightBothSides && !display.showTable}
					<text x={mX} y={centerY + boxH / 2 + 18} class="sub-label accent">
						meet here!
					</text>
				{/if}
			</g>

			<!-- Arrow E_K1 to M -->
			<line
				x1={e1X + boxW / 2 + 4}
				y1={centerY}
				x2={mX - boxW / 2 - 4}
				y2={centerY}
				class="arrow"
				class:arrow-left={display.highlightBothSides}
			/>
			<polygon
				points="{mX - boxW / 2 - 4},{centerY} {mX - boxW / 2 - 12},{centerY - 5} {mX -
					boxW / 2 -
					12},{centerY + 5}"
				class="arrow-head"
				class:arrow-left={display.highlightBothSides}
			/>

			<!-- Encrypt box with K₂ entering from above -->
			<g class="fade-in">
				<!-- Key label above -->
				<text x={e2X} y={centerY - boxH / 2 - 24} class="key-label" class:key-right={display.highlightBothSides}>K₂</text>
				<!-- Key arrow pointing down -->
				<line
					x1={e2X}
					y1={centerY - boxH / 2 - 18}
					x2={e2X}
					y2={centerY - boxH / 2 - 4}
					class="key-arrow"
					class:key-right={display.highlightBothSides}
				/>
				<polygon
					points="{e2X},{centerY - boxH / 2 - 2} {e2X - 4},{centerY - boxH / 2 - 8} {e2X + 4},{centerY - boxH / 2 - 8}"
					class="key-arrow-head"
					class:key-right={display.highlightBothSides}
				/>
				<!-- Encrypt box -->
				<rect
					x={e2X - boxW / 2}
					y={centerY - boxH / 2}
					width={boxW}
					height={boxH}
					rx="6"
					class="box encrypt"
					class:highlight-right={display.highlightBothSides}
				/>
				<text x={e2X} y={centerY + 5} class="box-label">Encrypt</text>
			</g>

			<!-- Arrow M to E_K2 -->
			<line
				x1={mX + boxW / 2 + 4}
				y1={centerY}
				x2={e2X - boxW / 2 - 4}
				y2={centerY}
				class="arrow"
				class:arrow-right={display.highlightBothSides}
			/>
			<polygon
				points="{e2X - boxW / 2 - 4},{centerY} {e2X - boxW / 2 - 12},{centerY - 5} {e2X -
					boxW / 2 -
					12},{centerY + 5}"
				class="arrow-head"
				class:arrow-right={display.highlightBothSides}
			/>

			<!-- Arrow E_K2 to C -->
			<line
				x1={e2X + boxW / 2 + 4}
				y1={centerY}
				x2={cX - boxW / 2 - 4}
				y2={centerY}
				class="arrow"
				class:arrow-right={display.highlightBothSides}
			/>
			<polygon
				points="{cX - boxW / 2 - 4},{centerY} {cX - boxW / 2 - 12},{centerY - 5} {cX -
					boxW / 2 -
					12},{centerY + 5}"
				class="arrow-head"
				class:arrow-right={display.highlightBothSides}
			/>
		{/if}

		<!-- Attack arrows showing both directions -->
		{#if display.highlightBothSides && !display.showTable}
			<!-- Left attack arrow: P top → M top (curved high above K₁) -->
			<path
				d="M {pX} {centerY - boxH / 2}
				   Q {(pX + mX) / 2 + 40} {centerY - boxH / 2 - 95}
				   {mX - 8} {centerY - boxH / 2}"
				class="attack-arrow left"
				fill="none"
				marker-end="url(#arrow-left)"
			/>
			<text x={(pX + mX) / 2 + 20} y={centerY - boxH / 2 - 75} class="attack-label left">
				Encrypt with K₁
			</text>

			<!-- Right attack arrow: C top → M top (curved high above K₂) -->
			<path
				d="M {cX} {centerY - boxH / 2}
				   Q {(cX + mX) / 2 - 40} {centerY - boxH / 2 - 95}
				   {mX + 8} {centerY - boxH / 2}"
				class="attack-arrow right"
				fill="none"
				marker-end="url(#arrow-right)"
			/>
			<text x={(cX + mX) / 2 - 20} y={centerY - boxH / 2 - 75} class="attack-label right">
				Decrypt with K₂
			</text>
		{/if}

		<!-- Table (from left side attack) -->
		{#if display.showTable}
			<g transform="translate(40, 145)">
				<text x="0" y="0" class="table-title">Lookup Table (from P side)</text>

				<!-- Table header -->
				<rect x="0" y="10" width="180" height="24" class="table-header" />
				<text x="50" y="26" class="table-header-text">K₁</text>
				<text x="130" y="26" class="table-header-text">M</text>
				<line x1="90" y1="10" x2="90" y2={34 + display.tableCount * 28} class="table-divider" />

				<!-- Table rows -->
				{#each tableEntries.slice(0, display.tableCount) as entry, i}
					<rect
						x="0"
						y={34 + i * 28}
						width="180"
						height="28"
						class="table-row"
						class:match-row={display.matchFound && i === 1}
					/>
					<text x="10" y={52 + i * 28} class="table-cell">{entry.k}</text>
					<text x="100" y={52 + i * 28} class="table-cell" class:match-text={display.matchFound && i === 1}>
						{entry.m}
					</text>
				{/each}

				{#if display.tableCount === 4}
					<text x="90" y={34 + 4 * 28 + 16} class="table-ellipsis">... 2⁵⁶ entries ...</text>
				{/if}
			</g>
		{/if}

		<!-- Search from right side -->
		{#if display.showSearch}
			<g transform="translate(280, 145)">
				<text x="0" y="0" class="table-title search">Trying K₂ values (from C side)</text>

				{#each searchEntries.slice(0, display.searchCount) as entry, i}
					<g transform="translate(0, {20 + i * 36})">
						<text x="0" y="12" class="search-key">{entry.k}</text>
						<text x="0" y="30" class="search-result" class:no-match={!entry.match} class:match={entry.match}>
							{entry.m} → {entry.match ? 'MATCH!' : 'not in table'}
						</text>
						{#if entry.match && display.matchFound}
							<rect x="-5" y="0" width="180" height="40" rx="4" class="match-highlight" />
						{/if}
					</g>
				{/each}
			</g>
		{/if}

		<!-- Work calculation -->
		{#if display.matchFound}
			<g transform="translate({width / 2}, 355)">
				<text x="0" y="0" class="calc-text">
					Total work: 2⁵⁶ + 2⁵⁶ = 2⁵⁷ operations
				</text>
				<text x="0" y="20" class="calc-sub">
					(not 2¹¹² as expected)
				</text>
			</g>
		{/if}
	</svg>

	<div class="label" class:success={display.matchFound}>{display.label}</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 1rem;
	}

	.scene {
		width: 100%;
		max-width: 540px;
		height: auto;
	}

	.fade-in {
		animation: fadeIn 0.4s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Boxes */
	.box {
		stroke-width: 2;
		transition: all 0.4s ease;
	}

	.box.known {
		fill: var(--color-bg-card);
		stroke: var(--color-accent);
	}

	.box.encrypt {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
	}

	.box.intermediate {
		fill: var(--color-bg-card);
		stroke: var(--color-fg-muted);
	}

	.box.highlight-left {
		stroke: var(--color-accent);
	}

	.box.highlight-right {
		stroke: var(--color-error);
	}

	.box.highlight-middle {
		stroke: var(--color-math);
		stroke-width: 3;
	}

	.box.match-glow {
		stroke: var(--color-accent);
		stroke-width: 3;
		filter: drop-shadow(0 0 8px var(--color-accent));
	}

	.box-label {
		fill: var(--color-fg);
		font-size: 13px;
		font-weight: bold;
		font-family: monospace;
		text-anchor: middle;
	}

	.key-label {
		fill: var(--color-fg-muted);
		font-size: 12px;
		font-weight: bold;
		font-family: monospace;
		text-anchor: middle;
		transition: fill 0.4s ease;
	}

	.key-label.key-left {
		fill: var(--color-accent);
	}

	.key-label.key-right {
		fill: var(--color-error);
	}

	.key-arrow {
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: stroke 0.4s ease;
	}

	.key-arrow.key-left {
		stroke: var(--color-accent);
	}

	.key-arrow.key-right {
		stroke: var(--color-error);
	}

	.key-arrow-head {
		fill: var(--color-fg-muted);
		transition: fill 0.4s ease;
	}

	.key-arrow-head.key-left {
		fill: var(--color-accent);
	}

	.key-arrow-head.key-right {
		fill: var(--color-error);
	}

	.sub-label {
		fill: var(--color-fg-muted);
		font-size: 10px;
		text-anchor: middle;
	}

	.sub-label.accent {
		fill: var(--color-math);
		font-weight: bold;
	}

	/* Arrows */
	.arrow {
		stroke: var(--color-fg-muted);
		stroke-width: 2;
		transition: stroke 0.4s ease;
	}

	.arrow-head {
		fill: var(--color-fg-muted);
		transition: fill 0.4s ease;
	}

	.arrow.arrow-left,
	.arrow-head.arrow-left {
		stroke: var(--color-accent);
		fill: var(--color-accent);
	}

	.arrow.arrow-right,
	.arrow-head.arrow-right {
		stroke: var(--color-error);
		fill: var(--color-error);
	}

	/* Attack arrows */
	.attack-arrow {
		stroke-width: 2;
		stroke-dasharray: 6 3;
	}

	.attack-arrow.left {
		stroke: var(--color-accent);
	}

	.attack-arrow.right {
		stroke: var(--color-error);
	}

	.attack-label {
		font-size: 11px;
		font-family: monospace;
		text-anchor: middle;
	}

	.attack-label.left {
		fill: var(--color-accent);
	}

	.attack-label.right {
		fill: var(--color-error);
	}

	/* Table */
	.table-title {
		fill: var(--color-fg);
		font-size: 12px;
		font-weight: bold;
	}

	.table-title.search {
		fill: var(--color-error);
	}

	.table-header {
		fill: var(--color-border);
		rx: 4;
	}

	.table-header-text {
		fill: var(--color-fg);
		font-size: 11px;
		font-weight: bold;
		font-family: monospace;
		text-anchor: middle;
	}

	.table-divider {
		stroke: var(--color-border);
		stroke-width: 1;
	}

	.table-row {
		fill: var(--color-bg-card);
		stroke: var(--color-border);
		stroke-width: 1;
		transition: all 0.3s ease;
	}

	.table-row.match-row {
		fill: var(--color-accent);
		fill-opacity: 0.2;
		stroke: var(--color-accent);
	}

	.table-cell {
		fill: var(--color-fg-muted);
		font-size: 10px;
		font-family: monospace;
	}

	.table-cell.match-text {
		fill: var(--color-accent);
		font-weight: bold;
	}

	.table-ellipsis {
		fill: var(--color-fg-muted);
		font-size: 10px;
		font-style: italic;
		text-anchor: middle;
	}

	/* Search */
	.search-key {
		fill: var(--color-fg);
		font-size: 11px;
		font-family: monospace;
	}

	.search-result {
		font-size: 10px;
		font-family: monospace;
		transition: fill 0.3s ease;
	}

	.search-result.no-match {
		fill: var(--color-fg-muted);
	}

	.search-result.match {
		fill: var(--color-accent);
		font-weight: bold;
	}

	.match-highlight {
		fill: var(--color-accent);
		fill-opacity: 0.1;
		stroke: var(--color-accent);
		stroke-width: 2;
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* Calculation */
	.calc-text {
		fill: var(--color-error);
		font-size: 14px;
		font-weight: bold;
		text-anchor: middle;
	}

	.calc-sub {
		fill: var(--color-fg-muted);
		font-size: 11px;
		text-anchor: middle;
	}

	/* Label */
	.label {
		font-size: 1.1rem;
		color: var(--color-fg);
		text-align: center;
		max-width: 450px;
		transition: color 0.3s ease;
	}

	.label.success {
		color: var(--color-accent);
		font-weight: bold;
	}
</style>
