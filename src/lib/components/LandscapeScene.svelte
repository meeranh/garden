<script lang="ts">
	let { width = 256, height = 160 }: { width?: number; height?: number } = $props();
</script>

<svg
	{width}
	{height}
	viewBox="0 0 256 160"
	class="landscape"
	overflow="visible"
>
	<!-- Sky gradient -->
	<defs>
		<linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color="#1d2021" />
			<stop offset="30%" stop-color="#3c3836" />
			<stop offset="60%" stop-color="#d3869b" />
			<stop offset="85%" stop-color="#fe8019" />
			<stop offset="100%" stop-color="#fabd2f" />
		</linearGradient>
	</defs>

	<!-- Sky -->
	<rect x="0" y="0" width="256" height="120" fill="url(#sky-gradient)" />

	<!-- Sun (setting) -->
	<g class="sun">
		<circle cx="200" cy="95" r="20" fill="#fabd2f" class="sun-core" />
		<circle cx="200" cy="95" r="24" fill="#fabd2f" opacity="0.4" class="sun-glow-1" />
		<circle cx="200" cy="95" r="30" fill="#fe8019" opacity="0.2" class="sun-glow-2" />
	</g>

	<!-- Distant hills -->
	<g class="hills">
		<!-- Hill 1 (left) -->
		<polygon points="0,110 40,70 80,110" fill="#504945" />
		<!-- Hill 2 (center) -->
		<polygon points="60,110 120,55 180,110" fill="#3c3836" />
		<!-- Hill 3 (right) -->
		<polygon points="150,110 210,65 256,110" fill="#504945" />
	</g>

	<!-- Back trees (distant, smaller) -->
	<g class="trees-back">
		<!-- Pine 1 -->
		<g class="tree-back-1">
			<rect x="25" y="95" width="4" height="10" fill="#504945" />
			<polygon points="27,95 17,75 37,95" fill="#79740e" />
			<polygon points="27,85 19,70 35,85" fill="#79740e" />
		</g>
		<!-- Pine 2 -->
		<g class="tree-back-2">
			<rect x="55" y="92" width="4" height="12" fill="#504945" />
			<polygon points="57,92 45,68 69,92" fill="#689d6a" />
			<polygon points="57,80 47,62 67,80" fill="#689d6a" />
		</g>
		<!-- Small deciduous -->
		<g class="tree-back-3">
			<rect x="90" y="95" width="3" height="8" fill="#504945" />
			<ellipse cx="91" cy="88" rx="10" ry="8" fill="#79740e" />
		</g>
		<!-- Pine 3 -->
		<g class="tree-back-4">
			<rect x="145" y="90" width="5" height="14" fill="#504945" />
			<polygon points="147,90 133,60 161,90" fill="#689d6a" />
			<polygon points="147,75 136,52 158,75" fill="#689d6a" />
		</g>
		<!-- Small pine -->
		<g class="tree-back-5">
			<rect x="175" y="95" width="3" height="8" fill="#504945" />
			<polygon points="176,95 168,78 184,95" fill="#79740e" />
		</g>
	</g>

	<!-- River -->
	<g class="river">
		<rect x="0" y="105" width="256" height="20" fill="#458588" />
		<!-- Water ripples -->
		<g class="ripple-1">
			<rect x="0" y="108" width="30" height="2" fill="#83a598" opacity="0.6" />
			<rect x="50" y="112" width="40" height="2" fill="#83a598" opacity="0.5" />
			<rect x="110" y="108" width="25" height="2" fill="#83a598" opacity="0.6" />
			<rect x="160" y="114" width="35" height="2" fill="#83a598" opacity="0.5" />
			<rect x="220" y="110" width="36" height="2" fill="#83a598" opacity="0.6" />
		</g>
		<g class="ripple-2">
			<rect x="20" y="116" width="25" height="2" fill="#83a598" opacity="0.4" />
			<rect x="70" y="118" width="30" height="2" fill="#83a598" opacity="0.5" />
			<rect x="130" y="116" width="20" height="2" fill="#83a598" opacity="0.4" />
			<rect x="180" y="120" width="40" height="2" fill="#83a598" opacity="0.5" />
			<rect x="240" y="118" width="16" height="2" fill="#83a598" opacity="0.4" />
		</g>
	</g>

	<!-- Ground -->
	<rect x="0" y="125" width="256" height="35" fill="#665c54" />
	<rect x="0" y="130" width="256" height="30" fill="#504945" />

	<!-- Front trees (closer, larger, more detailed) -->
	<g class="trees-front">
		<!-- Large pine (left) -->
		<g class="tree-front-1">
			<rect x="10" y="105" width="8" height="25" fill="#3c3836" />
			<polygon points="14,105 -8,55 36,105" fill="#98971a" />
			<polygon points="14,80 -2,40 30,80" fill="#98971a" />
			<polygon points="14,60 4,30 24,60" fill="#b8bb26" />
		</g>

		<!-- Deciduous tree (left-center) -->
		<g class="tree-front-2">
			<rect x="58" y="110" width="6" height="20" fill="#3c3836" />
			<ellipse cx="61" cy="95" rx="18" ry="16" fill="#98971a" />
			<ellipse cx="55" cy="90" rx="12" ry="10" fill="#b8bb26" />
			<ellipse cx="68" cy="92" rx="10" ry="9" fill="#79740e" />
		</g>

		<!-- Medium pine (center-right) -->
		<g class="tree-front-3">
			<rect x="180" y="108" width="6" height="18" fill="#3c3836" />
			<polygon points="183,108 165,65 201,108" fill="#98971a" />
			<polygon points="183,85 168,50 198,85" fill="#98971a" />
			<polygon points="183,68 172,42 194,68" fill="#b8bb26" />
		</g>

		<!-- Small deciduous (right) -->
		<g class="tree-front-4">
			<rect x="230" y="115" width="5" height="15" fill="#3c3836" />
			<ellipse cx="232" cy="105" rx="14" ry="12" fill="#98971a" />
			<ellipse cx="228" cy="102" rx="8" ry="7" fill="#b8bb26" />
		</g>
	</g>

	<!-- Grass tufts -->
	<g class="grass">
		<rect x="5" y="125" width="2" height="5" fill="#98971a" />
		<rect x="8" y="126" width="2" height="4" fill="#79740e" />
		<rect x="35" y="125" width="2" height="5" fill="#b8bb26" />
		<rect x="50" y="126" width="2" height="4" fill="#98971a" />
		<rect x="95" y="125" width="2" height="5" fill="#79740e" />
		<rect x="120" y="126" width="2" height="4" fill="#98971a" />
		<rect x="150" y="125" width="2" height="5" fill="#b8bb26" />
		<rect x="200" y="126" width="2" height="4" fill="#98971a" />
		<rect x="220" y="125" width="2" height="5" fill="#79740e" />
		<rect x="245" y="126" width="2" height="4" fill="#b8bb26" />
	</g>

	<!-- Birds -->
	<g class="bird-1">
		<path d="M0,30 Q3,27 6,30 M6,30 Q9,27 12,30" stroke="#3c3836" stroke-width="1.5" fill="none" />
	</g>
	<g class="bird-2">
		<path d="M0,45 Q2,43 4,45 M4,45 Q6,43 8,45" stroke="#504945" stroke-width="1" fill="none" />
	</g>
	<g class="bird-3">
		<path d="M0,25 Q2,23 4,25 M4,25 Q6,23 8,25" stroke="#504945" stroke-width="1" fill="none" />
	</g>
