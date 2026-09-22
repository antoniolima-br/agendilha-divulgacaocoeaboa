import { describe, expect, it } from "vitest";
import { normalizeAds } from "./useAds";

const validAd = {
  id: "ad-1",
  user_id: "user-1",
  title: "Som para festas",
  description: "Equipamento completo para eventos.",
  category: "Serviços",
  contact_whatsapp: "5521999999999",
  status: "publicado",
  photos: ["capa.jpg"],
  price_cents: 15000,
  city: "Rio de Janeiro",
  neighborhood: "Ilha do Governador",
  rejection_reason: null,
  is_highlight: true,
  highlight_plan_id: null,
  highlight_until: null,
  views_count: 4,
  created_at: "2026-09-22T12:00:00Z",
};

describe("normalizeAds", () => {
  it.each([null, undefined, {}, "anúncios"])("devolve lista vazia para %p", (input) => {
    expect(normalizeAds(input)).toEqual([]);
  });

  it("descarta registros inválidos e normaliza fotos inesperadas", () => {
    const result = normalizeAds([
      null,
      { title: "sem identificação" },
      { ...validAd, photos: null, views_count: null },
      { ...validAd, id: "ad-2", photos: ["foto.jpg", null, 10, ""] },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].photos).toEqual([]);
    expect(result[0].views_count).toBe(0);
    expect(result[1].photos).toEqual(["foto.jpg"]);
  });
});