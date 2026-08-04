import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { saveAnalysisResult } from "@/lib/analyses.functions";

type Props = {
  analysisId: string;
  initial: {
    actualHtHomeGoals: number | null;
    actualHtAwayGoals: number | null;
    actualHomeGoals: number | null;
    actualAwayGoals: number | null;
    resultNotes: string;
    recordedAt: string | null;
  };
  homeTeam: string;
  awayTeam: string;
};

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.7rem] text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

export function ResultForm({ analysisId, initial, homeTeam, awayTeam }: Props) {
  const [form, setForm] = useState(initial);
  const save = useServerFn(saveAnalysisResult);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: analysisId,
          actualHtHomeGoals: form.actualHtHomeGoals,
          actualHtAwayGoals: form.actualHtAwayGoals,
          actualHomeGoals: form.actualHomeGoals,
          actualAwayGoals: form.actualAwayGoals,
          resultNotes: form.resultNotes,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Résultat réel enregistré");
    },
    onError: () => toast.error("Enregistrement impossible"),
  });

  return (
    <section className="card-elevated p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-bold">Résultat réel après match</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Renseigne le score final constaté : il servira à calibrer les prochaines analyses de
            cette compétition.
          </p>
        </div>
        {initial.recordedAt && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/50 px-2 py-1 text-[0.65rem] text-primary">
            <CheckCircle2 className="size-3" aria-hidden /> Enregistré
          </span>
        )}
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumberField
          label={`MT — ${homeTeam}`}
          value={form.actualHtHomeGoals}
          onChange={(v) => setForm((f) => ({ ...f, actualHtHomeGoals: v }))}
        />
        <NumberField
          label={`MT — ${awayTeam}`}
          value={form.actualHtAwayGoals}
          onChange={(v) => setForm((f) => ({ ...f, actualHtAwayGoals: v }))}
        />
        <NumberField
          label={`Final — ${homeTeam}`}
          value={form.actualHomeGoals}
          onChange={(v) => setForm((f) => ({ ...f, actualHomeGoals: v }))}
        />
        <NumberField
          label={`Final — ${awayTeam}`}
          value={form.actualAwayGoals}
          onChange={(v) => setForm((f) => ({ ...f, actualAwayGoals: v }))}
        />
      </div>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[0.7rem] text-muted-foreground">
          Observations (paris gagnés/perdus, faits de match…)
        </span>
        <textarea
          rows={3}
          maxLength={1000}
          value={form.resultNotes}
          onChange={(e) => setForm((f) => ({ ...f, resultNotes: e.target.value }))}
          className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {mutation.isPending ? "Enregistrement…" : "Enregistrer le résultat"}
      </button>
    </section>
  );
}
