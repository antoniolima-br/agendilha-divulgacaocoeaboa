import { describe, expect, it } from "vitest";
import { pickFallbackFlyerStyle } from "./generateFallbackFlyer";

describe("pickFallbackFlyerStyle", () => {
  it("combina paletas e layouts diferentes", () => {
    const values = [0, 0, 0.21, 0.26, 0.42, 0.51, 0.63, 0.76, 0.84, 0.99];
    let index = 0;
    const random = () => values[index++ % values.length];
    const styles = Array.from({ length: 5 }, () => pickFallbackFlyerStyle(random));

    expect(new Set(styles.map((style) => style.palette.background)).size).toBe(5);
    expect(new Set(styles.map((style) => style.layout)).size).toBe(4);
  });

  it("mantém o sorteio dentro dos estilos disponíveis nos limites", () => {
    const first = pickFallbackFlyerStyle(() => 0);
    const last = pickFallbackFlyerStyle(() => 1);

    expect(first.layout).toBe("editorial");
    expect(first.palette.background).toBeTruthy();
    expect(last.layout).toBe("orbit");
    expect(last.palette.accent).toBeTruthy();
  });
});