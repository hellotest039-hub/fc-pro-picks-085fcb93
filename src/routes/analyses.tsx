import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, LogOut, History, Sparkles, ShieldCheck } from "lucide-react";
import { listAnalyses } from "@/lib/analyses.functions";
import { supabase } from "@/integrations/supabase/client";
import { AccessGate, useAccessStatus } from "@/components/access-gate";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/analyses")({
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
  const [open, setOpen] = useState(false);
  const { data: access } = useAccessStatus();

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
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
          <Link to="/" className="font-display text-sm font-bold text-gold">
            Predictor Pro
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                <History className="size-3.5" aria-hidden /> Historique
                {analyses.length > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 text-[0.65rem] text-primary">
                    {analyses.length}
                  </span>
                )}
              </SheetTrigger>
              <SheetContent side="left" className="w-[19rem] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-display text-sm">Historique des analyses</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 space-y-1">
                  {analyses.length === 0 && (
                    <p className="text-xs text-muted-foreground">Aucune analyse enregistrée.</p>
                  )}
                  {analyses.map((item) => {
                    const active = params.analysisId === item.id;
                    return (
                      <Link
                        key={item.id}
                        to="/analyses/$analysisId"
                        params={{ analysisId: item.id }}
                        onClick={() => setOpen(false)}
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
              </SheetContent>
            </Sheet>

            {access?.isAdmin && (
              <Link
                to="/analyses/admin"
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/50 px-3 py-2 font-display text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <ShieldCheck className="size-3.5" aria-hidden /> Admin
              </Link>
            )}

            <Link
              to="/analyses/resume"
              className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 px-3 py-2 font-display text-xs font-semibold text-gold transition-colors hover:bg-gold/10"
            >
              <Sparkles className="size-3.5" aria-hidden /> Résumé VIP
            </Link>

            <Link
              to="/analyses"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 font-display text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" aria-hidden /> Nouvelle analyse
            </Link>


            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-3.5" aria-hidden /> Quitter
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-4xl px-4 py-6">
        <AccessGate>
          <Outlet />
        </AccessGate>
      </main>
    </div>
  );
}
