const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

export function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

export function formatPercent(value, { signed = true } = {}) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatMonth(month) {
  const [year, monthNum] = month.split("-").map(Number);
  return monthFormatter.format(new Date(year, monthNum - 1, 1));
}
