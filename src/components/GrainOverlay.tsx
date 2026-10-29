/**
 * Animated SVG grain overlay — gives the dark surfaces a hand-printed,
 * not-AI-generated feel. Drop inside a `position: relative` parent.
 */
export function GrainOverlay({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`grain ${className}`} />;
}
