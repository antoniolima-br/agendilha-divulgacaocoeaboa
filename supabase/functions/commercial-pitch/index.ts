import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { buildPitchContent } from "./content.ts";

const BodySchema = z.object({ password: z.string().min(1).max(256) }).strict();
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" },
  });
}
async function samePassword(input: string, expected: string) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([input, expected].map(async (value) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))));
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Entre com sua conta para continuar." }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) return json({ error: "Acesso indisponível. Tente novamente mais tarde." }, 503);
    const caller = createClient(url, key, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await caller.auth.getUser();
    if (authError || !user) return json({ error: "Entre novamente para continuar." }, 401);
    const { data: roles, error: roleError } = await caller.from("user_roles").select("role").eq("user_id", user.id);
    if (roleError || !roles?.some(({ role }) => role === "master" || role === "senior"))
      return json({ error: "Acesso exclusivo de Master e Sênior." }, 403);
    const { data: profile, error: profileError } = await caller.from("profiles").select("must_change_password").eq("user_id", user.id).maybeSingle();
    if (profileError || !profile || profile.must_change_password)
      return json({ error: "Conclua a troca de senha da sua conta antes de continuar." }, 403);
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Informe a senha do pitch." }, 400);
    const password = Deno.env.get("COMMERCIAL_PITCH_PASSWORD");
    if (!password) return json({ error: "A senha do pitch ainda não foi configurada. Fale com o responsável." }, 503);
    if (!await samePassword(parsed.data.password, password)) return json({ error: "Senha incorreta. Confira e tente novamente." }, 403);
    return json({ content: buildPitchContent(), expiresInSeconds: 900 });
  } catch {
    return json({ error: "Não deu para abrir o pitch. Tente novamente em instantes." }, 500);
  }
});
