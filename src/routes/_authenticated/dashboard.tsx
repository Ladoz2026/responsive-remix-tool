import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  Crown,
  Eye,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatPrice } from "@/lib/format";

type PropertyType = Database["public"]["Enums"]["property_type"];
type TransactionType = Database["public"]["Enums"]["transaction_type"];
type RequestStatus = Database["public"]["Enums"]["request_status"];
type Property = Database["public"]["Tables"]["properties"]["Row"];
type ContactRequest = Database["public"]["Tables"]["contact_requests"]["Row"];


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Tableau de bord vendeur | SeLoger CI" },
      {
        name: "description",
        content:
          "Gérez vos annonces immobilières, suivez leur statut de vérification et répondez aux demandes de contact.",
      },
      { property: "og:title", content: "Tableau de bord vendeur | SeLoger CI" },
      {
        property: "og:description",
        content: "Publiez et pilotez vos biens immobiliers en Côte d'Ivoire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-8 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
});

const propertySchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(120),
  description: z.string().trim().max(2000).optional(),
  price: z.number().min(0).max(100_000_000_000),
  city: z.string().trim().min(2, "Ville requise").max(80),
  district: z.string().trim().max(80).optional(),
  surface_m2: z.number().int().min(0).max(100000).optional(),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().int().min(0).max(50),
});

