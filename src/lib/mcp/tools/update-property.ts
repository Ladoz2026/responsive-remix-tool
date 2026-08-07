import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_property",
  title: "Modifier une annonce",
  description:
    "Met à jour une annonce appartenant à l'agence connectée (prix, titre, description, statut, caractéristiques).",
  inputSchema: {
    id: z.string().uuid().describe("Identifiant de l'annonce à modifier."),
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    bedrooms: z.number().int().optional(),
    bathrooms: z.number().int().optional(),
    surface_m2: z.number().optional(),
    status: z
      .enum(["brouillon", "en_revue", "publie", "archive"])
      .optional()
      .describe("Nouveau statut de l'annonce."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ id, ...patch }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text" as const, text: "Non authentifié." }], isError: true };

    const updates = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(updates).length === 0)
      return { content: [{ type: "text" as const, text: "Aucun champ à modifier." }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("properties")
      .update(updates as never)
      .eq("id", id)
      .eq("owner_id", ctx.getUserId() as string)
      .select("id, title, price, status")
      .maybeSingle();

    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text" as const, text: "Annonce introuvable pour ce compte." }],
        isError: true,
      };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: { property: data },
    };
  },
});
