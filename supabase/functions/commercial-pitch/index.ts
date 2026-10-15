import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { buildPitchContent } from "./content.ts";
import { inventoryImage } from "./inventory-image.ts";

const BodySchema = z.object({ audience: z.enum(["investor", "advertiser"]).default("investor") }).strict();
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" },
  });
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Confira os dados do pitch e tente novamente." }, 400);
    if (parsed.data.audience === "advertiser") {
      const { formats, pushTicket, push } = buildPitchContent();
      return json({ content: { formats, pushTicket, push }, expiresInSeconds: 900 });
    }
    return json({ content: { ...buildPitchContent(), inventoryImage }, expiresInSeconds: 900 });
  } catch {
    return json({ error: "Não deu para abrir o pitch. Tente novamente em instantes." }, 500);
  }
});
