import type { Plan } from "./tenant";

/** Nombre visible de cada plan. Hoy todos los restaurantes usan el Básico. */
export const PLAN_LABEL: Record<Plan, string> = { basic: "Básico", pro: "Pro" };
