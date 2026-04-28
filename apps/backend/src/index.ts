import http from 'http';
import express from 'express';
import cors from 'cors';
import marketsRouter from './routes/markets';
import ordersRouter from './routes/orders';
import orderbookRouter from './routes/orderbook';
import balancesRouter from './routes/balances';
import { createWsServer } from './ws';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Backend API running' });
});

// API Routes
app.use('/markets', marketsRouter);
app.use('/orders', ordersRouter);
app.use('/orderbook', orderbookRouter);
app.use('/balances', balancesRouter);

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

  WebSocket channels (ws://localhost:${PORT}/ws):
    subscribe orderbook  { marketId }
    subscribe trades     { marketId }
    subscribe ticker     { marketId }
    subscribe orders     { userId }
  `);
});