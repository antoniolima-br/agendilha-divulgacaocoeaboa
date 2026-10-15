import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventBatchNavigation({ batch }: { batch: {
  page: number; hasNext: boolean; hasPrevious: boolean; isFetching: boolean; next: () => void; previous: () => void;
} }) {
  if (!batch.hasNext && !batch.hasPrevious) return null;
  const move = (action: () => void) => { action(); document.getElementById("event-batch-start")?.scrollIntoView({ block: "start" }); };
  return <nav aria-label="Páginas de rolês" className="my-6 flex items-center justify-center gap-4">
    <Button variant="outline" disabled={!batch.hasPrevious || batch.isFetching} onClick={() => move(batch.previous)}><ChevronLeft className="h-4 w-4" />Anteriores</Button>
    <span className="text-sm text-muted-foreground">{batch.page + 1}</span>
    <Button variant="outline" disabled={!batch.hasNext || batch.isFetching} onClick={() => move(batch.next)}>Mais rolês<ChevronRight className="h-4 w-4" /></Button>
  </nav>;
}