import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, ShieldCheck } from "lucide-react";
import { getAccessStatus, redeemAccessKey } from "@/lib/access.functions";

export function useAccessStatus() {
  const fetchStatus = useServerFn(getAccessStatus);
  return useQuery({
    queryKey: ["access-status"],
    queryFn: () => fetchStatus(),
    staleTime: 30_000,
  });
}

export function AccessGate({ children }: { children: ReactNode }) {
  const { data, isLoading } = useAccessStatus();
  const queryClient = useQueryClient();
  const redeem = useServerFn(redeemAccessKey);
  const [code, setCode] = useState("");

  const mutation = useMutation({
    mutationFn: (value: string) => redeem({ data: { code: value } }),
    onSuccess: () => {
      toast.success("Clé validée. Bienvenue !");
      queryClient.invalidateQueries({ queryKey: ["access-status"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Vérification de l'accès…</p>;
  }

  if (data?.hasAccess) return <>{children}</>;

  return (
    <div className="card-elevated mx-auto max-w-md p-6">
      <p className="font-display text-[0.65rem] uppercase tracking-[0.3em] text-gold">
        Accès restreint
      </p>
      <h1 className="mt-2 flex items-center gap-2 text-xl font-bold">
        <KeyRound className="size-5 text-primary" aria-hidden /> Clé d'accès requise
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ton compte <span className="text-foreground">{data?.email}</span> est bien confirmé, mais
        l'accès au bot est réservé aux membres validés. L'administrateur
        (christusdigizone@gmail.com) doit te fournir une clé d'accès unique.
      </p>

      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!code.trim()) return;
          mutation.mutate(code);
        }}
      >
        <label htmlFor="access-code" className="text-xs font-medium text-muted-foreground">
          Clé d'accès
        </label>
        <input
          id="access-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="FVP-XXXX-XXXX"
          className="field-base"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-md bg-primary px-4 py-2.5 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {mutation.isPending ? "Validation…" : "Activer mon accès"}
        </button>
      </form>

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        Une clé est liée à un seul compte. Toute clé révoquée par l'administrateur coupe
        immédiatement l'accès.
      </p>
    </div>
  );
}
