/** Taxonomia geográfica única do Coé a Boa? para o município do Rio. */
export const REGIONS = ["Centro", "Zona Sul", "Grande Tijuca", "Zona Norte", "Ilha do Governador", "Jacarepaguá", "Barra e Recreio", "Zona Oeste"] as const;
export type Region = (typeof REGIONS)[number];
export const REGION_NEIGHBORHOODS: Record<Region, readonly string[]> = {
  Centro: ["Centro", "Santa Teresa", "Lapa", "Gamboa", "Saúde", "Santo Cristo", "Paquetá", "Cidade Nova", "Catumbi", "Estácio", "Rio Comprido"],
  "Zona Sul": ["Copacabana", "Ipanema", "Leblon", "Botafogo", "Flamengo", "Laranjeiras", "Gávea", "Catete", "Glória", "Urca", "Leme", "Humaitá", "Lagoa", "Jardim Botânico", "São Conrado", "Rocinha", "Vidigal", "Cosme Velho"],
  "Grande Tijuca": ["Tijuca", "Maracanã", "Grajaú", "Vila Isabel", "Andaraí", "Alto da Boa Vista", "Praça da Bandeira"],
  "Zona Norte": ["Méier", "Madureira", "Irajá", "Penha", "Pavuna", "Abolição", "Acari", "Água Santa", "Anchieta", "Barros Filho", "Benfica", "Bento Ribeiro", "Bonsucesso", "Brás de Pina", "Cachambi", "Cascadura", "Cavalcanti", "Coelho Neto", "Colégio", "Complexo do Alemão", "Cordovil", "Costa Barros", "Del Castilho", "Encantado", "Engenheiro Leal", "Engenho da Rainha", "Engenho de Dentro", "Engenho Novo", "Guadalupe", "Higienópolis", "Honório Gurgel", "Inhaúma", "Jacaré", "Jacarezinho", "Jardim América", "Lins de Vasconcelos", "Mangueira", "Manguinhos", "Maré", "Marechal Hermes", "Maria da Graça", "Olaria", "Oswaldo Cruz", "Parada de Lucas", "Parque Anchieta", "Parque Colúmbia", "Penha Circular", "Piedade", "Pilares", "Quintino Bocaiúva", "Ramos", "Riachuelo", "Ricardo de Albuquerque", "Rocha", "Rocha Miranda", "Sampaio", "São Cristóvão", "São Francisco Xavier", "Todos os Santos", "Tomás Coelho", "Turiaçu", "Vaz Lobo", "Vicente de Carvalho", "Vigário Geral", "Vila da Penha", "Vila Kosmos", "Vista Alegre"],
  "Ilha do Governador": ["Bancários", "Cacuia", "Cidade Universitária", "Cocotá", "Freguesia (Ilha do Governador)", "Galeão", "Jardim Carioca", "Jardim Guanabara", "Moneró", "Pitangueiras", "Portuguesa", "Praia da Bandeira", "Ribeira", "Tauá", "Zumbi"],
  Jacarepaguá: ["Jacarepaguá", "Freguesia (Jacarepaguá)", "Taquara", "Pechincha", "Curicica", "Praça Seca", "Vila Valqueire", "Anil", "Gardênia Azul", "Cidade de Deus", "Tanque"],
  "Barra e Recreio": ["Barra da Tijuca", "Recreio dos Bandeirantes", "Joá", "Itanhangá", "Vargem Grande", "Vargem Pequena", "Camorim", "Grumari", "Barra Olímpica"],
  "Zona Oeste": ["Bangu", "Campo Grande", "Realengo", "Santa Cruz", "Guaratiba", "Barra de Guaratiba", "Pedra de Guaratiba", "Sepetiba", "Padre Miguel", "Senador Camará", "Senador Vasconcelos", "Santíssimo", "Cosmos", "Inhoaíba", "Paciência", "Campo dos Afonsos", "Deodoro", "Jardim Sulacap", "Magalhães Bastos", "Vila Militar", "Gericinó", "Jabour"],
};
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const lookup = new Map<string, Region>();
for (const region of REGIONS) {
  lookup.set(norm(region), region);
  for (const neighborhood of REGION_NEIGHBORHOODS[region]) lookup.set(norm(neighborhood), region);
}
// Plain Freguesia is the historic island value; qualified names remove ambiguity for new entries.
for (const [alias, region] of Object.entries({ "Freguesia": "Ilha do Governador", "Freguesia da Ilha": "Ilha do Governador", "Freguesia de Jacarepaguá": "Jacarepaguá", "Recreio": "Barra e Recreio", "Ilha": "Ilha do Governador" })) lookup.set(norm(alias), region as Region);
export function regionOf(e: { address_neighborhood?: string | null; address_city?: string | null }): Region | null {
  const city = norm(e.address_city ?? "");
  if (city && !["rio de janeiro", "rio", "rj"].includes(city) && !REGIONS.some((r) => norm(r) === city)) return null;
  return lookup.get(norm(e.address_neighborhood ?? "")) ?? lookup.get(city) ?? null;
}
export function activeRegions(events: { address_neighborhood?: string | null; address_city?: string | null }[]): Region[] {
  const found = new Set(events.map(regionOf));
  return REGIONS.filter((r) => found.has(r));
}
