# Backlog

Epics and stories for v1. Every story lists concrete, verifiable acceptance
criteria — no vibes. The first story of Epic 1 is the wow moment and must
land before anything else.

## Epic 1 — Core tracking & the comparison chart

- [ ] **Personal-vs-CPI chart renders after two months of entries (wow moment)**
  - After entries exist for at least two distinct months, a chart renders
    two lines — the personal cart index and the CPI food-at-home index —
    sharing one axis and scale.
  - Before two distinct months of entries exist, the chart area shows a
    designed prompt state ("log one more month to see your line"), never a
    blank or broken chart.
  - The personal line's values match `cartIndexSeries()`'s output for the
    logged entries; the CPI line's values match `cpiChangePercent()`
    anchored to the same base month as the user's first entry (verifiable
    by unit test).

- [ ] **Add up to 10 tracked items**
  - Submitting the add-item form with a new name adds it to the list.
  - A duplicate name (case-insensitive) is rejected with an inline error,
    not a browser `alert()` or a crash.
  - Attempting an 11th item shows the inline error "Cart Creep tracks at
    most 10 items" and does not add it.

- [ ] **Log a monthly price per item**
  - The entry form requires an item, a month, and a non-negative price;
    an invalid month format or a negative price shows an inline validation
    error and does not submit.
  - Re-submitting the same item + month updates the existing entry instead
    of creating a duplicate.

- [ ] **Design polish — entry flow**
  - The item list and entry form are styled per `docs/DESIGN.md` (paper
    tokens, ink accents, chosen fonts) — not default unstyled browser
    inputs/buttons.
  - The page composes with no horizontal scroll and no dead empty margins
    at both 390px and 1440px viewport widths.

## Epic 2 — Data views & item-level insight

- [ ] **Per-item price history table**
  - Lists each tracked item's logged prices by month, sorted
    chronologically.
  - An item with zero logged prices shows a designed "not logged yet" row
    rather than being omitted or leaving blank space.

- [ ] **Per-item creep breakdown**
  - For items with two or more months logged, shows % change since that
    item's first logged price, sorted highest-to-lowest.
  - Items with fewer than two months logged are excluded from the ranking
    with a short note explaining why (not silently dropped).

- [ ] **Chart tooltip / point detail**
  - Hovering (desktop) or tapping (touch) a point on either line shows
    that month's date, dollar total or CPI index value, and cumulative %
    change in a tooltip or adjacent detail panel.

- [ ] **Design polish — chart & tables**
  - The chart's first render (and any render adding a new month) uses the
    "prints in" line-reveal animation from `docs/DESIGN.md`.
  - With `prefers-reduced-motion` set, lines render fully immediately with
    no travel animation, and all data remains correct.

## Epic 3 — Data ownership & persistence

- [ ] **Export data as JSON**
  - An "Export" action downloads a JSON file containing all items and
    entries currently in `localStorage`.

- [ ] **Import data as JSON**
  - An "Import" action accepts a previously exported JSON file and
    restores items/entries from it, with an explicit confirm step before
    overwriting current data.
  - Importing malformed or non-matching JSON shows an inline error and
    leaves existing data untouched.

- [ ] **Clear all data**
  - A "Clear all data" action requires explicit confirmation (dialog or
    type-to-confirm) before wiping `localStorage`.
  - Canceling the confirmation leaves all existing data untouched.

- [ ] **Data persists across reloads**
  - After adding items and logging entries, reloading the page shows the
    same items and entries (verified by a `localStorage` round-trip test).

- [ ] **Design polish — first-run empty state**
  - A user with zero items sees a designed onboarding empty state styled
    per `docs/DESIGN.md` prompting them to add their first item, rather
    than a blank page.
