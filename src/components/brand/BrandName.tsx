import { Fragment, type ReactNode } from "react";

/** Renderiza "LimaX" com o "X" na cor laranja oficial da marca. */
export function LimaXName() {
  return <>Lima<span className="limax-brand-x">X</span></>;
}

/** Aplica automaticamente o destaque do "X" em qualquer "LimaX" (ou "Limax"/"Lima X") dentro de um texto. */
export function BrandText({ children }: { children: string }): ReactNode {
  const parts = children.split(/(Lima\s?[Xx](?![a-z]))/g);
  return <>{parts.map((part, i) => /^Lima\s?[Xx]$/.test(part) ? <LimaXName key={i} /> : <Fragment key={i}>{part}</Fragment>)}</>;
}
