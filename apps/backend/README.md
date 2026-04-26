# Backend API Documentation

## Overview

The backend provides a complete trading API with market management, order placement, orderbook data, and balance management. It integrates with the `nodejs-order-book` library for high-performance order matching and uses Prisma for persistent storage.

## Architecture

### Directory Structure
```
src/
├── index.ts              # Main Express app setup
├── types.ts              # Shared type definitions
├── services/             # Business logic layer
│   ├── orderbook.ts      # Order matching & orderbook management
│   ├── order.ts          # Order persistence (Prisma)
│   ├── market.ts         # Market management
│   └── balance.ts        # User balance management
└── routes/               # API endpoint handlers
    ├── markets.ts        # Market CRUD & management
    ├── orders.ts         # Order placement & management
    ├── orderbook.ts      # Market data & orderbook
    └── balances.ts       # Balance operations
```

### Technology Stack
- **Framework**: Express.js
- **ORM**: Prisma
- **Order Matching**: nodejs-order-book (300k+ trades/sec)
- **Database**: PostgreSQL (via Neon)
- **Language**: TypeScript

## API Endpoints

### Markets API

#### Create Market
```
POST /markets
Content-Type: application/json

{
  "symbol": "SOL/USDC",
  "baseAsset": "SOL",
  "quoteAsset": "USDC",
  "tickSize": 0.01,
  "lotSize": 0.001,
  "minOrderSize": 0.1,
  "pricePrecision": 2,
  "sizePrecision": 3,
  "makerFeeRate": 0.001,
  "takerFeeRate": 0.002
}

Response (201):
{
  "id": "uuid",
  "symbol": "SOL/USDC",
  "baseAsset": "SOL",
  "quoteAsset": "USDC",
  "status": "ACTIVE",
  ...
}
```

#### List Markets
```
GET /markets

Response (200):
[
  { "id": "uuid", "symbol": "SOL/USDC", "status": "ACTIVE", ... },
  { "id": "uuid", "symbol": "BTC/USDC", "status": "ACTIVE", ... }
]
```

#### Get Market Details
```
GET /markets/:marketId

Response (200):
{
  "id": "uuid",
  "symbol": "SOL/USDC",
  "status": "ACTIVE",
  ...
}
```

#### Update Market Status
```
PATCH /markets/:marketId/status
Content-Type: application/json

{
  "status": "PAUSED" // or "ACTIVE", "DISABLED"
}

Response (200):
{
  "id": "uuid",
  "symbol": "SOL/USDC",
  "status": "PAUSED",
  ...
}
```

### Orders API

#### Place Order
```
POST /orders
Content-Type: application/json

{
  "userId": "user-uuid",
  "marketId": "market-uuid",
  "side": "buy",           // or "sell"
  "type": "limit",         // or "market"
  "size": 10.5,
  "price": 25.50,          // required for limit orders
  "timeInForce": "GTC",    // optional: "GTC" (default), "FOK", "IOC"
  "postOnly": false        // optional
}

Response (201):
{
  "orderId": "order-uuid",
  "userId": "user-uuid",
  "marketId": "market-uuid",
  "side": "BUY",
  "type": "LIMIT",
  "size": 10.5,
  "price": 25.50,
  "remainingSize": 10.5,
  "status": "ACCEPTED",
  "orderBookResult": { ... }
}
```

#### Get Order Details
```
GET /orders/:orderId

Response (200):
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "marketId": "market-uuid",
  "side": "BUY",
  "status": "OPEN",
  ...
}
```

#### Cancel Order
```
DELETE /orders/:orderId

Response (200):
{
  "id": "order-uuid",
  "status": "CANCELLED",
  ...
}
```

#### Modify Order
```
PATCH /orders/:orderId
Content-Type: application/json

{
  "size": 15.0,
  "price": 26.00
}

Response (200):
{
  "id": "order-uuid",
  "size": 15.0,
  "price": 26.00,
  ...
}
```

#### Get User's Orders
```
GET /orders/user/:userId/all

Response (200):
[
  { "id": "order-uuid", "status": "FILLED", ... },
  { "id": "order-uuid", "status": "OPEN", ... }
]
```

