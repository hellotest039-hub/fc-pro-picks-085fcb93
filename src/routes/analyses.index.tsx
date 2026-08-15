import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AnalysisForm } from "@/components/analysis-form";
import { createAnalysis } from "@/lib/analyses.functions";
import type { AnalysisInput } from "@/lib/competitions";

export const Route = createFileRoute("/analyses/")({
  component: NewAnalysis,
});

function NewAnalysis() {
  const create = useServerFn(createAnalysis);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: AnalysisInput) => create({ data: input }),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ["analyses"] });
      navigate({ to: "/analyses/$analysisId", params: { analysisId: id } });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Analyse impossible");
    },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Nouvelle analyse</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Renseigne les données réelles. Les champs laissés vides sont signalés comme manquants dans
          le rapport, jamais devinés.
        </p>
      </header>
      <AnalysisForm submitting={mutation.isPending} onSubmit={(input) => mutation.mutate(input)} />
    </div>
  );
}
