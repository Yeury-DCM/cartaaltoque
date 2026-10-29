import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { GrainOverlay } from "@/components/GrainOverlay";
import { APP_NAME } from "@/lib/brand";

/** Estructura común de las páginas legales (privacidad y términos). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <GrainOverlay />
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-5 py-6 md:px-8">
        <Link to="/" aria-label={APP_NAME}>
          <BrandLogo className="h-10" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-foreground/60 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Inicio
        </Link>
      </header>
      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-6 md:px-8">
        <h1 className="font-display text-[clamp(48px,7vw,84px)] uppercase leading-[0.92]">
          {title}
        </h1>
        <p className="mt-3 text-xs uppercase tracking-[0.25em] text-foreground/45">
          Última actualización: {updated}
        </p>
        <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-foreground/75">
          {children}
        </div>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-[30px] uppercase leading-none text-foreground">
        {title}
      </h2>
      <div className="space-y-3 [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
