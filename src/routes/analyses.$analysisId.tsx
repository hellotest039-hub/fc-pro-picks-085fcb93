import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { ReportView } from "@/components/report-view";
import { ResultForm } from "@/components/result-form";
import { deleteAnalysis, getAnalysis } from "@/lib/analyses.functions";


export const Route = createFileRoute("/analyses/$analysisId")({
  component: AnalysisDetail,
});

function AnalysisDetail() {
  const { analysisId } = Route.useParams();
  const fetchAnalysis = useServerFn(getAnalysis);
  const removeAnalysis = useServerFn(deleteAnalysis);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["analyses", analysisId],
    queryFn: () => fetchAnalysis({ data: { id: analysisId } }),
  });

  const removal = useMutation({
    mutationFn: () => removeAnalysis({ data: { id: analysisId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Analyse supprimée");
      navigate({ to: "/analyses" });
    },
    onError: () => toast.error("Suppression impossible"),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement de l'analyse…</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-risky">Analyse introuvable.</p>;
  }

  async function copyReport() {
    if (!data?.report) return;
    await navigator.clipboard.writeText(data.report);
    toast.success("Rapport copié");
  }

  return (
    <article className="space-y-5">
      <header className="card-elevated p-5">
        <p className="font-display text-[0.65rem] uppercase tracking-[0.3em] text-primary">
          {data.competition}
        </p>
        <h1 className="mt-2 text-2xl font-bold">
          {data.home_team} <span className="text-muted-foreground">vs</span> {data.away_team}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Généré le{" "}
          {new Date(data.created_at).toLocaleString("fr-FR", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={copyReport}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Copy className="size-3.5" aria-hidden /> Copier le rapport
          </button>
          <button
            onClick={() => removal.mutate()}
            disabled={removal.isPending}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-risky/50 hover:text-risky disabled:opacity-60"
          >
            <Trash2 className="size-3.5" aria-hidden /> Supprimer
          </button>
        </div>
      </header>

      <div className="card-elevated p-5">
        <ReportView report={data.report ?? "Rapport indisponible."} />
      </div>

      <ResultForm
        key={data.id}
        analysisId={data.id}
        homeTeam={data.home_team}
        awayTeam={data.away_team}
        initial={{
          actualHtHomeGoals: data.actual_ht_home_goals,
          actualHtAwayGoals: data.actual_ht_away_goals,
          actualHomeGoals: data.actual_home_goals,
          actualAwayGoals: data.actual_away_goals,
          resultNotes: data.result_notes ?? "",
          recordedAt: data.result_recorded_at,
        }}
      />



      <p className="border-l-2 border-primary/60 pl-4 text-xs leading-relaxed text-muted-foreground">
        Rappel : même une prédiction fiable ne garantit pas un résultat à 100 %. Dose tes mises
        selon le niveau de confiance et évite d'accumuler tous les marchés d'un même match.
      </p>
    </article>
  );
}
