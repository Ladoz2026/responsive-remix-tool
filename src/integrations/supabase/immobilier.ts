// Client Supabase centralisé pour le projet externe « immobilier ».
// Aucune clé secrète ici : uniquement l'URL et la clé publiable (safe côté client).
//
// Priorité des variables d'environnement (fichier .env.local, non versionné) :
//   VITE_IMMOBILIER_SUPABASE_URL        > VITE_SUPABASE_URL
//   VITE_IMMOBILIER_SUPABASE_PUBLISHABLE_KEY > VITE_SUPABASE_PUBLISHABLE_KEY
//   VITE_IMMOBILIER_SUPABASE_PROJECT_ID > VITE_SUPABASE_PROJECT_ID
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL =
  env['VITE_IMMOBILIER_SUPABASE_URL'] || env['VITE_SUPABASE_URL'] || "";
export const SUPABASE_PUBLISHABLE_KEY =
  env['VITE_IMMOBILIER_SUPABASE_PUBLISHABLE_KEY'] ||
  env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
  "";
export const SUPABASE_PROJECT_ID =
  env['VITE_IMMOBILIER_SUPABASE_PROJECT_ID'] || env['VITE_SUPABASE_PROJECT_ID'] || "";

export const isImmobilierConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

let _client: SupabaseClient | undefined;

/** Client unique utilisé par toutes les requêtes de l'application. */
export function getImmobilierClient(): SupabaseClient {
  if (!isImmobilierConfigured) {
    throw new Error(
      "Configuration Supabase « immobilier » manquante : renseignez VITE_IMMOBILIER_SUPABASE_URL et VITE_IMMOBILIER_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}

export type TableDiagnosis =
  | "ok_avec_donnees"
  | "vide_lecture_autorisee"
  | "rls_bloque"
  | "table_absente"
  | "erreur_inconnue";

export type TableCheck = {
  table: string;
  ok: boolean;
  count: number | null;
  error: string | null;
  errorCode: string | null;
  /** true si la lecture anonyme (SELECT) est autorisée par les policies */
  anonSelectAllowed: boolean;
  /** nombre de lignes réellement lisibles en anonyme (0 ou 1 sur un échantillon) */
  sampleRows: number | null;
  diagnosis: TableDiagnosis;
  hint: string;
};

export type ConnectionTestResult = {
  ok: boolean;
  url: string;
  projectId: string;
  checked: TableCheck[];
  error: string | null;
};

const DIAGNOSIS_LABEL: Record<TableDiagnosis, string> = {
  ok_avec_donnees: "Lecture anonyme OK, données présentes",
  vide_lecture_autorisee: "Lecture anonyme autorisée mais table vide (aucune donnée)",
  rls_bloque: "Bloqué par les policies RLS / permissions (aucun GRANT ou policy pour anon)",
  table_absente: "Table introuvable ou non exposée par l'API",
  erreur_inconnue: "Erreur inattendue — voir le message Supabase",
};

function classify(errorCode: string | null, errorMessage: string | null): TableDiagnosis {
  if (!errorCode && !errorMessage) return "ok_avec_donnees";
  const msg = (errorMessage ?? "").toLowerCase();
  if (errorCode === "42501" || msg.includes("permission denied") || msg.includes("row-level security"))
    return "rls_bloque";
  if (errorCode === "PGRST205" || errorCode === "42P01" || msg.includes("does not exist"))
    return "table_absente";
  return "erreur_inconnue";
}

/** Petit test de connexion : vérifie l'accès en lecture aux tables attendues. */
export async function testImmobilierConnection(
  tables: string[] = [
    "properties",
    "profiles",
    "agencies",
    "property_categories",
    "property_types",
    "listing_types",
    "amenities",
    "amenity_categories",
  ],
): Promise<ConnectionTestResult> {
  const base = { url: SUPABASE_URL, projectId: SUPABASE_PROJECT_ID };

  if (!isImmobilierConfigured) {
    return {
      ...base,
      ok: false,
      checked: [],
      error: "Variables d'environnement Supabase manquantes.",
    };
  }

  const supabase = getImmobilierClient();
  const checked: ConnectionTestResult["checked"] = [];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    checked.push({
      table,
      ok: !error,
      count: count ?? null,
      error: error ? error.message : null,
    });
  }

  return { ...base, ok: checked.some((c) => c.ok), checked, error: null };
}
