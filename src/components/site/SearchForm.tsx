import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { referenceQuery, type SearchFilters } from "@/lib/immobilier-queries";

const fieldClass =
  "w-full min-w-0 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold";

export function SearchForm({
  initial,
  compact = false,
}: {
  initial?: SearchFilters;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const { data } = useQuery(referenceQuery);
  const [filters, setFilters] = useState<SearchFilters>(initial ?? {});

  const set = (key: keyof SearchFilters, value: string) =>
    setFilters((f) => ({
      ...f,
      [key]:
        value === ""
          ? undefined
          : key === "minPrice" || key === "maxPrice"
            ? Number(value)
            : value,
      // cascades : un changement de niveau réinitialise les niveaux inférieurs
      ...(key === "cityId" ? { communeId: undefined, districtId: undefined } : {}),
      ...(key === "communeId" ? { districtId: undefined } : {}),
      ...(key === "categoryId" ? { propertyType: undefined } : {}),
    }));

  const communes = (data?.communes ?? []).filter(
    (c) => !filters.cityId || c.parent === filters.cityId,
  );
  const districts = (data?.districts ?? []).filter(
    (d) => !filters.communeId || d.parent === filters.communeId,
  );
  const propertyTypes = (data?.propertyTypes ?? []).filter(
    (t) => !filters.categoryId || t.parent === filters.categoryId,
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/recherche", search: filters as never });
      }}
      className={compact ? "rounded-3xl bg-card p-4 shadow-soft" : "rounded-3xl glass-panel p-4 sm:p-5"}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          className={fieldClass}
          value={filters.transaction ?? ""}
          onChange={(e) => set("transaction", e.target.value)}
        >
          <option value="">Transaction</option>
          {(data?.listingTypes ?? []).map((t) => (
            <option key={t.id} value={t.code}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={filters.categoryId ?? ""}
          onChange={(e) => set("categoryId", e.target.value)}
        >
          <option value="">Catégorie</option>
          {(data?.categories ?? []).map((c) => (
            <option key={c.id} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={filters.propertyType ?? ""}
          onChange={(e) => set("propertyType", e.target.value)}
        >
          <option value="">Type de bien</option>
          {propertyTypes.map((t) => (
            <option key={t.id} value={t.code}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={filters.cityId ?? ""}
          onChange={(e) => set("cityId", e.target.value)}
        >
          <option value="">Ville</option>
          {(data?.cities ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={filters.communeId ?? ""}
          onChange={(e) => set("communeId", e.target.value)}
          disabled={!filters.cityId}
        >
          <option value="">{filters.cityId ? "Commune" : "Commune (choisir une ville)"}</option>
          {communes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={filters.districtId ?? ""}
          onChange={(e) => set("districtId", e.target.value)}
          disabled={!filters.communeId}
        >
          <option value="">
            {filters.communeId ? "Quartier" : "Quartier (choisir une commune)"}
          </option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={0}
          placeholder="Prix min (FCFA)"
          className={fieldClass}
          value={filters.minPrice ?? ""}
          onChange={(e) => set("minPrice", e.target.value)}
        />
        <input
          type="number"
          min={0}
          placeholder="Prix max (FCFA)"
          className={fieldClass}
          value={filters.maxPrice ?? ""}
          onChange={(e) => set("maxPrice", e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full gold-gradient px-6 py-3 text-sm font-bold text-accent-foreground shadow-gold transition-transform hover:-translate-y-0.5 sm:w-auto"
      >
        <Search className="h-4 w-4" />
        Rechercher
      </button>
    </form>
  );
}
