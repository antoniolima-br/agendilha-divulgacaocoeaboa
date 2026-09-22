import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";


 export interface ProfileAddress {
   company_name: string;
   responsible_name: string;
   email: string;
   phone: string;
   address_street: string;
   address_number: string;
   address_neighborhood: string;
   address_city: string;
   address_state: string;
   address_zip: string;
    contact_social: string;
    nick_name?: string;
    home_location?: string;
    work_neighborhood?: string;
    musical_preferences?: string[];
    event_type_preferences?: string[];
    role?: string;
    push_notifications_enabled?: boolean;
    email_notifications_enabled?: boolean;
    notification_frequency?: string;
    followed_neighborhoods?: string[];
    followed_styles?: string[];
    onboarding_completed?: boolean;
  }

  const emptyAddress: ProfileAddress = {
    company_name: "",
    responsible_name: "",
    email: "",
    phone: "",
    address_street: "",
    address_number: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    contact_social: "",
    nick_name: "",
    home_location: "",
    work_neighborhood: "",
    musical_preferences: [],
    event_type_preferences: [],
    role: "public",
    push_notifications_enabled: false,
    email_notifications_enabled: false,
    notification_frequency: "weekly",
    followed_neighborhoods: [],
    followed_styles: [],
    onboarding_completed: false,
  };

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ProfileAddress> => {
      if (!userId) return emptyAddress;
      const { data, error } = await supabase
        .from("profiles")
        .select("company_name, responsible_name, email, phone, address_street, address_number, address_neighborhood, address_city, address_state, address_zip, contact_social, nick_name, home_location, work_neighborhood, musical_preferences, event_type_preferences, role, push_notifications_enabled, email_notifications_enabled, notification_frequency, followed_neighborhoods, followed_styles, onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return emptyAddress;
      return {
        company_name: data.company_name || "",
        responsible_name: data.responsible_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address_street: data.address_street || "",
        address_number: data.address_number || "",
        address_neighborhood: data.address_neighborhood || "",
        address_city: data.address_city || "",
        address_state: data.address_state || "",
        address_zip: data.address_zip || "",
        contact_social: data.contact_social || "",
        nick_name: data.nick_name || "",
        home_location: data.home_location || "",
        work_neighborhood: data.work_neighborhood || "",
        musical_preferences: data.musical_preferences || [],
        event_type_preferences: data.event_type_preferences || [],
        role: data.role || "public",
        push_notifications_enabled: data.push_notifications_enabled ?? false,
        email_notifications_enabled: data.email_notifications_enabled ?? false,
        notification_frequency: data.notification_frequency || "weekly",
        followed_neighborhoods: data.followed_neighborhoods || [],
        followed_styles: data.followed_styles || [],
        onboarding_completed: data.onboarding_completed ?? false,
      };
    },
  });

  useEffect(() => {
    if (!userId) return;
    const refreshProfile = () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    };
    window.addEventListener("agendilha:profile-updated", refreshProfile);
    return () => window.removeEventListener("agendilha:profile-updated", refreshProfile);
  }, [queryClient, userId]);

  async function saveProfile(data: Partial<ProfileAddress>) {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      handleError(error, "Erro ao salvar perfil");
    } else {
      queryClient.setQueryData<ProfileAddress>(["profile", user.id], (previous) => ({
        ...(previous ?? emptyAddress),
        ...data,
      }));
      window.dispatchEvent(new Event("agendilha:profile-updated"));
      toast.success("Perfil atualizado!");
    }

  }

  return {
    profile: profileQuery.data ?? emptyAddress,
    loaded: !userId || profileQuery.isFetched,
    saveProfile,
  };
}
