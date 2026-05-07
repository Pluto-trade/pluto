import http from 'http';
import "dotenv/config";
import express from 'express';
import cors from 'cors';
import marketsRouter from './routes/markets';
import ordersRouter from './routes/orders';
import orderbookRouter from './routes/orderbook';
import balancesRouter from './routes/balances';
import mpeLogsRouter from './routes/mpeLogs'
import usersRouter from './routes/users';
import { createWsServer } from './ws';
import { redisInit } from './lib/redis';
import { startPriceStream, getCachedPrice, FEED_IDS } from '@repo/oracle';
import { matchingEngineService } from './services/matchingEngine';
import { marketService } from './services/market';


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Backend API running' });
});



// API Routes
app.use('/markets', marketsRouter);  //done testing
app.use('/orders', ordersRouter);
app.use('/orderbook', orderbookRouter);
app.use('/balances', balancesRouter);
app.use('/mpe-logs', mpeLogsRouter);
app.use('/users', usersRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

//  HTTP + WebSocket server (same port) 
const PORT = process.env.PORT || 3001;
const httpServer = http.createServer(app);

// Attach WS layer — all WS traffic goes to ws://localhost:3001/ws



async function bootstrap() {
  await redisInit();

  const markets = await marketService.listMarkets();
  const oracleSymbols = new Set<string>();
  const marketOracleMap = new Map<string, string>();

  for (const market of markets) {
    const oracleSymbol = resolveOracleSymbol(market.symbol);
    if (!oracleSymbol) continue;
    oracleSymbols.add(oracleSymbol);
    marketOracleMap.set(market.id, oracleSymbol);
  }

  if (oracleSymbols.size > 0) {
    await startPriceStream(Array.from(oracleSymbols));

    setInterval(async () => {
      const latestMarkets = await marketService.listMarkets();
      for (const market of latestMarkets) {
        const oracleSymbol = resolveOracleSymbol(market.symbol);
        if (!oracleSymbol) continue;
        const cached = getCachedPrice(oracleSymbol);
        // console.log(`Market ${market.symbol} - Oracle ${oracleSymbol} price:`, cached);
        if (!cached) continue;

        const snapshot = await matchingEngineService.getSnapshot(market.id);
        const bestBid = snapshot.bids[0]?.price ?? cached.price;
        const bestAsk = snapshot.asks[0]?.price ?? cached.price;
        const lastTradePrice = (bestBid + bestAsk) / 2;

        matchingEngineService.updateMarket(market.symbol, {
          oraclePrice: cached.price,
          lastTradePrice,
          bestBid,
          bestAsk,
          currentTime: Date.now(),
        });
      }
    }, 1000);
  }

  createWsServer(httpServer);

  httpServer.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server on  ws://localhost:${PORT}/ws`);
  console.log(`
  Available HTTP endpoints:
  
  Markets:
    POST   /markets
    GET    /markets
    GET    /markets/:marketId
    PATCH  /markets/:marketId/status
  
  Orders:
    POST   /orders
    GET    /orders/:orderId
    DELETE /orders/:orderId
    PATCH  /orders/:orderId
    GET    /orders/user/:userId/all
    GET    /orders/user/:userId/open
  
  Orderbook & Market Data:
    GET    /orderbook/:marketId/orderbook
    GET    /orderbook/:marketId/trades
    GET    /orderbook/:marketId/ticker
    GET    /orderbook/:marketId/candles
  
  Balances:
    GET    /balances/user/:userId
    POST   /balances/deposit
    POST   /balances/withdraw

  Users:
    GET    /users/:userId/profile
    GET    /users/:userId/orders
    GET    /users/:userId/trades
    PATCH  /users/:userId/name

  MPE Logs:
    GET    /mpe-logs/summary
    GET    /mpe-logs/user/:userId

  WebSocket channels (ws://localhost:${PORT}/ws):
    subscribe orderbook  { marketId }
    subscribe trades     { marketId }
    subscribe ticker     { marketId }
    subscribe orders     { userId }
  `);
})
}

function resolveOracleSymbol(marketSymbol: string): string | null {
  if (FEED_IDS[marketSymbol]) return marketSymbol;
  if (marketSymbol.endsWith('-USDC')) {
    const candidate = marketSymbol.replace('-USDC', '-USD');
    return FEED_IDS[candidate] ? candidate : null;
  }
  if (marketSymbol.endsWith('-USDT')) {
    const candidate = marketSymbol.replace('-USDT', '-USD');
    return FEED_IDS[candidate] ? candidate : null;
  }
  return null;
}

bootstrap().catch(error => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});