import { Router, Request, Response } from 'express';
import { marketService } from '../services/market';
import { CreateMarketRequest } from '../types';

const router = Router();

// POST /markets - Create a new market
router.post('/', async (req: Request, res: Response) => {
  try {
    const { symbol, baseAsset, quoteAsset, tickSize, lotSize, minOrderSize, pricePrecision, sizePrecision, makerFeeRate, takerFeeRate } = req.body as CreateMarketRequest;

    if (!symbol || !baseAsset || !quoteAsset) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const market = await marketService.createMarket({
      symbol,
      baseAsset,
      quoteAsset,
      tickSize,
      lotSize,
      minOrderSize,
      pricePrecision,
      sizePrecision,
      makerFeeRate,
      takerFeeRate,
    });

    res.status(201).json(market);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /markets - List all markets
router.get('/', async (req: Request, res: Response) => {
  try {
    const markets = await marketService.listMarkets();
    res.json(markets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /markets/:marketId - Get market details
router.get('/:marketId', async (req: Request, res: Response) => {
  try {
    const marketId = Array.isArray(req.params.marketId) ? req.params.marketId[0] : req.params.marketId;
    const market = await marketService.getMarket(marketId);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    res.json(market);
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

// PATCH /markets/:marketId/status - Update market status
router.patch('/:marketId/status', async (req: Request, res: Response) => {
  try {
    const marketId = Array.isArray(req.params.marketId) ? req.params.marketId[0] : req.params.marketId;
    const { status } = req.body;

    if (!['ACTIVE', 'PAUSED', 'DISABLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const market = await marketService.updateMarketStatus(marketId, status);
    res.json(market);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
