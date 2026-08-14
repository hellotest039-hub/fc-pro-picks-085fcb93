import { defineTool } from "@lovable.dev/mcp-js";
import { COMPETITIONS } from "@/lib/competitions";

export default defineTool({
  name: "list_competitions",
  title: "Lister les compétitions",
  description: "Liste les compétitions FIFA/FC virtuelles couvertes par le prédicteur.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(COMPETITIONS) }],
    structuredContent: { competitions: COMPETITIONS },
  }),
});
