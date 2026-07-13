# Vision

## The problem

The Consumer Price Index tells you inflation was some official percentage
last year. It's an aggregate over a huge, generic basket of goods weighted
in ways that have nothing to do with what any one household actually buys.
People *feel* their own grocery bill creeping up faster than the number on
the news, and they have no easy way to check whether that feeling is
correct — you'd have to save every receipt and do the math yourself.

## Who it's for

Anyone curious enough about their own spending to log ten grocery items a
month, for two months, to see whether their personal inflation is running
ahead of or behind the official rate. No accounts, no budgeting app
lock-in — just a private, honest comparison.

## The core idea

Log what you actually paid for the same short list of groceries, once a
month. Cart Creep turns those prices into a personal cost-of-cart index —
the same "cumulative % change from a base month" convention the BLS uses —
and plots it against the real, published CPI-U food-at-home series on one
chart. Two months of data is enough for two points; two points are enough
for a slope; and a slope next to the official slope is the whole product.

## Key design decisions

- **Local-first, no backend.** Everything lives in `localStorage`. Grocery
  spending is personal; nothing about this tool needs a server, an account,
  or a database. Export/import as JSON is the only "backup."
- **A fixed, small cart (≤10 items).** Ten items is enough to be
  representative of a real shopping trip and small enough that logging
  prices once a month takes under a minute. A tool that asks for more
  effort than that won't get used past month one.
- **Real CPI, not a synthetic baseline.** The comparison only means
  something if the "official" line is the actual published BLS series
  (CPI-U food-at-home, `CUUR0000SAF11`), baked into the app so it works
  fully offline.
- **Same math, both lines.** Personal and official indices are both
  expressed as cumulative % change from a base month, so they share one
  axis and one visual language — the divergence is the entire point, and
  it has to be legible at a glance.
- **Paper-ledger aesthetic, not a dashboard.** See
  [`docs/DESIGN.md`](DESIGN.md). A grocery-price tool should feel like a
  receipt you annotated, not a SaaS analytics panel.

## What "v1 done" looks like

- A user can add up to 10 items, log a price per item per month, and after
  two distinct months see a chart with their personal line and the CPI
  line on the same axis, visibly diverging.
- Per-item breakdown shows which items are driving the creep.
- Data survives a reload, and can be exported/imported as JSON.
- The app is a single static site, buildable to one directory, deployable
  to a subpath with no server.
