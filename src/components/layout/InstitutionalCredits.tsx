import { INSTITUTIONAL } from "@/lib/institutional";

export function InstitutionalCredits() {
  return <p className="text-xs leading-relaxed text-muted-foreground">
    Criado por <a href={INSTITUTIONAL.creatorUrl} target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:text-primary hover:underline">Lima<span className="limax-brand-x">X</span> Soluções</a>
  </p>;
}