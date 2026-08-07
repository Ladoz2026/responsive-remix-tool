import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_properties",
  title: "Mes annonces",
  description:
    "Liste les annonces de l'agence connectée, tous statuts confondus (brouillon, en revue, publiée, etc.).",
  inputSchema: {
    status: z
      .enum(["brouillon", "en_revue", "publie", "archive", "attente_paiement", "refuse", "expire"])
      .optional()
      .describe("Filtrer sur un statut précis."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text" as const, text: "Non authentifié." }], isError: true };

    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("properties")
      .select(
        "id, title, price, currency, city, property_type, transaction, status, is_verified, views_count, created_at",
      )
      .eq("owner_id", ctx.getUserId() as string)
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 50);

    if (input.status) query = query.eq("status", input.status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data ?? []) }],
      structuredContent: { count: data?.length ?? 0, properties: data ?? [] },
    };
  },
});
