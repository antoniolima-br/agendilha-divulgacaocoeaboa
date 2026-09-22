import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const phonePattern = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

const BodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).refine((value) => !value || phonePattern.test(value), "Telefone inválido"),
  neighborhood: z.string().trim().max(100),
  access_type: z.enum(["publico", "divulgador", "artista", "admin"]),
  password: z.string().regex(strongPassword, "A senha precisa ter maiúscula, minúscula, número e símbolo").max(72),
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
    if (!parsed.success) return json({ error: "Revise os dados informados", fields: parsed.error.flatten().fieldErrors }, 400);

    const input = parsed.data;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    if (input.access_type === "admin") {
      const { data: callerIsMaster } = await admin.rpc("is_master", { _user_id: caller.id });
      if (!callerIsMaster) return json({ error: "Somente Master pode criar outro administrador" }, 403);
    }

    const email = input.email.toLowerCase();
    const phone = input.phone.replace(/\D/g, "") || null;
    const userType = input.access_type === "publico" || input.access_type === "admin" ? "usuario" : input.access_type === "artista" ? "artist" : "divulgador";
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.name, phone },
    });
    if (createError || !created.user) {
      const duplicate = /already|registered|exists/i.test(createError?.message ?? "");
      return json({ error: duplicate ? "Já existe uma conta com este e-mail" : createError?.message ?? "Não foi possível criar a conta" }, duplicate ? 409 : 400);
    }

    const userId = created.user.id;
    try {
      const { error: profileError } = await admin.from("profiles").upsert({
        user_id: userId,
        responsible_name: input.name,
        email,
        phone,
        address_neighborhood: input.neighborhood || null,
        user_type: userType,
        must_change_password: true,
      }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      if (input.access_type === "admin") {
        const { error: roleError } = await admin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        if (roleError) throw roleError;
      }

      const { error: auditError } = await admin.from("audit_logs").insert({
        actor_id: caller.id,
        action: "user_created",
        resource_type: "user",
        resource_id: userId,
        new_value: { email, access_type: input.access_type },
        reason: "Conta criada pela Gestão de Usuários",
      });
      if (auditError) console.error("create-user audit failed", auditError.message);
    } catch (setupError) {
      await admin.auth.admin.deleteUser(userId);
      throw setupError;
    }

    return json({ success: true, user_id: userId }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado" }, 500);
  }
});