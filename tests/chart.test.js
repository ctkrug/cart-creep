import { describe, expect, it } from "vitest";
import { buildComparisonSeries, chartGeometry, hasWowMoment, pathFromPoints } from "../src/chart.js";

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

describe("chartGeometry", () => {
  const series = {
    months: ["2026-01", "2026-02", "2026-03"],
    personal: [0, 10, 20],
    cpi: [0, 2, 4],
  };

  it("maps the first and last month to the padded left/right edges", () => {
    const { personalPoints } = chartGeometry(series, { width: 300, height: 100, padding: 20 });
    expect(personalPoints[0].x).toBeCloseTo(20, 5);
    expect(personalPoints[2].x).toBeCloseTo(280, 5);
  });

  it("maps the max value to the top padded edge and 0 or min to the bottom", () => {
    const { personalPoints, zeroY } = chartGeometry(series, { width: 300, height: 100, padding: 20 });
    expect(personalPoints[2].y).toBeCloseTo(20, 5);
    expect(zeroY).toBeCloseTo(80, 5);
  });

  it("centers a single-month series and does not divide by zero", () => {
    const single = { months: ["2026-01"], personal: [0], cpi: [0] };
    const { personalPoints } = chartGeometry(single, { width: 300, height: 100, padding: 20 });
    expect(personalPoints[0].x).toBeCloseTo(150, 5);
    expect(Number.isFinite(personalPoints[0].y)).toBe(true);
  });

  it("keeps a flat all-equal series finite instead of NaN", () => {
    const flat = { months: ["2026-01", "2026-02"], personal: [5, 5], cpi: [5, 5] };
    const { personalPoints } = chartGeometry(flat, { width: 300, height: 100, padding: 20 });
    expect(personalPoints.every((p) => Number.isFinite(p.y))).toBe(true);
  });

  it("passes through null values (missing CPI months) as null y", () => {
    const withGap = { months: ["2026-01", "1999-12"], personal: [0, 5], cpi: [0, null] };
    const { cpiPoints } = chartGeometry(withGap, { width: 300, height: 100, padding: 20 });
    expect(cpiPoints[1].y).toBeNull();
  });
});

describe("pathFromPoints", () => {
  it("returns an empty string for no plotted points", () => {
    expect(pathFromPoints([])).toBe("");
    expect(pathFromPoints([{ x: 1, y: null }])).toBe("");
  });

  it("builds an M-then-L path skipping null-y gaps", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: null },
      { x: 20, y: 5 },
    ];
    expect(pathFromPoints(points)).toBe("M0.00,0.00 L20.00,5.00");
  });
});
