import { Router, Request, Response } from 'express';
import { orderbookService } from '../services/orderbook';
import { matchingEngineService } from '../services/matchingEngine';
import { orderService } from '../services/order';
import { TickerInfo } from '../types';
import { getCandles } from '../lib/redis/trades';

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

    // Calculate 24h high, low, and change
    const now = Date.now();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const trades24h = await orderService.getMarketTrades(marketId, 10000);
    
    let high24h = lastPrice;
    let low24h = lastPrice;
    let change24h = 0;

    if (trades24h && trades24h.length > 0) {
      // Filter trades from last 24 hours
      const recentTrades = trades24h.filter(
        (t: any) => new Date(t.createdAt).getTime() >= twentyFourHoursAgo.getTime()
      );

      if (recentTrades.length > 0) {
        const prices = recentTrades.map((t: any) => Number(t.price));
        high24h = Math.max(...prices);
        low24h = Math.min(...prices);

        // Calculate change: (lastPrice - oldestPrice) / oldestPrice * 100
        const oldestTrade = recentTrades[recentTrades.length - 1];
        const oldestPrice = Number(oldestTrade.price);
        if (oldestPrice > 0) {
          change24h = ((Number(lastPrice) - oldestPrice) / oldestPrice) * 100;
        }
      }
    }

    const ticker: TickerInfo = {
      bestBid,
      bestAsk,
      lastPrice,
      volume24h,
      timestamp: now,
      high24h,
      low24h,
      change24h,
    };

    res.json(ticker);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /markets/:marketId/candles - Get candlestick data
router.get('/:marketId/candles', async (req: Request, res: Response) => {
  try {
    const marketId = Array.isArray(req.params.marketId) ? req.params.marketId[0] : req.params.marketId;
    const interval = req.query.interval as string || '1m';
    
    let intervalMs = 60 * 1000;
    if (interval === '5m') intervalMs = 5 * 60 * 1000;
    else if (interval === '15m') intervalMs = 15 * 60 * 1000;
    else if (interval === '1h') intervalMs = 60 * 60 * 1000;
    else if (interval === '4h') intervalMs = 4 * 60 * 60 * 1000;
    else if (interval === '1d') intervalMs = 24 * 60 * 60 * 1000;

    const candles = await getCandles(marketId, intervalMs);
    res.json(candles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
