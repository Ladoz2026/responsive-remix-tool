import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { wpAnnoncesQuery } from "@/lib/wordpress-annonces";
import { PropertyCard } from "@/components/site/PropertyCard";

export function Properties() {
  const { data: items, isLoading, error } = useQuery(wpAnnoncesQuery);

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

        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl bg-card shadow-soft">
                <div className="h-52 w-full animate-pulse bg-secondary" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/5 animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-3/5 animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <p className="mt-10 rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
            {error
              ? "Impossible de charger les annonces pour le moment."
              : "Aucune annonce publiée pour le moment."}
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
