import { Router, Request, Response } from 'express';
// @ts-ignore - uuid types not found, but module works fine
import { v4 as uuidv4 } from 'uuid';
import { orderService } from '../services/order';
import { orderbookService } from '../services/orderbook';
import { balanceService } from '../services/balance';
import { PlaceOrderRequest } from '../types';

const router = Router();

// POST /orders - Place an order
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, marketId, side, size, price, type } = req.body as PlaceOrderRequest;

    if (!userId || !marketId || !side || !size || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type === 'limit' && !price) {
      return res.status(400).json({ error: 'Price required for limit orders' });
    }

    // Create order in database
    const orderId = uuidv4();
    const dbOrder = await orderService.createOrder(userId, marketId, side, type, size, price, orderId);

    // Place order in orderbook
    const result = orderbookService.placeOrder(marketId, orderId, side.toLowerCase() as 'buy' | 'sell', type, size, price);

    res.status(201).json({
      orderId,
      ...dbOrder,
      orderBookResult: result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /orders/:orderId - Get order details
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /orders/:orderId - Cancel order
router.delete('/:orderId', async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Cancel in orderbook
    orderbookService.cancelOrder(order.marketId, orderId);

    // Update in database
    const cancelled = await orderService.cancelOrder(orderId);
    res.json(cancelled);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /orders/:orderId - Modify order
router.patch('/:orderId', async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const { size, price } = req.body;

    if (!size || !price) {
      return res.status(400).json({ error: 'Size and price required' });
    }

    const order = await orderService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Modify in orderbook
    orderbookService.modifyOrder(order.marketId, orderId, size, price);

    // Update in database
    const updated = await orderService.updateOrderRemainingSize(orderId, size);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /users/:userId/orders - Get user's orders
router.get('/user/:userId/all', async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const orders = await orderService.getUserOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /users/:userId/orders/open - Get user's open orders
router.get('/user/:userId/open', async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const orders = await orderService.getUserOpenOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
