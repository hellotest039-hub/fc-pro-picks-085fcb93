import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Ban, Copy, RotateCcw, Trash2, UserPlus } from "lucide-react";
import {
  adminCreateAccessKey,
  adminListAccess,
  adminUpdateAccessKey,
} from "@/lib/access.functions";

export const Route = createFileRoute("/_authenticated/analyses/admin")({
  head: () => ({
    meta: [
      { title: "Administration — FIFA Virtual Predictor Pro" },
      {
        name: "description",
        content:
          "Console d'administration : génération et gestion des clés d'accès uniques du bot de pronostics.",
      },
      { property: "og:title", content: "Administration — FIFA Virtual Predictor Pro" },
      {
        property: "og:description",
        content: "Attribue, révoque et suit les clés d'accès des membres.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const fetchAccess = useServerFn(adminListAccess);
  const createKey = useServerFn(adminCreateAccessKey);
  const updateKey = useServerFn(adminUpdateAccessKey);
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-access"],
    queryFn: () => fetchAccess(),
    retry: false,
  });

  const create = useMutation({
    mutationFn: () =>
      createKey({ data: { assignedEmail: email.trim() ? email.trim() : null, label } }),
    onSuccess: (res) => {
      toast.success(`Clé générée : ${res.code}`);
      setEmail("");
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["admin-access"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; action: "revoke" | "restore" | "delete" }) =>
      updateKey({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-access"] });
      queryClient.invalidateQueries({ queryKey: ["access-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) {
    return (
      <div className="card-elevated mx-auto max-w-md p-6 text-sm text-muted-foreground">
        Accès réservé à l'administrateur.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="font-display text-[0.65rem] uppercase tracking-[0.3em] text-gold">
          Console admin
        </p>
        <h1 className="mt-1 text-2xl font-bold">Clés d'accès</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Génère une clé unique par membre. Sans clé active, aucun compte ne peut utiliser le bot.
        </p>
      </header>

      <section className="card-elevated p-5">
        <h2 className="font-display text-sm font-semibold">Générer une clé</h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <input
            className="field-base"
            type="email"
            placeholder="E-mail du membre (optionnel)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="field-base"
            placeholder="Libellé (optionnel)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button
            type="submit"
            disabled={create.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 font-display text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <UserPlus className="size-4" aria-hidden /> Générer
          </button>
        </form>
      </section>

      <section className="card-elevated p-5">
        <h2 className="font-display text-sm font-semibold">Clés existantes</h2>
        {isLoading && <p className="mt-3 text-xs text-muted-foreground">Chargement…</p>}
        <ul className="mt-3 space-y-2">
          {data?.keys.map((key) => (
            <li
              key={key.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs"
            >
              <span className="font-mono text-sm text-gold">{key.code}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(key.code);
                  toast.success("Clé copiée");
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Copier la clé"
              >
                <Copy className="size-3.5" aria-hidden />
              </button>
              <span className="text-muted-foreground">
                {key.assigned_email ?? "non attribuée"}
                {key.label ? ` · ${key.label}` : ""}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                  key.revoked
                    ? "bg-destructive/15 text-destructive"
                    : key.redeemed_at
                      ? "bg-primary/15 text-primary"
                      : "bg-gold/15 text-gold"
                }`}
              >
                {key.revoked ? "révoquée" : key.redeemed_at ? "activée" : "en attente"}
              </span>
              <span className="ml-auto flex items-center gap-2">
                {key.revoked ? (
                  <button
                    type="button"
                    onClick={() => update.mutate({ id: key.id, action: "restore" })}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="size-3.5" aria-hidden /> Réactiver
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => update.mutate({ id: key.id, action: "revoke" })}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Ban className="size-3.5" aria-hidden /> Révoquer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => update.mutate({ id: key.id, action: "delete" })}
                  className="inline-flex items-center gap-1 text-destructive hover:opacity-80"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
          {data && data.keys.length === 0 && (
            <p className="text-xs text-muted-foreground">Aucune clé générée pour l'instant.</p>
          )}
        </ul>
      </section>

      <section className="card-elevated p-5">
        <h2 className="font-display text-sm font-semibold">Comptes inscrits</h2>
        <ul className="mt-3 space-y-2">
          {data?.users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs"
            >
              <span className="text-foreground">{user.email}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                  user.confirmed ? "bg-primary/15 text-primary" : "bg-gold/15 text-gold"
                }`}
              >
                {user.confirmed ? "e-mail confirmé" : "en attente de confirmation"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail(user.email);
                  toast.info("E-mail pré-rempli, génère la clé ci-dessus.");
                }}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                Attribuer une clé
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
