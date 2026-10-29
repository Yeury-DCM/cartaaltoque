import { Loader2 } from "lucide-react";

export function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      {children}
    </div>
  );
}

export function FullSpinner() {
  return (
    <Center>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </Center>
  );
}

/** Campo de formulario con el estilo del panel. */
export const fieldClass =
  "w-full rounded-lg border border-input bg-foreground/5 px-3 py-2.5 text-sm outline-none focus:border-primary";

export const labelClass =
  "block space-y-1.5 text-xs uppercase tracking-[0.15em] text-foreground/70";

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-destructive/20 px-3 py-2 text-sm">
      {children}
    </p>
  );
}
