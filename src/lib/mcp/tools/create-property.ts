import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_property",
  title: "Créer une annonce",
  description:
    "Crée une nouvelle annonce immobilière pour l'agence connectée. L'annonce est créée en brouillon par défaut.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Titre de l'annonce."),
    description: z.string().optional(),
    price: z.number().describe("Prix en FCFA."),
    city: z.string().describe("Ville du bien."),
    district: z.string().optional().describe("Quartier."),
    address: z.string().optional(),
    property_type: z.enum(["appartement", "villa", "maison", "bureau", "terrain", "commerce"]),
    transaction: z.enum(["vente", "location"]),
    bedrooms: z.number().int().optional(),
    bathrooms: z.number().int().optional(),
    surface_m2: z.number().optional(),
    status: z.enum(["brouillon", "en_revue", "publie"]).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text" as const, text: "Non authentifié." }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("properties")
      .insert({
        owner_id: ctx.getUserId() as string,
        title: input.title,
        description: input.description ?? null,
        price: input.price,
        city: input.city,
        district: input.district ?? null,
        address: input.address ?? null,
        property_type: input.property_type,
        transaction: input.transaction,
        bedrooms: input.bedrooms ?? 0,
        bathrooms: input.bathrooms ?? 0,
        surface_m2: input.surface_m2 ?? null,
        status: input.status ?? "brouillon",
      })
      .select("id, title, status")
      .maybeSingle();

    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: { property: data },
    };
  },
});
