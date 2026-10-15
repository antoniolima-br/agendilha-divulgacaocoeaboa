import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { qk } from "@/data/queryKeys";

const pendingOperations = new WeakMap<QueryClient, Set<string>>();
type FavoriteChange = { eventId: string; userId: string; remove: boolean };

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelInstanceId = useRef(Math.random().toString(36).slice(2));

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: qk.favorites.byUser(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("event_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((fav) => fav.event_id);
    },
    enabled: !!user,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ eventId, userId, remove }: FavoriteChange) => {
      if (remove) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("event_id", eventId);
        if (error) throw error;
        return { eventId, action: "removed" as const };
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: userId, event_id: eventId });
        if (error) throw error;
        return { eventId, action: "added" as const };
      }
    },
    onMutate: async ({ eventId, userId, remove }) => {
      await queryClient.cancelQueries({ queryKey: qk.favorites.byUser(userId) });
      const previousFavorites = queryClient.getQueryData<string[]>(qk.favorites.byUser(userId)) ?? [];

      queryClient.setQueryData<string[]>(qk.favorites.byUser(userId), (old = []) => {
        if (remove) {
          return old.filter((id) => id !== eventId);
        }
        return old.includes(eventId) ? old : [...old, eventId];
      });

      return { previousFavorites };
    },
    onError: (error, { userId }, context) => {
      if (context?.previousFavorites !== undefined) {
        queryClient.setQueryData(qk.favorites.byUser(userId), context.previousFavorites);
      }
      toast.error(error instanceof Error && error.message === "AUTH_REQUIRED"
        ? "Você precisa entrar para favoritar eventos."
        : "Não deu pra atualizar o favorito.");
    },
    onSuccess: (result) => {
      if (!result) return;
      toast.success(result.action === "removed" ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onSettled: async (_result, _error, { userId, eventId }) => {
      try {
        await queryClient.invalidateQueries({ queryKey: qk.favorites.byUser(userId) });
      } finally {
        pendingOperations.get(queryClient)?.delete(`${userId}:${eventId}`);
      }
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_favorites_${user.id}_${channelInstanceId.current}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_favorites",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: qk.favorites.byUser(user.id) });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const isFavorite = (eventId: string) => favorites.includes(eventId);

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite: (eventId: string) => {
      if (!user) {
        toast.error("Você precisa entrar para favoritar eventos.");
        return;
      }
      if (isLoading) return;
      const pending = pendingOperations.get(queryClient) ?? new Set<string>();
      const opKey = `${user.id}:${eventId}`;
      if (pending.has(opKey)) return;
      if (!pendingOperations.has(queryClient)) pendingOperations.set(queryClient, pending);
      pending.add(opKey);
      const latest = queryClient.getQueryData<string[]>(qk.favorites.byUser(user.id)) ?? favorites;
      toggleFavoriteMutation.mutate({ eventId, userId: user.id, remove: latest.includes(eventId) });
    },
    isToggling: toggleFavoriteMutation.isPending,
  };
}
