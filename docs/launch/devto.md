---
title: "Cart Creep: a grocery inflation calculator for the cart you actually buy"
published: false
tags: javascript, webdev, dataviz, showdev
---

The official inflation number never matched my receipts. The news would say
food inflation was a couple of percent while my weekly shop kept creeping up,
and I had no way to prove which of us was right. So I built a small tool to
settle it: log what I pay for the same short list of groceries each month, and
plot my own inflation line against the government's food-at-home CPI on one
chart.

It's called Cart Creep. It's vanilla JavaScript, it stores everything in
`localStorage`, and there's no backend. Here are the two decisions that were
more interesting than the feature list.

## Making two very different numbers comparable

The whole point is a single chart with two lines that mean the same thing. My
cart is measured in dollars; the CPI is a published index sitting around 317.
You can't just draw both and expect a fair comparison.

The fix is to stop plotting values and start plotting *change from a shared
starting point*. Both series are indexed to the user's first logged month:
each point is the cumulative percentage change since that month. My cart's
first month is 0%, the CPI's value in that same month is 0%, and every later
point is how far each has moved since. Now "my line is steeper than theirs"
is a true statement about the same quantity, and the gap between the lines is
literally the number I built the app to find.

One deliberate non-feature came out of this. Cart Creep sums only the prices
you actually logged for a given month. It does not carry forward an item's
last known price into a month you skipped. That means a half-logged month
looks cheaper than it really was, which sounds like a bug. I kept it because
the honest failure (a visible dip when you forget to log) is better than a
silently invented number, and the entry form nudges you to log every item each
month.

## Treating localStorage as untrusted input

`localStorage` feels like your own private variable, but it's a string that
anyone can hand-edit in devtools, and a value your own older code wrote might
not match the shape your new code expects. Early on, a single malformed month
string crashed the whole render because a date formatter choked on it.

So the store has one read path, `readAll()`, and it sanitizes on the way out.
Anything that doesn't match the same rules the app enforces on input (a
non-empty item name, a `YYYY-MM` month in range, a finite non-negative price,
an entry that points at a real tracked item) gets dropped before it ever
reaches the chart. Import does the same thing but louder: it validates the
entire file first and throws a specific message, so a bad import can never
leave a half-written store behind. The result is a data layer that degrades to
"empty" instead of "broken," which for a tool with no server is the difference
between working and not.

## What I'd do differently

The CPI data is baked into the source so the app works offline and needs no
API key. The trade-off is that I have to update it by hand. If this grew, I'd
pull the BLS series at build time and cache it, keeping the offline behavior
without the manual step.

## Try it

Live: https://apps.charliekrug.com/cart-creep/
Source: https://github.com/ctkrug/cart-creep

If you track your own grocery prices, I'd genuinely like to know how far your
cart has drifted from the CPI. Mine is not doing well.
