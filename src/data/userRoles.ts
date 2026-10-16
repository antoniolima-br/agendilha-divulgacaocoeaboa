import { supabase } from "@/integrations/supabase/client";

export async function fetchUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.role));
}
export type RoleAssignment = { user_id: string; role: string };

/** Lista quem tem cada papel. Falhas viram lista vazia, como as telas já esperavam. */
export async function listRoleAssignments(roles?: string[]): Promise<RoleAssignment[]> {
  let query = supabase.from("user_roles").select("user_id, role");
  if (roles) query = query.in("role", roles as never[]);
  const { data } = await query;
  return (data ?? []).map((row) => ({ user_id: row.user_id, role: String(row.role) }));
}

/** Liga ou desliga um papel. Só o Master chega aqui; o backend confere de novo. */
export async function setUserRole(userId: string, role: string, enabled: boolean) {
  const { error } = enabled
    ? await supabase.from("user_roles").insert({ user_id: userId, role: role as never })
    : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as never);
  return error;
}
