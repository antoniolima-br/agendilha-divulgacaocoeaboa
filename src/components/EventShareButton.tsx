import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/ShareDialog";
import { cn } from "@/lib/utils";

interface EventShareButtonProps {
  title: string;
  text: string;
  url: string;
  onShared?: () => void;
  className?: string;
  compact?: boolean;
}

export function EventShareButton({
  title,
  text,
  url,
  onShared,
  className,
  compact = false,
}: EventShareButtonProps) {
  const [fallbackOpen, setFallbackOpen] = useState(false);

  const share = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!navigator.share) {
      setFallbackOpen(true);
      return;
    }

    try {
      await navigator.share({ title, text, url });
      onShared?.();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setFallbackOpen(true);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon" : "default"}
        className={cn(
          compact ? "h-9 w-9 rounded-full" : "h-11 rounded-full border-foreground/15 font-medium",
          className,
        )}
        onClick={share}
        aria-label="Compartilhar evento"
      >
        <Share2 className={cn("h-4 w-4", !compact && "mr-2")} />
        {!compact && "Compartilhar"}
      </Button>

      <ShareDialog
        open={fallbackOpen}
        onOpenChange={setFallbackOpen}
        title={title}
        text={text}
        url={url}
        onShare={() => onShared?.()}
      />
    </>
  );
}