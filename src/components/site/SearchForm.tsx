import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { wpAnnoncesQuery } from "@/lib/wordpress-annonces";
import { PROPERTY_TYPES, TRANSACTIONS } from "@/lib/format";
import type { SearchFilters } from "@/lib/immobilier-queries";

const fieldClass =
  "w-full min-w-0 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold";

// Compare sans tenir compte des accents ni des majuscules
const norm = (s: string | null | undefined) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const v of values) {
    const label = (v ?? "").trim();
    if (label && !seen.has(norm(label))) seen.set(norm(label), label);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "fr"));
}

export function SearchForm({
  initial,
  compact = false,
}: {
  initial?: SearchFilters;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const { data } = useQuery(wpAnnoncesQuery);
  const [filters, setFilters] = useState<SearchFilters>(initial ?? {});

  // cityId et districtId contiennent ici le nom de la ville et du quartier
  const set = (key: keyof SearchFilters, value: string) =>
    setFilters((f) => ({
      ...f,
      [key]:
        value === ""
          ? undefined
          : key === "minPrice" || key === "maxPrice"
            ? Number(value)
            : value,
      ...(key === "cityId" ? { districtId: undefined } : {}),
    }));

  const cities = useMemo(() => uniqueSorted((data ?? []).map((p) => p.city)), [data]);
  const districts = useMemo(
    () =>
      uniqueSorted(
        (data ?? [])
          .filter((p) => !filters.cityId || norm(p.city) === norm(filters.cityId))
          .map((p) => p.district),
      ),
    [data, filters.cityId],
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/recherche", search: filters as never });
      }}
      className={compact ? "rounded-3xl bg-card p-4 shadow-soft" : "rounded-3xl glass-panel p-4 sm:p-5"}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select
          className={fieldClass}
          value={filters.transaction ?? ""}
          onChange={(e) => set("transaction", e.target.value)}
        >
          <option value="">Transaction</option>
          {TRANSACTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={filters.propertyType ?? ""}
          onChange={(e) => set("propertyType", e.target.value)}
        >
          <option value="">Type de bien</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={filters.cityId ?? ""}
          onChange={(e) => set("cityId", e.target.value)}
        >
          <option value="">Ville</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className={fieldClass}
          value={filters.districtId ?? ""}
          onChange={(e) => set("districtId", e.target.value)}
        >
          <option value="">Quartier</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
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
          onChange={(e) => set("maxPrice",
