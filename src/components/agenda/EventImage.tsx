import { useState, useMemo, useEffect, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventFallbackPalette } from "@/lib/event-utils";
import { cn } from "@/lib/utils";

interface EventImageProps {
  src?: string | null;
  alt: string;
  category?: string | null;
  className?: string;
  icon?: any;
  fit?: "cover" | "contain";
}

export const EventImage = memo(function EventImage({ src, alt, category, className, icon: Icon, fit = "cover" }: EventImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const palette = useMemo(() => getEventFallbackPalette(`${alt}:${category || "outros"}`), [alt, category]);
  const showGeneratedArtwork = !src || error;

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", className)}>
      {!isLoaded && !showGeneratedArtwork && (
        <div className="absolute inset-0 z-10 p-2">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      )}
      {showGeneratedArtwork ? (
        <div className={cn("absolute inset-0 flex items-center justify-center", palette)} aria-hidden>
          <span className="select-none font-display text-5xl font-black opacity-15">
            {(alt || "Coé").trim().charAt(0).toUpperCase()}
          </span>
        </div>
      ) : <img
        src={src || undefined}
        alt={alt}
        key={src || "fallback"}
        className={cn(
          "h-full w-full motion-safe:transition-opacity motion-safe:duration-300",
          fit === "contain" ? "object-contain" : "object-cover",
          !isLoaded ? "opacity-0" : "opacity-100",
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setError(true);
          setIsLoaded(true);
        }}
        loading="lazy"
        decoding="async"
      />}
      {(!src || error) && Icon && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/10 backdrop-blur-[1px] z-20">
          <Icon className="h-6 w-6 text-current drop-shadow-md" />
        </div>
      )}
    </div>
  );
});