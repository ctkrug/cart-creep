const STORAGE_KEY = "cart-creep:v1";
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_ITEM_NAME_LENGTH = 60;

/**
 * Reads survive a hand-edited or foreign-written localStorage value: any
 * record that doesn't match the shape the rest of the app relies on is
 * dropped here rather than crashing something downstream (e.g. formatMonth
 * on a garbage month string).
 */
function readAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: [], entries: [] };
  try {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter(
          (item) => typeof item === "string" && item.trim() && item.length <= MAX_ITEM_NAME_LENGTH,
        )
      : [];
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.filter(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            typeof entry.item === "string" &&
            items.includes(entry.item) &&
            typeof entry.month === "string" &&
            MONTH_RE.test(entry.month) &&
            Number.isFinite(entry.price) &&
            entry.price >= 0,
        )
      : [];
    return { items, entries };
  } catch {
    return { items: [], entries: [] };
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getItems() {
  return readAll().items;
}

export function addItem(name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Item name cannot be empty");
  if (trimmed.length > MAX_ITEM_NAME_LENGTH) {
    throw new Error(`Item name must be ${MAX_ITEM_NAME_LENGTH} characters or fewer`);
  }
  const data = readAll();
  if (data.items.length >= 10) {
    throw new Error("Cart Creep tracks at most 10 items");
  }
  if (data.items.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`"${trimmed}" is already in your cart`);
  }
  data.items.push(trimmed);
  writeAll(data);
  return data.items;
}

export function removeItem(name) {
  const data = readAll();
  data.items = data.items.filter((item) => item !== name);
  data.entries = data.entries.filter((entry) => entry.item !== name);
  writeAll(data);
  return data.items;
}

export function getEntries() {
  return readAll().entries;
}

export function addEntry({ item, month, price }) {
  if (!item) throw new Error("Entry requires an item");
  if (!MONTH_RE.test(month)) {
    throw new Error("Month must be in YYYY-MM format");
  }
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    throw new Error("Price must be a non-negative number");
  }

  const data = readAll();
  if (!data.items.includes(item)) {
    throw new Error(`"${item}" is not in your cart`);
  }
  const existingIndex = data.entries.findIndex(
    (entry) => entry.item === item && entry.month === month,
  );
  const entry = { item, month, price: numericPrice };
  if (existingIndex >= 0) {
    data.entries[existingIndex] = entry;
  } else {
    data.entries.push(entry);
  }
  writeAll(data);
  return data.entries;
}

export function clearAll() {
  writeAll({ items: [], entries: [] });
}

/** Serializes all items and entries as a pretty-printed JSON string. */
export function exportData() {
  return JSON.stringify(readAll(), null, 2);
}

/**
 * Validates a previously exported JSON string end-to-end before writing
 * anything, so a malformed or foreign file can never leave a partial write
 * behind.
 */
export function importData(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Import file is not valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items) || !Array.isArray(parsed.entries)) {
    throw new Error("Import file must contain \"items\" and \"entries\" arrays");
  }

  const items = [];
  for (const item of parsed.items) {
    if (typeof item !== "string" || !item.trim()) {
      throw new Error("Import file contains an invalid item name");
    }
    const trimmed = item.trim();
    if (trimmed.length > MAX_ITEM_NAME_LENGTH) {
      throw new Error(`Import file has an item name over ${MAX_ITEM_NAME_LENGTH} characters`);
    }
    if (items.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Import file has a duplicate item "${trimmed}"`);
    }
    items.push(trimmed);
  }
  if (items.length > 10) {
    throw new Error("Cart Creep tracks at most 10 items");
  }

  const entries = [];
  for (const entry of parsed.entries) {
    if (!entry || typeof entry !== "object") {
      throw new Error("Import file contains an invalid entry");
    }
    const { item, month, price } = entry;
    if (typeof item !== "string" || !items.includes(item)) {
      throw new Error(`Import file references an item not in its own item list: "${item}"`);
    }
    if (typeof month !== "string" || !MONTH_RE.test(month)) {
      throw new Error(`Import file has an invalid month "${month}"`);
    }
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      throw new Error(`Import file has an invalid price for "${item}"`);
    }
    entries.push({ item, month, price });
  }

  writeAll({ items, entries });
  return { items, entries };
}
