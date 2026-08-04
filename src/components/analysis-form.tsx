import { useState } from "react";
import type { AnalysisInput } from "@/lib/competitions";
import { COMPETITIONS, emptyInput } from "@/lib/competitions";

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function fromNumber(value: number | null): string {
  return value === null ? "" : String(value);
}

type Props = {
  initial?: AnalysisInput;
  submitting: boolean;
  onSubmit: (input: AnalysisInput) => void;
};

export function AnalysisForm({ initial, submitting, onSubmit }: Props) {
  const [form, setForm] = useState<AnalysisInput>(initial ?? emptyInput());
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AnalysisInput>(key: K, value: AnalysisInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.homeTeam.trim() || !form.awayTeam.trim()) {
      setError("Renseigne le nom des deux équipes.");
      return;
    }
    setError(null);
    onSubmit({
      ...form,
      homeTeam: form.homeTeam.trim(),
      awayTeam: form.awayTeam.trim(),
    });
  }

  const missing = [
    form.homeMatches === null || form.awayMatches === null ? "matchs joués" : null,
    form.homeGoalsFor === null || form.awayGoalsFor === null ? "buts marqués" : null,
    form.homeGoalsAgainst === null || form.awayGoalsAgainst === null ? "buts encaissés" : null,
  ].filter(Boolean) as string[];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="card-elevated p-5">
        <h2 className="font-display text-sm uppercase tracking-widest text-primary">
          1 · Compétition
        </h2>
        <select
          value={form.competition}
          onChange={(e) => set("competition", e.target.value)}
          className="field-base mt-3"
          aria-label="Compétition"
        >
          {COMPETITIONS.map((competition) => (
            <option key={competition} value={competition}>
              {competition}
            </option>
          ))}
        </select>
      </section>

      <section className="card-elevated p-5">
        <h2 className="font-display text-sm uppercase tracking-widest text-primary">
          2 · Équipes et statistiques
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {(["home", "away"] as const).map((side) => {
            const isHome = side === "home";
            return (
              <div key={side} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {isHome ? "Domicile" : "Extérieur"}
                </p>
                <input
                  className="field-base"
                  placeholder={isHome ? "Équipe à domicile" : "Équipe à l'extérieur"}
                  value={isHome ? form.homeTeam : form.awayTeam}
                  onChange={(e) => set(isHome ? "homeTeam" : "awayTeam", e.target.value)}
                  maxLength={80}
                  aria-label={isHome ? "Équipe à domicile" : "Équipe à l'extérieur"}
                />
                <div className="grid grid-cols-3 gap-2">
                  <LabelledNumber
                    label="Matchs"
                    value={isHome ? form.homeMatches : form.awayMatches}
                    onChange={(v) => set(isHome ? "homeMatches" : "awayMatches", v)}
                  />
                  <LabelledNumber
                    label="Buts +"
                    value={isHome ? form.homeGoalsFor : form.awayGoalsFor}
                    onChange={(v) => set(isHome ? "homeGoalsFor" : "awayGoalsFor", v)}
                  />
                  <LabelledNumber
                    label="Buts −"
                    value={isHome ? form.homeGoalsAgainst : form.awayGoalsAgainst}
                    onChange={(v) => set(isHome ? "homeGoalsAgainst" : "awayGoalsAgainst", v)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card-elevated p-5">
        <h2 className="font-display text-sm uppercase tracking-widest text-primary">
          3 · 5 dernières confrontations directes
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Du plus récent au plus ancien. L'équipe à domicile reste à gauche.
        </p>
        <div className="mt-4 space-y-2">
          {form.h2h.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 text-xs text-muted-foreground">{index + 1}</span>
              <input
                type="number"
                min={0}
                className="field-base text-center"
                value={fromNumber(row.homeGoals)}
                onChange={(e) => setH2H(index, "homeGoals", e.target.value)}
                aria-label={`Buts domicile confrontation ${index + 1}`}
              />
              <span className="text-muted-foreground">−</span>
              <input
                type="number"
                min={0}
                className="field-base text-center"
                value={fromNumber(row.awayGoals)}
                onChange={(e) => setH2H(index, "awayGoals", e.target.value)}
                aria-label={`Buts extérieur confrontation ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card-elevated p-5">
        <h2 className="font-display text-sm uppercase tracking-widest text-primary">
          4 · Notes (optionnel)
        </h2>
        <textarea
          className="field-base mt-3 min-h-24"
          maxLength={1000}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Forme récente, absences, contexte particulier…"
          aria-label="Notes complémentaires"
        />
      </section>

      {missing.length > 0 && (
        <p className="rounded-md border border-moderate/40 bg-moderate/10 px-4 py-3 text-xs text-foreground">
          Données incomplètes ({missing.join(", ")}). L'analyse sera produite, mais sa fiabilité
          sera réduite et signalée dans le rapport.
        </p>
      )}
      {error && <p className="text-sm text-risky">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-primary px-5 py-3 font-display text-sm font-semibold text-primary-foreground shadow-[var(--shadow-gold)] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Analyse en cours…" : "Générer la prédiction"}
      </button>
    </form>
  );
}

function LabelledNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        className="field-base mt-1 text-center"
        value={fromNumber(value)}
        onChange={(e) => onChange(toNumber(e.target.value))}
      />
    </label>
  );
}
