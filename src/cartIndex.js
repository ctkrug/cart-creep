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

/**
 * Ranks tracked items by % price change from their first logged price to
 * their most recent one. Items with fewer than two months logged can't show
 * a trend, so they're reported separately rather than silently dropped.
 */
export function itemCreepBreakdown(entries) {
  const byItem = new Map();
  for (const entry of entries) {
    if (!byItem.has(entry.item)) byItem.set(entry.item, []);
    byItem.get(entry.item).push(entry);
  }

  const ranked = [];
  const excluded = [];
  for (const [item, logs] of byItem) {
    const sorted = [...logs].sort((a, b) => a.month.localeCompare(b.month));
    if (sorted.length < 2) {
      excluded.push({ item, monthsLogged: sorted.length });
      continue;
    }
    const firstPrice = sorted[0].price;
    const lastPrice = sorted[sorted.length - 1].price;
    const changePercent =
      firstPrice === 0 ? 0 : ((lastPrice - firstPrice) / firstPrice) * 100;
    ranked.push({ item, changePercent, firstPrice, lastPrice, monthsLogged: sorted.length });
  }
  ranked.sort((a, b) => b.changePercent - a.changePercent);

  return { ranked, excluded };
}
