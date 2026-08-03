import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Flame,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  StickyNote,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type RequestStatus = Database["public"]["Enums"]["request_status"];
type LeadPriority = Database["public"]["Enums"]["lead_priority"];
type ContactRequest = Database["public"]["Tables"]["contact_requests"]["Row"];
type LeadNote = Database["public"]["Tables"]["lead_notes"]["Row"];

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "CRM – Suivi des leads | SeLoger CI" },
      {
        name: "description",
        content:
          "Pipeline commercial SeLoger CI : qualifiez vos demandes de contact, ajoutez des notes de suivi et planifiez vos relances.",
      },
      { property: "og:title", content: "CRM – Suivi des leads | SeLoger CI" },
      {
        property: "og:description",
        content: "Pipeline commercial, notes de suivi et relances pour vos leads immobiliers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Crm,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-8 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
});

const STATUS_COLUMNS: { key: RequestStatus; label: string; hint: string }[] = [
  { key: "nouveau", label: "Nouveaux", hint: "À qualifier" },
  { key: "en_cours", label: "En cours", hint: "Négociation / visite" },
  { key: "traite", label: "Traités", hint: "Clos ou convertis" },
];

const PRIORITY_STYLES: Record<LeadPriority, string> = {
  basse: "bg-muted text-muted-foreground",
  normale: "bg-primary/10 text-primary",
  haute: "bg-destructive/10 text-destructive",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Crm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | LeadPriority>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const requestsQuery = useQuery({
    queryKey: ["crm-requests", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<ContactRequest[]> => {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const propertiesQuery = useQuery({
    queryKey: ["crm-property-titles", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<{ id: string; title: string }[]> => {
      const { data, error } = await supabase.from("properties").select("id, title");
      if (error) throw error;
      return data ?? [];
    },
  });

  const propertyTitle = useMemo(() => {
    const map = new Map<string, string>();
    (propertiesQuery.data ?? []).forEach((p) => map.set(p.id, p.title));
    return map;
  }, [propertiesQuery.data]);

  const notesQuery = useQuery({
    queryKey: ["crm-notes", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async (): Promise<LeadNote[]> => {
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("request_id", selectedId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<ContactRequest, "status" | "priority" | "follow_up_at" | "last_contacted_at" | "assigned_to">>;
    }) => {
      const { error } = await supabase.from("contact_requests").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      toast.success("Lead mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const body = noteDraft.trim();
      if (!body) throw new Error("Note vide");
      if (body.length > 2000) throw new Error("Note trop longue");
      const { error } = await supabase
        .from("lead_notes")
        .insert({ request_id: selectedId!, author_id: user!.id, body });
      if (error) throw error;
    },
    onSuccess: () => {
      setNoteDraft("");
      queryClient.invalidateQueries({ queryKey: ["crm-notes", selectedId] });
      toast.success("Note ajoutée");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requests = requestsQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q) ||
        (r.property_id ? (propertyTitle.get(r.property_id) ?? "").toLowerCase().includes(q) : false)
      );
    });
  }, [requests, search, priorityFilter, propertyTitle]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  const kpis = useMemo(() => {
    const now = Date.now();
    return {
      total: requests.length,
      nouveaux: requests.filter((r) => r.status === "nouveau").length,
      chauds: requests.filter((r) => r.priority === "haute" && r.status !== "traite").length,
      relances: requests.filter(
        (r) => r.follow_up_at && new Date(r.follow_up_at).getTime() <= now && r.status !== "traite",
      ).length,
    };
  }, [requests]);

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Espace commercial</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">CRM &amp; suivi des leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Qualifiez vos demandes, notez vos échanges et planifiez vos relances.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Leads au total", value: kpis.total, icon: UserCheck },
            { label: "À qualifier", value: kpis.nouveaux, icon: MessageSquare },
            { label: "Leads chauds", value: kpis.chauds, icon: Flame },
            { label: "Relances dues", value: kpis.relances, icon: CalendarClock },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-3xl font-bold">{kpi.value}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un contact, un e-mail, un bien…"
              className="pl-9"
            />
          </div>
          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v as "all" | LeadPriority)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les priorités</SelectItem>
              <SelectItem value="haute">Haute</SelectItem>
              <SelectItem value="normale">Normale</SelectItem>
              <SelectItem value="basse">Basse</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {requestsQuery.isLoading ? (
          <div className="grid place-items-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-3">
            {STATUS_COLUMNS.map((col) => {
              const items = filtered.filter((r) => r.status === col.key);
              return (
                <div key={col.key} className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="mb-4 flex items-baseline justify-between">
                    <div>
                      <h2 className="font-semibold">{col.label}</h2>
                      <p className="text-xs text-muted-foreground">{col.hint}</p>
                    </div>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {items.length === 0 && (
                      <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        Aucun lead
                      </p>
                    )}
                    {items.map((lead) => {
                      const overdue =
                        lead.follow_up_at && new Date(lead.follow_up_at).getTime() <= Date.now();
                      return (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => {
                            setSelectedId(lead.id);
                            setNoteDraft("");
                          }}
                          className={`w-full rounded-xl border bg-card p-4 text-left transition hover:shadow-md ${
                            selectedId === lead.id ? "border-primary" : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium leading-tight">{lead.full_name}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLES[lead.priority]}`}
                            >
                              {lead.priority}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{lead.email}</p>
                          {lead.property_id && (
                            <p className="mt-2 truncate text-xs text-primary">
                              {propertyTitle.get(lead.property_id) ?? "Bien"}
                            </p>
                          )}
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            Reçu le {formatDate(lead.created_at)}
                          </p>
                          {lead.follow_up_at && (
                            <p
                              className={`mt-1 text-[11px] ${overdue ? "text-destructive" : "text-muted-foreground"}`}
                            >
                              Relance : {formatDate(lead.follow_up_at)}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {selected && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{selected.full_name}</h2>
                <p className="text-sm text-muted-foreground">
                  Reçu le {formatDate(selected.created_at)}
                  {selected.property_id
                    ? ` • ${propertyTitle.get(selected.property_id) ?? "Bien"}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${selected.email}`}>
                    <Mail className="mr-2 h-4 w-4" /> E-mail
                  </a>
                </Button>
                {selected.phone && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${selected.phone}`}>
                      <Phone className="mr-2 h-4 w-4" /> Appeler
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() =>
                    updateLead.mutate({
                      id: selected.id,
                      patch: { last_contacted_at: new Date().toISOString() },
                    })
                  }
                >
                  Marquer contacté
                </Button>
              </div>
            </div>

            <p className="mt-4 rounded-xl bg-muted/50 p-4 text-sm leading-relaxed">
              {selected.message}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Étape</Label>
                <Select
                  value={selected.status}
                  onValueChange={(v) =>
                    updateLead.mutate({ id: selected.id, patch: { status: v as RequestStatus } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nouveau">Nouveau</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="traite">Traité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select
                  value={selected.priority}
                  onValueChange={(v) =>
                    updateLead.mutate({ id: selected.id, patch: { priority: v as LeadPriority } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="followup">Relance prévue</Label>
                <Input
                  id="followup"
                  type="date"
                  value={selected.follow_up_at ? selected.follow_up_at.slice(0, 10) : ""}
                  onChange={(e) =>
                    updateLead.mutate({
                      id: selected.id,
                      patch: {
                        follow_up_at: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      },
                    })
                  }
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Dernier contact : {formatDate(selected.last_contacted_at)}
            </p>

            <div className="mt-6 border-t border-border pt-6">
              <h3 className="flex items-center gap-2 font-semibold">
                <StickyNote className="h-4 w-4 text-primary" /> Notes de suivi
              </h3>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Compte-rendu d'appel, visite planifiée, objections…"
                  rows={3}
                  maxLength={2000}
                />
                <Button
                  className="sm:self-end"
                  onClick={() => addNote.mutate()}
                  disabled={addNote.isPending || !noteDraft.trim()}
                >
                  {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {notesQuery.isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {!notesQuery.isLoading && (notesQuery.data ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune note pour ce lead.</p>
                )}
                {(notesQuery.data ?? []).map((note) => (
                  <div key={note.id} className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm leading-relaxed">{note.body}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {new Date(note.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
