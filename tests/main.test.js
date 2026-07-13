import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportData } from "../src/store.js";

// Importing main.js runs its one-time side effects (the initial render and
// the document/window listener registrations) exactly once for this whole
// file. Re-importing per test via vi.resetModules() would register a fresh
// set of listeners on every test without ever removing the old ones, since
// main.js has no dispose hook — window/document persist across tests in one
// file, so those listeners pile up and all fire on the next dispatched
// event, racing each other's renders against the current test's assertions.
// #app has to exist before that first import-time render() runs, so this
// uses a dynamic import after setting up the DOM rather than a static one.
document.body.innerHTML = '<div id="app"></div>';
const { render } = await import("../src/main.js");

function loadApp() {
  document.body.innerHTML = '<div id="app"></div>';
  render();
}

async function waitFor(check, timeout = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("waitFor: condition never became true");
}

function submit(formId) {
  const form = document.getElementById(formId);
  form.dispatchEvent(new Event("submit", { cancelable: true }));
}

function app() {
  return document.getElementById("app");
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("empty state", () => {
  it("renders the empty-ledger prompt and a 0/10 cart count", async () => {
    await loadApp();
    expect(app().textContent).toContain("Your ledger is empty");
    expect(app().textContent).toContain("(0/10)");
  });
});

describe("adding and removing items", () => {
  it("adds an item through the form and clears the input", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Whole milk";
    submit("item-form");

    expect(app().textContent).toContain("Whole milk");
    expect(app().textContent).toContain("(1/10)");
    expect(document.getElementById("item-name-input").value).toBe("");
  });

  it("shows an error and preserves the draft on an empty item name", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "   ";
    submit("item-form");

    expect(app().textContent).toContain("cannot be empty");
  });

  it("rejects a case-insensitive duplicate item with the store's own message", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Eggs";
    submit("item-form");
    document.getElementById("item-name-input").value = "eggs";
    submit("item-form");

    expect(app().textContent).toContain("already in your cart");
    expect(app().textContent).toContain("(1/10)");
  });

  it("still enforces the 10-item cap even if a disabled submit button is bypassed", async () => {
    await loadApp();
    for (let i = 0; i < 10; i++) {
      document.getElementById("item-name-input").value = `Item ${i}`;
      submit("item-form");
    }
    expect(app().textContent).toContain("(10/10)");
    expect(document.querySelector("#item-form button[type=submit]").disabled).toBe(true);

    document.getElementById("item-name-input").value = "One too many";
    submit("item-form");

    expect(app().textContent).toContain("at most 10 items");
    expect(app().textContent).toContain("(10/10)");
  });

  it("removes an item and its price history together", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");
    document.getElementById("entry-month-input").value = "2026-01";
    document.getElementById("entry-price-input").value = "4.20";
    submit("entry-form");

    expect(app().textContent).toContain("4.20");

    document.querySelector("[data-remove-item]").click();

    expect(app().textContent).not.toContain("Milk");
    expect(app().textContent).toContain("(0/10)");
    expect(app().textContent).toContain("Your ledger is empty");
  });

  it("neutralizes an item name that looks like markup instead of rendering it", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = '<img src=x onerror="window.__pwned=true">';
    submit("item-form");

    expect(window.__pwned).toBeUndefined();
    expect(document.querySelectorAll("img")).toHaveLength(0);
    expect(app().textContent).toContain("<img src=x onerror=");
  });

  it("removes an item whose name contains quotes, round-tripping through the data attribute", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = 'Milk "Whole" & Cream';
    submit("item-form");

    expect(app().textContent).toContain('Milk "Whole" & Cream');

    document.querySelector("[data-remove-item]").click();

    expect(app().textContent).not.toContain("Whole");
    expect(app().textContent).toContain("(0/10)");
  });

  it("does not add the same item twice from a rapid double submit", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");

    expect(app().textContent).toContain("(1/10)");
    expect(app().textContent).toContain("already in your cart");
  });

  it("keeps the entry form usable after removing the item it had selected", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");
    document.getElementById("item-name-input").value = "Eggs";
    submit("item-form");

    document.getElementById("entry-item-select").value = "Milk";
    document.querySelector('[data-remove-item="Milk"]').click();

    document.getElementById("entry-month-input").value = "2026-01";
    document.getElementById("entry-price-input").value = "3.50";
    submit("entry-form");

    expect(app().textContent).toContain("$3.50");
    expect(document.getElementById("entry-item-select").value).toBe("Eggs");
  });
});