</svg>

<style>
	.landscape {
		display: block;
	}

	/* Sun glow pulse */
	.sun-core {
		animation: sun-pulse 4s ease-in-out infinite;
	}

	.sun-glow-1 {
		animation: glow-pulse 4s ease-in-out infinite;
		animation-delay: 0.5s;
	}

	.sun-glow-2 {
		animation: glow-pulse 4s ease-in-out infinite;
		animation-delay: 1s;
	}

	@keyframes sun-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.85; }
	}

	@keyframes glow-pulse {
		0%, 100% { opacity: 0.4; transform: scale(1); }
		50% { opacity: 0.6; transform: scale(1.05); }
	}

	/* River flow */
	.ripple-1 {
		animation: flow-1 8s linear infinite;
	}

	.ripple-2 {
		animation: flow-2 10s linear infinite;
	}

	@keyframes flow-1 {
		0% { transform: translateX(0); }
		100% { transform: translateX(-60px); }
	}

	@keyframes flow-2 {
		0% { transform: translateX(0); }
		100% { transform: translateX(-80px); }
	}

	/* Front trees sway - gentle breeze */
	.tree-front-1 {
		transform-origin: 14px 130px;
		animation: sway-large 6s ease-in-out infinite;
	}

	.tree-front-2 {
		transform-origin: 61px 130px;
		animation: sway-medium 7s ease-in-out infinite;
		animation-delay: -2s;
	}

	.tree-front-3 {
		transform-origin: 183px 126px;
		animation: sway-medium 5.5s ease-in-out infinite;
		animation-delay: -1s;
	}

	.tree-front-4 {
		transform-origin: 232px 130px;
		animation: sway-small 6.5s ease-in-out infinite;
		animation-delay: -3s;
	}

	@keyframes sway-large {
		0%, 100% { transform: rotate(-1deg); }
		50% { transform: rotate(1deg); }
	}

	@keyframes sway-medium {
		0%, 100% { transform: rotate(-0.8deg); }
		50% { transform: rotate(0.8deg); }
	}

	@keyframes sway-small {
		0%, 100% { transform: rotate(-0.5deg); }
		50% { transform: rotate(0.5deg); }
	}

	/* Back trees - subtler sway */
	.tree-back-1, .tree-back-2, .tree-back-3, .tree-back-4, .tree-back-5 {
		animation: sway-distant 8s ease-in-out infinite;
	}

	.tree-back-1 { transform-origin: 27px 105px; animation-delay: 0s; }
	.tree-back-2 { transform-origin: 57px 104px; animation-delay: -1.5s; }
	.tree-back-3 { transform-origin: 91px 103px; animation-delay: -3s; }
	.tree-back-4 { transform-origin: 147px 104px; animation-delay: -4.5s; }
	.tree-back-5 { transform-origin: 176px 103px; animation-delay: -6s; }

	@keyframes sway-distant {
		0%, 100% { transform: rotate(-0.3deg); }
		50% { transform: rotate(0.3deg); }
	}

	/* Grass sway */
	.grass {
		animation: grass-sway 3s ease-in-out infinite;
		transform-origin: center bottom;
	}

	@keyframes grass-sway {
		0%, 100% { transform: skewX(-2deg); }
		50% { transform: skewX(2deg); }
	}

	/* Birds flying across */
	.bird-1 {
		animation: fly-across-1 25s linear infinite;
	}

	.bird-2 {
		animation: fly-across-2 30s linear infinite;
		animation-delay: -10s;
	}

	.bird-3 {
		animation: fly-across-3 28s linear infinite;
		animation-delay: -18s;
	}

	@keyframes fly-across-1 {
		0% { transform: translateX(-20px); opacity: 0; }
		5% { opacity: 1; }
		95% { opacity: 1; }
		100% { transform: translateX(280px); opacity: 0; }
	}

	@keyframes fly-across-2 {
		0% { transform: translateX(-20px) translateY(0); opacity: 0; }
		5% { opacity: 0.7; }
		50% { transform: translateX(130px) translateY(-8px); }
		95% { opacity: 0.7; }
		100% { transform: translateX(280px) translateY(0); opacity: 0; }
	}

	@keyframes fly-across-3 {
		0% { transform: translateX(-20px); opacity: 0; }
		5% { opacity: 0.6; }
		95% { opacity: 0.6; }
		100% { transform: translateX(280px); opacity: 0; }
	}
</style>
