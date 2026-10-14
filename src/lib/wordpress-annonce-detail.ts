import { queryOptions } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/integrations/supabase/immobilier";
import { decodeHtml } from "@/lib/wordpress-annonces";

const API_BASE = "https://api-seloger-ci.poroinfo.net/wp-json/wp/v2/annonces";
const PHOTOS_BASE = `${SUPABASE_URL}/storage/v1/object/public/property-images/`;

type WpMedia = {
  source_url?: string;
  media_details?: { sizes?: Record<string, { source_url: string }> };
};

type WpAnnonceDetail = {
  id: number;
  title: { rendered: string };
  content?: { rendered?: string };
  acf?: Record<string, unknown> | false | null;
  _embedded?: { "wp:featuredmedia"?: WpMedia[] };
};

export type AnnonceDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  transaction: string;
  propertyType: string;
  district: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  surface: number | null;
  verified: boolean;
  photos: string[];
};

const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

const num = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[\s\u00A0]/g, "").replace(/,/g, "."));
  return Number.isFinite(n) ? n : 0;
};

const toPublicUrl = (p: string): string =>
  /^https?:\/\//.test(p) ? p : PHOTOS_BASE + p.split("/").map(encodeURIComponent).join("/");

export const wpAnnonceQuery = (id: string) =>
  queryOptions({
    queryKey: ["wp-annonce", id],
    queryFn: async (): Promise<AnnonceDetail | null> => {
      if (!/^\d+$/.test(id)) return null;
      const res = await fetch(`${API_BASE}/${id}?_embed`);
      if (res.status === 404 || res.status === 401 || res.status === 403) return null;
      if (!res.ok) throw new Error(`WordPress API ${res.status}`);

      const a = (await res.json()) as WpAnnonceDetail;
      const acf = (a.acf || {}) as Record<string, unknown>;
      if (str(acf["statut"]).trim().toLowerCase() !== "publiée") return null;

      const media = a._embedded?.["wp:featuredmedia"]?.[0];
      const sizes = media?.media_details?.sizes;
      const featured = sizes?.["large"]?.source_url ?? media?.source_url ?? null;
      const seller = str(acf["photos_urls"])
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(toPublicUrl);
      const photos = [...new Set([featured, ...seller].filter((u): u is string => Boolean(u)))];
      const badges = Array.isArray(acf["badges"]) ? (acf["badges"] as string[]) : [];

      return {
        id: String(a.id),
        title: decodeHtml(a.title?.rendered) || "Annonce",
        description: decodeHtml(a.content?.rendered),
        price: num(acf["prix"]),
        currency: str(acf["unite_prix"]) || "FCFA",
        transaction: str(acf["type_transaction"]),
        propertyType: str(acf["type_bien"]),
        district: str(acf["quartier"]),
        city: str(acf["ville"]),
        bedrooms: num(acf["chambres"]),
        bathrooms: num(acf["salles_de_bain"]),
        surface: acf["surface_m2"] ? num(acf["surface_m2"]) : null,
        verified: badges.includes("Vérifié"),
        photos,
      };
    },
    staleTime: 60_000,
    retry: 1,
  });
