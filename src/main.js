import { addEntry, addItem, clearAll, exportData, getEntries, getItems, importData, removeItem } from "./store.js";
import { attachChartInteractions, renderChartMarkup } from "./chartRender.js";
import { itemCreepBreakdown } from "./cartIndex.js";
import { formatCurrency, formatMonth, formatPercent } from "./format.js";

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
  dataError: "",
  pendingImport: null,
  clearConfirmOpen: false,
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
      <p class="field-hint">Log every item each month for an accurate comparison —
         a month with only some items priced will look cheaper than it was.</p>
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

function renderHistoryPanel(items, entries) {
  const rows = items
    .map((item) => {
      const logs = entries
        .filter((entry) => entry.item === item)
        .sort((a, b) => a.month.localeCompare(b.month));
      if (logs.length === 0) {
        return `
          <tr class="is-empty-row">
            <td>${escapeHtml(item)}</td>
            <td colspan="2">Not logged yet</td>
          </tr>`;
      }
      return logs
        .map(
          (log, index) => `
          <tr>
            <td>${index === 0 ? escapeHtml(item) : ""}</td>
            <td>${escapeHtml(formatMonth(log.month))}</td>
            <td class="is-numeric">${escapeHtml(formatCurrency(log.price))}</td>
          </tr>`,
        )
        .join("");
    })
    .join("");

  return `
    <section class="history-block receipt-card" aria-label="Price history">
      <h2>Price history</h2>
      ${
        items.length === 0
          ? `<p class="field-hint">Add an item to start a price history.</p>`
          : `<table class="price-table">
        <caption>Every logged price, by item and month</caption>
        <thead>
          <tr><th>Item</th><th>Month</th><th class="is-numeric">Price</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`
      }
    </section>`;
}

function renderBreakdownPanel(entries) {
  const { ranked, excluded } = itemCreepBreakdown(entries);

  const rankedRows = ranked
    .map(
      (row) => `
      <li class="breakdown-row">
        <span class="item-name">${escapeHtml(row.item)}</span>
        <span class="creep-figure ${row.changePercent >= 0 ? "is-up" : "is-down"}">
          ${escapeHtml(formatPercent(row.changePercent))}
        </span>
      </li>`,
    )
    .join("");

  const excludedNote =
    excluded.length > 0
      ? `<p class="breakdown-excluded">
          Needs a second month to show a trend: ${excluded.map((row) => escapeHtml(row.item)).join(", ")}.
        </p>`
      : "";

  return `
    <section class="breakdown-block receipt-card" aria-label="Per-item creep breakdown">
      <h2>Creep breakdown</h2>
      ${
        ranked.length === 0
          ? `<p class="field-hint">Log a second month for an item to rank it here.</p>`
          : `<ul class="breakdown-list">${rankedRows}</ul>`
      }
      ${excludedNote}
    </section>`;
}

function renderDataPanel() {
  if (state.pendingImport) {
    return `
      <div class="receipt-card confirm-panel" role="alertdialog" aria-label="Confirm import">
        <p><strong>Import "${escapeHtml(state.pendingImport.fileName)}"?</strong>
           This replaces every item and price currently stored.</p>
        <div class="masthead-actions">
          <button type="button" class="btn btn-primary" id="confirm-import-btn">Confirm import</button>
          <button type="button" class="btn btn-ghost" id="cancel-import-btn">Cancel</button>
        </div>
        <p class="field-error" role="alert">${escapeHtml(state.dataError)}</p>
      </div>`;
  }
  if (state.clearConfirmOpen) {
    return `
      <div class="receipt-card confirm-panel" role="alertdialog" aria-label="Confirm clear all data">
        <p><strong>Type CLEAR to erase all items and prices.</strong> This cannot be undone.</p>
        <div class="form-row">
          <div class="field">
            <input class="field-input" id="clear-confirm-input" type="text" autocomplete="off" placeholder="CLEAR" />
          </div>
          <button type="button" class="btn btn-danger" id="confirm-clear-btn" disabled>Erase everything</button>
          <button type="button" class="btn btn-ghost" id="cancel-clear-btn">Cancel</button>
        </div>
      </div>`;
  }
  if (state.dataError) {
    return `<p class="field-error" role="alert">${escapeHtml(state.dataError)}</p>`;
  }
  return "";
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
        <div class="masthead-actions">
          <button type="button" class="btn btn-ghost" id="export-btn">Export</button>
          <label class="btn btn-ghost" for="import-file-input">
            Import
            <input type="file" id="import-file-input" accept="application/json" class="visually-hidden" />
          </label>
          <button type="button" class="btn btn-ghost btn-danger" id="clear-btn">Clear all data</button>
        </div>
      </header>
      ${renderDataPanel()}
      <main class="layout">
        <section class="chart-panel receipt-card">
          <h2>
            Your cart vs. official CPI
            <span class="chart-legend">
              <span><span class="legend-swatch is-personal"></span>Your cart</span>
              <span><span class="legend-swatch is-cpi"></span>CPI food-at-home</span>
            </span>
          </h2>
          ${renderChartMarkup(items, entries)}
        </section>
        <aside class="rail">
          ${renderItemsPanel(items)}
          ${renderEntryPanel(items)}
        </aside>
      </main>
      <section class="detail-row">
        ${renderHistoryPanel(items, entries)}
        ${renderBreakdownPanel(entries)}
      </section>
    </div>
  `;

  bindItemForm();
  bindEntryForm();
  bindDataActions();
  attachChartInteractions(app, items, entries);
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

function downloadJson(filename, contents) {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function bindDataActions() {
  document.getElementById("export-btn")?.addEventListener("click", () => {
    downloadJson("cart-creep-export.json", exportData());
  });

  document.getElementById("import-file-input")?.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.pendingImport = { fileName: file.name, text: String(reader.result) };
      state.dataError = "";
      render();
    };
    reader.readAsText(file);
  });

  document.getElementById("confirm-import-btn")?.addEventListener("click", () => {
    try {
      importData(state.pendingImport.text);
      state.pendingImport = null;
      state.dataError = "";
    } catch (error) {
      state.dataError = error.message;
    }
    render();
  });

  document.getElementById("cancel-import-btn")?.addEventListener("click", () => {
    state.pendingImport = null;
    state.dataError = "";
    render();
  });

  document.getElementById("clear-btn")?.addEventListener("click", () => {
    state.clearConfirmOpen = true;
    state.dataError = "";
    render();
  });

  document.getElementById("cancel-clear-btn")?.addEventListener("click", () => {
    state.clearConfirmOpen = false;
    render();
  });

  const clearInput = document.getElementById("clear-confirm-input");
  const confirmClearBtn = document.getElementById("confirm-clear-btn");
  clearInput?.addEventListener("input", () => {
    confirmClearBtn.disabled = clearInput.value.trim() !== "CLEAR";
  });
  confirmClearBtn?.addEventListener("click", () => {
    clearAll();
    state.clearConfirmOpen = false;
    render();
  });
}

document.addEventListener("click", (event) => {
  const removeName = event.target.closest("[data-remove-item]")?.dataset.removeItem;
  if (!removeName) return;
  removeItem(removeName);
  render();
});

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 150);
});

render();
