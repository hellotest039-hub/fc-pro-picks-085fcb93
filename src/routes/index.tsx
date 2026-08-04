import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, LineChart, ListChecks } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FIFA Virtual Predictor Pro — Pronostics FIFA/FC virtuels" },
      {
        name: "description",
        content:
          "Analyse statistique des matchs FIFA/FC virtuels : 1X2, BTTS, Over/Under, handicap, score exact, avec niveaux de confiance et protection du bankroll.",
      },
      { property: "og:title", content: "FIFA Virtual Predictor Pro — Pronostics FIFA/FC virtuels" },
      {
        property: "og:description",
        content:
          "Analyse statistique des matchs FIFA/FC virtuels : 1X2, BTTS, Over/Under, handicap, score exact, avec niveaux de confiance et protection du bankroll.",
      },
    ],
  }),
  component: Landing,
});

const pillars = [
  {
    icon: LineChart,
    title: "Analyse chiffrée",
    body: "Moyennes buts marqués/encaissés croisées avec les 5 dernières confrontations directes, pondérées par récence.",
  },
  {
    icon: ListChecks,
    title: "Tous les marchés",
    body: "1X2, mi-temps, BTTS, Over/Under, buts par période, handicap asiatique, score exact, buts par équipe.",
  },
  {
    icon: ShieldCheck,
    title: "Bankroll protégé",
    body: "Chaque marché est noté Sécurisé, Modéré ou Risqué. Aucune promesse, aucune mise all-in recommandée.",
  },
];

function Landing() {
  return (
    <main className="surface-pitch min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-primary">
          Football virtuel FIFA / FC
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-tight font-bold sm:text-6xl">
          Des pronostics <span className="text-gold">justifiés par les données</span>, pas par
          l'enthousiasme.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Renseigne la compétition, les statistiques des deux équipes et les 5 dernières
          confrontations directes. Tu reçois un rapport complet, marché par marché, avec un niveau
          de confiance sur chaque ligne.
        </p>

        <div className="mt-9">
          <Link
            to="/analyses"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-display text-sm font-semibold text-primary-foreground shadow-[var(--shadow-gold)] transition-opacity hover:opacity-90"
          >
            Lancer une analyse
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <section key={pillar.title} className="card-elevated p-5">
              <pillar.icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-display text-base font-semibold">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-14 max-w-2xl border-l-2 border-primary/60 pl-4 text-xs leading-relaxed text-muted-foreground">
          Aucune prédiction ne garantit un résultat à 100 %. Une gestion de bankroll disciplinée
          reste indispensable : dose tes mises selon le niveau de confiance indiqué.
        </p>
      </div>
    </main>
  );
}
