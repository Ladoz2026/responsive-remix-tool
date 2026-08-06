import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { featuredQuery } from "@/lib/property-queries";
import { PropertyCard, type PropertyCardData } from "@/components/site/PropertyCard";

export function Properties() {
  const { data, isLoading } = useQuery(featuredQuery);

  return (
    <section id="properties" className="bg-secondary/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Biens à la une</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Propriétés vérifiées et coups de cœur
          </h2>
          <p className="mt-3 text-muted-foreground">
            Une sélection rigoureusement validée par nos équipes.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((p) => (
            <PropertyCard key={p.id} property={p as PropertyCardData} />
          ))}
        </div>

        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="mt-10 rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
            Aucune annonce publiée pour le moment.
          </p>
        )}

        <div className="mt-10">
          <Link
            to="/recherche"
            className="inline-flex items-center gap-2 rounded-full gold-gradient px-6 py-3 text-sm font-bold text-accent-foreground shadow-gold"
          >
            Voir toutes les annonces
          </Link>
        </div>
      </div>
    </section>
  );
}
