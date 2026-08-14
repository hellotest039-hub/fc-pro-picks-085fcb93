import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "record_result",
  title: "Enregistrer le résultat réel",
  description:
    "Enregistre le score réel (mi-temps et fin de match) d'une analyse, afin de calibrer les prochaines prédictions de la même compétition.",
  inputSchema: {
    id: z.string().describe("Identifiant UUID de l'analyse."),
    homeGoals: z.number().int().describe("Buts marqués par l'équipe à domicile en fin de match."),
    awayGoals: z.number().int().describe("Buts marqués par l'équipe à l'extérieur en fin de match."),
    htHomeGoals: z.number().int().optional().describe("Buts à domicile à la mi-temps."),
    htAwayGoals: z.number().int().optional().describe("Buts à l'extérieur à la mi-temps."),
    notes: z.string().optional().describe("Observations qualitatives sur le déroulé du match."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, homeGoals, awayGoals, htHomeGoals, htAwayGoals, notes }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("analyses")
      .update({
        actual_home_goals: homeGoals,
        actual_away_goals: awayGoals,
        actual_ht_home_goals: htHomeGoals ?? null,
        actual_ht_away_goals: htAwayGoals ?? null,
        result_notes: notes?.trim() || null,
        result_recorded_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, home_team, away_team, actual_home_goals, actual_away_goals");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data || data.length === 0) {
      return { content: [{ type: "text", text: "Analyse introuvable." }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data[0]) }],
      structuredContent: { analysis: data[0] },
    };
  },
});
