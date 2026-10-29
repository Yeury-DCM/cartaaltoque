import { useEffect, useRef, useState } from "react";

/**
 * Frase grande que se "enciende" palabra por palabra a medida que se hace scroll.
 * Las palabras marcadas con * se resaltan con el color de la marca.
 */
export function Statement({ text }: { text: string }) {
  const words = text.split(" ");
  const ref = useRef<HTMLParagraphElement>(null);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setOn(words.length);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      setOn(Math.round(Math.max(0, Math.min(1, p)) * words.length * 1.1));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [words.length]);

  return (
    <p
      ref={ref}
      className="max-w-[22ch] font-display text-[clamp(44px,6.4vw,96px)] uppercase leading-[0.95]"
    >
      {words.map((w, i) => {
        const hl = w.startsWith("*");
        return (
          <span key={i} className={`word ${i < on ? "on" : ""} ${hl ? "hl" : ""}`}>
            {hl ? w.slice(1) : w}{" "}
          </span>
        );
      })}
    </p>
  );
}
