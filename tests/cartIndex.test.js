import { describe, expect, it } from "vitest";
import { cartIndexSeries, cartMonthlyTotals, itemCreepBreakdown } from "../src/cartIndex.js";

describe("cartMonthlyTotals", () => {
  it("sums prices per month and sorts chronologically", () => {
    const entries = [
      { item: "Milk", month: "2026-02", price: 4 },
      { item: "Eggs", month: "2026-01", price: 3 },
      { item: "Milk", month: "2026-01", price: 4 },
    ];
    expect(cartMonthlyTotals(entries)).toEqual([
      { month: "2026-01", total: 7 },
      { month: "2026-02", total: 4 },
    ]);
  });
});

describe("cartIndexSeries", () => {
  it("returns an empty series with no entries", () => {
    expect(cartIndexSeries([])).toEqual([]);
  });

  it("expresses later months as cumulative % change from the first month", () => {
    const entries = [
      { item: "Milk", month: "2026-01", price: 10 },
      { item: "Milk", month: "2026-02", price: 11 },
    ];
    const series = cartIndexSeries(entries);
    expect(series[0]).toEqual({ month: "2026-01", changePercent: 0 });
    expect(series[1].changePercent).toBeCloseTo(10, 5);
  });
});

describe("itemCreepBreakdown", () => {
  it("ranks items highest-creep-first from first to most recent price", () => {
    const entries = [
      { item: "Eggs", month: "2026-01", price: 3 },
      { item: "Eggs", month: "2026-02", price: 4.5 },
      { item: "Milk", month: "2026-01", price: 4 },
      { item: "Milk", month: "2026-02", price: 4.2 },
    ];
    const { ranked, excluded } = itemCreepBreakdown(entries);
    expect(ranked.map((r) => r.item)).toEqual(["Eggs", "Milk"]);
    expect(ranked[0].changePercent).toBeCloseTo(50, 5);
    expect(ranked[1].changePercent).toBeCloseTo(5, 5);
    expect(excluded).toEqual([]);
  });

  it("excludes items with fewer than two months logged instead of dropping them silently", () => {
    const entries = [
      { item: "Eggs", month: "2026-01", price: 3 },
      { item: "Eggs", month: "2026-02", price: 4.5 },
      { item: "Coffee", month: "2026-01", price: 8 },
    ];
    const { ranked, excluded } = itemCreepBreakdown(entries);
    expect(ranked.map((r) => r.item)).toEqual(["Eggs"]);
    expect(excluded).toEqual([{ item: "Coffee", monthsLogged: 1 }]);
  });

  it("returns empty ranked and excluded for no entries", () => {
    expect(itemCreepBreakdown([])).toEqual({ ranked: [], excluded: [] });
  });

  it("treats a zero first price as 0% change to avoid Infinity/NaN", () => {
    const entries = [
      { item: "Freebie", month: "2026-01", price: 0 },
      { item: "Freebie", month: "2026-02", price: 2 },
    ];
    const { ranked } = itemCreepBreakdown(entries);
    expect(ranked[0].changePercent).toBe(0);
  });
});