#### Get User's Open Orders
```
GET /orders/user/:userId/open

Response (200):
[
  { "id": "order-uuid", "status": "OPEN", ... },
  { "id": "order-uuid", "status": "PARTIALLY_FILLED", ... }
]
```

### Orderbook & Market Data API

#### Get Orderbook Snapshot
```
GET /orderbook/:marketId/orderbook

Response (200):
{
  "bids": [
    { "price": 25.50, "size": 100.0 },
    { "price": 25.45, "size": 250.5 },
    { "price": 25.40, "size": 150.0 }
  ],
  "asks": [
    { "price": 25.55, "size": 75.0 },
    { "price": 25.60, "size": 200.0 },
    { "price": 25.65, "size": 50.0 }
  ],
  "timestamp": 1672531200000
}
```

#### Get Recent Trades
```
GET /orderbook/:marketId/trades?limit=50

Response (200):
[
  {
    "id": "trade-uuid",
    "price": 25.50,
    "size": 10.5,
    "buyOrderId": "order-uuid",
    "sellOrderId": "order-uuid",
    "timestamp": 1672531200000
  },
  ...
]
```

#### Get Ticker Info
```
GET /orderbook/:marketId/ticker

Response (200):
{
  "bestBid": 25.50,
  "bestAsk": 25.55,
  "lastPrice": 25.52,
  "volume24h": 5000.0,
  "timestamp": 1672531200000
}
```

#### Get Candles (Placeholder)
```
GET /orderbook/:marketId/candles?interval=1m&limit=100

Response (200):
{
  "message": "Candles endpoint - coming soon"
}
```

### Balance API

#### Get User Balances
```
GET /balances/user/:userId

Response (200):
[
  {
    "id": "balance-uuid",
    "userId": "user-uuid",
    "asset": "USDC",
    "available": 1000.50,
    "reserved": 250.00
  },
  {
    "id": "balance-uuid",
    "userId": "user-uuid",
    "asset": "SOL",
    "available": 10.5,
    "reserved": 2.0
  }
]
```

#### Deposit Balance
```
POST /balances/deposit
Content-Type: application/json

{
  "userId": "user-uuid",
  "asset": "USDC",
  "amount": 1000.00
}

Response (201):
{
  "id": "balance-uuid",
  "userId": "user-uuid",
  "asset": "USDC",
  "available": 1000.00,
  "reserved": 0
}
```

#### Withdraw Balance
```
POST /balances/withdraw
Content-Type: application/json

{
  "userId": "user-uuid",
  "asset": "USDC",
  "amount": 500.00
}

Response (200):
{
  "id": "balance-uuid",
  "userId": "user-uuid",
  "asset": "USDC",
  "available": 500.00,
  "reserved": 0
}
```

## Running the Backend

### Development
```bash
cd apps/backend
pnpm dev
# Server will auto-restart on file changes (nodemon)
```

### Build
```bash
cd apps/backend
pnpm build
```

### Start Production
```bash
cd apps/backend
pnpm start
```

## Environment Variables

Ensure these are set in your `.env` file:

```env
DATABASE_URL=postgresql://user:password@neon.tech/dbname?schema=public
PORT=3001
```

## Order Flow

1. **Place Order**: `POST /orders` creates order in DB and adds to orderbook
2. **Match**: `nodejs-order-book` automatically matches with existing orders
3. **Execute**: Matched orders generate trades and update balances
4. **Query**: `GET /orderbook/:marketId/*` retrieves real-time market data

## Services

### OrderbookService
- Maintains in-memory orderbooks per market
- Handles order placement, cancellation, modification
- Tracks trades and price history
- Provides orderbook snapshots

### OrderService
- Persists orders to database
- Tracks order status and remaining size
- Records executed trades
- Queries user orders

### MarketService
- Creates and manages markets
- Updates market status (ACTIVE, PAUSED, DISABLED)
- Retrieves market metadata

### BalanceService
- Manages user asset balances
- Handles deposits and withdrawals
- Reserves balance for open orders

## Notes

- All prices and amounts use `Decimal.js` for precision
- Order IDs are UUIDs for global uniqueness
- Trades are automatically recorded when orders match
- Market status can be toggled to pause/pause trading
- Balance reserve/release happens during order placement/cancellation
