import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const resultSchema = z.object({
  id: z.string().uuid(),
  actualHtHomeGoals: z.number().int().min(0).max(99).nullable(),
  actualHtAwayGoals: z.number().int().min(0).max(99).nullable(),
  actualHomeGoals: z.number().int().min(0).max(99).nullable(),
  actualAwayGoals: z.number().int().min(0).max(99).nullable(),
  resultNotes: z.string().max(1000).default(""),
});

export const listAnalyses = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await db
      .from("analyses")
      .select(
        "id, competition, home_team, away_team, created_at, actual_home_goals, actual_away_goals, result_recorded_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });


export const getAnalysis = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: row, error } = await db
      .from("analyses")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Analyse introuvable.");
    return row;
  });

export const createAnalysis = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { generateReport } = await import("./prediction.server");

    const { data: settled } = await db
      .from("analyses")
      .select(
        "competition, home_team, away_team, input, actual_ht_home_goals, actual_ht_away_goals, actual_home_goals, actual_away_goals, result_notes",
      )
      .eq("competition", data.competition)
      .not("result_recorded_at", "is", null)
      .order("result_recorded_at", { ascending: false })
      .limit(12);

    const report = await generateReport(data, settled ?? []);


    const { data: row, error } = await db
      .from("analyses")
      .insert({
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

export const buildDailyDigest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ days: z.number().int().min(1).max(7).default(1) }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { generateDailyDigest } = await import("./daily-digest.server");
    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    const { data: rows, error } = await db
      .from("analyses")
      .select("competition, home_team, away_team, created_at, report")
      .gte("created_at", since)
      .not("report", "is", null)
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("Aucune analyse récente à résumer. Lance d'abord une analyse.");
    }

    const digest = await generateDailyDigest(rows);
    return { digest, count: rows.length };
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await db.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveAnalysisResult = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resultSchema.parse(data))
  .handler(async ({ data }) => {
    const hasScore = data.actualHomeGoals !== null && data.actualAwayGoals !== null;
    const { error } = await db
      .from("analyses")
      .update({
        actual_ht_home_goals: data.actualHtHomeGoals,
        actual_ht_away_goals: data.actualHtAwayGoals,
        actual_home_goals: data.actualHomeGoals,
        actual_away_goals: data.actualAwayGoals,
        result_notes: data.resultNotes.trim() || null,
        result_recorded_at: hasScore ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
