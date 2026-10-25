import { describe, expect, it } from "vitest";
import { homePubliList, pickPubli } from "./homePubli";

describe("publicidade da Home", () => {
  it("usa só os espaços preenchidos", () => {
    expect(homePubliList({ home_publi_1: "storage:publi/a.jpg", home_publi_2: "", home_publi_3: "storage:publi/c.png" }))
      .toEqual(["storage:publi/a.jpg", "storage:publi/c.png"]);
  });
  it("alterna entre as imagens conforme a sessão", () => {
    expect(pickPubli(["a", "b"], 0)).toBe("a");
    expect(pickPubli(["a", "b"], 1)).toBe("b");
    expect(pickPubli([], 3)).toBeNull();
  });
});
