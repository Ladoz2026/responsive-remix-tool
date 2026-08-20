// Requêtes de recherche branchées EXCLUSIVEMENT sur la base Supabase « immobilier ».
// Aucune table n'est créée ni modifiée : lecture seule sur les tables existantes
// (properties, property_categories, property_types, listing_types, cities, communes,
// districts, property_images).
import { queryOptions } from "@tanstack/react-query";
import { getImmobilierClient, isImmobilierConfigured } from "@/integrations/supabase/immobilier";
import type { PropertyCardData } from "@/components/site/PropertyCard";

export type SearchFilters = {
  cityId?: string | undefined;
  communeId?: string | undefined;
  districtId?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  /** listing_types.code */
  transaction?: string | undefined;
  /** property_categories.code */
  categoryId?: string | undefined;
  /** property_types.code */
  propertyType?: string | undefined;
  q?: string | undefined;
};

export type RefItem = { id: string; code: string; name: string; parent: string | null };

type Row = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown) => (typeof v === "number" ? v : v == null ? null : Number(v));

function mapRef(rows: Row[] | null, parentKey?: string): RefItem[] {
  return (rows ?? []).map((r) => ({
    id: str(r['id']),
    code: str(r['code'] ?? r['slug'] ?? r['id']),
    name: str(r['name_fr'] ?? r['name'] ?? r['label'] ?? r['code']),
    parent: parentKey ? (r[parentKey] == null ? null : str(r[parentKey])) : null,
  }));
}

/** Les référentiels peuvent avoir is_active NULL : on ne doit pas les exclure. */
const ACTIVE = "is_active.is.null,is_active.is.true";

export const referenceQuery = queryOptions({
  queryKey: ["immobilier", "reference"],
  staleTime: 10 * 60 * 1000,
  queryFn: async () => {
    const empty = {
      listingTypes: [] as RefItem[],
      categories: [] as RefItem[],
      propertyTypes: [] as RefItem[],
      cities: [] as RefItem[],
      communes: [] as RefItem[],
      districts: [] as RefItem[],
    };
    if (!isImmobilierConfigured) return empty;
    const supabase = getImmobilierClient();

    const [listingTypes, categories, propertyTypes, cities, communes, districts] =
      await Promise.all([
        supabase.from("listing_types").select("id, code, name_fr, sort_order, is_active").or(ACTIVE).order("sort_order"),
        supabase.from("property_categories").select("id, code, name_fr, sort_order, is_active").or(ACTIVE).order("sort_order"),
        supabase
          .from("property_types")
          .select("id, code, name_fr, category_code, sort_order, is_active")
          .or(ACTIVE)
          .order("sort_order"),
        supabase.from("cities").select("id, code, name, sort_order").order("sort_order").order("name"),
        supabase.from("communes").select("id, code, name, city_id, sort_order").order("sort_order").order("name"),
        supabase
          .from("districts")
          .select("id, code, name, commune_id, sort_order")
          .order("sort_order")
          .order("name"),
      ]);

    return {
      listingTypes: mapRef(listingTypes.data as Row[] | null),
      categories: mapRef(categories.data as Row[] | null),
      propertyTypes: mapRef(propertyTypes.data as Row[] | null, "category_code"),
      cities: mapRef(cities.data as Row[] | null),
      communes: mapRef(communes.data as Row[] | null, "city_id"),
      districts: mapRef(districts.data as Row[] | null, "commune_id"),
    };
  },
});

export type ReferenceData = Awaited<ReturnType<NonNullable<typeof referenceQuery.queryFn>>>;

export function buildLabels(reference?: ReferenceData) {
  const dict = (items: RefItem[] | undefined) =>
    new Map((items ?? []).map((i) => [i.code, i.name] as const));
  return {
    listingTypes: dict(reference?.listingTypes),
    propertyTypes: dict(reference?.propertyTypes),
    categories: dict(reference?.categories),
  };
}

const SELECT =
  "*, property_images(url, is_primary, sort_order), cities(name), communes(name), districts(name)";

function firstImage(row: Row): string | null {
  const images = (row['property_images'] as Row[] | null) ?? [];
  if (images.length > 0) {
    const sorted = [...images].sort(
      (a, b) =>
        Number(Boolean(b['is_primary'])) - Number(Boolean(a['is_primary'])) ||
        (num(a['sort_order']) ?? 0) - (num(b['sort_order']) ?? 0),
    );
    const url = str(sorted[0]?.['url']);
    if (url) return url;
  }
  const legacy = row['main_image_url'] ?? row['cover_url'] ?? row['image_url'];
  const arr = row['images'];
  if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") return arr[0];
  return legacy ? str(legacy) : null;
}

export function toCardData(row: Row, labels: ReturnType<typeof buildLabels>): PropertyCardData {
  const typeCode = str(row['property_type_code']);
  const listingCode = str(row['listing_type_code']);
  const cityName = str((row['cities'] as Row | null)?.['name'] ?? row['city']);
  const districtName = str(
    (row['districts'] as Row | null)?.['name'] ??
      row['district'] ??
      (row['communes'] as Row | null)?.['name'] ??
      row['commune'],
  );

  return {
    id: str(row['id']),
    title: str(row['title'] ?? row['name'] ?? "Bien immobilier"),
    price: num(row['price']) ?? 0,
    currency: str(row['currency'] || "FCFA"),
    city: cityName,
    district: districtName || null,
    property_type: typeCode,
    transaction: listingCode,
    bedrooms: num(row['bedrooms']) ?? 0,
    bathrooms: num(row['bathrooms']) ?? 0,
    surface_m2: num(row['surface_m2'] ?? row['surface'] ?? row['area_m2']),
    images: null,
    image_url: firstImage(row),
    type_label: labels.propertyTypes.get(typeCode) ?? null,
    transaction_label: labels.listingTypes.get(listingCode) ?? null,
    is_verified: Boolean(row['is_verified'] ?? row['is_certified'] ?? false),
    is_featured: Boolean(row['is_featured'] ?? false),
  };
}

function publicProperties() {
  const supabase = getImmobilierClient();
  return supabase
    .from("properties")
    .select(SELECT)
    // publication : on tolère les valeurs NULL (colonnes optionnelles)
    .or("is_published.is.null,is_published.is.true")
    .or("is_active.is.null,is_active.is.true");
}

export function propertiesSearchQuery(filters: SearchFilters) {
  return queryOptions({
    queryKey: ["immobilier", "properties", filters],
    queryFn: async () => {
      if (!isImmobilierConfigured) return [] as Row[];
      let query = publicProperties()
        .order("is_featured", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(48);

      if (filters.cityId) query = query.eq("city_id", filters.cityId);
      if (filters.communeId) query = query.eq("commune_id", filters.communeId);
      if (filters.districtId) query = query.eq("district_id", filters.districtId);
      if (filters.categoryId) query = query.eq("category_code", filters.categoryId);
      if (filters.transaction) query = query.eq("listing_type_code", filters.transaction);
      if (filters.propertyType) query = query.eq("property_type_code", filters.propertyType);
      if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
      if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
      if (filters.q) query = query.ilike("title", `%${filters.q}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
}

export const featuredPropertiesQuery = queryOptions({
  queryKey: ["immobilier", "properties", "featured"],
  queryFn: async () => {
    if (!isImmobilierConfigured) return [] as Row[];
    const { data, error } = await publicProperties()
      .order("is_featured", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    return (data ?? []) as Row[];
  },
});
