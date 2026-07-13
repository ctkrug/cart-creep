const STORAGE_KEY = "cart-creep:v1";

function readAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: [], entries: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
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
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Month must be in YYYY-MM format");
  }
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    throw new Error("Price must be a non-negative number");
  }

  const data = readAll();
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
