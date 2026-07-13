import { beforeEach, describe, expect, it } from "vitest";
import { addEntry, addItem, clearAll, getEntries, getItems, removeItem } from "../src/store.js";

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
