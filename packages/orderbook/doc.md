# Order Book


## File Structure

```
packages/orderbook/
├── package.json              ← scripts: test, test:watch, lint, check-types
├── tsconfig.json
├── src/
│   ├── types.ts              ← All shapes: enums (OrderSide/Type/Status), IOrder/ILimitOrder/IMarketOrder,
│   │                            LimitOrderOptions, MarketOrderOptions, IProcessOrder,
│   │                            Snapshot, BookLevelSnapshot
│   ├── errors.ts             ← Stable numeric ERROR codes + orderBookError(code, msg) factory
│   ├── order.ts              ← Pure factories (createLimitOrder, createMarketOrder, createOrder)
│   │                            + state transitions (applyFill, cancelOrder)
│   ├── orderqueue.ts         ← OrderQueue: FIFO queue at one price level, Map-backed for O(1) by-id ops
│   ├── orderside.ts          ← BookSide: one half of the book (bids OR asks); sorted price levels,
│   │                            bestPrice, walk, depth — driven by a single comparator
│   ├── orderbook.ts          ← OrderBook: per-market top-level class; bids + asks + orderId→side index;
│   │                            addLimit, cancel, depth, snapshot
│   └── index.ts              ← Public API barrel — only import from here


---

## Layered Architecture

```
┌────────────────────────────────────────────────────────┐
│ OrderBook (per market)                                 │
│   • bids: BookSide   • asks: BookSide                  │
│   • orderIndex: Map<orderId, {order, side}>            │
│   • addLimit / cancel / bestBid / bestAsk              │
│   • spread / midPrice / depth / snapshot               │
├────────────────────────────────────────────────────────┤
│ BookSide × 2  (bids descending, asks ascending)        │
│   • queues: Map<price, OrderQueue>                     │
│   • prices: number[] kept sorted via binary insert     │
│   • orderToPrice: Map<id, price>                       │
│   • bestPrice / walk / append / remove / update / depth│
├────────────────────────────────────────────────────────┤
│ OrderQueue × N  (one per price level)                  │
│   • orders: Map<id, ILimitOrder>                       │
│   • FIFO via Map insertion order, volume tracked       │
│   • append / remove / head / removeFromHead / update   │
└────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
addLimit(LimitOrderOptions)
      ↓
  market check          (options.marketId === book.marketId?)
      ↓
  duplicate-id check    (orderIndex.has(options.id)?)
      ↓
  createLimitOrder      validates fields → ILimitOrder { status: ACCEPTED }
      ↓
  wouldCross()          BUY price >= bestAsk  OR  SELL price <= bestBid?
      ↓                 (no matching engine yet → reject if crossing)
  status → OPEN
      ↓
  BookSide.append → OrderQueue.append      (FIFO at the price level)
      ↓
  orderIndex.set(id, {order, side})         (O(1) cancel later)
      ↓
  IProcessOrder { quantityLeft = size, err: null }
```

```
cancel(orderId)
      ↓
  orderIndex.get(id) → {order, side}
      ↓
  BookSide.remove(id)  → OrderQueue.remove(id)    (prune empty level)
      ↓
  orderIndex.delete(id)
      ↓
  return { ...order, status: CANCELLED, updatedAt: now }
```

```
depth() / snapshot()
      ↓
  walk bids best→worst, walk asks best→worst
      ↓
  depth   → DepthLevel[]            { price, volume, orders }
  snapshot → BookLevelSnapshot[]    { price, orders: ILimitOrder[] }  + ts
```

---

## Sort Comparator (the one rule that runs the book)

```
compare(a, b) < 0  ⇒  "a is better than b on this side"

  BUY  (bids):   higher price is better  →  b - a
  SELL (asks):   lower price is better   →  a - b

⇒ bestPrice() === prices[0] on either side
⇒ findInsertIndex / findExactIndex are sort-direction-agnostic
```

---

## Order Status Lifecycle

```
ACCEPTED          ← createLimitOrder / createMarketOrder (factory default)
   ↓
OPEN              ← OrderBook.addLimit (resting on the book)
   ↓
PARTIALLY_FILLED  ← applyFill, remainingSize > 0          (matching engine, future)
   ↓
FILLED            ← applyFill drains remainingSize to 0   (matching engine, future)

CANCELLED         ← OrderBook.cancel (terminal, from any state above)
```

---

## v1 Scope (this package)

```
✓ Resting limit orders         (addLimit / cancel / read)
✓ O(1) cancel by id            (orderId → side index in OrderBook)
✓ Sorted price levels          (binary-insert into number[])
✓ Aggregated depth + full snapshot
✓ Pure-function factories + state transitions for use by callers
✗ Matching / fills             (lives in services/matching, not here)
✗ Market-order execution       (factory exists; matching engine consumes)
✗ Persistence                  (lives in services/oms, calls @repo/database)
```

---

