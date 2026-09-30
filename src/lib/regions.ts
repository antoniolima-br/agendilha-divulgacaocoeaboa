/** Regiões do Rio/Grande Rio e mapeamento por bairro/município do evento. */
export const REGIONS = [
  "Zona Sul", "Zona Norte", "Zona Oeste", "Centro", "Ilha do Governador", "Baixada Fluminense", "Leste Metropolitano",
] as const;
export type Region = (typeof REGIONS)[number];

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const list = (s: string) => s.split(",").map(norm);

const MAP: Record<Region, string[]> = {
  "Ilha do Governador": list("ilha do governador,bancarios,cacuia,cidade universitaria,cocota,freguesia,galeao,jardim carioca,jardim guanabara,monero,pitangueiras,portuguesa,praia da bandeira,ribeira,taua,zumbi,ilha"),
  "Zona Sul": list("copacabana,ipanema,leblon,botafogo,flamengo,laranjeiras,catete,gloria,urca,leme,humaita,lagoa,jardim botanico,gavea,sao conrado,rocinha,vidigal,cosme velho,zona sul"),
  "Centro": list("centro,lapa,santa teresa,saude,gamboa,santo cristo,cidade nova,catumbi,rio comprido,estacio,paqueta"),
  "Zona Oeste": list("barra da tijuca,recreio,recreio dos bandeirantes,jacarepagua,campo grande,bangu,realengo,santa cruz,taquara,freguesia de jacarepagua,vargem grande,vargem pequena,guaratiba,sepetiba,padre miguel,senador camara,anil,pechincha,curicica,itanhanga,joa,zona oeste"),
  "Zona Norte": list("tijuca,vila isabel,grajau,maracana,meier,madureira,penha,olaria,ramos,bonsucesso,maré,mare,iraja,vista alegre,vila da penha,pavuna,andarai,engenho novo,cachambi,todos os santos,piedade,cascadura,oswaldo cruz,bento ribeiro,marechal hermes,rocha miranda,vicente de carvalho,vaz lobo,sao cristovao,benfica,cordovil,bras de pina,zona norte"),
  "Baixada Fluminense": list("duque de caxias,nova iguacu,sao joao de meriti,belford roxo,nilopolis,mesquita,queimados,mage,guapimirim,japeri,seropedica,itaguai,paracambi,baixada,baixada fluminense"),
  "Leste Metropolitano": list("niteroi,sao goncalo,marica,itaborai,tangua,rio bonito,icarai,piratininga,itaipu,leste metropolitano"),
};

/** Descobre a região de um evento pelo bairro e, se não achar, pela cidade. */
export function regionOf(e: { address_neighborhood?: string | null; address_city?: string | null }): Region | null {
  for (const v of [e.address_neighborhood, e.address_city]) {
    const n = norm(String(v || ""));
    if (!n) continue;
    for (const r of REGIONS) if (MAP[r].includes(n)) return r;
  }
  return null;
}

/** Só as regiões que têm pelo menos um evento, na ordem padrão. */
export function activeRegions(events: any[]): Region[] {
  const set = new Set(events.map(regionOf).filter(Boolean) as Region[]);
  return REGIONS.filter((r) => set.has(r));
}
