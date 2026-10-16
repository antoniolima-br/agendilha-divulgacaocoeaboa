import type { ReactNode } from "react";

type Props = {
  label: string;
  count: number;
  icon: ReactNode;
  /** Classes do estado ativo/inativo — cada contador mantém suas cores. */
  toneClassName: string;
  className?: string;
  onClick: () => void;
};

/** Contador clicável do topo do painel de Envios (Pendentes, Confirmados, Lixeira…). */
export function EnviosStatCard({ label, count, icon, toneClassName, className = "", onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${className}${className ? " " : ""}${toneClassName}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-2xl font-display font-bold text-foreground">{count}</div>
    </button>
  );
}
