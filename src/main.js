import { addEntry, addItem, getEntries, getItems, removeItem } from "./store.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const state = {
  itemFormError: "",
  itemFormDraft: "",
  entryFormError: "",
  entryFormDraft: { item: "", month: currentMonth(), price: "" },
};

function renderItemsPanel(items) {
  const rows = items.length
    ? items
        .map(
          (item) => `
        <li class="item-row">
          <span class="item-name">${escapeHtml(item)}</span>
          <button type="button" class="item-remove" data-remove-item="${escapeHtml(item)}">
            remove
          </button>
        </li>`,
        )
        .join("")
    : `<li class="item-row"><span class="item-name field-hint">No items yet — add your first below.</span></li>`;

  return `
    <section class="rail-block items-block receipt-card" aria-label="Your cart">
      <h2>Your cart <span class="field-hint">(${items.length}/10)</span></h2>
      <ul class="item-list">${rows}</ul>
      <form class="item-form" id="item-form" novalidate>
        <div class="field">
          <label class="field-label" for="item-name-input">Add an item</label>
          <input
            class="field-input"
            id="item-name-input"
            name="name"
            type="text"
            maxlength="60"
            placeholder="e.g. Whole milk, 1 gal"
            autocomplete="off"
            value="${escapeHtml(state.itemFormDraft)}"
          />
          <p class="field-error" role="alert">${escapeHtml(state.itemFormError)}</p>
        </div>
        <button type="submit" class="btn btn-primary" ${items.length >= 10 ? "disabled" : ""}>
          Add item
        </button>
      </form>
    </section>`;
}

function renderEntryPanel(items) {
  const draft = state.entryFormDraft;
  const options = items
    .map(
      (item) =>
        `<option value="${escapeHtml(item)}" ${item === draft.item ? "selected" : ""}>${escapeHtml(item)}</option>`,
    )
    .join("");

  return `
    <section class="rail-block entry-block receipt-card" aria-label="Log a price">
      <h2>Log a price</h2>
      ${
        items.length === 0
          ? `<p class="field-hint">Add an item above before logging a price.</p>`
          : `<form class="entry-form" id="entry-form" novalidate>
        <div class="field">
          <label class="field-label" for="entry-item-select">Item</label>
          <select class="field-select" id="entry-item-select" name="item">${options}</select>
        </div>
        <div class="form-row">
          <div class="field">
            <label class="field-label" for="entry-month-input">Month</label>
            <input
              class="field-input"
              id="entry-month-input"
              name="month"
              type="month"
              value="${escapeHtml(draft.month)}"
            />
          </div>
          <div class="field">
            <label class="field-label" for="entry-price-input">Price paid</label>
            <input
              class="field-input"
              id="entry-price-input"
              name="price"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              placeholder="0.00"
              value="${escapeHtml(draft.price)}"
            />
          </div>
        </div>
        <p class="field-error" role="alert">${escapeHtml(state.entryFormError)}</p>
        <button type="submit" class="btn btn-primary">Log price</button>
      </form>`
      }
    </section>`;
}

function render() {
  const app = document.getElementById("app");
  const items = getItems();
  const entries = getEntries();

  app.innerHTML = `
    <div class="page">
      <header class="masthead">
        <div class="masthead-heading">
          <h1 class="wordmark">Cart<span class="wordmark-accent">Creep</span></h1>
          <p class="tagline">Track your own grocery inflation against the official CPI.</p>
        </div>
      </header>
      <main class="layout">
        <section class="chart-panel receipt-card">
          <h2>Your cart vs. official CPI</h2>
          <p class="field-hint">${items.length} item${items.length === 1 ? "" : "s"} tracked,
             ${entries.length} price${entries.length === 1 ? "" : "s"} logged.</p>
        </section>
        <aside class="rail">
          ${renderItemsPanel(items)}
          ${renderEntryPanel(items)}
        </aside>
      </main>
    </div>
  `;

  bindItemForm();
  bindEntryForm();
}

function bindItemForm() {
  const form = document.getElementById("item-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("item-name-input");
    try {
      addItem(input.value);
      state.itemFormError = "";
      state.itemFormDraft = "";
    } catch (error) {
      state.itemFormError = error.message;
      state.itemFormDraft = input.value;
    }
    render();
  });
}

function bindEntryForm() {
  const form = document.getElementById("entry-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const item = document.getElementById("entry-item-select").value;
    const month = document.getElementById("entry-month-input").value;
    const price = document.getElementById("entry-price-input").value;
    if (price.trim() === "") {
      state.entryFormError = "Price is required";
      state.entryFormDraft = { item, month, price };
      render();
      return;
    }
    try {
      addEntry({ item, month, price });
      state.entryFormError = "";
      state.entryFormDraft = { item, month, price: "" };
    } catch (error) {
      state.entryFormError = error.message;
      state.entryFormDraft = { item, month, price };
    }
    render();
  });
}

document.addEventListener("click", (event) => {
  const removeName = event.target.closest("[data-remove-item]")?.dataset.removeItem;
  if (!removeName) return;
  removeItem(removeName);
  render();
});

render();
