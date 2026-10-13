import { queryOptions } from "@tanstack/react-query";

const API_BASE = "https://api-seloger-ci.poroinfo.net/wp-json/seloger/v1/mes-annonces";

export type MonAnnonce = {
  id: number;
  title: string;
  statut: string;
  prix: number;
  unite: string;
  type_bien: string;
  ville: string;
  quartier: string;
};

type WpMesAnnonce = {
  id: number;
  title: string;
  status: string;
  acf?: Record<string, unknown> | false | null;
};

const num = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[\s\u00A0]/g, "").replace(/,/g, "."));
  return Number.isFinite(n) ? n : 0;
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");

const WP_STATUS_LABELS: Record<string, string> = {
  publish: "Publiée",
  pending: "En validation",
  draft: "Brouillon",
};

export const wpMesAnnoncesQuery = (ownerUid: string) =>
  queryOptions({
    queryKey: ["my-properties", ownerUid],
    queryFn: async (): Promise<MonAnnonce[]> => {
      const res = await fetch(`${API_BASE}?owner_uid=${encodeURIComponent(ownerUid)}`);
      if (!res.ok) throw new Error(`WordPress API ${res.status}`);
      const data = (await res.json()) as WpMesAnnonce[];
      return (Array.isArray(data) ? data : []).map((a) => {
        const acf = (a.acf || {}) as Record<string, unknown>;
        return {
          id: a.id,
          title: a.title,
          statut: str(acf["statut"]) || WP_STATUS_LABELS[a.status] || a.status,
          prix: num(acf["prix"]),
          unite: str(acf["unite_prix"]) || "FCFA",
          type_bien: str(acf["type_bien"]),
          ville: str(acf["ville"]),
          quartier: str(acf["quartier"]),
        };
      });
    },
    staleTime: 30_000,
  });
