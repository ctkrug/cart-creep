import { buildComparisonSeries, chartGeometry, hasWowMoment, pathFromPoints } from "./chart.js";
import { formatMonth, formatPercent } from "./format.js";

export const CHART_WIDTH = 640;
export const CHART_HEIGHT = 340;
export const CHART_PADDING = 28;

function pointMarkup(point, series) {
  if (point.y == null) return "";
  return `<circle
    class="chart-point is-${series}"
    data-series="${series}"
    data-month="${point.month}"
    data-value="${point.value}"
    cx="${point.x.toFixed(2)}"
    cy="${point.y.toFixed(2)}"
    r="4"
    tabindex="0"
    aria-label="${series === "personal" ? "Your cart" : "CPI"}, ${formatMonth(point.month)}, ${formatPercent(point.value)}"
  ></circle>`;
}

/**
 * Renders the wow-moment comparison chart as an SVG string, or a designed
 * prompt/empty state when there isn't enough data yet. Kept separate from
 * chart.js's pure geometry so the animation-triggering DOM code
 * (see attachChartInteractions) has somewhere to live without polluting the
 * unit-testable math.
 */
export function renderChartMarkup(items, entries) {
  if (items.length === 0) {
    return `
      <div class="chart-canvas state-block">
        <p class="state-title">Your ledger is empty</p>
        <p>Add your first grocery item in the cart on the right to get started.</p>
      </div>`;
  }
  if (entries.length === 0) {
    return `
      <div class="chart-canvas state-block">
        <p class="state-title">No prices logged yet</p>
        <p>Log a price below to start your ledger.</p>
      </div>`;
  }
  if (!hasWowMoment(entries)) {
    return `
      <div class="chart-canvas state-block">
        <p class="state-title">One month down</p>
        <p>Log one more month to see your line against the CPI.</p>
      </div>`;
  }

  const series = buildComparisonSeries(entries);
  const geometry = chartGeometry(series, { width: CHART_WIDTH, height: CHART_HEIGHT, padding: CHART_PADDING });
  const personalPath = pathFromPoints(geometry.personalPoints);
  const cpiPath = pathFromPoints(geometry.cpiPoints);
  const lastPersonal = geometry.personalPoints[geometry.personalPoints.length - 1];

  return `
    <div class="chart-canvas">
      <svg
        viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}"
        role="img"
        aria-label="Chart comparing your cart's cumulative price change to the official CPI food-at-home index"
      >
        <line
          class="chart-axis-zero"
          x1="${CHART_PADDING}"
          y1="${geometry.zeroY.toFixed(2)}"
          x2="${CHART_WIDTH - CHART_PADDING}"
          y2="${geometry.zeroY.toFixed(2)}"
        />
        <path class="chart-line is-cpi" data-line="cpi" d="${cpiPath}"></path>
        <path class="chart-line is-personal" data-line="personal" d="${personalPath}"></path>
        ${geometry.cpiPoints.map((point) => pointMarkup(point, "cpi")).join("")}
        ${geometry.personalPoints.map((point) => pointMarkup(point, "personal")).join("")}
        <circle
          class="chart-printer-head"
          cx="${lastPersonal.x.toFixed(2)}"
          cy="${lastPersonal.y.toFixed(2)}"
          r="3"
        ></circle>
      </svg>
      <p class="chart-tooltip" id="chart-tooltip" hidden></p>
    </div>`;
}

function animateLineDraw(svg) {
  const paths = [...svg.querySelectorAll(".chart-line")];
  const printerHead = svg.querySelector(".chart-printer-head");
  const firstPersonal = svg.querySelector(".chart-point.is-personal");

  const lengths = paths.map((path) => {
    if (typeof path.getTotalLength !== "function") return null;
    try {
      return path.getTotalLength();
    } catch {
      return null;
    }
  });
  paths.forEach((path, index) => {
    const length = lengths[index];
    if (length == null) return;
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
  });

  let restoreHeadCx = null;
  let restoreHeadCy = null;
  if (printerHead && firstPersonal) {
    restoreHeadCx = printerHead.getAttribute("cx");
    restoreHeadCy = printerHead.getAttribute("cy");
    printerHead.setAttribute("cx", firstPersonal.getAttribute("cx"));
    printerHead.setAttribute("cy", firstPersonal.getAttribute("cy"));
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      paths.forEach((path) => {
        path.style.strokeDashoffset = "0";
      });
      if (printerHead && restoreHeadCx != null) {
        printerHead.setAttribute("cx", restoreHeadCx);
        printerHead.setAttribute("cy", restoreHeadCy);
      }
    });
  });
}

function attachTooltip(root, svg) {
  const canvas = root.querySelector(".chart-canvas");
  const tooltip = root.querySelector("#chart-tooltip");
  if (!canvas || !tooltip) return;

  const show = (point) => {
    const series = point.dataset.series === "personal" ? "Your cart" : "CPI";
    tooltip.textContent = `${series} · ${formatMonth(point.dataset.month)} · ${formatPercent(Number(point.dataset.value))}`;
    const canvasRect = canvas.getBoundingClientRect();
    const pointRect = point.getBoundingClientRect();
    tooltip.style.left = `${pointRect.left - canvasRect.left + pointRect.width / 2}px`;
    tooltip.style.top = `${pointRect.top - canvasRect.top}px`;
    tooltip.hidden = false;
  };
  const hide = () => {
    tooltip.hidden = true;
  };

  svg.querySelectorAll(".chart-point").forEach((point) => {
    point.addEventListener("mouseenter", () => show(point));
    point.addEventListener("focus", () => show(point));
    point.addEventListener("click", () => show(point));
    point.addEventListener("mouseleave", hide);
    point.addEventListener("blur", hide);
  });
}

/** Wires the "prints in" line-draw animation and the point tooltip. DOM-only — not covered by the pure geometry unit tests. */
export function attachChartInteractions(root) {
  const svg = root.querySelector(".chart-canvas svg");
  if (!svg) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) animateLineDraw(svg);

  attachTooltip(root, svg);
}
