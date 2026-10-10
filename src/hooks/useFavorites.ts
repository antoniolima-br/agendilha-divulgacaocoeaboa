 import { useEffect, useRef } from "react";
 import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { toast } from "sonner";
 import { qk } from "@/data/queryKeys";

 const pendingUsers = new WeakMap<QueryClient, Set<string>>();
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
     mutationFn: async (eventId: string) => {
       if (!user) throw new Error("AUTH_REQUIRED");

       const isFavorite = favorites.includes(eventId);

       if (isFavorite) {
         const { error } = await supabase
           .from("user_favorites")
           .delete()
           .eq("user_id", user.id)
           .eq("event_id", eventId);
         if (error) throw error;
         return { eventId, action: "removed" };
       } else {
         const { error } = await supabase
           .from("user_favorites")
           .insert({ user_id: userId, event_id: eventId });
         if (error) throw error;
         return { eventId, action: "added" };
       }
     },
     onMutate: async (eventId) => {
       if (!user) return { previousFavorites: favorites, skipped: true };
       await queryClient.cancelQueries({ queryKey: qk.favorites.byUser(user?.id) });
       const previousFavorites = queryClient.getQueryData<string[]>(qk.favorites.byUser(user?.id));

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
     onSettled: () => {
       queryClient.invalidateQueries({ queryKey: qk.favorites.byUser(user?.id) });
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
       supabase.removeChannel(channel);
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
        const pending = pendingUsers.get(queryClient) ?? new Set<string>();
        if (pending.has(user.id)) return;
        pendingUsers.set(queryClient, pending);
        pending.add(user.id);
        const latest = queryClient.getQueryData<string[]>(qk.favorites.byUser(user.id)) ?? [];
        toggleFavoriteMutation.mutate({ eventId, userId: user.id, remove: latest.includes(eventId) });
      },
     isToggling: toggleFavoriteMutation.isPending,
   };
 }