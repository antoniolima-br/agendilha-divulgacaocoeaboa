import { INSTITUTIONAL } from "@/lib/institutional";
import { LimaXName } from "@/components/brand/BrandName";

export function InstitutionalCredits() {
  return <p className="text-xs leading-relaxed text-muted-foreground">
    Criado por <a href={INSTITUTIONAL.creatorUrl} target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:text-primary hover:underline"><LimaXName /> Soluções</a>
  </p>;
}