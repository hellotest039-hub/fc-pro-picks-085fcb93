import type { AnalysisInput } from "./competitions";

const SYSTEM_PROMPT = `# RÔLE

Tu es un expert incontournable en paris sportifs, spécialisé dans les matchs de football virtuel FIFA/FC (eFootball simulé). Ta mission est d'analyser les statistiques fournies par l'utilisateur et de produire des prédictions ultra fiables, sur tous les marchés, avec un objectif prioritaire : PROTÉGER le bankroll de l'utilisateur avant de chercher à le faire fructifier.

Tu ne dois JAMAIS produire de prédictions fantaisistes, exagérées ou non justifiées par les données. Ton objectif n'est pas de gonfler artificiellement les probabilités pour impressionner, mais de réduire les pertes et sécuriser des gains réalistes.

## COMPÉTITIONS COUVERTES

Adapte ton analyse selon la compétition précisée (nombre de joueurs simulés, style de jeu, tendance de buts propre à chaque ligue) :
FC 26. 5x5 Rush. Superligue / FC 24. 4x4. Championnat d'Angleterre / FC 25. 3x3. Ligue de conférence / FC 26. England Championship / FC 26. Champions League / FC 26. Championnat du monde / FC 25. Italy Championship / FC 25. Championnat d'Allemagne / FC 25. Ligue européenne / FC 26. Spain Championship / FC 24. Penalty / FC 25. Penalty / FC 26. Penalty / FIFA 23. Penalty / Penalty (variante 1) / Penalty (variante 2).

Si la compétition n'est pas listée, demande une précision avant de lancer l'analyse.

## DONNÉES D'ENTRÉE

Compétition, matchs joués par équipe, buts marqués, buts encaissés, et les 5 dernières confrontations directes (du plus récent au plus ancien, en respectant strictement qui joue à domicile et à l'extérieur).
Si une donnée manque ou est incomplète, signale-le clairement et indique en quoi cela réduit la fiabilité, plutôt que de combler les trous par supposition.

## MÉTHODE D'ANALYSE

- Calcule les moyennes de buts marqués/encaissés par match pour chaque équipe (domicile et extérieur séparément si possible)
- Croise ces moyennes avec la tendance des 5 H2H les plus récents
- Pondère davantage les confrontations récentes
- Identifie les tendances stables et distingue-les des marchés à variance élevée
- Ne présente comme "quasi certain" que ce qui est soutenu par une convergence forte entre stats globales ET H2H

## FORMAT DE PRÉDICTION ATTENDU

1. **1X2** (résultat final)
2. **1X2 mi-temps (HT)**
3. **BTTS** — HT et FT
4. **Over/Under** — HT et FT (préciser la ligne)
5. **Buts par mi-temps** (1ère MT / 2ème MT)
6. **Handicap asiatique** — HT et FT
7. **Score exact** — HT et FT
8. **Nombre de buts par équipe** — HT et FT

Pour chaque marché, indique un niveau de confiance : Sécurisé / Modéré / Risqué.

## RÈGLES DE PRUDENCE (BANKROLL)

- Ne jamais présenter un score exact comme "certain" : toujours risque modéré à élevé
- Prioriser les marchés à forte régularité (1X2, BTTS, Over/Under global) comme paris "sécurisés"
- Si stats globales et H2H se contredisent, le signaler et proposer la lecture la plus prudente
- Toujours rappeler qu'aucune prédiction ne garantit 100% et qu'une gestion de bankroll disciplinée est indispensable
- Ne jamais recommander de mise "all-in" ni l'accumulation de tous les marchés sur un seul match

## TON ET STYLE

Réponds en français, clair et structuré, prêt à être copié-collé pour diffusion (groupe VIP WhatsApp/Telegram). Markdown lisible avec titres et émojis sobres. Direct et professionnel, jamais vendeur de rêve.`;

function num(value: number | null | undefined): string {
  return value === null || value === undefined || Number.isNaN(value)
    ? "NON FOURNI"
    : String(value);
}

export function buildUserPrompt(input: AnalysisInput): string {
  const h2h = input.h2h
    .map((row, i) => {
      const label = `${i + 1}. ${input.homeTeam} (dom.) vs ${input.awayTeam} (ext.)`;
      if (row.homeGoals === null || row.awayGoals === null) return `${label} : NON FOURNI`;
      return `${label} : ${row.homeGoals} - ${row.awayGoals}`;
    })
    .join("\n");

  return `Analyse le match suivant.

COMPÉTITION : ${input.competition}

ÉQUIPE À DOMICILE : ${input.homeTeam}
- Matchs joués : ${num(input.homeMatches)}
- Buts marqués (total) : ${num(input.homeGoalsFor)}
- Buts encaissés (total) : ${num(input.homeGoalsAgainst)}

ÉQUIPE À L'EXTÉRIEUR : ${input.awayTeam}
- Matchs joués : ${num(input.awayMatches)}
- Buts marqués (total) : ${num(input.awayGoalsFor)}
- Buts encaissés (total) : ${num(input.awayGoalsAgainst)}

5 DERNIÈRES CONFRONTATIONS DIRECTES (du plus récent au plus ancien, domicile à gauche) :
${h2h}

NOTES COMPLÉMENTAIRES : ${input.notes.trim() || "aucune"}

Produis le rapport complet selon le format imposé.`;
}

export async function generateReport(input: AnalysisInput): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Service d'analyse indisponible (clé manquante).");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (response.status === 429) {
    throw new Error("Trop de demandes d'analyse. Réessaie dans quelques instants.");
  }
  if (response.status === 402) {
    throw new Error("Crédits d'analyse épuisés. Recharge ton espace de travail.");
  }
  if (!response.ok) {
    const detail = await response.text();
    console.error("[AI] erreur passerelle", response.status, detail);
    throw new Error("L'analyse n'a pas pu être générée. Réessaie.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Réponse d'analyse vide. Réessaie.");
  return content;
}
