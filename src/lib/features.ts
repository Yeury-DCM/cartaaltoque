import type { Plan } from "./tenant";

/**
 * Qué trae cada plan. Es el único lugar donde se decide: el resto de la app
 * pregunta con hasFeature(). Las funciones Pro todavía no existen; quedan
 * listadas para mostrarlas como "próximamente".
 */
const PLAN_FEATURES = {
  menu: ["basic", "pro"],
  qr: ["basic", "pro"],
  whatsapp_orders: ["basic", "pro"],
  orders_history: ["basic", "pro"],
  delivery_zones: ["basic", "pro"],
  kitchen_display: ["pro"],
  invoicing: ["pro"],
  team: ["pro"],
} as const satisfies Record<string, readonly Plan[]>;

export type Feature = keyof typeof PLAN_FEATURES;

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return (PLAN_FEATURES[feature] as readonly Plan[]).includes(plan);
}

export const PLAN_LABEL: Record<Plan, string> = { basic: "Básico", pro: "Pro" };
