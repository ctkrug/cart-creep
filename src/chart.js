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

/**
 * Converts a comparison series into SVG-ready point coordinates. Pure
 * geometry — no DOM — so it's testable without a browser and reusable for
 * both the chart's line paths and its hover/tap tooltip targets.
 */
export function chartGeometry(series, { width, height, padding = 24 }) {
  const { months, personal, cpi } = series;
  const values = [...personal, ...cpi].filter((value) => value != null);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const domain = minValue === maxValue ? [minValue - 1, maxValue + 1] : [minValue, maxValue];
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const xFor = (index) =>
    months.length <= 1 ? padding + innerWidth / 2 : padding + (index / (months.length - 1)) * innerWidth;
  const yFor = (value) =>
    padding + innerHeight - ((value - domain[0]) / (domain[1] - domain[0])) * innerHeight;

  const toPoints = (series) =>
    series.map((value, index) => ({
      month: months[index],
      value,
      x: xFor(index),
      y: value == null ? null : yFor(value),
    }));

  return {
    domain,
    zeroY: yFor(0),
    personalPoints: toPoints(personal),
    cpiPoints: toPoints(cpi),
  };
}

/** Builds an SVG path "d" attribute from chart points, skipping gaps. */
export function pathFromPoints(points) {
  const plotted = points.filter((point) => point.y != null);
  if (plotted.length === 0) return "";
  return plotted
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
}
