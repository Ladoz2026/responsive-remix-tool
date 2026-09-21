import { queryOptions } from "@tanstack/react-query";
import type { PropertyCardData } from "@/components/site/PropertyCard";

const API_URL = "https://api-seloger-ci.poroinfo.net/wp-json/wp/v2/annonces?_embed&per_page=50";

type WpMedia = { source_url?: string; media_details?: { sizes?: Record<string, { source_url: string }> } };

type WpAnnonce = {
  id: number;
  title: { rendered: string };
  acf?: {
    prix?: number | string | null;
    unite_prix?: string | null;
    type_transaction?: string | null;
    type_bien?: string | null;
    quartier?: string | null;
    ville?: string | null;
    chambres?: number | string | null;
    salles_de_bain?: number | string | null;
    surface_m2?: number | string | null;
    badges?: string[] | null;
    statut?: string | null;
  } | null;
  _embedded?: { "wp:featuredmedia"?: WpMedia[] };
};

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function featuredImage(a: WpAnnonce): string | null {
  const media = a._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return null;
  const sizes = media.media_details?.sizes;
  return sizes?.medium_large?.source_url ?? sizes?.large?.source_url ?? media.source_url ?? null;
}

export function wpAnnonceToCard(a: WpAnnonce): PropertyCardData {
  const acf = a.acf ?? {};
  return {
    id: String(a.id),
    title: a.title?.rendered ?? "Annonce",
    price: num(acf.prix),
    currency: acf.unite_prix || "FCFA",
    city: acf.ville || "",
    district: acf.quartier || null,
    property_type: acf.type_bien || "",
    transaction: acf.type_transaction || "",
    bedrooms: num(acf.chambres),
    bathrooms: num(acf.salles_de_bain),
    surface_m2: acf.surface_m2 ? num(acf.surface_m2) : null,
    images: null,
    image_url: featuredImage(a),
    type_label: acf.type_bien || null,
    transaction_label: acf.type_transaction || null,
    is_verified: (acf.badges ?? []).includes("Vérifié"),
    is_featured: (acf.badges ?? []).includes("À la une"),
  };
}

export const wpAnnoncesQuery = queryOptions({
  queryKey: ["wp-annonces"],
  queryFn: async (): Promise<PropertyCardData[]> => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`WordPress API ${res.status}`);
    const data = (await res.json()) as WpAnnonce[];
    return (Array.isArray(data) ? data : [])
      .filter((a) => (a.acf?.statut ?? "").trim().toLowerCase() === "publiée")
      .map(wpAnnonceToCard);
  },
  staleTime: 60_000,
  retry: 1,
});
