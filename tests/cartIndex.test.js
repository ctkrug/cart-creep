import { describe, expect, it } from "vitest";
import { cartIndexSeries, cartMonthlyTotals } from "../src/cartIndex.js";

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
