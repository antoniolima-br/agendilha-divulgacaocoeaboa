import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCepAddress } from "./cep";

afterEach(() => vi.unstubAllGlobals());

describe("CEP transport contract", () => {
  it("passes the abort signal and returns unchanged fields", async () => {
    const data = { logradouro: " Rua X ", bairro: "Olaria", localidade: "Rio de Janeiro", uf: "RJ" };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => data });
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    expect(await fetchCepAddress("21021100", { signal })).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/21021100/json/", { signal });
  });

  it("retains status checking as an explicit caller policy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ erro: true }) }));
    await expect(fetchCepAddress("21021100")).rejects.toThrow("Falha ao consultar CEP");
    expect(await fetchCepAddress("21021100", { checkHttpStatus: false })).toEqual({ erro: true });
  });

  it("propagates network failures and leaves recovery to the form", async () => {
    const error = new Error("offline");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
    await expect(fetchCepAddress("21021100")).rejects.toBe(error);
  });
});