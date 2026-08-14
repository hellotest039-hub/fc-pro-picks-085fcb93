import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listAnalysesTool from "./tools/list-analyses";
import getAnalysisTool from "./tools/get-analysis";
import recordResultTool from "./tools/record-result";
import listCompetitionsTool from "./tools/list-competitions";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "fifa-predictor-pro",
  title: "FIFA Predictor Pro",
  version: "0.1.0",
  instructions:
    "Outils du prédicteur FIFA/FC virtuel. `list_competitions` liste les ligues couvertes, `list_analyses` et `get_analysis` donnent les rapports de pronostics de l'utilisateur connecté, `record_result` enregistre le score réel d'un match pour calibrer les prochaines analyses. Les nouvelles analyses se lancent dans l'application.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listCompetitionsTool,
    listAnalysesTool,
    getAnalysisTool,
    recordResultTool,
  ] as Parameters<typeof defineMcp>[0]["tools"],
});
