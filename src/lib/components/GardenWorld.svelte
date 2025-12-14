<script lang="ts">
	import type { TreeNode } from '$lib/content/tree';

	let { subjects }: { subjects: TreeNode[] } = $props();

	// Pixel size - all coordinates snap to this grid
	const PX = 4;

	// House positions for subjects (will expand as more subjects added)
	const housePositions = [
		{ x: 60, y: 52, label: 'Mathematics' },
		{ x: 140, y: 56, label: 'Physics' },
		{ x: 200, y: 50, label: 'Chemistry' },
	];
</script>

<div class="world-container">
	<svg
		viewBox="0 0 256 144"
		preserveAspectRatio="xMidYMid slice"
		class="world"
	>
		<!-- Sky - solid color, pixelated clouds -->
		<rect x="0" y="0" width="256" height="144" fill="#282828" />

		<!-- Stars -->
		<g class="stars">
			<rect x="20" y="8" width="{PX}" height="{PX}" fill="#fbf1c7" opacity="0.6" />
			<rect x="45" y="16" width="{PX}" height="{PX}" fill="#fbf1c7" opacity="0.4" />
			<rect x="80" y="6" width="{PX}" height="{PX}" fill="#fbf1c7" opacity="0.7" />
			<rect x="120" y="12" width="{PX}" height="{PX}" fill="#fbf1c7" opacity="0.5" />
			<rect x="150" y="4" width="{PX}" height="{PX}" fill="#fbf1c7" opacity="0.6" />
			<rect x="180" y="14" width="{PX}" height="{PX}" fill="#fbf1c7" opacity="0.4" />
			<rect x="210" y="8" width="{PX}" height="{PX}" fill="#fbf1c7" opacity="0.7" />
			<rect x="240" y="18" width="{PX}" height="{PX}" fill="#fbf1c7" opacity="0.5" />
		</g>

		<!-- Pixel clouds -->
		<g class="cloud cloud-1">
			<rect x="30" y="12" width="24" height="{PX}" fill="#3c3836" />
			<rect x="26" y="16" width="32" height="{PX}" fill="#3c3836" />
			<rect x="30" y="20" width="24" height="{PX}" fill="#3c3836" />
		</g>
		<g class="cloud cloud-2">
			<rect x="180" y="20" width="20" height="{PX}" fill="#3c3836" />
			<rect x="176" y="24" width="28" height="{PX}" fill="#3c3836" />
			<rect x="180" y="28" width="20" height="{PX}" fill="#3c3836" />
		</g>
		<g class="cloud cloud-3">
			<rect x="100" y="8" width="16" height="{PX}" fill="#3c3836" />
			<rect x="96" y="12" width="24" height="{PX}" fill="#3c3836" />
			<rect x="100" y="16" width="16" height="{PX}" fill="#3c3836" />
		</g>

		<!-- Mountains (background) -->
		<g class="mountains">
			<!-- Mountain 1 (left) -->
			<polygon points="0,60 32,28 64,60" fill="#504945" />
			<polygon points="32,28 40,28 48,36 32,36" fill="#665c54" />
			<!-- Mountain 2 (center, taller) -->
			<polygon points="80,60 128,16 176,60" fill="#3c3836" />
			<polygon points="128,16 140,16 152,28 128,28" fill="#504945" />
			<!-- Mountain 3 (right) -->
			<polygon points="180,60 224,32 256,60" fill="#504945" />
			<polygon points="224,32 232,32 240,40 224,40" fill="#665c54" />
		</g>

		<!-- Distant trees (on mountains) -->
		<g class="trees-distant">
			{#each [16, 48, 72, 96, 160, 184, 208, 232] as tx}
				<rect x={tx} y="52" width="{PX}" height="8" fill="#79740e" />
				<rect x={tx - 4} y="44" width="12" height="8" fill="#79740e" />
				<rect x={tx - 2} y="40" width="8" height="{PX}" fill="#98971a" />
			{/each}
		</g>

		<!-- Ground base -->
		<rect x="0" y="60" width="256" height="84" fill="#504945" />

		<!-- River -->
		<g class="river">
			<rect x="0" y="68" width="256" height="16" fill="#458588" />
			<!-- Pixel water ripples -->
			<g class="ripples">
				<rect x="8" y="72" width="12" height="{PX}" fill="#83a598" class="ripple-1" />
				<rect x="40" y="76" width="16" height="{PX}" fill="#83a598" class="ripple-2" />
				<rect x="80" y="72" width="12" height="{PX}" fill="#83a598" class="ripple-1" />
				<rect x="120" y="76" width="16" height="{PX}" fill="#83a598" class="ripple-2" />
				<rect x="160" y="72" width="12" height="{PX}" fill="#83a598" class="ripple-1" />
				<rect x="200" y="76" width="16" height="{PX}" fill="#83a598" class="ripple-2" />
				<rect x="240" y="72" width="16" height="{PX}" fill="#83a598" class="ripple-1" />
			</g>
			<!-- River banks -->
			<rect x="0" y="68" width="256" height="{PX}" fill="#665c54" />
			<rect x="0" y="84" width="256" height="{PX}" fill="#665c54" />
		</g>

		<!-- Bridge -->
		<g class="bridge">
			<rect x="108" y="64" width="40" height="{PX}" fill="#a89984" />
			<rect x="108" y="68" width="{PX * 2}" height="20" fill="#a89984" />
			<rect x="140" y="68" width="{PX * 2}" height="20" fill="#a89984" />
			<rect x="108" y="84" width="40" height="{PX}" fill="#a89984" />
			<!-- Bridge planks -->
			<rect x="112" y="68" width="28" height="{PX}" fill="#d5c4a1" />
			<rect x="112" y="72" width="28" height="{PX}" fill="#bdae93" />
			<rect x="112" y="76" width="28" height="{PX}" fill="#d5c4a1" />
			<rect x="112" y="80" width="28" height="{PX}" fill="#bdae93" />
		</g>

		<!-- Path -->
		<g class="path">
			<rect x="120" y="88" width="16" height="56" fill="#665c54" />
			<!-- Path texture -->
			<rect x="124" y="92" width="{PX}" height="{PX}" fill="#7c6f64" />
			<rect x="128" y="100" width="{PX}" height="{PX}" fill="#7c6f64" />
			<rect x="124" y="112" width="{PX}" height="{PX}" fill="#7c6f64" />
			<rect x="128" y="124" width="{PX}" height="{PX}" fill="#7c6f64" />
			<rect x="124" y="136" width="{PX}" height="{PX}" fill="#7c6f64" />
		</g>

		<!-- Grass patches -->
		<g class="grass">
			{#each [8, 24, 44, 64, 88, 152, 172, 192, 216, 236] as gx}
				<rect x={gx} y="88" width="{PX}" height="8" fill="#98971a" class="grass-blade" />
				<rect x={gx + 6} y="90" width="{PX}" height="6" fill="#b8bb26" class="grass-blade" />
			{/each}
		</g>

		<!-- Trees (foreground) -->
		<g class="trees-front">
			<!-- Tree left of path -->
			<g class="tree tree-1">
				<rect x="24" y="92" width="8" height="20" fill="#3c3836" />
				<rect x="12" y="76" width="32" height="16" fill="#98971a" />
				<rect x="16" y="68" width="24" height="8" fill="#98971a" />
				<rect x="20" y="60" width="16" height="8" fill="#b8bb26" />
				<rect x="24" y="56" width="8" height="{PX}" fill="#b8bb26" />
			</g>
			<!-- Tree right side -->
			<g class="tree tree-2">
				<rect x="200" y="96" width="8" height="16" fill="#3c3836" />
				<rect x="188" y="80" width="32" height="16" fill="#98971a" />
				<rect x="192" y="72" width="24" height="8" fill="#98971a" />
				<rect x="196" y="64" width="16" height="8" fill="#b8bb26" />
			</g>
			<!-- Small tree far right -->
			<g class="tree tree-3">
				<rect x="240" y="100" width="{PX}" height="12" fill="#3c3836" />
				<rect x="232" y="88" width="20" height="12" fill="#79740e" />
				<rect x="236" y="84" width="12" height="{PX}" fill="#98971a" />
			</g>
		</g>

		<!-- HOUSES (clickable subjects) -->
		{#each subjects as subject, i}
			{@const pos = housePositions[i] || { x: 60 + i * 60, y: 52 }}
			<a href="/{subject.path}" class="house-link">
				<g class="house" data-subject={subject.slug}>
					<!-- House shadow -->
					<rect x={pos.x - 2} y={pos.y + 26} width="40" height="{PX}" fill="#282828" opacity="0.3" />

					<!-- House body -->
					<rect x={pos.x} y={pos.y + 8} width="36" height="20" fill="#a89984" />
					<rect x={pos.x + 4} y={pos.y + 12} width="28" height="16" fill="#d5c4a1" />

					<!-- Roof -->
					<rect x={pos.x - 4} y={pos.y + 4} width="44" height="{PX}" fill="#cc241d" />
					<rect x={pos.x} y={pos.y} width="36" height="{PX}" fill="#cc241d" />
					<rect x={pos.x + 4} y={pos.y - 4} width="28" height="{PX}" fill="#fb4934" />
					<rect x={pos.x + 12} y={pos.y - 8} width="12" height="{PX}" fill="#fb4934" />

					<!-- Door -->
					<rect x={pos.x + 14} y={pos.y + 16} width="8" height="12" fill="#3c3836" />
					<rect x={pos.x + 18} y={pos.y + 20} width="{PX/2}" height="{PX/2}" fill="#fabd2f" />

					<!-- Window -->
					<rect x={pos.x + 6} y={pos.y + 14} width="6" height="6" fill="#83a598" />
					<rect x={pos.x + 8} y={pos.y + 14} width="{PX/2}" height="6" fill="#3c3836" />
					<rect x={pos.x + 6} y={pos.y + 16} width="6" height="{PX/2}" fill="#3c3836" />

					<!-- Chimney -->
					<rect x={pos.x + 26} y={pos.y - 8} width="6" height="12" fill="#504945" />

					<!-- Smoke -->
					<g class="smoke">
						<rect x={pos.x + 27} y={pos.y - 14} width="{PX}" height="{PX}" fill="#7c6f64" class="smoke-1" />
						<rect x={pos.x + 29} y={pos.y - 20} width="{PX}" height="{PX}" fill="#7c6f64" class="smoke-2" />
						<rect x={pos.x + 26} y={pos.y - 26} width="{PX}" height="{PX}" fill="#7c6f64" class="smoke-3" />
					</g>

					<!-- Sign post -->
					<rect x={pos.x + 40} y={pos.y + 12} width="{PX}" height="16" fill="#3c3836" />
					<rect x={pos.x + 36} y={pos.y + 8} width="16" height="8" fill="#d5c4a1" />
				</g>

				<!-- Label (shows on hover) -->
				<text
					x={pos.x + 18}
					y={pos.y + 38}
					class="house-label"
					text-anchor="middle"
					font-size="6"
					fill="#fbf1c7"
				>{subject.title}</text>
			</a>
		{/each}

		<!-- Flowers -->
		<g class="flowers">
			<g class="flower flower-1">
				<rect x="52" y="108" width="{PX}" height="8" fill="#98971a" />
				<rect x="48" y="104" width="{PX}" height="{PX}" fill="#fb4934" />
				<rect x="56" y="104" width="{PX}" height="{PX}" fill="#fb4934" />
				<rect x="52" y="100" width="{PX}" height="{PX}" fill="#fb4934" />
				<rect x="52" y="108" width="{PX}" height="{PX}" fill="#fb4934" />
				<rect x="52" y="104" width="{PX}" height="{PX}" fill="#fabd2f" />
			</g>
			<g class="flower flower-2">
				<rect x="176" y="104" width="{PX}" height="8" fill="#98971a" />
				<rect x="172" y="100" width="{PX}" height="{PX}" fill="#d3869b" />
				<rect x="180" y="100" width="{PX}" height="{PX}" fill="#d3869b" />
				<rect x="176" y="96" width="{PX}" height="{PX}" fill="#d3869b" />
				<rect x="176" y="104" width="{PX}" height="{PX}" fill="#d3869b" />
				<rect x="176" y="100" width="{PX}" height="{PX}" fill="#fabd2f" />
			</g>
		</g>

		<!-- Butterflies -->
		<g class="butterfly butterfly-1">
			<rect x="0" y="0" width="6" height="{PX}" fill="#d3869b" class="wing-l" />
			<rect x="6" y="2" width="{PX/2}" height="{PX/2}" fill="#3c3836" />
			<rect x="8" y="0" width="6" height="{PX}" fill="#d3869b" class="wing-r" />
		</g>
		<g class="butterfly butterfly-2">
			<rect x="0" y="0" width="{PX}" height="{PX}" fill="#83a598" class="wing-l" />
			<rect x="4" y="1" width="{PX/2}" height="{PX/2}" fill="#3c3836" />
			<rect x="6" y="0" width="{PX}" height="{PX}" fill="#83a598" class="wing-r" />
		</g>
	</svg>

	<!-- Title overlay -->
	<div class="title-overlay">
		<h1>garden</h1>
		<p>a place where fine truths grow into something greater</p>
	</div>
</div>

<style>
	.world-container {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: #1d2021;
	}

	.world {
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
	}

	.title-overlay {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		text-align: center;
		pointer-events: none;
	}

	.title-overlay h1 {
		font-size: 2rem;
		color: #fbf1c7;
		text-shadow: 2px 2px 0 #282828, -2px -2px 0 #282828, 2px -2px 0 #282828, -2px 2px 0 #282828;
		margin-bottom: 0.5rem;
	}

	.title-overlay p {
		font-size: 0.875rem;
		color: #d5c4a1;
		text-shadow: 1px 1px 0 #282828;
	}

	/* House interactivity */
	.house-link {
		cursor: pointer;
	}

	.house {
		transition: transform 0.2s ease;
	}

	.house-link:hover .house {
		transform: translateY(-2px);
	}

	.house-label {
		opacity: 0;
		transition: opacity 0.2s ease;
		font-family: var(--font-mono);
	}

	.house-link:hover .house-label {
		opacity: 1;
	}

	/* Smoke animation */
	.smoke-1, .smoke-2, .smoke-3 {
		animation: smoke-rise 3s ease-out infinite;
	}

	.smoke-2 {
		animation-delay: -1s;
	}

	.smoke-3 {
		animation-delay: -2s;
	}

	@keyframes smoke-rise {
		0% {
			opacity: 0.8;
			transform: translateY(0) translateX(0);
		}
		50% {
			opacity: 0.4;
			transform: translateY(-4px) translateX(2px);
		}
		100% {
			opacity: 0;
			transform: translateY(-8px) translateX(-2px);
		}
	}

	/* Cloud drift */
	.cloud-1 {
		animation: cloud-drift 60s linear infinite;
	}

	.cloud-2 {
		animation: cloud-drift 80s linear infinite;
		animation-delay: -20s;
	}

	.cloud-3 {
		animation: cloud-drift 70s linear infinite;
		animation-delay: -40s;
	}

	@keyframes cloud-drift {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(280px);
		}
	}

	/* Star twinkle */
	.stars rect {
		animation: twinkle 3s ease-in-out infinite;
	}

	.stars rect:nth-child(2n) {
		animation-delay: -1s;
	}

	.stars rect:nth-child(3n) {
		animation-delay: -2s;
	}

	@keyframes twinkle {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 0.8; }
	}

	/* River flow */
	.ripple-1 {
		animation: ripple-flow 4s linear infinite;
	}

	.ripple-2 {
		animation: ripple-flow 5s linear infinite;
		animation-delay: -2s;
	}

	@keyframes ripple-flow {
		0% {
			transform: translateX(0);
			opacity: 0.6;
		}
		50% {
			opacity: 0.8;
		}
		100% {
			transform: translateX(-20px);
			opacity: 0.6;
		}
	}

	/* Tree sway */
	.tree-1 {
		transform-origin: 28px 112px;
		animation: tree-sway 8s ease-in-out infinite;
	}

	.tree-2 {
		transform-origin: 204px 112px;
		animation: tree-sway 7s ease-in-out infinite;
		animation-delay: -2s;
	}

	.tree-3 {
		transform-origin: 242px 112px;
		animation: tree-sway 6s ease-in-out infinite;
		animation-delay: -4s;
	}

	@keyframes tree-sway {
		0%, 100% { transform: rotate(-0.5deg); }
		50% { transform: rotate(0.5deg); }
	}

	/* Grass sway */
	.grass-blade {
		animation: grass-sway 2s ease-in-out infinite;
		transform-origin: center bottom;
	}

	.grass-blade:nth-child(2n) {
		animation-delay: -0.5s;
	}

	@keyframes grass-sway {
		0%, 100% { transform: skewX(-3deg); }
		50% { transform: skewX(3deg); }
	}

	/* Flower bob */
	.flower-1 {
		animation: flower-bob 4s ease-in-out infinite;
	}

	.flower-2 {
		animation: flower-bob 4.5s ease-in-out infinite;
		animation-delay: -1.5s;
	}

	@keyframes flower-bob {
		0%, 100% { transform: rotate(-2deg); }
		50% { transform: rotate(2deg); }
	}

	/* Butterflies */
	.butterfly-1 {
		animation: butterfly-fly-1 20s ease-in-out infinite;
	}

	.butterfly-2 {
		animation: butterfly-fly-2 25s ease-in-out infinite;
		animation-delay: -10s;
	}

	@keyframes butterfly-fly-1 {
		0% { transform: translate(60px, 90px); }
		10% { transform: translate(80px, 85px); }
		20% { transform: translate(100px, 92px); }
		30% { transform: translate(85px, 80px); }
		40% { transform: translate(70px, 88px); }
		50% { transform: translate(90px, 95px); }
		60% { transform: translate(110px, 82px); }
		70% { transform: translate(95px, 90px); }
		80% { transform: translate(75px, 84px); }
		90% { transform: translate(65px, 92px); }
		100% { transform: translate(60px, 90px); }
	}

	@keyframes butterfly-fly-2 {
		0% { transform: translate(180px, 95px); }
		15% { transform: translate(165px, 88px); }
		30% { transform: translate(185px, 82px); }
		45% { transform: translate(170px, 90px); }
		60% { transform: translate(190px, 85px); }
		75% { transform: translate(175px, 92px); }
		90% { transform: translate(195px, 88px); }
		100% { transform: translate(180px, 95px); }
	}

	.butterfly .wing-l,
	.butterfly .wing-r {
		animation: flutter 0.15s ease-in-out infinite alternate;
		transform-origin: center;
	}

	@keyframes flutter {
		0% { transform: scaleY(1); }
		100% { transform: scaleY(0.4); }
	}
</style>
