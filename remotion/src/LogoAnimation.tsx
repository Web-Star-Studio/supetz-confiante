import {
    AbsoluteFill,
    Easing,
    Img,
    interpolate,
    spring,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import "./styles.css";

/*
 * Smooth, natural dog-like logo animation.
 *
 * Single SVG with a flowing clip-path reveal combined with
 * organic whole-logo motion that mimics a curious, playful animal.
 *
 * Timeline (60fps, 180 frames = 3 seconds):
 *   0–40:   Logo fades in, soft scale entrance
 *   10–90:  Smooth clip reveal left→right (like sniffing along a trail)
 *   40–70:  Gentle curious wobble as letters appear
 *   90–130: Subtle "wag" — playful sway side to side
 *   130–180: Settle with gentle breathing
 */

export const LogoAnimation: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // ── Smooth entrance ────────────────────────────────────────────────────

    const entranceProgress = spring({
        frame,
        fps,
        config: {
            stiffness: 60,
            damping: 14,
            mass: 1,
        },
    });

    const opacity = interpolate(frame, [0, 25], [0, 1], {
        extrapolateRight: "clamp",
        easing: Easing.ease,
    });

    const scale = interpolate(entranceProgress, [0, 1], [0.88, 1]);

    // ── Flowing clip reveal (sniffing along a trail, left to right) ────────
    // Smooth continuous reveal, not stepped

    const revealProgress = interpolate(frame, [8, 100], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Convert to clip-path: the right side starts at 85% clipped, goes to 0%
    const clipRight = interpolate(revealProgress, [0, 1], [85, 0]);

    // ── Curious sniff wobble (subtle Y oscillation as reveal happens) ──────

    const sniffY = interpolate(
        frame,
        [15, 30, 42, 54, 66, 78, 90],
        [0, -4, 2, -3, 1.5, -2, 0],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.ease),
        }
    );

    // Tiny rotation that follows the sniff — like a dog tilting its nose
    const sniffRotation = interpolate(
        frame,
        [15, 35, 50, 65, 80, 90],
        [0, -1.2, 0.8, -0.6, 0.4, 0],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.ease),
        }
    );

    // ── Playful wag after reveal (subtle side-to-side sway) ────────────────

    const wagProgress = Math.max(0, frame - 95);
    const wagAngle =
        wagProgress > 0
            ? interpolate(
                wagProgress,
                [0, 8, 16, 24, 32, 40, 50],
                [0, 2.5, -2, 1.5, -1, 0.6, 0],
                {
                    extrapolateRight: "clamp",
                    easing: Easing.inOut(Easing.ease),
                }
            )
            : 0;

    // Wag also has a gentle X sway
    const wagX =
        wagProgress > 0
            ? interpolate(
                wagProgress,
                [0, 8, 16, 24, 32, 40, 50],
                [0, 6, -5, 3.5, -2, 1, 0],
                {
                    extrapolateRight: "clamp",
                    easing: Easing.inOut(Easing.ease),
                }
            )
            : 0;

    // ── Breathing idle (frame 140+) ────────────────────────────────────────

    const breatheY = interpolate(
        frame,
        [140, 155, 170, 180],
        [0, -2.5, 0, -1],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.sin),
        }
    );

    const breatheScale = interpolate(
        frame,
        [140, 155, 170, 180],
        [1, 1.008, 1, 1.004],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.sin),
        }
    );

    // ── Glow pulse when fully revealed ─────────────────────────────────────

    const glowOpacity = interpolate(
        frame,
        [85, 100, 120, 145],
        [0, 0.4, 0.15, 0],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        }
    );

    // ── Drop shadow grows in ───────────────────────────────────────────────

    const shadowOpacity = interpolate(frame, [0, 50], [0, 0.3], {
        extrapolateRight: "clamp",
    });

    // ── Combine transforms ─────────────────────────────────────────────────

    const totalRotation = sniffRotation + wagAngle;
    const totalScale = scale * breatheScale;

    return (
        <AbsoluteFill className="container">
            <AbsoluteFill className="background" />

            {/* Soft glow */}
            <div className="glow" style={{ opacity: glowOpacity }} />

            {/* Logo */}
            <div
                className="logo-wrapper"
                style={{
                    opacity,
                    transform: [
                        `translateX(${wagX}px)`,
                        `translateY(${sniffY + breatheY}px)`,
                        `scale(${totalScale})`,
                        `rotate(${totalRotation}deg)`,
                    ].join(" "),
                    clipPath: `inset(0% ${clipRight}% 0% 0%)`,
                    filter: `drop-shadow(0 10px 30px rgba(255, 120, 40, ${shadowOpacity}))`,
                    transformOrigin: "center center",
                }}
            >
                <Img src={staticFile("supet-logo.svg")} className="logo-image" />
            </div>
        </AbsoluteFill>
    );
};

