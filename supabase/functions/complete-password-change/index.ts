import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const schema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(8).max(72) });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = req.headers.get("Authorization");
    if (!url || !key || !serviceKey) return json({ error: "Serviço indisponível. Tenta de novo em instantes." }, 503);
    if (!authorization) return json({ error: "Entre novamente para trocar sua senha." }, 401);
    const client = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user?.email) return json({ error: "Sua sessão expirou. Entre novamente." }, 401);
    const input = schema.safeParse(await req.json());
    if (!input.success) return json({ error: "Confira a senha atual e use de 8 a 72 caracteres na nova senha." }, 400);
    const { currentPassword, newPassword } = input.data;
    if (currentPassword === newPassword) return json({ error: "A nova senha precisa ser diferente da temporária ou atual." }, 400);
    // An isolated client verifies ownership without changing the caller's browser session.
    const verifier = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (verifyError || verified.user?.id !== user.id) return json({ error: "Senha atual ou temporária incorreta. Confira e tente novamente." }, 400);
    const { error: changeError } = await verifier.auth.updateUser({ password: newPassword, current_password: currentPassword });
    if (changeError) return json({ error: /weak|pwned|leaked/i.test(changeError.message) ? "Use uma senha mais segura que não tenha sido vazada." : changeError.message }, 400);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: profile, error: flagError } = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", user.id).select("user_id").single();
    if (flagError || !profile) return json({ error: "Sua senha mudou, mas não deu pra liberar o acesso. Use a nova senha como senha atual e tente novamente." }, 503);
    return json({ success: true });
  } catch {
    return json({ error: "Não deu pra trocar a senha agora. Tenta de novo em instantes." }, 500);
  }
});
