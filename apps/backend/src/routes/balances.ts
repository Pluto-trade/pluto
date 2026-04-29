import { Router, Request, Response } from 'express';
import { balanceService } from '../services/balance';
import { DepositRequest, WithdrawRequest } from '../types';

const router = Router();

// GET /users/:userId/balances - Get user balances
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const balances = await balanceService.getUserBalances(userId);
    res.json(balances);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /balances/deposit - Deposit balance (simulated)
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const { userId, asset, amount } = req.body as DepositRequest;

    if (!userId || !asset || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const balance = await balanceService.deposit(userId, asset, amount);
    res.status(201).json(balance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /balances/withdraw - Withdraw balance (simulated)
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { userId, asset, amount } = req.body as WithdrawRequest;

    if (!userId || !asset || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const balance = await balanceService.withdraw(userId, asset, amount);
    res.json(balance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
