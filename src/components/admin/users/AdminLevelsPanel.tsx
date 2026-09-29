import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { UserWithRole } from "./types";

type Level = "senior" | "financeiro";
const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: "senior", label: "Sênior", hint: "Moderação e gestão de todos os módulos" },
  { id: "financeiro", label: "Financeiro", hint: "Único que dá baixa em pagamentos" },
];

/** Master define o nível de cada admin (Sênior / Financeiro). */
export function AdminLevelsPanel({ users }: { users: UserWithRole[] }) {
  const { isMaster } = useAppPermissions();
  const admins = users.filter((u) => u.is_admin && u.status !== "master");
  const [levels, setLevels] = useState<Record<string, Level[]>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!isMaster || admins.length === 0) return;
    supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["senior", "financeiro"] as never[])
      .then(({ data }) => {
        const map: Record<string, Level[]> = {};
        (data ?? []).forEach((r: { user_id: string; role: string }) => {
          (map[r.user_id] ||= []).push(r.role as Level);
        });
        setLevels(map);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaster, admins.length]);

  if (!isMaster || admins.length === 0) return null;

  async function toggle(userId: string, level: Level, on: boolean) {
    setBusy(`${userId}-${level}`);
    const q = on
      ? supabase.from("user_roles").insert({ user_id: userId, role: level as never })
      : supabase.from("user_roles").delete().eq("user_id", userId).eq("role", level as never);
    const { error } = await q;
    setBusy(null);
    if (error) {
      toast.error("Não deu pra mudar o nível. Tenta de novo.");
      return;
    }
    setLevels((prev) => {
      const cur = prev[userId] ?? [];
      return { ...prev, [userId]: on ? [...cur, level] : cur.filter((l) => l !== level) };
    });
    toast.success("Nível atualizado");
  }

  return (
    <section className="rounded-2xl border bg-card p-4 space-y-3">
      <div>
        <h2 className="font-bold">Níveis de administrador</h2>
        <p className="text-xs text-muted-foreground">
          Admin comum modera e vê pagamentos. Sênior tem gestão ampla. Só o Financeiro (ou o Master) dá baixa.
        </p>
      </div>
      <ul className="divide-y">
        {admins.map((u) => (
          <li key={u.id} className="py-2 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <span className="text-sm font-medium truncate">{u.responsible_name || u.email}</span>
            <div className="flex gap-4">
              {LEVELS.map((l) => {
                const checked = (levels[u.id] ?? []).includes(l.id);
                return (
                  <label key={l.id} title={l.hint} className="flex items-center gap-2 text-sm min-h-[44px]">
                    <Checkbox
                      checked={checked}
                      disabled={busy === `${u.id}-${l.id}`}
                      onCheckedChange={(v) => toggle(u.id, l.id, !!v)}
                    />
                    {l.label}
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
