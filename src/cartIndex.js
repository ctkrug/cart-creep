/**
 * Turns a flat list of { item, month, price } entries into a personal
 * cost-of-cart index: one total per month (sum of that month's logged
 * prices), expressed as cumulative % change from the first month, on the
 * same base-100 convention as cpiChangePercent so the two lines are
 * directly comparable on one chart.
 */
export function cartMonthlyTotals(entries) {
  const totals = new Map();
  for (const { month, price } of entries) {
    totals.set(month, (totals.get(month) ?? 0) + price);
  }
  return [...totals.entries()]
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function cartIndexSeries(entries) {
  const totals = cartMonthlyTotals(entries);
  if (totals.length === 0) return [];
  const base = totals[0].total;
  return totals.map(({ month, total }) => ({
    month,
    changePercent: base === 0 ? 0 : ((total - base) / base) * 100,
  }));
}
