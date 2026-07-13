import { cartIndexSeries } from "./cartIndex.js";
import { cpiChangePercent } from "./cpi.js";

/**
 * True once entries span at least two distinct months — the minimum needed
 * for a personal line to have a slope worth comparing to CPI.
 */
export function hasWowMoment(entries) {
  const distinctMonths = new Set(entries.map((entry) => entry.month));
  return distinctMonths.size >= 2;
}

/**
 * Builds the two directly-comparable series for the chart: the personal
 * cart index and the official CPI, both expressed as cumulative % change
 * from the same base month (the user's earliest logged month).
 */
export function buildComparisonSeries(entries) {
  const personal = cartIndexSeries(entries);
  if (personal.length === 0) {
    return { baseMonth: null, months: [], personal: [], cpi: [] };
  }
  const baseMonth = personal[0].month;
  const months = personal.map((point) => point.month);
  const cpi = months.map((month) => cpiChangePercent(baseMonth, month));
  return {
    baseMonth,
    months,
    personal: personal.map((point) => point.changePercent),
    cpi,
  };
}
