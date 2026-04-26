import express from 'express';
import cors from 'cors';
import marketsRouter from './routes/markets';
import ordersRouter from './routes/orders';
import orderbookRouter from './routes/orderbook';
import balancesRouter from './routes/balances';

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  console.log(`
  Available endpoints:
  
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
  `)
});