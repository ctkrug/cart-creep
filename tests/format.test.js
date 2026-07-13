import { describe, expect, it } from "vitest";
import { formatCurrency, formatMonth, formatPercent } from "../src/format.js";

describe("formatCurrency", () => {
  it("formats a positive amount as USD", () => {
    expect(formatCurrency(4.2)).toBe("$4.20");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("formatPercent", () => {
  it("shows a leading + on positive values", () => {
    expect(formatPercent(12.34)).toBe("+12.3%");
  });

  it("does not add a sign to negative values", () => {
    expect(formatPercent(-5)).toBe("-5.0%");
  });

  it("does not add a + sign to zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("renders an em dash for null", () => {
    expect(formatPercent(null)).toBe("—");
  });

  it("renders an em dash for NaN", () => {
    expect(formatPercent(NaN)).toBe("—");
  });

  it("can render unsigned", () => {
    expect(formatPercent(12.34, { signed: false })).toBe("12.3%");
  });
});

describe("formatMonth", () => {
  it("formats a valid YYYY-MM month", () => {
    expect(formatMonth("2026-01")).toBe("Jan 2026");
  });

  it("does not throw on a month string with a non-numeric month component", () => {
    expect(() => formatMonth("2026-ab")).not.toThrow();
  });

  it("does not throw on a completely malformed month string", () => {
    expect(() => formatMonth("not-a-month")).not.toThrow();
  });
});
