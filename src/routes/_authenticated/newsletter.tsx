import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Mail, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";

export const Route = createFileRoute("/_authenticated/newsletter")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Newsletter | SeLoger CI" },
      {
        name: "description",
        content: "Gérez les inscrits à la newsletter et vos campagnes e-mail SeLoger CI.",
      },
      { property: "og:title", content: "Newsletter | SeLoger CI" },
      { property: "og:description", content: "Administration de la newsletter SeLoger CI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsletterAdmin,
});

function NewsletterAdmin() {
  const { isAdmin, loading: rolesLoading } = useRoles();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const subscribersQuery = useQuery({
    queryKey: ["newsletter-subscribers"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const campaignsQuery = useQuery({
    queryKey: ["newsletter-campaigns"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active: active, unsubscribed_at: active ? null : new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      toast.success("Inscrit mis à jour");
    },
    onError: () => toast.error("Mise à jour impossible"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      toast.success("Inscrit supprimé");
    },
    onError: () => toast.error("Suppression impossible"),
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      if (title.trim().length < 3) throw new Error("Titre trop court");
      if (subject.trim().length < 3) throw new Error("Objet trop court");
      if (content.trim().length < 10) throw new Error("Contenu trop court");
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("newsletter_campaigns").insert({
        title: title.trim(),
        subject: subject.trim(),
        content: content.trim(),
        author_id: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      setTitle("");
      setSubject("");
      setContent("");
      toast.success("Campagne enregistrée en brouillon");
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible"),
  });

  const markSent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_campaigns")
        .update({
          status: "envoyee",
          sent_at: new Date().toISOString(),
          recipients_count: activeCount,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      toast.success("Campagne marquée comme envoyée");
    },
    onError: () => toast.error("Action impossible"),
  });

  const subscribers = subscribersQuery.data ?? [];
  const activeCount = subscribers.filter((s) => s.is_active).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (s) =>
        s.email.toLowerCase().includes(q) || (s.full_name ?? "").toLowerCase().includes(q),
    );
  }, [subscribers, search]);

  function exportCsv() {
    const rows = [
      ["email", "nom", "source", "actif", "inscrit_le"],
      ...subscribers.map((s) => [
        s.email,
        s.full_name ?? "",
        s.source,
        s.is_active ? "oui" : "non",
        new Date(s.created_at).toLocaleDateString("fr-FR"),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter-selogerci-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (rolesLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/40">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-36 text-center sm:px-6">
          <h1 className="text-2xl font-extrabold text-foreground">Accès réservé</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Seuls les administrateurs peuvent gérer la newsletter.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Newsletter</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gérez vos inscrits et préparez vos campagnes e-mail.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Inscrits", value: subscribers.length, icon: Users },
            { label: "Actifs", value: activeCount, icon: UserCheck },
            {
              label: "Désinscrits",
              value: subscribers.length - activeCount,
              icon: UserX,
            },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-3xl bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
                  <kpi.icon className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-extrabold text-foreground">{kpi.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground">Inscrits</h2>
              <div className="flex gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-9 w-48"
                />
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
              </div>
            </div>

            {subscribersQuery.isLoading ? (
              <div className="grid place-items-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-gold" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucun inscrit.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {filtered.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{s.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.full_name ? `${s.full_name} · ` : ""}
                        {s.source} · {new Date(s.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        s.is_active
                          ? "bg-secondary text-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.is_active ? "Actif" : "Désinscrit"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMutation.mutate({ id: s.id, active: !s.is_active })}
                    >
                      {s.is_active ? "Désinscrire" : "Réactiver"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(s.id)}
                      aria-label={`Supprimer ${s.email}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-6">
            <div className="rounded-3xl bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold text-foreground">Nouvelle campagne</h2>
              <form
                className="mt-4 grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  createCampaign.mutate();
                }}
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="c-title">Titre interne</Label>
                  <Input
                    id="c-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="c-subject">Objet de l'e-mail</Label>
                  <Input
                    id="c-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={160}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="c-content">Contenu</Label>
                  <Textarea
                    id="c-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    maxLength={5000}
                  />
                </div>
                <Button type="submit" disabled={createCampaign.isPending}>
                  {createCampaign.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer en brouillon
                </Button>
              </form>
            </div>

            <div className="rounded-3xl bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold text-foreground">Campagnes</h2>
              {campaignsQuery.isLoading ? (
                <div className="grid place-items-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gold" />
                </div>
              ) : (campaignsQuery.data ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucune campagne pour le moment.
                </p>
              ) : (
                <ul className="mt-4 grid gap-3">
                  {(campaignsQuery.data ?? []).map((c) => (
                    <li key={c.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {c.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{c.subject}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                          {c.status === "envoyee" ? "Envoyée" : "Brouillon"}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.content}</p>
                      {c.status === "envoyee" ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {c.recipients_count} destinataires ·{" "}
                          {c.sent_at ? new Date(c.sent_at).toLocaleDateString("fr-FR") : ""}
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            href={`mailto:?bcc=${subscribers
                              .filter((s) => s.is_active)
                              .map((s) => s.email)
                              .join(",")}&subject=${encodeURIComponent(
                              c.subject,
                            )}&body=${encodeURIComponent(c.content)}`}
                            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                          >
                            <Mail className="h-3.5 w-3.5" /> Ouvrir dans le client mail
                          </a>
                          <Button size="sm" variant="outline" onClick={() => markSent.mutate(c.id)}>
                            Marquer envoyée
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
