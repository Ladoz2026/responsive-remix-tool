import { createFileRoute } from "@tanstack/react-router";

const DEFAULT_TABLES = [
  "properties",
  "profiles",
  "agencies",
  "property_categories",
  "property_types",
  "listing_types",
  "amenities",
  "amenity_categories",
  "cities",
  "communes",
  "districts",
  "property_images",
  "contact_requests",
];

type Verdict =
  | "lecture_anonyme_ok_avec_donnees"
  | "lecture_anonyme_ok_table_vide"
  | "rls_ou_grant_bloque"
  | "table_absente_ou_non_exposee"
  | "erreur_inconnue";

const VERDICT_HINT: Record<Verdict, string> = {
  lecture_anonyme_ok_avec_donnees:
    "Une policy SELECT (ou l'absence de RLS) autorise le rôle anon, et la table contient des lignes lisibles.",
  lecture_anonyme_ok_table_vide:
    "La requête passe (pas de blocage RLS/GRANT) mais aucune ligne n'est renvoyée : table vide ou policy filtrante (ex. status = 'publie').",
  rls_ou_grant_bloque:
    "Lecture refusée : RLS activée sans policy SELECT pour anon, ou GRANT SELECT manquant sur la table.",
  table_absente_ou_non_exposee:
    "Table introuvable dans le schéma exposé par l'API (nom différent, autre schéma, ou cache PostgREST à recharger).",
  erreur_inconnue: "Erreur inattendue — voir le champ error renvoyé par Supabase.",
};

function classify(status: number, code: string | null, message: string | null): Verdict {
  const msg = (message ?? "").toLowerCase();
  if (status === 401 || status === 403 || code === "42501" || msg.includes("permission denied"))
    return "rls_ou_grant_bloque";
  if (status === 404 || code === "PGRST205" || code === "42P01" || msg.includes("does not exist"))
    return "table_absente_ou_non_exposee";
  if (status >= 200 && status < 300) return "lecture_anonyme_ok_avec_donnees";
  return "erreur_inconnue";
}

export const Route = createFileRoute("/diagnostic_/rls")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url =
          process.env["VITE_IMMOBILIER_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "";
        const key =
          process.env["VITE_IMMOBILIER_SUPABASE_PUBLISHABLE_KEY"] ??
          process.env["SUPABASE_PUBLISHABLE_KEY"] ??
          "";
        const projectId =
          process.env["VITE_IMMOBILIER_SUPABASE_PROJECT_ID"] ??
          process.env["SUPABASE_PROJECT_ID"] ??
          "";

        if (!url || !key) {
          return Response.json(
            {
              ok: false,
              error:
                "Configuration Supabase manquante côté serveur (URL / clé publiable non définies).",
            },
            { status: 500 },
          );
        }

        const requested = new URL(request.url).searchParams.get("tables");
        const tables = requested
          ? requested
              .split(",")
              .map((t) => t.trim())
              .filter((t) => /^[a-zA-Z0-9_]{1,63}$/.test(t))
              .slice(0, 40)
          : DEFAULT_TABLES;

        const headers = { apikey: key, Authorization: `Bearer ${key}` };

        const results = await Promise.all(
          tables.map(async (table) => {
            const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`;
            try {
              const res = await fetch(endpoint, {
                headers: { ...headers, Prefer: "count=exact" },
              });
              const text = await res.text();

              let body: unknown = null;
              try {
                body = text ? JSON.parse(text) : null;
              } catch {
                body = text;
              }

              const err =
                body && typeof body === "object" && !Array.isArray(body)
                  ? (body as { code?: string; message?: string; details?: string; hint?: string })
                  : null;

              const contentRange = res.headers.get("content-range");
              const total = contentRange?.split("/")[1];
              const rowCount = total && total !== "*" ? Number(total) : null;
              const sampleRows = Array.isArray(body) ? body.length : 0;

              let verdict = classify(res.status, err?.code ?? null, err?.message ?? null);
              if (verdict === "lecture_anonyme_ok_avec_donnees" && sampleRows === 0) {
                verdict = "lecture_anonyme_ok_table_vide";
              }

              const anonSelectAllowed =
                verdict === "lecture_anonyme_ok_avec_donnees" ||
                verdict === "lecture_anonyme_ok_table_vide";

              return {
                table,
                httpStatus: res.status,
                anonSelectAllowed,
                rowCount,
                sampleRows,
                verdict,
                hint: VERDICT_HINT[verdict],
                rls: {
                  // Déduit du comportement observé : pg_policies n'est pas exposé au rôle anon.
                  blocksAnonSelect: verdict === "rls_ou_grant_bloque",
                  activeSelectPolicyForAnon: anonSelectAllowed,
                  filteringPolicySuspected:
                    verdict === "lecture_anonyme_ok_table_vide" && (rowCount ?? 0) > 0,
                  introspection:
                    "Non introspectable avec la clé publiable : les tables système (pg_policies, pg_class) ne sont pas exposées au rôle anon. Verdict déduit des réponses PostgREST.",
                },
                error: err?.message
                  ? {
                      code: err.code ?? null,
                      message: err.message,
                      details: err.details ?? null,
                      hint: err.hint ?? null,
                    }
                  : null,
              };
            } catch (e) {
              return {
                table,
                httpStatus: 0,
                anonSelectAllowed: false,
                rowCount: null,
                sampleRows: 0,
                verdict: "erreur_inconnue" as Verdict,
                hint: VERDICT_HINT.erreur_inconnue,
                rls: {
                  blocksAnonSelect: false,
                  activeSelectPolicyForAnon: false,
                  filteringPolicySuspected: false,
                  introspection: "Requête réseau échouée.",
                },
                error: { code: null, message: (e as Error).message, details: null, hint: null },
              };
            }
          }),
        );

        const summary = {
          total: results.length,
          lisibles: results.filter((r) => r.anonSelectAllowed).length,
          bloquees_rls: results.filter((r) => r.verdict === "rls_ou_grant_bloque").length,
          absentes: results.filter((r) => r.verdict === "table_absente_ou_non_exposee").length,
          vides: results.filter((r) => r.verdict === "lecture_anonyme_ok_table_vide").length,
        };

        return Response.json(
          { ok: true, projectId, url, checkedAt: new Date().toISOString(), summary, tables: results },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
