import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SearchFilters = {
  cityId?: string | undefined;
  communeId?: string | undefined;
  districtId?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  transaction?: string | undefined;
  categoryId?: string | undefined;
  propertyType?: string | undefined;
  q?: string | undefined;
};

export const referenceQuery = queryOptions({
  queryKey: ["reference-data"],
  staleTime: 5 * 60 * 1000,
  queryFn: async () => {
    const [cities, communes, districts, categories] = await Promise.all([
      supabase.from("cities").select("id, name, slug").order("name"),
      supabase.from("communes").select("id, name, city_id").order("name"),
      supabase.from("districts").select("id, name, commune_id").order("name"),
      supabase.from("categories").select("id, name, slug, icon").order("sort_order"),
    ]);
    return {
      cities: cities.data ?? [],
      communes: communes.data ?? [],
      districts: districts.data ?? [],
      categories: categories.data ?? [],
    };
  },
});

const LIST_COLUMNS =
  "id, title, price, currency, city, district, property_type, transaction, bedrooms, bathrooms, surface_m2, images, is_verified, is_featured, status, created_at, owner_id";

export function propertiesQuery(filters: SearchFilters) {
  return queryOptions({
    queryKey: ["properties", filters],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select(LIST_COLUMNS)
        .eq("status", "publie")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(48);

      if (filters.cityId) query = query.eq("city_id", filters.cityId);
      if (filters.communeId) query = query.eq("commune_id", filters.communeId);
      if (filters.districtId) query = query.eq("district_id", filters.districtId);
      if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
      if (filters.transaction) query = query.eq("transaction", filters.transaction as never);
      if (filters.propertyType) query = query.eq("property_type", filters.propertyType as never);
      if (filters.minPrice) query = query.gte("price", filters.minPrice);
      if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
      if (filters.q) query = query.or(`title.ilike.%${filters.q}%,city.ilike.%${filters.q}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export const featuredQuery = queryOptions({
  queryKey: ["properties", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("properties")
      .select(LIST_COLUMNS)
      .eq("status", "publie")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    return data ?? [];
  },
});

export function propertyQuery(id: string) {
  return queryOptions({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const [{ data: gallery }, { data: agency }] = await Promise.all([
        supabase
          .from("property_images")
          .select("id, url, alt, sort_order")
          .eq("property_id", id)
          .order("sort_order"),
        supabase
          .from("profiles")
          .select("id, full_name, phone, city, avatar_url")
          .eq("id", data.owner_id)
          .maybeSingle(),
      ]);

      return { property: data, gallery: gallery ?? [], agency: agency ?? null };
    },
  });
}

export function myPropertiesQuery(userId: string) {
  return queryOptions({
    queryKey: ["my-properties", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(LIST_COLUMNS)
        .or(`owner_id.eq.${userId},agent_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function myLeadsQuery(userId: string) {
  return queryOptions({
    queryKey: ["my-leads", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("id, full_name, email, phone, message, status, created_at, property_id")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}
