const DIGEST_SYSTEM = `Tu es l'analyste en chef d'un canal VIP de paris sur football virtuel FIFA/FC.

À partir des rapports d'analyse fournis (générés le même jour), rédige UN SEUL message quotidien prêt à être copié-collé dans WhatsApp/Telegram.

RÈGLES ABSOLUES
- Ne réutilise que ce qui figure dans les rapports fournis. N'invente aucun match, aucune cote, aucune statistique.
- PRIORITÉ AUX MARCHÉS MI-TEMPS (HT) : les sélections HT (BTTS HT, Total buts HT 0.5/1.5/2.5, 1X2 HT, buts HT par équipe) passent en premier et forment le cœur du message.
- Sélectionne uniquement les MEILLEURES occasions (5 à 8 sélections maximum au total). Écarte le bruit.
- Chaque sélection porte un niveau de risque explicite : 🟢 Sécurisé / 🟡 Modéré / 🔴 Risqué.
- Ne présente jamais un score exact ou une sélection HT comme « certain ».
- Termine TOUJOURS par un rappel de gestion de bankroll : max 3-5 % sur sécurisé, 1-2 % sur modéré, mise symbolique sur risqué, jamais d'all-in, jamais d'accumulation de tous les marchés d'un même match, aucune prédiction n'est garantie à 100 %.

FORMAT ATTENDU (markdown sobre, émojis mesurés)
⚽ **SÉLECTIONS DU JOUR — {date}**

⏱️ **PRIORITÉ MI-TEMPS (HT)**
- Compétition | Équipe A vs Équipe B → marché HT — 🟢/🟡/🔴 — justification en une ligne

🎯 **TEMPS PLEIN (FT)**
- même format, 2 à 3 lignes maximum

🧩 **COMBINÉ PRUDENT DU JOUR** (2-3 sélections sécurisées max, optionnel si rien ne le justifie)

💰 **PLAN DE MISE & BANKROLL**
- lignes courtes et concrètes

⚠️ Rappel final de prudence.

Français, direct, professionnel, jamais vendeur de rêve. Pas de préambule ni de commentaire hors du message.`;

export type DigestSource = {
  competition: string;
  home_team: string;
  away_team: string;
  created_at: string;
  report: string | null;
};

export async function generateDailyDigest(sources: DigestSource[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Service d'analyse indisponible (clé manquante).");

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const body = sources
    .map(
      (s, i) => `--- RAPPORT ${i + 1} ---
COMPÉTITION : ${s.competition}
MATCH : ${s.home_team} vs ${s.away_team}
${s.report ?? "(rapport indisponible)"}`,
    )
    .join("\n\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: DIGEST_SYSTEM },
        {
          role: "user",
          content: `DATE DU JOUR : ${today}\n\nRAPPORTS DISPONIBLES :\n\n${body}\n\nProduis le message VIP du jour selon le format imposé.`,
        },
      ],
    }),
  });

  if (response.status === 429) {
    throw new Error("Trop de demandes. Réessaie dans quelques instants.");
  }
  if (response.status === 402) {
    throw new Error("Crédits d'analyse épuisés. Recharge ton espace de travail.");
  }
  if (!response.ok) {
    const detail = await response.text();
    console.error("[AI] erreur passerelle (digest)", response.status, detail);
    throw new Error("Le résumé n'a pas pu être généré. Réessaie.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Résumé vide. Réessaie.");
  return content;
}
