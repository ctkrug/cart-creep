import { getItems, getEntries } from "./store.js";

function render() {
  const app = document.getElementById("app");
  const items = getItems();
  const entries = getEntries();

  app.innerHTML = `
    <header class="app-header">
      <h1>Cart Creep</h1>
      <p class="tagline">Track your own grocery inflation against the official CPI.</p>
    </header>
    <main>
      <p>${items.length} item${items.length === 1 ? "" : "s"} tracked,
         ${entries.length} price${entries.length === 1 ? "" : "s"} logged.</p>
    </main>
  `;
}

render();
