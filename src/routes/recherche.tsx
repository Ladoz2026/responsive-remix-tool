import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { CtaFooter } from "@/components/site/CtaFooter";
import { SearchForm } from "@/components/site/SearchForm";
import { PropertyCard } from "@/components/site/PropertyCard";
import { wpAnnoncesQuery } from "@/lib/wordpress-annonces";
import type { SearchFilters } from "@/lib/immobilier-queries";

const title = "Recherche de biens — SeLoger CI";
const description =
  "Filtrez les annonces immobilières par prix, transaction et type de bien en Côte d'Ivoire.";

// Compare sans tenir compte des accents ni des majuscules
const norm = (s: string | null | undefined) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const Route = createFileRoute("/recherche")({
  validateSearch: (search: Record<string, unknown>): SearchFilters => ({
    cityId: (search['cityId'] as string) || undefined,
    communeId: (search['communeId'] as string) || undefined,
    districtId: (search['districtId'] as string) || undefined,
    categoryId: (search['categoryId'] as string) || undefined,
    transaction: (search['transaction'] as string) || undefined,
    propertyType: (search['propertyType'] as string) || undefined,
    minPrice: search['minPrice'] ? Number(search['minPrice']) : undefined,
    maxPrice: search['maxPrice'] ? Number(search['maxPrice']) : undefined,
    q: (search['q'] as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const filters = Route.useSearch();
  const { data, isLoading, error } = useQuery(wpAnnoncesQuery);

  const items = (data ?? []).filter((p) => {
    if (filters.transaction && norm(p.transaction) !== norm(filters.transaction)) return false;
    if (filters.propertyType && norm(p.property_type) !== norm(filters.propertyType)) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.q) {
      const text = norm([p.title, p.city, p.district ?? "", p.property_type].join(" "));
      if (!text.includes(norm(filters.q))) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header solid />
      <main className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Trouver un bien
        </h1>
        <p className="mt-2 text-muted-foreground">
          Affinez votre recherche parmi les annonces publiées et vérifiées.
        </p>

        <div className="mt-8">
          <SearchForm initial={filters} compact />
        </div>

        <p className="mt-8 text-sm font-semibold text-muted-foreground">
          {isLoading ? "Chargement…" : `${items.length} bien(s) trouvé(s)`}
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>

        {!isLoading && items.length === 0 && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
            {error
              ? "Impossible de charger les annonces pour le moment."
              : "Aucun bien ne correspond à ces critères pour le moment."}
          </div>
        )}
      </main>
      <CtaFooter />
    </div>
  );
}
