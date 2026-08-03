import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, SlidersHorizontal } from "lucide-react";

import { Header } from "@/components/site/Header";
import { PropertyCard, type PropertyCardData } from "@/components/site/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recherche")({
  head: () => ({
    meta: [
      { title: "Recherche de biens immobiliers en Côte d'Ivoire | SeLoger CI" },
      {
        name: "description",
        content:
          "Filtrez les annonces vérifiées par ville, commune, quartier, budget, surface, chambres et équipements sur SeLoger CI.",
      },
      { property: "og:title", content: "Recherche de biens immobiliers | SeLoger CI" },
      {
        property: "og:description",
        content: "Trouvez villas, appartements, bureaux et terrains vérifiés en Côte d'Ivoire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

const sel = (s: string): string => s;

type Filters = {
  q: string;
  transaction: string;
  propertyType: string;
  cityId: string;
  communeId: string;
  districtId: string;
  minPrice: string;
  maxPrice: string;
  minSurface: string;
  bedrooms: string;
  amenities: string[];
  sort: string;
};

const emptyFilters: Filters = {
  q: "",
  transaction: "",
  propertyType: "",
  cityId: "",
  communeId: "",
  districtId: "",
  minPrice: "",
  maxPrice: "",
  minSurface: "",
  bedrooms: "",
  amenities: [],
  sort: "recent",
};

const amenityOptions = [
  { key: "has_pool", label: "Piscine" },
  { key: "has_garage", label: "Garage" },
  { key: "has_garden", label: "Jardin" },
  { key: "has_ac", label: "Climatisation" },
  { key: "has_kitchen", label: "Cuisine équipée" },
  { key: "is_furnished", label: "Meublé" },
] as const;

const propertyTypes = ["appartement", "villa", "maison", "bureau", "terrain", "commerce"] as const;

function SearchPage() {
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [panelOpen, setPanelOpen] = useState(false);

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data } = await supabase.from("cities").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: communes } = useQuery({
    queryKey: ["communes", draft.cityId],
    enabled: Boolean(draft.cityId),
    queryFn: async () => {
      const { data } = await supabase
        .from("communes")
        .select("id, name")
        .eq("city_id", draft.cityId)
        .order("name");
      return data ?? [];
    },
  });

  const { data: districts } = useQuery({
    queryKey: ["districts", draft.communeId],
    enabled: Boolean(draft.communeId),
    queryFn: async () => {
      const { data } = await supabase
        .from("districts")
        .select("id, name")
        .eq("commune_id", draft.communeId)
        .order("name");
      return data ?? [];
    },
  });

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", filters],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select(
          sel(
            "id, title, price, currency, city, district, bedrooms, bathrooms, surface_m2, images, is_verified, is_featured, transaction",
          ),
        )
        .eq("status", "publie");

      if (filters.q) query = query.ilike("title", `%${filters.q}%`);
      if (filters.transaction) query = query.eq("transaction", filters.transaction);
      if (filters.propertyType) query = query.eq("property_type", filters.propertyType);
      if (filters.cityId) query = query.eq("city_id", filters.cityId);
      if (filters.communeId) query = query.eq("commune_id", filters.communeId);
      if (filters.districtId) query = query.eq("district_id", filters.districtId);
      if (filters.minPrice) query = query.gte("price", Number(filters.minPrice));
      if (filters.maxPrice) query = query.lte("price", Number(filters.maxPrice));
      if (filters.minSurface) query = query.gte("surface_m2", Number(filters.minSurface));
      if (filters.bedrooms) query = query.gte("bedrooms", Number(filters.bedrooms));
      for (const amenity of filters.amenities) query = query.eq(amenity, true);

      if (filters.sort === "price_asc") query = query.order("price", { ascending: true });
      else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
      else query = query.order("created_at", { ascending: false });

      const { data, error } = await query.limit(60).returns<PropertyCardData[]>();
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) =>
        key === "amenities" ? (value as string[]).length > 0 : key !== "sort" && Boolean(value),
      ).length,
    [filters],
  );

  const update = (patch: Partial<Filters>) => setDraft((prev) => ({ ...prev, ...patch }));

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Recherche avancée</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Trouvez le bien qui vous correspond
          </h1>
          <p className="mt-3 text-muted-foreground">
            Ville, commune, quartier, budget, surface, équipements — affinez votre recherche.
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-card p-5 shadow-soft sm:p-6">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <Input
              value={draft.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Villa, appartement, mot-clé…"
              maxLength={120}
              className="rounded-full"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setPanelOpen((v) => !v)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filtres {activeCount > 0 && `(${activeCount})`}
            </Button>
            <Button type="button" className="rounded-full" onClick={() => setFilters(draft)}>
              Rechercher
            </Button>
          </div>

          <div
            className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-400 ease-out ${
              panelOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Transaction</Label>
                  <select
                    value={draft.transaction}
                    onChange={(e) => update({ transaction: e.target.value })}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Toutes</option>
                    <option value="vente">Vente</option>
                    <option value="location">Location</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label>Type de bien</Label>
                  <select
                    value={draft.propertyType}
                    onChange={(e) => update({ propertyType: e.target.value })}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm capitalize"
                  >
                    <option value="">Tous</option>
                    {propertyTypes.map((t) => (
                      <option key={t} value={t} className="capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label>Ville</Label>
                  <select
                    value={draft.cityId}
                    onChange={(e) => update({ cityId: e.target.value, communeId: "", districtId: "" })}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Toutes les villes</option>
                    {(cities ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label>Commune</Label>
                  <select
                    value={draft.communeId}
                    onChange={(e) => update({ communeId: e.target.value, districtId: "" })}
                    disabled={!draft.cityId}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                  >
                    <option value="">Toutes les communes</option>
                    {(communes ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label>Quartier</Label>
                  <select
                    value={draft.districtId}
                    onChange={(e) => update({ districtId: e.target.value })}
                    disabled={!draft.communeId}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                  >
                    <option value="">Tous les quartiers</option>
                    {(districts ?? []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label>Chambres (min.)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={draft.bedrooms}
                    onChange={(e) => update({ bedrooms: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Budget min. (FCFA)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={draft.minPrice}
                    onChange={(e) => update({ minPrice: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Budget max. (FCFA)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={draft.maxPrice}
                    onChange={(e) => update({ maxPrice: e.target.value })}
                    placeholder="500 000 000"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Surface min. (m²)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={draft.minSurface}
                    onChange={(e) => update({ minSurface: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                  <Label>Équipements</Label>
                  <div className="flex flex-wrap gap-2">
                    {amenityOptions.map((a) => {
                      const active = draft.amenities.includes(a.key);
                      return (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() =>
                            update({
                              amenities: active
                                ? draft.amenities.filter((x) => x !== a.key)
                                : [...draft.amenities, a.key],
                            })
                          }
                          className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                            active
                              ? "border-transparent gold-gradient text-accent-foreground"
                              : "border-border text-foreground hover:bg-secondary"
                          }`}
                        >
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Trier par</Label>
                  <select
                    value={draft.sort}
                    onChange={(e) => update({ sort: e.target.value })}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="recent">Plus récents</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => {
                      setDraft(emptyFilters);
                      setFilters(emptyFilters);
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          {isFetching ? (
            <div className="grid place-items-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (results ?? []).length === 0 ? (
            <div className="rounded-3xl bg-card p-10 text-center shadow-soft">
              <h2 className="text-lg font-bold text-foreground">Aucun bien ne correspond</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Élargissez vos critères ou réinitialisez les filtres.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-muted-foreground">
                {results!.length} bien{results!.length > 1 ? "s" : ""} trouvé
                {results!.length > 1 ? "s" : ""}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results!.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
