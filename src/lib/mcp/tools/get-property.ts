import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_property",
  title: "Détail d'un bien",
  description: "Récupère la fiche complète d'une annonce publiée SeLoger CI à partir de son identifiant.",
  inputSchema: { id: z.string().uuid().describe("Identifiant (UUID) de l'annonce.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .eq("status", "publie")
      .maybeSingle();

    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text" as const, text: "Annonce introuvable ou non publiée." }],
        isError: true,
      };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: { property: data },
    };
  },
});
