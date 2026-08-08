import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  isImmobilierConfigured,
  testImmobilierConnection,
  SUPABASE_URL,
  SUPABASE_PROJECT_ID,
} from "@/integrations/supabase/immobilier";

const title = "Test de connexion Supabase — SeLoger CI";
const description =
  "Page de diagnostic : vérifie que l'application communique bien avec le projet Supabase « immobilier ».";

export const Route = createFileRoute("/diagnostic")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Diagnostic,
});

function Diagnostic() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["immobilier-connection-test"],
    queryFn: () => testImmobilierConnection(),
    retry: false,
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Test de connexion Supabase</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Projet ciblé : <code>{SUPABASE_PROJECT_ID || "non défini"}</code>
        <br />
        URL : <code>{SUPABASE_URL || "non définie"}</code>
      </p>

      {!isImmobilierConfigured && (
        <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Variables d'environnement manquantes : renseignez
          <code> VITE_IMMOBILIER_SUPABASE_URL</code>,
          <code> VITE_IMMOBILIER_SUPABASE_PUBLISHABLE_KEY</code> et
          <code> VITE_IMMOBILIER_SUPABASE_PROJECT_ID</code>.
        </p>
      )}

      {isLoading && <p className="mt-6 text-sm">Test en cours…</p>}
      {error && <p className="mt-6 text-sm text-destructive">{(error as Error).message}</p>}

      {data && (
        <ul className="mt-6 space-y-2">
          {data.checked.map((c) => (
            <li
              key={c.table}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
            >
              <span className="font-medium">{c.table}</span>
              <span className={c.ok ? "text-primary" : "text-destructive"}>
                {c.ok ? `OK — ${c.count ?? 0} ligne(s)` : c.error}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
