import { useEffect, useRef } from "react";

/**
 * Luz del color de la marca que sigue al cursor dentro del hero, con inercia para que se
 * sienta física. Bajo la luz la cuadrícula se ilumina un poco más. Al salir el cursor
 * vuelve sola arriba al centro. En pantallas táctiles o con "reducir movimiento" queda fija.
 */
export function HeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const section = el?.parentElement;
    if (!el || !section) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Posición en píxeles dentro de la sección; arranca arriba al centro.
    const home = () => ({ x: section.clientWidth / 2, y: 0 });
    let target = home();
    const cur = { ...target };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = section.getBoundingClientRect();
      target = { x: e.clientX - r.left, y: e.clientY - r.top };
      start();
    };
    const onLeave = () => {
      target = home();
      start();
    };

    const loop = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      el.style.setProperty("--mx", `${cur.x.toFixed(1)}px`);
      el.style.setProperty("--my", `${cur.y.toFixed(1)}px`);
      // Se detiene al llegar, para no gastar batería con la página quieta.
      raf =
        Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.5
          ? requestAnimationFrame(loop)
          : 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    el.style.setProperty("--mx", `${cur.x}px`);
    el.style.setProperty("--my", `${cur.y}px`);
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      <div className="hero-spot absolute inset-0" />
      <div className="grid-spot absolute inset-0" />
    </div>
  );
}
