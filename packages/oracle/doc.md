# @repo/oracle

Fetches real-time prices from [Pyth Hermes](https://hermes.pyth.network).

## What's in here

| File | What it does |
|---|---|
| `types.ts` | `pythPrice` type — `{ feedId, price, confidence, publishTime }` |
| `feedIds.ts` | Maps symbol strings (e.g. `"SOL-USD"`) to Pyth feed IDs |
| `client.ts` | `fetchLatestPrice(symbol)` — one REST call, returns `pythPrice` |
| `stream.ts` | `startPriceStream(symbols)` + `getCachedPrice(symbol)` — live SSE cache |
| `index.ts` | Re-exports everything |

## How to use

**One-shot (OMS / MPE):**
```ts
import { fetchLatestPrice } from "@repo/oracle";

const { price, confidence, publishTime } = await fetchLatestPrice("SOL-USD");

## Live stream (Matching Engine):

import { startPriceStream, getCachedPrice } from "@repo/oracle";
await startPriceStream(["SOL-USD"]); // call once at boot
const data = getCachedPrice("SOL-USD"); // call per match cycle
Adding a symbol
Add to feedIds.ts. Feed IDs at docs.pyth.network/price-feeds/price-feeds.