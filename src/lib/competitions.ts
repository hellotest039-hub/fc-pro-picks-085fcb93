export const COMPETITIONS = [
  "FC 26. 5x5 Rush. Superligue",
  "FC 24. 4x4. Championnat d'Angleterre",
  "FC 25. 3x3. Ligue de conférence",
  "FC 26. England Championship",
  "FC 26. Champions League",
  "FC 26. Championnat du monde",
  "FC 25. Italy Championship",
  "FC 25. Championnat d'Allemagne",
  "FC 25. Ligue européenne",
  "FC 26. Spain Championship",
  "FC 24. Penalty",
  "FC 25. Penalty",
  "FC 26. Penalty",
  "FIFA 23. Penalty",
  "Penalty (variante 1)",
  "Penalty (variante 2)",
] as const;

export type H2HRow = {
  homeGoals: number | null;
  awayGoals: number | null;
};

export type AnalysisInput = {
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeMatches: number | null;
  homeGoalsFor: number | null;
  homeGoalsAgainst: number | null;
  awayMatches: number | null;
  awayGoalsFor: number | null;
  awayGoalsAgainst: number | null;
  h2h: H2HRow[];
  notes: string;
};

export const emptyInput = (): AnalysisInput => ({
  competition: COMPETITIONS[0],
  homeTeam: "",
  awayTeam: "",
  homeMatches: null,
  homeGoalsFor: null,
  homeGoalsAgainst: null,
  awayMatches: null,
  awayGoalsFor: null,
  awayGoalsAgainst: null,
  h2h: Array.from({ length: 5 }, () => ({ homeGoals: null, awayGoals: null })),
  notes: "",
});
