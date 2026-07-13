# Architecture

A static, client-only app: Vite serves/builds it, everything else is vanilla
JS modules over `localStorage`. No framework, no backend, no build-time
data fetching.

## Data flow

```
localStorage ("cart-creep:v1")
      │  read/write, validated
      ▼
  src/store.js        items: string[], entries: {item,month,price}[]
      │
      ├─► src/cartIndex.js   pure math: monthly totals, % change series,
      │                      per-item creep ranking
      ├─► src/cpi.js         pure lookup: baked-in BLS CPI-U food-at-home
      │                      series, cumulative % change between two months
      └─► src/chart.js       pure: combines the two into one comparison
                              series (same base month, same % axis) and
                              turns it into SVG coordinates
                                    │
                                    ▼
                          src/chartRender.js  (DOM: builds/animates the SVG,
                                                tooltip, prompt states)
                                    │
                                    ▼
                              src/main.js  (owns UI state, renders the whole
                                            page on every change, wires
                                            every form/button)
```

`src/format.js` holds display formatting only (currency, %, month labels) —
no logic that affects stored data.

## Modules

- **`src/store.js`** — the only code that touches `localStorage`. All reads
  go through `readAll()`; all writes through `writeAll()`, so the on-disk
  shape (`{ items, entries }`) is defined in exactly one place. Validates at
  the boundary: `addItem`/`addEntry`/`importData` throw on bad input rather
  than writing it. `exportData`/`importData` are the JSON backup path.
  `readAll()` also sanitizes on the way back out — a hand-edited or
  foreign-written localStorage value can have the right shape (`items`/
  `entries` arrays) but garbage inside it, so any item/entry that doesn't
  match the same rules `addItem`/`addEntry` enforce (non-empty string item,
  `YYYY-MM` month in 01–12, finite non-negative price, entry references a
  tracked item) is dropped rather than reaching the render pipeline.
- **`src/cpi.js`** — the reference dataset (BLS CPI-U food-at-home,
  `CUUR0000SAF11`, hardcoded so the app works offline) plus
  `cpiChangePercent(base, target)`, cumulative % change between two months.
- **`src/cartIndex.js`** — turns raw `{item, month, price}` entries into:
  `cartMonthlyTotals` (sum of that month's logged prices — *only* items
  logged that month, no carry-forward, see gotcha below), `cartIndexSeries`
  (those totals as cumulative % change from the first month), and
  `itemCreepBreakdown` (per-item first→latest % change, ranked).
- **`src/chart.js`** — pure geometry, no DOM: `buildComparisonSeries`
  anchors personal + CPI to the same base month; `chartGeometry` maps a
  series onto SVG coordinates for a given width/height; `pathFromPoints`
  builds the path `d` string. Kept DOM-free so it's unit-tested directly.
- **`src/chartRender.js`** — the DOM layer over `chart.js`: builds the SVG
  markup (or a designed empty/prompt state), and `attachChartInteractions`
  wires the "prints in" line-draw animation and the point tooltip. Also
  re-renders the chart at the canvas's *measured* pixel size right after
  mount, so the SVG always fills its container without letterboxing or
  distorting the circle markers (a fixed viewBox can't match every
  breakpoint's aspect ratio).
- **`src/main.js`** — single render loop. Holds transient UI state (form
  drafts/errors, pending import, clear-confirm open) in one `state` object;
  every action calls `render()`, which rebuilds `#app`'s innerHTML from
  `store.js` + `state` and re-binds listeners. No virtual DOM — acceptable
  at this scale, and it means "what's on screen" is always a pure function
  of `store` + `state`.

## Known behavior worth knowing before changing the math

`cartMonthlyTotals` sums **only the prices logged for that specific month**
— it does not carry forward an item's last known price into a month where
it wasn't logged. Skipping an item for a month understates that month's
total, which can make a real price increase look like a decrease on the
chart. This is intentional (tested, and referenced by the wow-moment
acceptance criteria in `docs/BACKLOG.md`), not a bug — but it's the reason
the entry form hints "log every item each month."

## Tests

`tests/` mirrors `src/` one-to-one. `cartIndex`, `chart`, `cpi`, `store`,
and `format` are pure-logic unit tests. `chartRender.test.js` and
`main.test.js` drive real jsdom DOM: `main.test.js` gets a fresh module
instance per test via `vi.resetModules()` + a dynamic `import()` (main.js
renders itself and binds a document-level listener as an import side
effect, so each test needs a clean instance against a clean `localStorage`
and `#app`).

## Run it

```sh
npm install
npm run dev            # local dev server
npm test                # vitest, jsdom environment
npm run test:coverage   # vitest with v8 coverage — coverage.all: true means
                         # an untested file shows as 0% instead of being
                         # silently omitted from the report
npm run lint            # eslint flat config
npm run build           # static build to dist/ — base-path-relative,
                         # deployable to a subpath (apps.charliekrug.com/cart-creep/)
```
