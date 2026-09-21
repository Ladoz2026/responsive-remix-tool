// Client applicatif unique : pointe vers le projet Supabase « immobilier ».
// Proxy paresseux pour éviter toute initialisation au chargement du module (SSR inclus).
import type { SupabaseClient } from "@supabase/supabase-js";
import { getImmobilierClient, isImmobilierConfigured } from "./immobilier";

export const isSupabaseConfigured = isImmobilierConfigured;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getImmobilierClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});
