# Cart Creep

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

## Planned features

- Item-level price log with monthly entries, stored entirely in
  `localStorage` — no accounts, no server, no sync.
- A line chart comparing your indexed cart cost against real BLS CPI data,
  baked into the app as a reference dataset.
- Per-item breakdown so you can see which items are driving your creep.
- Import/export of your data as JSON, since it's the only copy that exists.

## Stack

Vanilla JavaScript, `localStorage` for persistence, [Vite](https://vitejs.dev)
for the dev server and static build, [Vitest](https://vitest.dev) for tests.
No backend, no framework, no build step required to read the source.

## Status

Early scaffold — see [`docs/VISION.md`](docs/VISION.md) for the full design
and [`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # run the test suite
npm run build    # static build to dist/
```

## License

MIT — see [LICENSE](LICENSE).
