import { afterEach, describe, expect, it, vi } from "vitest";
import { measureFlowOperation, startFlowMeasure } from "./flow-performance";

describe("flow-performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("publica uma medição sem incluir dados do formulário", () => {
    const listener = vi.fn();
    window.addEventListener("agendilha:flow-metric", listener);

    const metric = startFlowMeasure("event-submission", "step-validation", 1).finish({
      outcome: "blocked",
      fieldCount: 2,
    });

    expect(metric).toMatchObject({
      flow: "event-submission",
      operation: "step-validation",
      outcome: "blocked",
      step: 1,
      fieldCount: 2,
    });
    expect(metric?.durationMs).toBeGreaterThanOrEqual(0);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("agendilha:flow-metric", listener);
  });

  it("marca operações rejeitadas como falha e preserva o erro", async () => {
    const error = Object.assign(new Error("falhou"), { code: "TEST_ERROR" });

    await expect(
      measureFlowOperation("event-submission", "submission-insert", async () => {
        throw error;
      }),
    ).rejects.toBe(error);
  });

  it("finaliza cada medição apenas uma vez", () => {
    const timer = startFlowMeasure("event-submission", "draft-save");
    expect(timer.finish()).not.toBeNull();
    expect(timer.finish()).toBeNull();
  });
  it("releases completed marks while retaining concurrent starts and bounding measures", () => {
    const pending = startFlowMeasure("memory-test", "pending");
    const mark = vi.spyOn(performance, "mark");
    const clear = vi.spyOn(performance, "clearMarks");
    const measures = vi.spyOn(performance, "clearMeasures");
    const measure = vi.spyOn(performance, "measure");
    vi.spyOn(console, "info").mockImplementation(() => {});
    for (let i = 0; i < 125; i++) startFlowMeasure("memory-test", `operation-${i}`).finish();
    expect(clear).toHaveBeenCalledTimes(250);
    expect(measures).toHaveBeenCalled();
    expect(clear.mock.calls.some(([name]) => String(name).includes("pending"))).toBe(false);
    expect(pending.finish()).not.toBeNull();
    expect(measure).toHaveBeenLastCalledWith("agendilha-flow:memory-test:pending", expect.stringContaining(":start"), expect.stringContaining(":end"));
    expect(mark).toHaveBeenCalled();
  });
});