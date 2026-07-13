import { describe, expect, it } from "vitest";
import { buildComparisonSeries, hasWowMoment } from "../src/chart.js";

describe("hasWowMoment", () => {
  it("is false with no entries", () => {
    expect(hasWowMoment([])).toBe(false);
  });

  it("is false with one distinct month, even with multiple items", () => {
    const entries = [
      { item: "Milk", month: "2026-01", price: 4 },
      { item: "Eggs", month: "2026-01", price: 3 },
    ];
    expect(hasWowMoment(entries)).toBe(false);
  });

  it("is true once entries span two distinct months", () => {
    const entries = [
      { item: "Milk", month: "2026-01", price: 4 },
      { item: "Milk", month: "2026-02", price: 4.4 },
    ];
    expect(hasWowMoment(entries)).toBe(true);
  });
});

describe("buildComparisonSeries", () => {
  it("returns empty series with no entries", () => {
    expect(buildComparisonSeries([])).toEqual({
      baseMonth: null,
      months: [],
      personal: [],
      cpi: [],
    });
  });

  it("anchors both lines to the user's first logged month", () => {
    const entries = [
      { item: "Milk", month: "2022-01", price: 10 },
      { item: "Milk", month: "2022-02", price: 11 },
    ];
    const series = buildComparisonSeries(entries);
    expect(series.baseMonth).toBe("2022-01");
    expect(series.months).toEqual(["2022-01", "2022-02"]);
    expect(series.personal[0]).toBe(0);
    expect(series.personal[1]).toBeCloseTo(10, 5);
    expect(series.cpi[0]).toBe(0);
    expect(series.cpi[1]).toBeGreaterThan(0);
  });

  it("matches cpiChangePercent's own anchored output exactly", () => {
    const entries = [
      { item: "Milk", month: "2022-01", price: 10 },
      { item: "Milk", month: "2022-06", price: 12 },
    ];
    const series = buildComparisonSeries(entries);
    expect(series.cpi[1]).toBeCloseTo(((288.884 - 270.711) / 270.711) * 100, 5);
  });
});
