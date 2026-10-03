import { describe, expect, it } from "vitest";
import { buildGuideAddress, buildGuideAgenda, buildGuideUberLink, resolveEstablishment, type GuideEvent } from "../../supabase/functions/coezinho/agenda";

const event: GuideEvent = {
  id: "event-1",
  event_title: "Samba de Hoje",
  date: "2026-10-03",
  start_time: "20:00:00",
  end_time: "22:00:00",
  location: "Bar do Porto",
  address_street: null,
  address_number: null,
  address_neighborhood: null,
  address_city: null,
  address_state: null,
  address_zip: null,
  latitude: null,
  longitude: null,
  category: "Música",
  description: "Roda de samba.",
  slug: "samba-de-hoje",
  is_highlight: false,
};

const establishment = {
  nome: "Bár do Pôrto",
  endereco: "Rua da Praia",
  numero: "10",
  complemento: null,
  bairro: "Ribeira",
  cep: "21930-050",
};

describe("agenda do Guia do Coé", () => {
  it("relaciona o local ignorando acentos e monta o endereço cadastrado", () => {
    expect(resolveEstablishment(event, [establishment])).toEqual(establishment);
    expect(buildGuideAddress(event, establishment)).toContain("Rua da Praia, 10 - Ribeira");
  });

  it("inclui links do evento e da rota na agenda enviada ao Guia", () => {
    const agenda = buildGuideAgenda([event], [establishment]);
    expect(agenda).toContain("ver rolê: /evento/samba-de-hoje");
    expect(agenda).toContain("Vá de Uber: https://m.uber.com/ul/");
    expect(agenda).toContain("Bár do Pôrto");
  });

  it("usa coordenadas reais quando elas estão disponíveis", () => {
    const link = buildGuideUberLink({ ...event, latitude: -22.8, longitude: -43.2 }, "Rua da Praia, 10");
    expect(link).toContain("dropoff%5Blatitude%5D=-22.8");
    expect(link).toContain("dropoff%5Blongitude%5D=-43.2");
  });
});