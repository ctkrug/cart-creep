# Design direction

## 1. Aesthetic direction

**Cart Creep is a paper-and-ink grocery ledger.** Cream thermal-receipt paper, a
dot-matrix hairline rule between sections, and two ink colors doing the talking:
brick-red for *your* price, blue-black for the *official* CPI — like a receipt
you annotated by hand to prove a point. No dark mode dashboard, no glassy
cards; this is a kitchen-drawer object, not a SaaS panel.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f4efe4` | page background — warm cream paper |
| `--surface-1` | `#fffdf8` | receipt/card surface |
| `--surface-2` | `#e8e0cc` | kraft-paper secondary surface (headers, table stripes) |
| `--text` | `#211d15` | body ink |
| `--text-muted` | `#6f6553` | secondary ink |
| `--accent` | `#c23b2c` | "your cart" line, primary actions, brick-red ink |
| `--accent-support` | `#2b3a55` | "official CPI" line, blue-black ink |
| `--success` | `#3f7d4f` | confirmations |
| `--danger` | `#b3261e` | destructive actions, validation errors |
| Display font | [`Special Elite`](https://fonts.google.com/specimen/Special+Elite) | wordmark, headings — typewriter/receipt-printer feel |
| UI font | [`IBM Plex Mono`](https://fonts.google.com/specimen/IBM+Plex+Mono) | body, labels, numbers — receipts are tabular by nature |
| Fallbacks | `"Courier New", ui-monospace, monospace` | if Google Fonts fails to load |
| Spacing unit | `8px` scale (`4/8/16/24/32/48`) | |
| Corner radius | `2px` | receipts have sharp corners, not rounded cards |
| Shadow | `0 1px 2px rgba(30,20,10,.10), 0 8px 20px rgba(30,20,10,.12)` | layered "paper lifted off the counter" |
| Motion | UI transitions `160ms ease-out`; micro feedback `90ms ease-out` | |

## 3. Layout intent

The **chart is the hero.** On desktop (1440×900) it occupies the left ~65%
of the viewport as a tall receipt-shaped card; the right rail is a slim
"printed" strip holding the item list and the entry form, styled like a
receipt tape pinned to a corkboard. On phone (390×844) the chart stacks
full-width on top (≥60vh) with the item list and entry form below it as a
scrollable receipt roll — never a shrunken chart squeezed under a wall of
form fields.

## 4. Signature detail

The comparison chart **"prints in"**: on first render (and whenever a new
month's data lands), each line draws left-to-right like a receipt emerging
from a printer, accompanied by a thin animated "printer head" that travels
along the leading edge. Respects `prefers-reduced-motion` (lines render
immediately, no travel animation).

## 5. Games/toys juice plan

Not applicable — Cart Creep is a data tool, not a game or playful toy.
