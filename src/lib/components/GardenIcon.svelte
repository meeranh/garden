<script lang="ts">
	let { size = 16 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 32 32"
	class="garden-icon"
	overflow="visible"
>
	<!-- Wind waves (white, right to left) -->
	<g class="wind-wave-1">
		<rect x="40" y="4" width="4" height="1" fill="#fbf1c7" opacity="0.8"/>
		<rect x="44" y="6" width="6" height="1" fill="#fbf1c7" opacity="0.6"/>
		<rect x="42" y="8" width="3" height="1" fill="#fbf1c7" opacity="0.7"/>
	</g>
	<g class="wind-wave-2">
		<rect x="45" y="12" width="5" height="1" fill="#fbf1c7" opacity="0.6"/>
		<rect x="42" y="14" width="4" height="1" fill="#fbf1c7" opacity="0.7"/>
		<rect x="46" y="16" width="6" height="1" fill="#fbf1c7" opacity="0.5"/>
	</g>
	<g class="wind-wave-3">
		<rect x="43" y="20" width="3" height="1" fill="#fbf1c7" opacity="0.6"/>
		<rect x="46" y="22" width="5" height="1" fill="#fbf1c7" opacity="0.5"/>
		<rect x="44" y="24" width="4" height="1" fill="#fbf1c7" opacity="0.4"/>
	</g>

	<!-- Butterfly 1 (pink) - base position near flower right side -->
	<g class="butterfly-1">
		<rect x="20" y="5" width="2" height="2" fill="#d3869b" class="wing-l"/>
		<rect x="22" y="6" width="1" height="1" fill="#3c3836"/>
		<rect x="23" y="5" width="2" height="2" fill="#d3869b" class="wing-r"/>
	</g>

	<!-- Butterfly 2 (cyan) - base position near flower right side -->
	<g class="butterfly-2">
		<rect x="21" y="9" width="2" height="2" fill="#83a598" class="wing-l"/>
		<rect x="23" y="10" width="1" height="1" fill="#3c3836"/>
		<rect x="24" y="9" width="2" height="2" fill="#83a598" class="wing-r"/>
	</g>

	<!-- Soil/ground -->
	<rect x="6" y="26" width="20" height="6" fill="#665c54"/>
	<rect x="8" y="28" width="3" height="2" fill="#504945"/>
	<rect x="16" y="27" width="4" height="2" fill="#504945"/>
	<rect x="22" y="28" width="2" height="2" fill="#504945"/>

	<!-- Grass blades -->
	<g class="grass">
		<rect x="7" y="23" width="1" height="3" fill="#98971a"/>
		<rect x="9" y="24" width="1" height="2" fill="#79740e"/>
		<rect x="23" y="23" width="1" height="3" fill="#98971a"/>
		<rect x="21" y="24" width="1" height="2" fill="#79740e"/>
	</g>

	<!-- Main plant -->
	<g class="plant">
		<!-- Stem -->
		<rect x="15" y="12" width="2" height="14" fill="#98971a"/>

		<!-- Left leaf -->
		<g class="leaf-left">
			<rect x="10" y="18" width="5" height="3" fill="#b8bb26"/>
			<rect x="11" y="17" width="4" height="1" fill="#b8bb26"/>
			<rect x="12" y="16" width="2" height="1" fill="#b8bb26"/>
		</g>

		<!-- Right leaf -->
		<g class="leaf-right">
			<rect x="17" y="14" width="5" height="3" fill="#b8bb26"/>
			<rect x="17" y="13" width="4" height="1" fill="#b8bb26"/>
			<rect x="18" y="12" width="2" height="1" fill="#b8bb26"/>
		</g>

		<!-- Flower -->
		<g class="flower">
			<rect x="13" y="4" width="6" height="6" fill="#fb4934"/>
			<rect x="11" y="6" width="2" height="4" fill="#fb4934"/>
			<rect x="19" y="6" width="2" height="4" fill="#fb4934"/>
			<rect x="14" y="2" width="4" height="2" fill="#fb4934"/>
			<rect x="14" y="10" width="4" height="2" fill="#fb4934"/>
			<rect x="14" y="6" width="4" height="4" fill="#fabd2f"/>
			<rect x="15" y="7" width="2" height="2" fill="#fe8019"/>
		</g>
	</g>

	<!-- Sparkles -->
	<rect x="22" y="4" width="1" height="1" fill="#fbf1c7" class="sparkle-1"/>
	<rect x="8" y="8" width="1" height="1" fill="#fbf1c7" class="sparkle-2"/>
</svg>

<style>
	.garden-icon {
		display: inline-block;
		vertical-align: middle;
	}

	/*
	 * Total cycle: 15 seconds
	 * 0-87% (0-13s): Calm, butterflies orbit flower
	 * 87-100% (13-15s): Wind blows for 2 seconds
	 */

	/* Wind waves - 2 second duration starting at 87% */
	.wind-wave-1,
	.wind-wave-2,
	.wind-wave-3 {
		animation: wind-sweep 15s linear infinite;
	}

	.wind-wave-2 {
		animation-delay: 0.2s;
	}

	.wind-wave-3 {
		animation-delay: 0.4s;
	}

	@keyframes wind-sweep {
		0%, 86% {
			transform: translateX(0);
			opacity: 0;
		}
		87% {
			transform: translateX(0);
			opacity: 0.9;
		}
		100% {
			transform: translateX(-70px);
			opacity: 0;
		}
	}

	/* Butterflies - orbit flower then get blown away with wind */
	.butterfly-1 {
		animation: butterfly-1-cycle 15s ease-in-out infinite;
	}

	.butterfly-2 {
		animation: butterfly-2-cycle 15s ease-in-out infinite;
	}

	@keyframes butterfly-1-cycle {
		/* Enter from right */
		0% {
			transform: translate(10px, 0);
			opacity: 0;
		}
		3% {
			transform: translate(0, 0);
			opacity: 1;
		}
		/* Orbit around flower - clockwise */
		10% {
			transform: translate(-8px, -4px);
		}
		18% {
			transform: translate(-14px, 0px);
		}
		26% {
			transform: translate(-12px, 6px);
		}
		34% {
			transform: translate(-6px, 8px);
		}
		42% {
			transform: translate(0px, 6px);
		}
		50% {
			transform: translate(2px, 2px);
		}
		58% {
			transform: translate(-2px, -2px);
		}
		66% {
			transform: translate(-8px, -4px);
		}
		74% {
			transform: translate(-12px, 0px);
		}
		82% {
			transform: translate(-8px, 4px);
		}
		86% {
			transform: translate(-4px, 2px);
			opacity: 1;
		}
		/* Wind hits - get blown away */
		87% {
			transform: translate(-4px, 2px);
			opacity: 1;
		}
		93% {
			transform: translate(-35px, 4px);
			opacity: 0.7;
		}
		99% {
			transform: translate(-60px, 6px);
			opacity: 0;
		}
		100% {
			transform: translate(10px, 0);
			opacity: 0;
		}
	}

	@keyframes butterfly-2-cycle {
		/* Enter slightly later */
		0%, 5% {
			transform: translate(12px, 0);
			opacity: 0;
		}
		8% {
			transform: translate(0, 0);
			opacity: 1;
		}
		/* Orbit around flower - counter-clockwise, offset timing */
		15% {
			transform: translate(-4px, 5px);
		}
		23% {
			transform: translate(-10px, 8px);
		}
		31% {
			transform: translate(-14px, 4px);
		}
		39% {
			transform: translate(-12px, -2px);
		}
		47% {
			transform: translate(-6px, -4px);
		}
		55% {
			transform: translate(0px, -2px);
		}
		63% {
			transform: translate(-2px, 3px);
		}
		71% {
			transform: translate(-8px, 6px);
		}
		79% {
			transform: translate(-12px, 2px);
		}
		86% {
			transform: translate(-6px, 0px);
			opacity: 1;
		}
		/* Wind hits - get blown away */
		87% {
			transform: translate(-6px, 0px);
			opacity: 1;
		}
		93% {
			transform: translate(-38px, 3px);
			opacity: 0.7;
		}
		99% {
			transform: translate(-65px, 5px);
			opacity: 0;
		}
		100% {
			transform: translate(12px, 0);
			opacity: 0;
		}
	}

	.butterfly-1 .wing-l,
	.butterfly-1 .wing-r,
	.butterfly-2 .wing-l,
	.butterfly-2 .wing-r {
		animation: flutter 0.1s ease-in-out infinite alternate;
		transform-origin: center;
	}

	@keyframes flutter {
		0% { transform: scaleY(1); }
		100% { transform: scaleY(0.3); }
	}

	/* Plant - sways hard during wind (87-100%) */
	.plant {
		transform-origin: 16px 26px;
		animation: plant-wind 15s ease-in-out infinite;
	}

	@keyframes plant-wind {
		0% {
			transform: rotate(-10deg);
		}
		3% {
			transform: rotate(-6deg);
		}
		8% {
			transform: rotate(-2deg);
		}
		15% {
			transform: rotate(0deg);
		}
		86% {
			transform: rotate(0deg);
		}
		90% {
			transform: rotate(-8deg);
		}
		96% {
			transform: rotate(-14deg);
		}
		100% {
			transform: rotate(-10deg);
		}
	}

	.leaf-left {
		transform-origin: 15px 19px;
		animation: leaf-left-wind 15s ease-in-out infinite;
	}

	.leaf-right {
		transform-origin: 17px 15px;
		animation: leaf-right-wind 15s ease-in-out infinite;
	}

	@keyframes leaf-left-wind {
		0% {
			transform: rotate(-20deg);
		}
		5% {
			transform: rotate(-10deg);
		}
		15% {
			transform: rotate(0deg);
		}
		86% {
			transform: rotate(0deg);
		}
		90% {
			transform: rotate(-15deg);
		}
		96% {
			transform: rotate(-25deg);
		}
		100% {
			transform: rotate(-20deg);
		}
	}

	@keyframes leaf-right-wind {
		0% {
			transform: rotate(-15deg);
		}
		5% {
			transform: rotate(-8deg);
		}
		15% {
			transform: rotate(0deg);
		}
		86% {
			transform: rotate(0deg);
		}
		90% {
			transform: rotate(-10deg);
		}
		96% {
			transform: rotate(-18deg);
		}
		100% {
			transform: rotate(-15deg);
		}
	}

	.flower {
		transform-origin: 16px 8px;
		animation: flower-wind 15s ease-in-out infinite;
	}

	@keyframes flower-wind {
		0% {
			transform: rotate(-15deg) translateX(-3px);
		}
		5% {
			transform: rotate(-8deg) translateX(-1px);
		}
		15% {
			transform: rotate(0deg) translateX(0);
		}
		86% {
			transform: rotate(0deg) translateX(0);
		}
		90% {
			transform: rotate(-10deg) translateX(-2px);
		}
		96% {
			transform: rotate(-18deg) translateX(-4px);
		}
		100% {
			transform: rotate(-15deg) translateX(-3px);
		}
	}

	.grass {
		transform-origin: 16px 26px;
		animation: grass-wind 15s ease-in-out infinite;
	}

	@keyframes grass-wind {
		0% {
			transform: skewX(-18deg);
		}
		5% {
			transform: skewX(-10deg);
		}
		15% {
			transform: skewX(0deg);
		}
		86% {
			transform: skewX(0deg);
		}
		90% {
			transform: skewX(-10deg);
		}
		96% {
			transform: skewX(-20deg);
		}
		100% {
			transform: skewX(-18deg);
		}
	}

	/* Sparkles */
	.sparkle-1 {
		animation: twinkle 2s ease-in-out infinite;
	}

	.sparkle-2 {
		animation: twinkle 2.5s ease-in-out infinite;
		animation-delay: -1s;
	}

	@keyframes twinkle {
		0%, 100% { opacity: 0; }
		50% { opacity: 1; }
	}
</style>
