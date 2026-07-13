import { beforeEach, describe, expect, it } from "vitest";
import {
  addEntry,
  addItem,
  clearAll,
  exportData,
  getEntries,
  getItems,
  importData,
  removeItem,
} from "../src/store.js";

beforeEach(() => {
  clearAll();
});

describe("items", () => {
  it("adds an item", () => {
    addItem("Eggs");
    expect(getItems()).toEqual(["Eggs"]);
  });

  it("rejects a duplicate item, case-insensitively", () => {
    addItem("Eggs");
    expect(() => addItem("eggs")).toThrow(/already in your cart/);
  });

  it("rejects an empty item name", () => {
    expect(() => addItem("   ")).toThrow(/cannot be empty/);
  });

  it("caps the cart at 10 items", () => {
    for (let i = 0; i < 10; i++) addItem(`Item ${i}`);
    expect(() => addItem("Item 10")).toThrow(/at most 10 items/);
  });

  it("removes an item and its entries", () => {
    addItem("Eggs");
    addEntry({ item: "Eggs", month: "2026-01", price: 3.5 });
    removeItem("Eggs");
    expect(getItems()).toEqual([]);
    expect(getEntries()).toEqual([]);
  });
});

describe("entries", () => {
  it("logs a price for a month", () => {
    addItem("Milk");
    addEntry({ item: "Milk", month: "2026-01", price: 4.2 });
    expect(getEntries()).toEqual([{ item: "Milk", month: "2026-01", price: 4.2 }]);
  });

  it("overwrites an entry for the same item and month instead of duplicating", () => {
    addItem("Milk");
    addEntry({ item: "Milk", month: "2026-01", price: 4.2 });
    addEntry({ item: "Milk", month: "2026-01", price: 4.5 });
    expect(getEntries()).toHaveLength(1);
    expect(getEntries()[0].price).toBe(4.5);
  });

  it("rejects a malformed month", () => {
    expect(() => addEntry({ item: "Milk", month: "Jan 2026", price: 4.2 })).toThrow(
      /YYYY-MM/,
    );
  });

  it("rejects a negative price", () => {
    expect(() => addEntry({ item: "Milk", month: "2026-01", price: -1 })).toThrow(
      /non-negative/,
    );
  });
});

describe("exportData / importData", () => {
  it("round-trips items and entries through export then import", () => {
    addItem("Milk");
    addEntry({ item: "Milk", month: "2026-01", price: 4.2 });
    const json = exportData();

    clearAll();
    expect(getItems()).toEqual([]);

    importData(json);
    expect(getItems()).toEqual(["Milk"]);
    expect(getEntries()).toEqual([{ item: "Milk", month: "2026-01", price: 4.2 }]);
  });

  it("rejects non-JSON input and leaves existing data untouched", () => {
    addItem("Milk");
    expect(() => importData("not json")).toThrow(/not valid JSON/);
    expect(getItems()).toEqual(["Milk"]);
  });

  it("rejects a payload missing items/entries arrays", () => {
    addItem("Milk");
    expect(() => importData(JSON.stringify({ items: [] }))).toThrow(/items.*entries/);
    expect(getItems()).toEqual(["Milk"]);
  });

  it("rejects an entry referencing an item not in the payload's own item list", () => {
    addItem("Milk");
    const bad = JSON.stringify({ items: ["Eggs"], entries: [{ item: "Milk", month: "2026-01", price: 3 }] });
    expect(() => importData(bad)).toThrow(/not in its own item list/);
    expect(getItems()).toEqual(["Milk"]);
  });

  it("rejects a payload over the 10-item cap", () => {
    addItem("Milk");
    const items = Array.from({ length: 11 }, (_, i) => `Item ${i}`);
    expect(() => importData(JSON.stringify({ items, entries: [] }))).toThrow(/at most 10 items/);
    expect(getItems()).toEqual(["Milk"]);
  });

  it("rejects an invalid month or negative price in an entry", () => {
    addItem("Milk");
    const badMonth = JSON.stringify({
      items: ["Eggs"],
      entries: [{ item: "Eggs", month: "Jan", price: 3 }],
    });
    expect(() => importData(badMonth)).toThrow(/invalid month/);

    const badPrice = JSON.stringify({
      items: ["Eggs"],
      entries: [{ item: "Eggs", month: "2026-01", price: -3 }],
    });
    expect(() => importData(badPrice)).toThrow(/invalid price/);
    expect(getItems()).toEqual(["Milk"]);
  });
});
