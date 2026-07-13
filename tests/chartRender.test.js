import { afterEach, describe, expect, it, vi } from "vitest";
import { attachChartInteractions, renderChartMarkup } from "../src/chartRender.js";

const noEntries = [];
const oneMonth = [
  { item: "Milk", month: "2026-01", price: 4 },
  { item: "Eggs", month: "2026-01", price: 3 },
];
const twoMonths = [
  { item: "Milk", month: "2026-01", price: 4 },
  { item: "Milk", month: "2026-02", price: 4.4 },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("renderChartMarkup", () => {
  it("shows the empty-ledger prompt with no items", () => {
    const html = renderChartMarkup([], noEntries);
    expect(html).toContain("Your ledger is empty");
    expect(html).not.toContain("<svg");
  });

  it("shows the no-prices prompt with items but no entries", () => {
    const html = renderChartMarkup(["Milk"], noEntries);
    expect(html).toContain("No prices logged yet");
    expect(html).not.toContain("<svg");
  });

  it("shows the one-month prompt before the wow moment", () => {
    const html = renderChartMarkup(["Milk", "Eggs"], oneMonth);
    expect(html).toContain("One month down");
    expect(html).not.toContain("<svg");
  });

  it("renders the comparison chart once two months are logged", () => {
    const html = renderChartMarkup(["Milk"], twoMonths);
    expect(html).toContain("<svg");
    expect(html).toContain('data-line="personal"');
    expect(html).toContain('data-line="cpi"');
    expect(html).toContain("chart-printer-head");
    expect(html).toContain("chart-tooltip");
  });

  it("sizes the svg viewBox to the requested dimensions", () => {
    const html = renderChartMarkup(["Milk"], twoMonths, { width: 500, height: 200 });
    expect(html).toContain('viewBox="0 0 500 200"');
  });

  it("plots one circle per series per month with an accessible label", () => {
    const html = renderChartMarkup(["Milk"], twoMonths);
    const personalPoints = html.match(/class="chart-point is-personal"/g) ?? [];
    expect(personalPoints).toHaveLength(2);
    expect(html).toContain("Your cart");
  });
});

describe("attachChartInteractions", () => {
  function mount(items, entries) {
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById("app");
    root.innerHTML = renderChartMarkup(items, entries);
    return root;
  }

  it("does nothing when there is no chart canvas rendered", () => {
    const root = mount([], noEntries);
    expect(() => attachChartInteractions(root, [], noEntries)).not.toThrow();
  });

  it("does nothing when the canvas holds a prompt state instead of an svg", () => {
    const root = mount(["Milk"], oneMonth);
    expect(() => attachChartInteractions(root, ["Milk"], oneMonth)).not.toThrow();
  });

  it("wires the tooltip to show and hide on point interaction", () => {
    const root = mount(["Milk"], twoMonths);
    attachChartInteractions(root, ["Milk"], twoMonths);

    const tooltip = root.querySelector("#chart-tooltip");
    const point = root.querySelector(".chart-point.is-personal");
    expect(tooltip.hidden).toBe(true);

    point.dispatchEvent(new Event("mouseenter"));
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toContain("Your cart");

    point.dispatchEvent(new Event("mouseleave"));
    expect(tooltip.hidden).toBe(true);
  });

  it("labels a CPI point distinctly from a personal point", () => {
    const root = mount(["Milk"], twoMonths);
    attachChartInteractions(root, ["Milk"], twoMonths);

    const tooltip = root.querySelector("#chart-tooltip");
    const cpiPoint = root.querySelector(".chart-point.is-cpi");
    cpiPoint.dispatchEvent(new Event("focus"));
    expect(tooltip.textContent).toContain("CPI");
  });

  it("re-renders at the canvas's measured pixel size when it has real layout", () => {
    const root = mount(["Milk"], twoMonths);
    const canvas = root.querySelector(".chart-canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ width: 480, height: 240 });

    attachChartInteractions(root, ["Milk"], twoMonths);

    const svg = root.querySelector("svg");
    expect(svg.getAttribute("viewBox")).toBe("0 0 480 240");
  });

  it("respects prefers-reduced-motion by skipping the line-draw animation", () => {
    const root = mount(["Milk"], twoMonths);
    const matchMediaSpy = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal("matchMedia", matchMediaSpy);

    expect(() => attachChartInteractions(root, ["Milk"], twoMonths)).not.toThrow();
    expect(matchMediaSpy).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });
});
