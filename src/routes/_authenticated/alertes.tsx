import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatPrice } from "@/lib/format";

type SavedSearch = Database["public"]["Tables"]["saved_searches"]["Row"];

export const Route = createFileRoute("/_authenticated/alertes")({
  head: () => ({
    meta: [
      { title: "Mes alertes immobilières | SeLoger CI" },
      {
        name: "description",
        content:
          "Créez des alertes personnalisées et soyez notifié dès qu'un bien correspondant à vos critères est publié sur SeLoger CI.",
      },
      { property: "og:title", content: "Mes alertes immobilières | SeLoger CI" },
      {
        property: "og:description",
        content: "Matching automatique : recevez une notification dès qu'un bien vous correspond.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-8 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
});

function criteriaSummary(s: SavedSearch) {
  const parts: string[] = [];
  if (s.transaction) parts.push(s.transaction === "vente" ? "Achat" : "Location");
  if (s.property_type) parts.push(s.property_type);
  if (s.city) parts.push(s.city);
  if (s.district) parts.push(s.district);
  if (s.min_price) parts.push(`dès ${formatPrice(Number(s.min_price))}`);
  if (s.max_price) parts.push(`max ${formatPrice(Number(s.max_price))}`);
  if (s.min_surface) parts.push(`≥ ${s.min_surface} m²`);
  if (s.min_bedrooms) parts.push(`${s.min_bedrooms}+ chambres`);
  if (s.requires_pool) parts.push("piscine");
  if (s.requires_garage) parts.push("garage");
  if (s.requires_furnished) parts.push("meublé");
  return parts.length ? parts.join(" • ") : "Tous les biens publiés";
}

function AlertsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");

  const alertsQuery = useQuery({
    queryKey: ["saved-searches", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<SavedSearch[]> => {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createAlert = useMutation({
    mutationFn: async () => {
      const label = name.trim();
      if (label.length < 2) throw new Error("Donnez un nom à votre alerte");
      const { error } = await supabase.from("saved_searches").insert({
        user_id: user!.id,
        name: label.slice(0, 80),
        city: city.trim() || null,
        max_price: maxPrice ? Number(maxPrice) : null,
        min_bedrooms: minBedrooms ? Number(minBedrooms) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setCity("");
      setMaxPrice("");
      setMinBedrooms("");
      toast.success("Alerte créée");
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleAlert = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("saved_searches").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_searches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerte supprimée");
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alerts = alertsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="eyebrow">Matching automatique</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Mes alertes immobilières
            </h1>
            <p className="mt-3 text-muted-foreground">
              Dès qu'un bien correspondant à vos critères est publié, vous recevez une notification.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/recherche">
              <Search className="mr-2 h-4 w-4" /> Recherche avancée
            </Link>
          </Button>
        </div>

        <section className="mt-8 rounded-3xl bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Créer une alerte rapide</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="alert-name">Nom de l'alerte</Label>
              <Input
                id="alert-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Villa Cocody 3 chambres"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-city">Ville</Label>
              <Input
                id="alert-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Abidjan"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-price">Budget max (FCFA)</Label>
              <Input
                id="alert-price"
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-rooms">Chambres min.</Label>
              <Input
                id="alert-rooms"
                type="number"
                min={0}
                max={50}
                value={minBedrooms}
                onChange={(e) => setMinBedrooms(e.target.value)}
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button
                className="rounded-full"
                onClick={() => createAlert.mutate()}
                disabled={createAlert.isPending}
              >
                {createAlert.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BellRing className="mr-2 h-4 w-4" />
                )}
                Créer l'alerte
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {alertsQuery.isLoading && (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!alertsQuery.isLoading && alerts.length === 0 && (
            <p className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Aucune alerte pour le moment. Créez-en une ci-dessus ou depuis la recherche avancée.
            </p>
          )}
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-card p-5 shadow-soft"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{alert.name}</h3>
                  {alert.is_active ? (
                    <Badge variant="secondary">Active</Badge>
                  ) : (
                    <Badge variant="outline">En pause</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{criteriaSummary(alert)}</p>
                {alert.last_notified_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dernière correspondance :{" "}
                    {new Date(alert.last_notified_at).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={alert.is_active}
                  onCheckedChange={(v) => toggleAlert.mutate({ id: alert.id, is_active: v })}
                  aria-label="Activer l'alerte"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteAlert.mutate(alert.id)}
                  aria-label="Supprimer l'alerte"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
