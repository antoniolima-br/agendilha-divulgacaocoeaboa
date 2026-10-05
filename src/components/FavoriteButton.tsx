 import { Heart } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 import { useFavorites } from "@/hooks/useFavorites";

 interface FavoriteButtonProps {
   eventId: string;
   className?: string;
   variant?: "default" | "ghost";
   size?: "default" | "sm" | "lg" | "icon";
 }

 export function FavoriteButton({ eventId, className, variant = "ghost", size = "icon" }: FavoriteButtonProps) {
   const { isFavorite, toggleFavorite, isToggling } = useFavorites();
   const active = isFavorite(eventId);

   return (
     <Button
       variant={variant}
       size={size}
       className={cn(
         "rounded-full transition-all active:scale-90 shadow-sm",
         active ? "bg-primary text-white" : "bg-black/20 text-white hover:bg-white/20",
         className
       )}
       onClick={(e) => {
         e.stopPropagation();
         toggleFavorite(eventId);
       }}
        disabled={isToggling}
        aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        aria-pressed={active}
     >
       <Heart className={cn("h-4 w-4", active && "fill-current")} />
     </Button>
   );
 }