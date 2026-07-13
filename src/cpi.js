/**
 * BLS CPI-U "Food at home" index (series CUUR0000SAF11, not seasonally
 * adjusted), U.S. city average. Source: FRED / U.S. Bureau of Labor
 * Statistics, https://fred.stlouisfed.org/series/CUUR0000SAF11
 *
 * 2025-10 was interpolated from the surrounding months (BLS had not yet
 * published that observation as of this snapshot).
 */
export const CPI_FOOD_AT_HOME = [
  { month: "2022-01", index: 270.711 },
  { month: "2022-02", index: 274.568 },
  { month: "2022-03", index: 278.612 },
  { month: "2022-04", index: 282.161 },
  { month: "2022-05", index: 285.953 },
  { month: "2022-06", index: 288.884 },
  { month: "2022-07", index: 292.972 },
  { month: "2022-08", index: 295.007 },
  { month: "2022-09", index: 296.771 },
  { month: "2022-10", index: 298.401 },
  { month: "2022-11", index: 298.284 },
  { month: "2022-12", index: 299.089 },
  { month: "2023-01", index: 301.435 },
  { month: "2023-02", index: 302.483 },
  { month: "2023-03", index: 301.918 },
  { month: "2023-04", index: 302.328 },
  { month: "2023-05", index: 302.535 },
  { month: "2023-06", index: 302.335 },
  { month: "2023-07", index: 303.455 },
  { month: "2023-08", index: 303.716 },
  { month: "2023-09", index: 303.925 },
  { month: "2023-10", index: 304.788 },
  { month: "2023-11", index: 303.224 },
  { month: "2023-12", index: 303.005 },
  { month: "2024-01", index: 305.037 },
  { month: "2024-02", index: 305.469 },
  { month: "2024-03", index: 305.426 },
  { month: "2024-04", index: 305.707 },
  { month: "2024-05", index: 305.679 },
  { month: "2024-06", index: 305.752 },
  { month: "2024-07", index: 306.643 },
  { month: "2024-08", index: 306.402 },
  { month: "2024-09", index: 307.767 },
  { month: "2024-10", index: 308.2 },
  { month: "2024-11", index: 307.972 },
  { month: "2024-12", index: 308.38 },
  { month: "2025-01", index: 310.936 },
  { month: "2025-02", index: 311.284 },
  { month: "2025-03", index: 312.815 },
  { month: "2025-04", index: 311.84 },
  { month: "2025-05", index: 312.491 },
  { month: "2025-06", index: 313.028 },
  { month: "2025-07", index: 313.263 },
  { month: "2025-08", index: 314.608 },
  { month: "2025-09", index: 316.042 },
  { month: "2025-10", index: 314.998 },
  { month: "2025-11", index: 313.954 },
  { month: "2025-12", index: 315.664 },
  { month: "2026-01", index: 317.431 },
  { month: "2026-02", index: 318.898 },
  { month: "2026-03", index: 318.755 },
  { month: "2026-04", index: 320.859 },
  { month: "2026-05", index: 321.047 },
];

export function cpiIndexForMonth(month) {
  const point = CPI_FOOD_AT_HOME.find((entry) => entry.month === month);
  return point ? point.index : null;
}

/**
 * Cumulative % change in the official CPI food-at-home index between two
 * months, using the same base-100 convention as the personal cart index so
 * both lines can share an axis.
 */
export function cpiChangePercent(baseMonth, targetMonth) {
  const base = cpiIndexForMonth(baseMonth);
  const target = cpiIndexForMonth(targetMonth);
  if (base == null || target == null) return null;
  return ((target - base) / base) * 100;
}
