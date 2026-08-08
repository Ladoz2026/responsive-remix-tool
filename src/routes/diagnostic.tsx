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
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Diagnostic par table</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Distingue une table réellement vide d'un blocage par les policies RLS / permissions
            anonymes.
          </p>

          <div className="mt-4 space-y-3">
            {data.checked.map((c) => {
              const tone =
                c.diagnosis === "ok_avec_donnees"
                  ? "border-primary/40 bg-primary/5"
                  : c.diagnosis === "vide_lecture_autorisee"
                    ? "border-border bg-muted/40"
                    : "border-destructive/40 bg-destructive/10";

              return (
                <article key={c.table} className={`rounded-lg border p-4 text-sm ${tone}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{c.table}</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                      {c.diagnosis}
                    </span>
                  </div>

                  <p className="mt-2 text-muted-foreground">{c.hint}</p>

                  <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Lecture anonyme (SELECT)</dt>
                      <dd className={c.anonSelectAllowed ? "text-primary" : "text-destructive"}>
                        {c.anonSelectAllowed ? "autorisée" : "refusée"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Lignes (count exact)</dt>
                      <dd>{c.count ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Échantillon lu</dt>
                      <dd>{c.sampleRows ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Code erreur</dt>
                      <dd>
                        <code>{c.errorCode ?? "—"}</code>
                      </dd>
                    </div>
                  </dl>

                  {c.error && (
                    <p className="mt-3 rounded border border-destructive/30 bg-background/60 p-2 text-xs text-destructive">
                      {c.error}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
