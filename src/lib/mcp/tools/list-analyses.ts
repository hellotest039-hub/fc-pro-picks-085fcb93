import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_analyses",
  title: "Lister les analyses",
  description:
    "Liste les analyses de matchs FIFA/FC virtuels du compte connecté (compétition, équipes, date, résultat réel si renseigné).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Nombre maximum d'analyses (défaut 20)."),
    competition: z.string().optional().describe("Filtre exact sur le nom de la compétition."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, competition }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("analyses")
      .select(
        "id, competition, home_team, away_team, created_at, actual_ht_home_goals, actual_ht_away_goals, actual_home_goals, actual_away_goals, result_recorded_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (competition) query = query.eq("competition", competition);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { analyses: data ?? [] },
    };
  },
});
