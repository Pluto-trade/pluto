# Trading UI Architecture

## 📁 Directory Structure

```
apps/web/
├── app/
│   ├── layout.tsx           (Root layout with navbar)
│   ├── providers.tsx        (QueryClient + Privy provider)
│   ├── globals.css          (Tailwind styles)
│   ├── page.tsx             (Home/landing)
│   └── trade/
│       └── page.tsx         ← Main trading page
│
├── components/
│   └── Trading/
│       ├── index.ts         (Exports)
│       ├── TradingLayout.tsx (Main 3-column grid)
│       └── TradingPanels.tsx (Individual panel components)
│
└── src/
    ├── store/
    │   ├── tradingStore.ts  (Zustand: WebSocket state + UI state)
    │   └── index.ts
    │
    ├── hooks/
    │   ├── useWebSocket.ts  (WebSocket connection logic)
    │   ├── useApi.ts        (TanStack Query: REST API calls)
    │   └── index.ts
    │
    └── types/
        └── trading.ts       (TypeScript interfaces)
```

## 🏗️ Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│            Trading Application                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  REST API Layer (TanStack Query)                        │
│  ├─ Markets list (staleTime: 5s)                       │
│  ├─ User balances (staleTime: 3s)                      │
│  ├─ Open orders (staleTime: 2s)                        │
│  ├─ Positions (staleTime: 2s)                          │
│  └─ Mutations: placeOrder, cancelOrder, closePosition │
│                                                          │
│  WebSocket Layer (Zustand)                              │
│  ├─ Order book (delta updates)                          │
│  ├─ Recent trades (streaming)                           │
│  ├─ Price ticker (real-time)                            │
│  └─ Connection status                                   │
│                                                          │
│  UI State (Zustand)                                     │
│  ├─ Selected symbol                                     │
│  ├─ Trade form (price, size, side, type)                │
│  ├─ Chart timeframe selection                           │
│  └─ Panel visibility toggles                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Component Hierarchy

```
TradingPage
└── TradingLayout
    ├── LeftPanel
    │   ├─ Pairs list
    │   └─ Market stats
    │
    ├── ChartPanel
    │   ├─ Timeframe selector (1m, 5m, 15m, 1h, 4h, 1d)
    │   └─ Chart (TradingView Lightweight Charts)
    │
    ├── OrderBookPanel
    │   ├─ Asks (red, virtual scrolling)
    │   ├─ Bids (green, virtual scrolling)
    │   └─ Spread display
    │
    ├── RecentTradesPanel
    │   └─ Trade list (last 50, streaming)
    │
    ├── TransactionPanel
    │   ├─ Order type toggle (LIMIT/MARKET)
    │   ├─ Side toggle (BUY/SELL)
    │   ├─ Price input (LIMIT only)
    │   ├─ Size input
    │   ├─ Total + fee display
    │   └─ Place order button
    │
    └── BottomSheet
        ├─ Open orders (collapsible)
        ├─ Positions (collapsible)
        └─ Order history (collapsible)
```

## 📊 State Management Pattern

### Zustand Store (Real-time & UI)
```typescript
useTradingStore()
├── selectedSymbol: string
├── orderBook: OrderBook | null
├── recentTrades: Trade[]
├── currentMarket: Market | null
├── tradePanel: { orderType, side, price, size }
├── selectedTimeframe: '1m' | '5m' | ... | '1d'
└── wsConnected: boolean
```

### TanStack Query (REST API)
```typescript
useMarkets()          → /markets (5s stale)
useBalances()         → /balances (3s stale)
useOrders(symbol)     → /orders (2s stale)
usePositions()        → /positions (2s stale)
usePlaceOrder()       → POST /orders
useCancelOrder()      → DELETE /orders/{id}
useClosePosition()    → POST /positions/{id}/close
```

## 🔌 WebSocket Integration

**Backend endpoint:** `ws://localhost:3001/ws`

**Subscribe channels:**
```json
{
  "type": "SUBSCRIBE",
  "channel": "orderbook|trades|ticker",
  "symbol": "BTC-PERP"
}
```

**Update frequency:**
- Ticker: 1-2 seconds
- Order Book: 100-200ms (with debouncing)
- Trades: Event-based

## 🎨 Layout Dimensions

```
┌─────────────────────────────────────────────────────┐
│  Navbar (h-16)                                       │
├───────┬──────────────────────────┬─────────┬────────┤
│       │                          │         │        │
│ Left  │      Chart               │ Book    │ Form   │
│ 12rem │      flex-1              │ 20rem   │ 20rem  │
│       │                          │         │        │
├───────┴──────────────────────────┴─────────┴────────┤
│  Bottom Sheet (h-32)                                 │
└─────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### 1. Install dependencies
```bash
cd apps/web
pnpm install
```

### 2. Create `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 3. Start development
```bash
pnpm dev
```

### 4. Navigate to trading page
Visit: `http://localhost:3000/trade`

## 📋 TODO: Implementation Checklist

### Phase 1: MVP Layout
- [ ] Verify path aliases work (@/components, @/store)
- [ ] Test Zustand store initialization
- [ ] Test TanStack Query setup
- [ ] Verify WebSocket connection
- [ ] Render placeholder components without errors

### Phase 2: Left Panel
- [ ] Build pairs list with search
- [ ] Add pair selection UI
- [ ] Display market stats (24h high/low, volume)
- [ ] Add favorites functionality

### Phase 3: Chart Component
- [ ] Install TradingView Lightweight Charts
- [ ] Implement candle rendering
- [ ] Add volume overlay
- [ ] Implement zoom/pan
- [ ] Add timeframe switching

### Phase 4: Order Book
- [ ] Implement virtual scrolling (100s of rows)
- [ ] Build asks/bids table
- [ ] Add spread calculation & display
- [ ] Color code (green bids, red asks)
- [ ] Click to fill order form

### Phase 5: Recent Trades
- [ ] Implement virtual scrolling
- [ ] Stream new trades real-time
- [ ] Color code by side (buy/sell)
- [ ] Show time, price, size

### Phase 6: Transaction Form
- [ ] Wire up LIMIT/MARKET toggle
- [ ] Implement real-time total calculation
- [ ] Add fee estimation
- [ ] Integrate usePlaceOrder mutation
- [ ] Show order confirmation/errors

### Phase 7: Bottom Sheet
- [ ] Build open orders table
- [ ] Build positions table with PnL
- [ ] Build order history with filters
- [ ] Add collapsible expand/collapse

### Phase 8: Polish
- [ ] Mobile responsiveness
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Keyboard shortcuts
- [ ] Dark mode refinement

## 💡 Key Implementation Notes

1. **Path aliases**: Use `@/` prefix for all imports (already configured)
2. **Zustand**: Single store with clear separation between WS state and UI state
3. **TanStack Query**: Automatic refetching + caching without extra logic
4. **Component Layout**: Use Tailwind flexbox for responsive layout
5. **Real-time Updates**: WebSocket handled by hook, Zustand maintains state
6. **Virtual Scrolling**: For large lists (orderbook, trades, history)
