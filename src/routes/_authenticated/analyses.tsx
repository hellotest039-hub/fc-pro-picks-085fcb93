import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, LogOut } from "lucide-react";
import { listAnalyses } from "@/lib/analyses.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/analyses")({
  head: () => ({
    meta: [
      { title: "Mes analyses — FIFA Virtual Predictor Pro" },
      {
        name: "description",
        content:
          "Historique de tes analyses FIFA virtuelles : compétition, équipes, marchés et niveaux de confiance.",
      },
      { property: "og:title", content: "Mes analyses — FIFA Virtual Predictor Pro" },
      {
        property: "og:description",
        content: "Retrouve et relis tous tes rapports de pronostics FIFA/FC virtuels.",
      },
    ],
  }),
  component: AnalysesLayout,
});

function AnalysesLayout() {
  const fetchAnalyses = useServerFn(listAnalyses);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { analysisId?: string };

  const { data: analyses = [] } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => fetchAnalyses(),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="surface-pitch min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="flex items-center justify-between">
            <Link to="/" className="font-display text-sm font-bold text-gold">
              Predictor Pro
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-3.5" aria-hidden /> Quitter
            </button>
          </div>

          <Link
            to="/analyses"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden /> Nouvelle analyse
          </Link>

          <nav className="mt-5 space-y-1">
            <p className="px-1 pb-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              Historique
            </p>
            {analyses.length === 0 && (
              <p className="px-1 text-xs text-muted-foreground">Aucune analyse enregistrée.</p>
            )}
            {analyses.map((item) => {
              const active = params.analysisId === item.id;
              return (
                <Link
                  key={item.id}
                  to="/analyses/$analysisId"
                  params={{ analysisId: item.id }}
                  className={`block rounded-md border px-3 py-2 text-xs transition-colors ${
                    active
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="block font-medium text-foreground">
                    {item.home_team} vs {item.away_team}
                  </span>
                  {item.result_recorded_at ? (
                    <span className="mt-0.5 block text-[0.65rem] font-semibold text-primary">
                      Résultat : {item.actual_home_goals}-{item.actual_away_goals}
                    </span>
                  ) : (
                    <span className="mt-0.5 block text-[0.65rem] text-gold">
                      Résultat à renseigner
                    </span>
                  )}
                  <span className="mt-0.5 block truncate">{item.competition}</span>

                  <span className="mt-0.5 block text-[0.65rem]">
                    {new Date(item.created_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
