import { useIntranet } from './useIntranet';
import { ChartView } from './SectorViews';

export default function ConsolidatedView({ days }: { days: number }) {
  const commercial = useIntranet('comercial', days, true);
  const marketing = useIntranet('marketing', days, true);
  const administration = useIntranet('administracao', days, true);
  if (commercial.isError || marketing.isError || administration.isError) return <p role="alert" className="py-6">Não deu pra reunir os indicadores. Escolha o setor para tentar novamente.</p>;
  if (!commercial.data || !marketing.data || !administration.data) return <p role="status" className="py-6">Reunindo indicadores da equipe…</p>;
  return <section aria-label="Visão consolidada" className="grid gap-6 lg:grid-cols-2">
    <ChartView title="Submissões diárias" points={administration.data.consolidated}/>
    <ChartView title="Novos cadastros" points={marketing.data.growth ?? []}/>
    <ChartView title="Campanhas vigentes por produto" points={commercial.data.inventory ?? []}/>
    <ChartView title="Ranking de estabelecimentos" points={administration.data.ranking ?? []}/>
  </section>;
}