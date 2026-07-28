import { describe, expect, it } from "vitest";
import { isValidAge } from "./validateAge";

describe("isValidAge", () => {
  it("accepts the lower boundary (1)", () => {
    expect(isValidAge(1)).toBe(true);
  });

  it("accepts the upper boundary (120)", () => {
    expect(isValidAge(120)).toBe(true);
  });

  it("accepts a typical mid-range age", () => {
    expect(isValidAge(30)).toBe(true);
  });

  it("rejects 0", () => {
    expect(isValidAge(0)).toBe(false);
  });

  it("rejects a value above 120", () => {
    expect(isValidAge(121)).toBe(false);
  });

  it("rejects negative numbers", () => {
    expect(isValidAge(-5)).toBe(false);
  });

  it("rejects non-integer numbers", () => {
    expect(isValidAge(25.5)).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isValidAge(NaN)).toBe(false);
  });
});
