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

  it("trims leading and trailing whitespace from the stored name", () => {
    addItem("  Eggs  ");
    expect(getItems()).toEqual(["Eggs"]);
  });

  it("rejects a duplicate item, case-insensitively", () => {
    addItem("Eggs");
    expect(() => addItem("eggs")).toThrow(/already in your cart/);
  });

  it("rejects an empty item name", () => {
    expect(() => addItem("   ")).toThrow(/cannot be empty/);
  });

  it("rejects an item name longer than 60 characters", () => {
    expect(() => addItem("A".repeat(61))).toThrow(/60 characters/);
  });

  it("accepts an item name at exactly the 60-character limit", () => {
    addItem("A".repeat(60));
    expect(getItems()).toEqual(["A".repeat(60)]);
  });

  it("accepts unicode and emoji in an item name", () => {
    addItem("Café ☕ + 牛奶");
    expect(getItems()).toEqual(["Café ☕ + 牛奶"]);
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

  it("rejects a month number outside 01-12", () => {
    expect(() => addEntry({ item: "Milk", month: "2026-13", price: 4.2 })).toThrow(
      /YYYY-MM/,
    );
    expect(() => addEntry({ item: "Milk", month: "2026-00", price: 4.2 })).toThrow(
      /YYYY-MM/,
    );
  });

  it("rejects an entry for an item that isn't tracked", () => {
    expect(() => addEntry({ item: "Eggs", month: "2026-01", price: 4.2 })).toThrow(
      /not in your cart/,
    );
  });

  it("rejects an entry with no item", () => {
    expect(() => addEntry({ item: "", month: "2026-01", price: 4.2 })).toThrow(
      /requires an item/,
    );
  });

  it("rejects a negative price", () => {
    expect(() => addEntry({ item: "Milk", month: "2026-01", price: -1 })).toThrow(
      /non-negative/,
    );
  });

  it("rejects a non-numeric price", () => {
    expect(() => addEntry({ item: "Milk", month: "2026-01", price: "free" })).toThrow(
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

  it("rejects a non-string or blank item name in the payload", () => {
    addItem("Milk");
    expect(() => importData(JSON.stringify({ items: [42], entries: [] }))).toThrow(
      /invalid item name/,
    );
    expect(() => importData(JSON.stringify({ items: ["  "], entries: [] }))).toThrow(
      /invalid item name/,
    );
    expect(getItems()).toEqual(["Milk"]);
  });

  it("rejects a payload with a duplicate item name, case-insensitively", () => {
    addItem("Milk");
    const bad = JSON.stringify({ items: ["Eggs", "eggs"], entries: [] });
    expect(() => importData(bad)).toThrow(/duplicate item/);
    expect(getItems()).toEqual(["Milk"]);
  });

  it("rejects a non-object entry in the payload", () => {
    addItem("Milk");
    const bad = JSON.stringify({ items: ["Eggs"], entries: ["not an entry"] });
    expect(() => importData(bad)).toThrow(/invalid entry/);
    expect(getItems()).toEqual(["Milk"]);
  });

  it("rejects a payload over the 10-item cap", () => {
    addItem("Milk");
    const items = Array.from({ length: 11 }, (_, i) => `Item ${i}`);
    expect(() => importData(JSON.stringify({ items, entries: [] }))).toThrow(/at most 10 items/);
    expect(getItems()).toEqual(["Milk"]);
  });

  it("rejects an item name over 60 characters in the payload", () => {
    addItem("Milk");
    const bad = JSON.stringify({ items: ["A".repeat(61)], entries: [] });
    expect(() => importData(bad)).toThrow(/60 characters/);
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

  it("rejects a month number outside 01-12", () => {
    addItem("Milk");
    const badMonth = JSON.stringify({
      items: ["Eggs"],
      entries: [{ item: "Eggs", month: "2026-13", price: 3 }],
    });
    expect(() => importData(badMonth)).toThrow(/invalid month/);
    expect(getItems()).toEqual(["Milk"]);
  });
});

describe("reading corrupted or hand-edited localStorage", () => {
  const STORAGE_KEY = "cart-creep:v1";

  it("recovers to an empty store when the raw value is not JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(getItems()).toEqual([]);
    expect(getEntries()).toEqual([]);
  });

  it("recovers to an empty store when items/entries aren't arrays", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: "Milk", entries: {} }));
    expect(getItems()).toEqual([]);
    expect(getEntries()).toEqual([]);
  });

  it("drops non-string or blank item names instead of crashing", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items: ["Milk", 42, "   ", null], entries: [] }),
    );
    expect(getItems()).toEqual(["Milk"]);
  });

  it("drops item names over the 60-character limit", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items: ["Milk", "A".repeat(61)], entries: [] }),
    );
    expect(getItems()).toEqual(["Milk"]);
  });

  it("drops entries with a month that isn't a valid YYYY-MM string", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: ["Milk"],
        entries: [
          { item: "Milk", month: "not-a-month", price: 4 },
          { item: "Milk", month: "2026-01", price: 4 },
        ],
      }),
    );
    expect(getEntries()).toEqual([{ item: "Milk", month: "2026-01", price: 4 }]);
  });

  it("drops entries referencing an item that isn't in the item list", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: ["Milk"],
        entries: [{ item: "Eggs", month: "2026-01", price: 3 }],
      }),
    );
    expect(getEntries()).toEqual([]);
  });

  it("drops entries with a non-finite or negative price", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: ["Milk"],
        entries: [
          { item: "Milk", month: "2026-01", price: "free" },
          { item: "Milk", month: "2026-02", price: -1 },
          { item: "Milk", month: "2026-03", price: 4 },
        ],
      }),
    );
    expect(getEntries()).toEqual([{ item: "Milk", month: "2026-03", price: 4 }]);
  });
});
