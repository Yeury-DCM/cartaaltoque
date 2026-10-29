import { useReveal } from "@/hooks/useReveal";

type Tag = "div" | "li" | "section" | "header" | "footer";

/**
 * Envuelve un bloque para que aparezca suavemente al entrar en pantalla.
 * `delay` (ms) escalona elementos hermanos para que no salgan todos a la vez.
 */
export function Reveal({
  as = "div",
  delay = 0,
  className = "",
  children,
}: {
  as?: Tag;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useReveal<HTMLElement>();
  const Comp = as as "div";
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Comp>
  );
}
