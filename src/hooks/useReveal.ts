import { useEffect, useRef } from "react";

const DEFAULT_OPTIONS: IntersectionObserverInit = {
  threshold: 0.12,
  rootMargin: "0px 0px -8% 0px",
};

/**
 * Adds the `is-visible` class once the element scrolls into view.
 * Pair with the `.reveal` utility in styles.css for a soft fade-up.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = DEFAULT_OPTIONS,
) {
  const ref = useRef<T | null>(null);
  const { threshold, rootMargin } = options;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // If user prefers reduced motion, just show immediately.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("is-visible");
      return;
    }

    const show = () => node.classList.add("is-visible");

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show();
            obs.unobserve(node);
          }
        });
      },
      { threshold, rootMargin },
    );
    obs.observe(node);

    // Respaldo: lo que ya está a la vista al montar aparece sin esperar al primer scroll.
    const raf = requestAnimationFrame(() => {
      const r = node.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
        show();
        obs.unobserve(node);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [threshold, rootMargin]);

  return ref;
}
