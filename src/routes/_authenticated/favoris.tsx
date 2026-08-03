import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Header } from "@/components/site/Header";
import { PropertyCard, type PropertyCardData } from "@/components/site/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/favoris")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Mes biens favoris | SeLoger CI" },
      {
        name: "description",
        content: "Retrouvez tous les biens immobiliers que vous avez enregistrés sur SeLoger CI.",
      },
      { property: "og:title", content: "Mes biens favoris | SeLoger CI" },
      {
        property: "og:description",
        content: "Votre sélection personnelle de biens vérifiés en Côte d'Ivoire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavoritesPage,
});

const sel = (s: string): string => s;

function FavoritesPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: favs, error } = await supabase
        .from("favorites")
        .select("property_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      const ids = (favs ?? []).map((f) => f.property_id);
      if (ids.length === 0) return [] as PropertyCardData[];
      const { data: props, error: propsError } = await supabase
        .from("properties")
        .select(
          sel(
            "id, title, price, currency, city, district, bedrooms, bathrooms, surface_m2, images, is_verified, is_featured, transaction",
          ),
        )
        .in("id", ids)
        .returns<PropertyCardData[]>();
      if (propsError) throw propsError;
      return props ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6">
        <p className="eyebrow">Ma sélection</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Mes biens favoris
        </h1>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid place-items-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (data ?? []).length === 0 ? (
            <div className="rounded-3xl bg-card p-10 text-center shadow-soft">
              <h2 className="text-lg font-bold text-foreground">Aucun favori pour le moment</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enregistrez des biens depuis la recherche pour les retrouver ici.
              </p>
              <Link
                to="/recherche"
                className="mt-6 inline-flex rounded-full gold-gradient px-5 py-2.5 text-sm font-bold text-accent-foreground"
              >
                Explorer les biens
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data!.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
