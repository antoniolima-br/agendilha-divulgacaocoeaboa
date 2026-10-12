import { INSTITUTIONAL } from "@/lib/institutional";

export function InstitutionalCredits() {
  return <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
    <p>{INSTITUTIONAL.ownership}</p>
    <p>Tecnologia criada pela <a href={INSTITUTIONAL.creatorUrl} target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:text-primary hover:underline">{INSTITUTIONAL.creator}</a> (Lima X Soluções).</p>
  </div>;
}