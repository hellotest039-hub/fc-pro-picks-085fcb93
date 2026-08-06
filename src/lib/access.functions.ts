import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "christusdigizone@gmail.com";

export const getAccessStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = ((context.claims as { email?: string } | null)?.email ?? "").toLowerCase();

    const { data: isAdminData } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const isAdmin = Boolean(isAdminData) || email === ADMIN_EMAIL;

    const { data: key } = await context.supabase
      .from("access_keys")
      .select("code, redeemed_at, revoked")
      .eq("user_id", context.userId)
      .eq("revoked", false)
      .maybeSingle();

    return {
      email,
      isAdmin,
      hasAccess: isAdmin || Boolean(key),
      keyCode: key?.code ?? null,
    };
  });

export const redeemAccessKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().trim().min(4).max(64) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const email = ((context.claims as { email?: string } | null)?.email ?? "").toLowerCase();
    const code = data.code.trim().toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: key, error } = await supabaseAdmin
      .from("access_keys")
      .select("id, user_id, assigned_email, revoked")
      .eq("code", code)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!key || key.revoked) throw new Error("Clé d'accès invalide ou révoquée.");
    if (key.user_id && key.user_id !== context.userId) {
      throw new Error("Cette clé est déjà utilisée par un autre compte.");
    }
    if (key.assigned_email && key.assigned_email.toLowerCase() !== email) {
      throw new Error("Cette clé est réservée à une autre adresse e-mail.");
    }

    const { error: updateError } = await supabaseAdmin
      .from("access_keys")
      .update({
        user_id: context.userId,
        assigned_email: key.assigned_email ?? email,
        redeemed_at: new Date().toISOString(),
      })
      .eq("id", key.id);

    if (updateError) throw new Error(updateError.message);
    return { ok: true };
  });

async function assertAdmin(context: { supabase: any; userId: string; claims: unknown }) {
  const email = ((context.claims as { email?: string } | null)?.email ?? "").toLowerCase();
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data && email !== ADMIN_EMAIL) throw new Error("Accès réservé à l'administrateur.");
}

export const adminListAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: keys }, users] = await Promise.all([
      supabaseAdmin
        .from("access_keys")
        .select("id, code, assigned_email, label, user_id, redeemed_at, revoked, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    return {
      keys: keys ?? [],
      users: (users.data?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? "",
        confirmed: Boolean(u.email_confirmed_at),
        createdAt: u.created_at,
      })),
    };
  });

function generateCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `FVP-${part(4)}-${part(4)}`;
}

export const adminCreateAccessKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        assignedEmail: z.string().trim().email().max(255).nullable().default(null),
        label: z.string().trim().max(120).default(""),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const code = generateCode();
    const { error } = await supabaseAdmin.from("access_keys").insert({
      code,
      assigned_email: data.assignedEmail ? data.assignedEmail.toLowerCase() : null,
      label: data.label.trim() || null,
    });
    if (error) throw new Error(error.message);
    return { code };
  });

export const adminUpdateAccessKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["revoke", "restore", "delete"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "delete") {
      const { error } = await supabaseAdmin.from("access_keys").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const { error } = await supabaseAdmin
      .from("access_keys")
      .update({ revoked: data.action === "revoke" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
