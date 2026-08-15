import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Sparkles } from "lucide-react";
import { ReportView } from "@/components/report-view";
import { buildDailyDigest } from "@/lib/analyses.functions";

export const Route = createFileRoute("/analyses/resume")({
  head: () => ({
    meta: [
      { title: "Résumé VIP du jour — FIFA Virtual Predictor Pro" },
      {
        name: "description",
        content:
          "Génère un message quotidien prêt à copier-coller pour ton canal VIP : meilleures sélections mi-temps, niveau de risque et rappel bankroll.",
      },
      { property: "og:title", content: "Résumé VIP du jour — FIFA Virtual Predictor Pro" },
      {
        property: "og:description",
        content: "Sélections du jour priorité mi-temps, niveaux de risque et plan de mise.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DailyDigestPage,
});

const RANGES = [
  { days: 1, label: "Aujourd'hui" },
  { days: 2, label: "48 h" },
  { days: 7, label: "7 jours" },
];

function DailyDigestPage() {
  const runDigest = useServerFn(buildDailyDigest);
  const [days, setDays] = useState(1);
  const [digest, setDigest] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => runDigest({ data: { days } }),
    onSuccess: (res) => {
      setDigest(res.digest);
      toast.success(`Résumé généré à partir de ${res.count} analyse(s)`);
    },
    onError: (error: Error) => toast.error(error.message || "Génération impossible"),
  });

  async function copyDigest() {
    if (!digest) return;
    await navigator.clipboard.writeText(digest);
    toast.success("Résumé copié");
  }

  return (
    <section className="space-y-5">
      <header className="card-elevated p-5">
        <p className="font-display text-[0.65rem] uppercase tracking-[0.3em] text-primary">
          Canal VIP
        </p>
        <h1 className="mt-2 text-2xl font-bold">Résumé quotidien</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compile tes analyses récentes en un message prêt à copier-coller : meilleures sélections
          en priorité mi-temps, niveau de risque par pari et rappel de gestion de bankroll.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                days === r.days
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles className="size-3.5" aria-hidden />
            {mutation.isPending ? "Génération…" : "Générer le résumé"}
          </button>
          {digest && (
            <button
              onClick={copyDigest}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Copy className="size-3.5" aria-hidden /> Copier
            </button>
          )}
        </div>
      </header>

      {digest && (
        <div className="card-elevated p-5">
          <ReportView report={digest} />
        </div>
      )}

      <p className="border-l-2 border-primary/60 pl-4 text-xs leading-relaxed text-muted-foreground">
        Rappel : aucune sélection n'est garantie à 100 %. Les marchés mi-temps sont plus volatils —
        limite-les à une mise de pari modéré et n'accumule jamais tous les marchés d'un même match.
      </p>
    </section>
  );
}
