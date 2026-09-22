import { describe, expect, it } from "vitest";
import {
  computeKpis,
  filterSubmissions,
  isActiveSubmission,
  type AdminSubmission,
} from "./adminEventsHelpers";

const base: AdminSubmission = {
  id: "event-1",
  created_at: "2026-09-01T12:00:00Z",
  user_id: "user-1",
  company_name: "Coé a Boa?",
  responsible_name: "Curadoria",
  email: null,
  phone: null,
  event_title: "Rolê na Ilha",
  date: "2026-09-22",
  start_time: "18:00",
  end_time: "21:00",
  location: "Ilha do Governador",
  address_street: null,
  address_number: null,
  address_neighborhood: null,
  address_city: null,
  address_state: null,
  address_zip: null,
  description: null,
  video_link: null,
  category: "musica",
  promotion_type: null,
  target_audience: null,
  promotion_rules: null,
  contact_social: null,
  additional_details: null,
  status: "pendente",
};

const saoPauloNow = new Date("2026-09-22T19:30:00Z"); // 16:30 em São Paulo

describe("isActiveSubmission", () => {
  it("mantém eventos futuros e em andamento", () => {
    expect(isActiveSubmission({ ...base, date: "2026-09-23" }, saoPauloNow)).toBe(true);
    expect(isActiveSubmission({ ...base, end_time: "17:00" }, saoPauloNow)).toBe(true);
  });

  it("oculta eventos encerrados e datas inválidas", () => {
    expect(isActiveSubmission({ ...base, end_time: "16:29" }, saoPauloNow)).toBe(false);
    expect(isActiveSubmission({ ...base, date: "2026-09-21" }, saoPauloNow)).toBe(false);
    expect(isActiveSubmission({ ...base, date: "sem-data" }, saoPauloNow)).toBe(false);
  });

  it("mantém eventos de hoje sem horário final até o fim do dia", () => {
    expect(isActiveSubmission({ ...base, end_time: null }, saoPauloNow)).toBe(true);
  });
});

describe("gestão ativa", () => {
  it("calcula métricas e filtros somente com a lista ativa", () => {
    const active = [
      { ...base, id: "pending" },
      { ...base, id: "approved", status: "aprovado", event_title: "Samba", date: "2026-09-23" },
      { ...base, id: "expired", status: "rejeitado", date: "2026-09-21" },
    ].filter((submission) => isActiveSubmission(submission, saoPauloNow));

    expect(computeKpis(active)).toMatchObject({ total: 2, pending: 1, approved: 1, rejected: 0 });
    expect(filterSubmissions(active, { statusFilter: "aprovado", categoryFilter: "all", search: "samba" }))
      .toHaveLength(1);
  });
});