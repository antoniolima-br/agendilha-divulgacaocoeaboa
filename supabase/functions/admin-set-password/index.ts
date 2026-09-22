import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
const BodySchema = z.object({
  user_id: z.string().uuid(),
  new_password: z.string().regex(strongPassword, "A senha precisa ter maiúscula, minúscula, número e símbolo").max(72),
  require_change: z.boolean().default(true),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Sessão necessária" }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Configuração indisponível" }, 500);

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Sessão inválida" }, 401);
    const { data: callerIsAdmin } = await callerClient.rpc("is_admin_or_master", { p_user_id: caller.id });
    if (!callerIsAdmin) return json({ error: "Acesso restrito a administradores" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Revise a nova senha", fields: parsed.error.flatten().fieldErrors }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { user_id: targetUserId, new_password: newPassword, require_change: requireChange } = parsed.data;
    const { data: targetUser } = await admin.auth.admin.getUserById(targetUserId);
    if (!targetUser.user) return json({ error: "Usuário não encontrado" }, 404);

    const { data: targetIsAdmin } = await admin.rpc("is_admin_or_master", { p_user_id: targetUserId });
    if (targetIsAdmin) {
      const { data: callerIsMaster } = await admin.rpc("is_master", { _user_id: caller.id });
      if (!callerIsMaster) return json({ error: "Somente Master pode alterar a senha de outro administrador" }, 403);
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(targetUserId, { password: newPassword });
    if (updateError) return json({ error: updateError.message }, 400);

    const { error: profileError } = await admin.from("profiles").update({ must_change_password: requireChange }).eq("user_id", targetUserId);
    if (profileError) return json({ error: "Senha alterada, mas não foi possível definir a troca no próximo acesso" }, 500);

    const { error: auditError } = await admin.from("audit_logs").insert({
      actor_id: caller.id,
      action: "password_changed_by_admin",
      resource_type: "user",
      resource_id: targetUserId,
      reason: requireChange ? "Senha definida pelo administrador; troca obrigatória" : "Senha definida pelo administrador",
    });
    if (auditError) console.error("admin-set-password audit failed", auditError.message);

    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado" }, 500);
  }
});