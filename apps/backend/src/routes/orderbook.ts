import { Router, Request, Response } from 'express';
import { orderbookService } from '../services/orderbook';
import { matchingEngineService } from '../services/matchingEngine';
import { orderService } from '../services/order';
import { TickerInfo } from '../types';

const router = Router();

// GET /markets/:marketId/orderbook - Get orderbook snapshot
router.get('/:marketId/orderbook', async (req: Request, res: Response) => {
  try {
    const marketId = Array.isArray(req.params.marketId) ? req.params.marketId[0] : req.params.marketId;
    const snap = await matchingEngineService.getSnapshot(marketId);
    const ts = Date.now();
    res.json({
      bids: snap.bids.map((level) => ({
        price: level.price,
        size: level.totalQuantity,
        timestamp: ts,
      })),
      asks: snap.asks.map((level) => ({
        price: level.price,
        size: level.totalQuantity,
        timestamp: ts,
      })),
      timestamp: ts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /markets/:marketId/trades - Get recent trades
router.get('/:marketId/trades', async (req: Request, res: Response) => {
  try {
    const marketId = Array.isArray(req.params.marketId) ? req.params.marketId[0] : req.params.marketId;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    const trades = await orderService.getMarketTrades(marketId, limit);
    res.json(trades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /markets/:marketId/ticker - Get ticker info
router.get('/:marketId/ticker', async (req: Request, res: Response) => {
  try {
    const marketId = Array.isArray(req.params.marketId) ? req.params.marketId[0] : req.params.marketId;
    const snapshot = await matchingEngineService.getSnapshot(marketId);
    const lastPrice = orderbookService.getLastPrice(marketId);
    const volume24h = orderbookService.getVolume24h(marketId);

    const bestBid = snapshot.bids.length > 0 ? snapshot.bids[0].price : null;
    const bestAsk = snapshot.asks.length > 0 ? snapshot.asks[0].price : null;

    const ticker: TickerInfo = {
      bestBid,
      bestAsk,
      lastPrice,
      volume24h,
      timestamp: Date.now(),
      high24h: null,
      low24h: null
    };

    res.json(ticker);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /markets/:marketId/candles - Get candlestick data (optional for now)
router.get('/:marketId/candles', async (req: Request, res: Response) => {
  try {
    res.json({ message: 'Candles endpoint - coming soon' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
