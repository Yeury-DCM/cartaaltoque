import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/** Sesión actual: undefined mientras carga, null si no hay nadie dentro. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return session;
}