const emptyForm = {
  title: "",
  description: "",
  property_type: "appartement" as PropertyType,
  transaction: "vente" as TransactionType,
  price: "",
  city: "Abidjan",
  district: "",
  surface_m2: "",
  bedrooms: "0",
  bathrooms: "0",
};

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const propertiesQuery = useQuery({
    queryKey: ["my-properties", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const requestsQuery = useQuery({
    queryKey: ["my-requests", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ContactRequest[]> => {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const viewsQuery = useQuery({
    queryKey: ["my-views", userId],
    enabled: !!userId,
    queryFn: async (): Promise<{ property_id: string; created_at: string }[]> => {
      const { data, error } = await supabase
        .from("property_views")
        .select("property_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const requestStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const { error } = await supabase.from("contact_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut du lead mis à jour");
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const createMutation = useMutation({
    mutationFn: async () => {
      const parsed = propertySchema.safeParse({
        title: form.title,
        description: form.description,
        price: Number(form.price || 0),
        city: form.city,
        district: form.district,
        surface_m2: form.surface_m2 ? Number(form.surface_m2) : undefined,
        bedrooms: Number(form.bedrooms || 0),
        bathrooms: Number(form.bathrooms || 0),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      const { error } = await supabase.from("properties").insert({
        owner_id: userId!,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        property_type: form.property_type,
        transaction: form.transaction,
        price: parsed.data.price,
        city: parsed.data.city,
        district: parsed.data.district || null,
        surface_m2: parsed.data.surface_m2 ?? null,
        bedrooms: parsed.data.bedrooms,
        bathrooms: parsed.data.bathrooms,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Annonce enregistrée en brouillon");
      setForm(emptyForm);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Property["status"] }) => {
      const { error } = await supabase.from("properties").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-properties"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Annonce supprimée");
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const properties = propertiesQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const views = viewsQuery.data ?? [];

  const perProperty = useMemo(() => {
    const since = Date.now() - 30 * 24 * 3600 * 1000;
    return properties.map((p) => {
      const propViews = views.filter((v) => v.property_id === p.id);
      return {
        property: p,
        views: Math.max(p.views_count ?? 0, propViews.length),
        views30: propViews.filter((v) => new Date(v.created_at).getTime() >= since).length,
        leads: requests.filter((r) => r.property_id === p.id).length,
      };
    });
  }, [properties, views, requests]);

  const stats = useMemo(
    () => ({
      total: properties.length,
      published: properties.filter((p) => p.status === "publie").length,
      requests: requests.length,
      newLeads: requests.filter((r) => r.status === "nouveau").length,
      views: perProperty.reduce((sum, p) => sum + p.views, 0),
      portfolio: properties
        .filter((p) => p.transaction === "vente")
        .reduce((sum, p) => sum + Number(p.price ?? 0), 0),
      monthlyRent: properties
        .filter((p) => p.transaction === "location" && p.status === "publie")
        .reduce((sum, p) => sum + Number(p.price ?? 0), 0),
    }),
    [properties, requests, perProperty],
  );


  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-secondary">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full gold-gradient">
              <Crown className="h-4 w-4 text-accent-foreground" />
            </span>
            <span className="font-extrabold tracking-tight text-foreground">
              SeLoger<span className="text-gold">CI</span>
            </span>
          </Link>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Tableau de bord vendeur
        </h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Annonces",
              value: String(stats.total),
              hint: `${stats.published} publiée(s)`,
              icon: Building2,
            },
            {
              label: "Vues cumulées",
              value: new Intl.NumberFormat("fr-FR").format(stats.views),
              hint: `${perProperty.reduce((s, p) => s + p.views30, 0)} sur 30 jours`,
              icon: Eye,
            },
            {
              label: "Leads reçus",
              value: String(stats.requests),
              hint: `${stats.newLeads} nouveau(x)`,
              icon: MessageSquare,
            },
            {
              label: "Portefeuille",
              value: formatPrice(stats.portfolio),
              hint: `${formatPrice(stats.monthlyRent)} / mois en location`,
              icon: Wallet,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card p-5 shadow-soft">
              <s.icon className="h-5 w-5 text-gold" />
              <p className="mt-3 truncate text-xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">{s.hint}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="annonces" className="mt-8">
          <TabsList>
            <TabsTrigger value="annonces">Mes annonces</TabsTrigger>
            <TabsTrigger value="performances">Performances</TabsTrigger>
            <TabsTrigger value="demandes">Leads</TabsTrigger>

          </TabsList>

          <TabsContent value="annonces" className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">Vos biens</h2>
              <Button size="sm" className="rounded-full" onClick={() => setShowForm((v) => !v)}>
                <Plus className="mr-1 h-4 w-4" /> Nouvelle annonce
              </Button>
            </div>

            {showForm && (
              <form
                className="mt-4 grid gap-4 rounded-2xl bg-card p-5 shadow-soft sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate();
                }}
              >
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={form.title}
                    maxLength={120}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Type de bien</Label>
                  <Select
                    value={form.property_type}
                    onValueChange={(v) => setForm({ ...form, property_type: v as PropertyType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["appartement", "villa", "maison", "bureau", "terrain", "commerce"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Transaction</Label>
                  <Select
                    value={form.transaction}
                    onValueChange={(v) => setForm({ ...form, transaction: v as TransactionType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vente">Vente</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Prix (FCFA)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={form.city}
                    maxLength={80}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="district">Quartier</Label>
                  <Input
                    id="district"
                    value={form.district}
                    maxLength={80}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="surface">Surface (m²)</Label>
                  <Input
                    id="surface"
                    type="number"
                    value={form.surface_m2}
                    onChange={(e) => setForm({ ...form, surface_m2: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bedrooms">Chambres</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={form.bedrooms}
                    onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bathrooms">Salles de bain</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={form.bathrooms}
                    onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    maxLength={2000}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createMutation.isPending} className="rounded-full">
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-4 grid gap-3">
              {propertiesQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              )}
              {!propertiesQuery.isLoading && properties.length === 0 && (
                <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-soft">
                  Aucune annonce pour l'instant. Créez votre première annonce.
                </p>
              )}
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 shadow-soft"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.city}
                      {p.district ? ` · ${p.district}` : ""} ·{" "}
                      {Number(p.price).toLocaleString("fr-FR")} {p.currency}
                    </p>
                  </div>
                  <Badge variant={p.status === "publie" ? "default" : "secondary"}>{p.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                      statusMutation.mutate({
                        id: p.id,
                        status: p.status === "publie" ? "brouillon" : "publie",
                      })
                    }
                  >
                    {p.status === "publie" ? "Dépublier" : "Publier"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Supprimer"
                    onClick={() => deleteMutation.mutate(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performances" className="mt-6 grid gap-3">
            {perProperty.length === 0 && (
              <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-soft">
                Publiez une annonce pour suivre ses performances.
              </p>
            )}
            {perProperty.map(({ property: p, views: v, views30, leads }) => {
              const max = Math.max(1, ...perProperty.map((x) => x.views));
              return (
                <div key={p.id} className="rounded-2xl bg-card p-4 shadow-soft">
                  <div className="flex flex-wrap items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gold" />
                    <Link
                      to="/bien/$id"
                      params={{ id: p.id }}
                      className="min-w-0 flex-1 truncate font-semibold text-foreground hover:text-gold"
                    >
                      {p.title}
                    </Link>
                    <Badge variant={p.status === "publie" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full gold-gradient"
                      style={{ width: `${Math.round((v / max) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="font-bold text-foreground">{v}</p>
                      <p className="text-xs text-muted-foreground">Vues totales</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{views30}</p>
                      <p className="text-xs text-muted-foreground">30 derniers jours</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{leads}</p>
                      <p className="text-xs text-muted-foreground">Leads générés</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="demandes" className="mt-6 grid gap-3">
            {requestsQuery.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
            {!requestsQuery.isLoading && requests.length === 0 && (
              <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-soft">
                Aucune demande reçue pour le moment.
              </p>
            )}
            {requests.map((r) => {
              const related = properties.find((p) => p.id === r.property_id);
              return (
                <div key={r.id} className="rounded-2xl bg-card p-4 shadow-soft">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{r.full_name}</p>
                    <Badge
                      variant={
                        r.status === "nouveau"
                          ? "default"
                          : r.status === "en_cours"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {r.status}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {related && (
                    <p className="mt-1 text-xs text-muted-foreground">Bien : {related.title}</p>
                  )}
                  <p className="mt-2 text-sm text-foreground">{r.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <a href={`mailto:${r.email}`}>
                        <Mail className="mr-1 h-4 w-4" /> {r.email}
                      </a>
                    </Button>
                    {r.phone && (
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <a href={`tel:${r.phone}`}>
                          <Phone className="mr-1 h-4 w-4" /> {r.phone}
                        </a>
                      </Button>
                    )}
                    <Select
                      value={r.status}
                      onValueChange={(v) =>
                        requestStatusMutation.mutate({ id: r.id, status: v as RequestStatus })
                      }
                    >
                      <SelectTrigger className="ml-auto w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nouveau">Nouveau</SelectItem>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="traite">Traité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </TabsContent>

        </Tabs>
      </div>
    </main>
  );
}
