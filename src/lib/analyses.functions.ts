import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  competition: z.string().trim().min(1).max(120),
  homeTeam: z.string().trim().min(1).max(80),
  awayTeam: z.string().trim().min(1).max(80),
  homeMatches: z.number().int().nullable(),
  homeGoalsFor: z.number().int().nullable(),
  homeGoalsAgainst: z.number().int().nullable(),
  awayMatches: z.number().int().nullable(),
  awayGoalsFor: z.number().int().nullable(),
  awayGoalsAgainst: z.number().int().nullable(),
  notes: z.string().max(1000).default(""),
});

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("analyses")
      .select("id, competition, home_team, away_team, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("analyses")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Analyse introuvable.");
    return row;
  });

export const createAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { generateReport } = await import("./prediction.server");
    const report = await generateReport(data);

    const { data: row, error } = await context.supabase
      .from("analyses")
      .insert({
        user_id: context.userId,
        competition: data.competition,
        home_team: data.homeTeam,
        away_team: data.awayTeam,
        input: data,
        report,
        status: "done",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
