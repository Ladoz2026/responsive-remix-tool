import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { myLeadsQuery, myPropertiesQuery } from "@/lib/property-queries";
import { formatDate, formatPrice, typeLabel } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord agence — SeLoger CI" },
      {
        name: "description",
        content: "Gérez vos annonces immobilières et vos demandes de contact.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: properties } = useQuery(myPropertiesQuery(user.id));
  const { data: leads } = useQuery(myLeadsQuery(user.id));

  async function remove(id: string) {
    if (!confirm("Supprimer définitivement cette annonce ?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Annonce supprimée");
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const published = (properties ?? []).filter((p) => p.status === "publie").length;

  return (
    <div className="min-h-screen bg-secondary/40 font-sans">
      <Header solid />
      <main className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Tableau de bord agence
            </h1>
            <p className="mt-1 text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/annonces/nouvelle"
              className="inline-flex items-center gap-2 rounded-full gold-gradient px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-gold"
            >
              <Plus className="h-4 w-4" /> Nouvelle annonce
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground"
            >
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Annonces", value: properties?.length ?? 0 },
            { label: "Publiées", value: published },
            { label: "Demandes reçues", value: leads?.length ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl bg-card p-6 shadow-soft">
              <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="mt-10 overflow-hidden rounded-3xl bg-card shadow-soft">
          <h2 className="border-b border-border p-6 text-lg font-bold text-foreground">
            Mes annonces
          </h2>
          {(properties ?? []).length === 0 ? (
            <p className="p-6 text-muted-foreground">
              Aucune annonce pour l'instant. Créez votre première annonce.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {(properties ?? []).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {typeLabel(p.property_type)} · {p.city} ·{" "}
                      {formatPrice(p.price, p.currency ?? "FCFA")}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                    {p.status}
                  </span>
                  <Link
                    to="/annonces/$id"
                    params={{ id: p.id }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 overflow-hidden rounded-3xl bg-card shadow-soft">
          <h2 className="border-b border-border p-6 text-lg font-bold text-foreground">
            Demandes de contact
          </h2>
          {(leads ?? []).length === 0 ? (
            <p className="p-6 text-muted-foreground">Aucune demande pour le moment.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(leads ?? []).map((l) => (
                <li key={l.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{l.full_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(l.created_at)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {l.email} {l.phone ? `· ${l.phone}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-foreground">{l.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
