import { useEffect, useMemo, useRef, useState } from "react";
import {
  type CountryIso2,
  type ParsedCountry,
  FlagImage,
  defaultCountries,
  guessCountryByPartialPhoneNumber,
  parseCountry,
  usePhoneInput,
} from "react-international-phone";
import { Check, ChevronDown, Search } from "lucide-react";

const DEFAULT_COUNTRY: CountryIso2 = "do";
const PREFERRED: CountryIso2[] = ["do", "us", "pr", "es", "mx", "co", "ve"];
/** Nombres de país en español (la librería los trae en inglés). */
const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["es"], { type: "region" });
  } catch {
    return null;
  }
})();
const nameOf = (c: ParsedCountry) => {
  try {
    return regionNames?.of(c.iso2.toUpperCase()) ?? c.name;
  } catch {
    return c.name;
  }
};
const COUNTRIES = defaultCountries
  .map(parseCountry)
  .map((c) => ({ ...c, name: nameOf(c) }))
  .sort((a, b) => a.name.localeCompare(b.name, "es"));
const PREFERRED_SET = new Set(PREFERRED);

const maskOf = (c: ParsedCountry) =>
  !c.format ? "" : typeof c.format === "string" ? c.format : c.format.default;

/** ¿El número tiene todos los dígitos que pide el formato del país? */
function isComplete(digits: string, c: ParsedCountry) {
  const national = digits.startsWith(c.dialCode) ? digits.slice(c.dialCode.length) : digits;
  const expected = (maskOf(c).match(/\./g) ?? []).length;
  return expected > 0 ? national.length === expected : national.length >= 6 && digits.length <= 15;
}

const matches = (c: ParsedCountry, q: string) => {
  const s = q.toLowerCase().trim().replace("+", "");
  return !s || c.name.toLowerCase().includes(s) || c.iso2.includes(s) || c.dialCode.startsWith(s);
};

/**
 * Teléfono con selector de país (República Dominicana por defecto). Da formato mientras se
 * escribe y avisa si el número está completo para ese país, para evitar errores de tipeo.
 * `value` y lo que entrega `onChange` son solo dígitos con código de país ("18098704800").
 */
export function PhoneField({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (digits: string, complete: boolean) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);

  // Un número ya guardado de otro país abre con su país, no con República Dominicana.
  const [startCountry] = useState<CountryIso2>(
    () =>
      (value && guessCountryByPartialPhoneNumber({ phone: `+${value}` }).country?.iso2) ||
      DEFAULT_COUNTRY,
  );

  const { phone, inputValue, handlePhoneValueChange, country, setCountry, inputRef } =
    usePhoneInput({
      defaultCountry: startCountry,
      value: value ? `+${value}` : "",
      countries: defaultCountries,
      forceDialCode: true,
      disableCountryGuess: true,
      charAfterDialCode: " ",
    });

  const digits = phone.replace(/\D/g, "");
  // Solo el código de país, sin número, cuenta como vacío.
  const own = digits === country.dialCode ? "" : digits;
  const complete = own !== "" && isComplete(own, country);

  const report = useRef(onChange);
  report.current = onChange;
  useEffect(() => {
    report.current(own, complete);
  }, [own, complete]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
      } else if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const { frequent, others } = useMemo(() => {
    const list = COUNTRIES.filter((c) => matches(c, search));
    return {
      frequent: list
        .filter((c) => PREFERRED_SET.has(c.iso2))
        .sort((a, b) => PREFERRED.indexOf(a.iso2) - PREFERRED.indexOf(b.iso2)),
      others: list.filter((c) => !PREFERRED_SET.has(c.iso2)),
    };
  }, [search]);

  const mask = maskOf(country).replaceAll(".", "0");
  const placeholder = mask ? `+${country.dialCode} ${mask}` : `+${country.dialCode}`;
  const showError = touched && own !== "" && !complete;

  const pick = (c: ParsedCountry) => {
    setCountry(c.iso2, { focusOnInput: true });
    setOpen(false);
    setSearch("");
  };

  const row = (c: ParsedCountry) => (
    <li key={c.iso2}>
      <button
        type="button"
        onClick={() => pick(c)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm normal-case tracking-normal transition hover:bg-foreground/10"
      >
        <FlagImage iso2={c.iso2} size={18} className="shrink-0 rounded-sm" />
        <span className="min-w-0 flex-1 truncate">{c.name}</span>
        <span className="shrink-0 text-xs text-foreground/55">+{c.dialCode}</span>
        {c.iso2 === country.iso2 && <Check className="h-4 w-4 shrink-0 text-primary" />}
      </button>
    </li>
  );

  return (
    <div ref={boxRef} className="relative">
      <div className="flex">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Elegir país"
          aria-expanded={open}
          className="flex shrink-0 items-center gap-2 rounded-l-lg border border-r-0 border-input bg-foreground/5 px-3 text-sm normal-case tracking-normal outline-none transition focus-visible:border-primary"
        >
          <FlagImage iso2={country.iso2} size={20} className="rounded-sm" />
          <span className="font-semibold">+{country.dialCode}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-foreground/50 transition ${open ? "rotate-180" : ""}`} />
        </button>
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required={required}
          value={inputValue}
          onChange={handlePhoneValueChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          aria-invalid={showError}
          className={`w-full rounded-r-lg border bg-foreground/5 px-3 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-primary ${showError ? "border-destructive" : "border-input"}`}
        />
      </div>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-input bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-input px-3">
            <Search className="h-4 w-4 text-foreground/45" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país o código"
              className="w-full bg-transparent py-3 text-sm normal-case tracking-normal outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1.5 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
            {frequent.length > 0 && (
              <li className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                Frecuentes
              </li>
            )}
            {frequent.map(row)}
            {others.length > 0 && (
              <li className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                Todos los países
              </li>
            )}
            {others.map(row)}
            {frequent.length + others.length === 0 && (
              <li className="px-3 py-6 text-center text-sm normal-case tracking-normal text-foreground/55">
                No hay países con esa búsqueda.
              </li>
            )}
          </ul>
        </div>
      )}

      {showError && (
        <p className="mt-1.5 text-[11px] normal-case tracking-normal text-destructive">
          El número parece incompleto. Revisa que tenga todos los dígitos.
        </p>
      )}
    </div>
  );
}