describe("logging a price", () => {
  async function withOneItem() {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");
  }

  it("logs a valid price into the history table", async () => {
    await withOneItem();
    document.getElementById("entry-month-input").value = "2026-01";
    document.getElementById("entry-price-input").value = "4.20";
    submit("entry-form");

    expect(app().textContent).toContain("$4.20");
    expect(document.getElementById("entry-price-input").value).toBe("");
  });

  it("requires a price before calling the store", async () => {
    await withOneItem();
    document.getElementById("entry-month-input").value = "2026-01";
    document.getElementById("entry-price-input").value = "";
    submit("entry-form");

    expect(app().textContent).toContain("Price is required");
  });

  it("surfaces the store's validation error for a month bypassing the native month input", async () => {
    await withOneItem();
    const monthInput = document.getElementById("entry-month-input");
    monthInput.value = "not-a-month";
    document.getElementById("entry-price-input").value = "4.20";
    submit("entry-form");

    expect(app().textContent).toContain("YYYY-MM");
  });

  it("treats a non-numeric price as empty, same as the native number input would", async () => {
    await withOneItem();
    document.getElementById("entry-month-input").value = "2026-01";
    // A real <input type="number"> sanitizes a non-numeric assignment to
    // "" itself (which jsdom faithfully replicates), so this exercises the
    // same "Price is required" path an empty field would.
    document.getElementById("entry-price-input").value = "free";
    submit("entry-form");

    expect(app().textContent).toContain("Price is required");
  });

  it("overwrites the price when the same item and month are logged again", async () => {
    await withOneItem();
    document.getElementById("entry-month-input").value = "2026-01";
    document.getElementById("entry-price-input").value = "4.20";
    submit("entry-form");

    document.getElementById("entry-month-input").value = "2026-01";
    document.getElementById("entry-price-input").value = "4.75";
    submit("entry-form");

    const priceCells = [...document.querySelectorAll(".price-table tbody .is-numeric")];
    expect(priceCells).toHaveLength(1);
    expect(priceCells[0].textContent).toContain("4.75");
  });

  it("hides the entry form entirely when there are no items yet", async () => {
    await loadApp();
    expect(document.getElementById("entry-form")).toBeNull();
    expect(app().textContent).toContain("Add an item above before logging a price");
  });
});

describe("resizing the window", () => {
  it("re-measures and redraws the chart at its new container size", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");
    document.getElementById("entry-month-input").value = "2026-01";
    document.getElementById("entry-price-input").value = "4";
    submit("entry-form");
    document.getElementById("entry-month-input").value = "2026-02";
    document.getElementById("entry-price-input").value = "4.4";
    submit("entry-form");

    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      width: 900,
      height: 500,
    });

    window.dispatchEvent(new Event("resize"));

    await waitFor(() => document.querySelector("svg")?.getAttribute("viewBox") === "0 0 900 500");
  });
});

describe("export / import", () => {
  it("exports the current store as a downloaded JSON blob", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");

    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    document.getElementById("export-btn").click();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0];
    expect(await blob.text()).toBe(exportData());
  });

  it("does nothing when the user opens the file picker and cancels", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");

    const input = document.getElementById("import-file-input");
    Object.defineProperty(input, "files", { value: [], configurable: true });
    expect(() => input.dispatchEvent(new Event("change"))).not.toThrow();

    expect(app().textContent).toContain("Milk");
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("shows a confirm panel before an import, then applies it on confirm", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Old item";
    submit("item-form");

    const payload = JSON.stringify({ items: ["Eggs"], entries: [] });
    const file = new File([payload], "backup.json", { type: "application/json" });
    const input = document.getElementById("import-file-input");
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change"));

    await waitFor(() => app().textContent.includes('Import "backup.json"?'));
    expect(app().textContent).toContain("Old item");

    document.getElementById("confirm-import-btn").click();

    expect(app().textContent).toContain("Eggs");
    expect(app().textContent).not.toContain("Old item");
  });

  it("keeps existing data and shows an error when the imported file is invalid", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");

    const file = new File(["not json"], "bad.json", { type: "application/json" });
    const input = document.getElementById("import-file-input");
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change"));

    await waitFor(() => app().textContent.includes("Import \"bad.json\"?"));
    document.getElementById("confirm-import-btn").click();

    expect(app().textContent).toContain("not valid JSON");
    expect(app().textContent).toContain("Milk");
  });

  it("cancels a pending import without changing any data", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");

    const payload = JSON.stringify({ items: ["Eggs"], entries: [] });
    const file = new File([payload], "backup.json", { type: "application/json" });
    const input = document.getElementById("import-file-input");
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change"));

    await waitFor(() => app().textContent.includes('Import "backup.json"?'));
    document.getElementById("cancel-import-btn").click();

    expect(app().textContent).toContain("Milk");
    expect(app().textContent).not.toContain("Eggs");
  });
});

describe("clear all data", () => {
  it("only enables the erase button once the user types CLEAR exactly", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");

    document.getElementById("clear-btn").click();
    const confirmBtn = document.getElementById("confirm-clear-btn");
    expect(confirmBtn.disabled).toBe(true);

    const input = document.getElementById("clear-confirm-input");
    input.value = "clear";
    input.dispatchEvent(new Event("input"));
    expect(confirmBtn.disabled).toBe(true);

    input.value = "CLEAR";
    input.dispatchEvent(new Event("input"));
    expect(confirmBtn.disabled).toBe(false);

    confirmBtn.click();

    expect(app().textContent).toContain("Your ledger is empty");
    expect(app().textContent).not.toContain("Milk");
  });

  it("cancels without erasing anything", async () => {
    await loadApp();
    document.getElementById("item-name-input").value = "Milk";
    submit("item-form");

    document.getElementById("clear-btn").click();
    document.getElementById("cancel-clear-btn").click();

    expect(app().textContent).toContain("Milk");
  });
});

describe("recovering from corrupted localStorage", () => {
  it("renders the empty state instead of crashing on unparsable JSON", () => {
    localStorage.setItem("cart-creep:v1", "{not json");
    expect(() => loadApp()).not.toThrow();
    expect(app().textContent).toContain("Your ledger is empty");
  });

  it("renders cleanly when a stored entry has a garbage month", () => {
    localStorage.setItem(
      "cart-creep:v1",
      JSON.stringify({
        items: ["Milk"],
        entries: [{ item: "Milk", month: "garbage", price: 4 }],
      }),
    );
    expect(() => loadApp()).not.toThrow();
    expect(app().textContent).toContain("Milk");
    expect(app().textContent).toContain("Not logged yet");
  });
});
