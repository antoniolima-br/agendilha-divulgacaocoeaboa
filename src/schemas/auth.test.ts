import { describe, expect, it } from "vitest";
import { passwordSchema } from "./auth";

describe("personal password policy", () => {
  it("accepts six lowercase characters without symbols or uppercase", () => {
    expect(passwordSchema.safeParse("roleno").success).toBe(true);
  });
  it("rejects fewer than six characters", () => {
    expect(passwordSchema.safeParse("role").success).toBe(false);
    expect(passwordSchema.safeParse("rolen").success).toBe(false);
  });
});