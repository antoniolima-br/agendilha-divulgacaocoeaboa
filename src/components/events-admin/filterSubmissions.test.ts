import { describe, expect, it } from "vitest";
import { filterSubmissions } from "./filterSubmissions";
import type { Submission } from "./types";

const make = (p: Partial<Submission>) => ({ event_title: "", category: "musica", editorial_status: null, ...p }) as Submission;
const list = [
  make({ id: "1", event_title: "Samba na Praça", category: "musica" }),
  make({ id: "2", event_title: "Feira", category: "feira", editorial_status: "pronto_divulgar" as never, location: "Bar do Zé" }),
];
const all = { category: "all", editorial: "all", search: "" };

describe("filterSubmissions", () => {
  it("mantém tudo sem filtros", () => expect(filterSubmissions(list, all)).toHaveLength(2));
  it("filtra por categoria", () => expect(filterSubmissions(list, { ...all, category: "feira" }).map((s) => s.id)).toEqual(["2"]));
  it("trata etapa vazia como recebido", () => expect(filterSubmissions(list, { ...all, editorial: "recebido" }).map((s) => s.id)).toEqual(["1"]));
  it("busca por local sem diferenciar maiúsculas", () => expect(filterSubmissions(list, { ...all, search: "ZÉ" }).map((s) => s.id)).toEqual(["2"]));
});
