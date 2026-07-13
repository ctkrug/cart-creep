import { describe, expect, it } from "vitest";
import { cpiChangePercent, cpiIndexForMonth } from "../src/cpi.js";

describe("cpiIndexForMonth", () => {
  it("returns the published index for a known month", () => {
    expect(cpiIndexForMonth("2022-01")).toBe(270.711);
  });

  it("returns null for a month outside the dataset", () => {
    expect(cpiIndexForMonth("1999-01")).toBeNull();
  });
});

describe("cpiChangePercent", () => {
  it("computes 0% change between a month and itself", () => {
    expect(cpiChangePercent("2022-01", "2022-01")).toBe(0);
  });

  it("computes positive cumulative change over time", () => {
    const change = cpiChangePercent("2022-01", "2023-01");
    expect(change).toBeGreaterThan(0);
    expect(change).toBeCloseTo(11.36, 1);
  });

  it("returns null when either month is missing from the dataset", () => {
    expect(cpiChangePercent("1999-01", "2022-01")).toBeNull();
  });
});
