import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Restaurant } from "./tenant";

export type Role = "owner" | "staff";
export type Membership = { role: Role; restaurant: Restaurant };

type AdminValue = {
  session: Session;
  restaurant: Restaurant;
  role: Role;
  isOwner: boolean;
  isSuperAdmin: boolean;
  memberships: Membership[];
  switchTo: (restaurantId: string) => void;
  /** Vuelve a leer el restaurante (después de editar el perfil, por ejemplo). */
  refresh: () => Promise<void>;
};

export const AdminContext = createContext<AdminValue | null>(null);

/** Restaurante activo del panel. Todo lo que se lee o escribe lleva su id. */
export function useAdmin(): AdminValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin debe usarse dentro del panel (/app)");
  return ctx;
}

/** Restaurantes de este usuario. RLS ya limita a los suyos; el filtro por user_id es explícito. */
export async function loadMemberships(userId: string): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("restaurant_members")
    .select("role, restaurant:restaurants(*)")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return (data as unknown as Membership[]).filter((m) => m.restaurant);
}

export const ACTIVE_RESTAURANT_KEY = "restaurante-activo-v1";
