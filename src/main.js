import { addItem, getEntries, getItems, removeItem } from "./store.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const state = {
  itemFormError: "",
  itemFormDraft: "",
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
        </aside>
      </main>
    </div>
  `;

  bindItemForm();
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

document.addEventListener("click", (event) => {
  const removeName = event.target.closest("[data-remove-item]")?.dataset.removeItem;
  if (!removeName) return;
  removeItem(removeName);
  render();
});

render();
