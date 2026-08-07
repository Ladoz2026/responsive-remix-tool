import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

const LIST_COLUMNS =
  "id, title, price, currency, city, district, property_type, transaction, bedrooms, bathrooms, surface_m2, is_verified, is_featured, created_at";

export default defineTool({
  name: "search_properties",
  title: "Rechercher des biens",
  description:
    "Recherche les annonces immobilières publiées sur SeLoger CI (ville, type de bien, transaction, budget, chambres).",
  inputSchema: {
    query: z.string().optional().describe("Mots-clés recherchés dans le titre ou la ville."),
    city: z.string().optional().describe("Nom de la ville, ex: Abidjan."),
    property_type: z
      .enum(["appartement", "villa", "maison", "bureau", "terrain", "commerce"])
      .optional(),
    transaction: z.enum(["vente", "location"]).optional(),
    min_price: z.number().optional().describe("Prix minimum en FCFA."),
    max_price: z.number().optional().describe("Prix maximum en FCFA."),
    min_bedrooms: z.number().int().optional(),
    limit: z.number().int().min(1).max(50).optional().describe("Nombre de résultats (défaut 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const supabase = supabaseAnon();
    let query = supabase
      .from("properties")
      .select(LIST_COLUMNS)
      .eq("status", "publie")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 20);

    if (input.city) query = query.ilike("city", `%${input.city}%`);
    if (input.property_type) query = query.eq("property_type", input.property_type);
    if (input.transaction) query = query.eq("transaction", input.transaction);
    if (input.min_price !== undefined) query = query.gte("price", input.min_price);
    if (input.max_price !== undefined) query = query.lte("price", input.max_price);
    if (input.min_bedrooms !== undefined) query = query.gte("bedrooms", input.min_bedrooms);
    if (input.query) query = query.or(`title.ilike.%${input.query}%,city.ilike.%${input.query}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data ?? []) }],
      structuredContent: { count: data?.length ?? 0, properties: data ?? [] },
    };
  },
});
