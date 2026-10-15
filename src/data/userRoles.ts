import { supabase } from "@/integrations/supabase/client";

export async function fetchUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.role));
}