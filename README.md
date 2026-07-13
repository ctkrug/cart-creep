# Cart Creep

[![CI](https://github.com/ctkrug/cart-creep/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/cart-creep/actions/workflows/ci.yml)

Log what you paid for the same 10 groceries each month. Watch your own
personal inflation line pull away from the official CPI number.

## Why

The Consumer Price Index tells you inflation was 3.1% last year. It doesn't
tell you that *your* cart — the actual eggs, coffee, and chicken thighs you
buy every month — went up 9%. Cart Creep closes that gap: you log real
prices for the same short list of items, and it plots your personal
inflation line right next to the official CPI line so the divergence is
impossible to ignore.

Everything runs in the browser. Nothing you type ever leaves your device.

## How it works

1. Pick up to 10 grocery items you buy regularly (milk, eggs, bread, ground
   beef, whatever makes up your real cart).
2. Once a month, log what you paid for each one.
3. After your second month of entries, Cart Creep plots your personal
   cost-of-cart index against the official BLS CPI-U food-at-home series on
   the same chart — same start point, same scale — so you can see exactly
   how much steeper (or flatter) your line is.

## Features

- Track up to 10 grocery items, with inline validation on the add-item and
  log-price forms — no browser `alert()`s.
- The comparison chart: your personal cost-of-cart index against the real
  BLS CPI-U food-at-home series, sharing one axis, "printing in" on first
  render. Hover or tap a point for its exact month/value.
- Per-item price history table and a creep breakdown ranking which items
  are driving your personal inflation, highest first.
- Export your data as JSON, or import a previous export (with a confirm
  step before it overwrites anything).
- Clear-all with a type-to-confirm safeguard.
- Everything persists in `localStorage` — no accounts, no server, no sync.

## Stack

Vanilla JavaScript, `localStorage` for persistence, [Vite](https://vitejs.dev)
for the dev server and static build, [Vitest](https://vitest.dev) for tests.
No backend, no framework, no build step required to read the source. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the modules fit
together.

## Status

Core v1 feature set is built — see [`docs/VISION.md`](docs/VISION.md) for
the full design and [`docs/BACKLOG.md`](docs/BACKLOG.md) for the story
list.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # run the test suite
npm run build    # static build to dist/
```

## License

MIT — see [LICENSE](LICENSE).
