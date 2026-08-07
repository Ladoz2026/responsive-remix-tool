import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_contact_requests",
  title: "Demandes de contact",
  description: "Liste les demandes de contact (leads) reçues sur les annonces de l'agence connectée.",
  inputSchema: {
    status: z.enum(["nouveau", "en_cours", "traite"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text" as const, text: "Non authentifié." }], isError: true };

    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("contact_requests")
      .select("id, full_name, email, phone, message, status, priority, property_id, created_at")
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 50);

    if (input.status) query = query.eq("status", input.status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data ?? []) }],
      structuredContent: { count: data?.length ?? 0, requests: data ?? [] },
    };
  },
});
