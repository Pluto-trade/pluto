import { prisma } from '@repo/database';
// @ts-ignore - uuid types not found, but module works fine
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';

function userAssetKey(userId: string, asset: string): string {
  return `${userId}_${asset}`;
}

export class BalanceService {
  async getUserBalances(userId: string) {
    return await prisma.balances.findMany({
      where: { userId },
    });
  }

  async getBalance(userId: string, asset: string) {
    return await prisma.balances.findUnique({
      where: {
        userId_asset: userAssetKey(userId, asset),
      },
    });
  }

  async deposit(userId: string, asset: string, amount: number) {
    const existing = await this.getBalance(userId, asset);

    if (existing) {
      return await prisma.balances.update({
        where: {
          userId_asset: userAssetKey(userId, asset),
        },
        data: {
          available: existing.available.plus(new Decimal(amount)),
        },
      });
    }

    return await prisma.balances.create({
      data: {
        id: uuidv4(),
        userId,
        asset,
        available: new Decimal(amount),
        reserved: new Decimal(0),
        userId_asset: userAssetKey(userId, asset),
      },
    });
  }

  async withdraw(userId: string, asset: string, amount: number) {
    const balance = await this.getBalance(userId, asset);

    if (!balance) {
      throw new Error('Balance not found');
    }

    if (balance.available.lessThan(new Decimal(amount))) {
      throw new Error('Insufficient balance');
    }

    return await prisma.balances.update({
      where: {
        userId_asset: userAssetKey(userId, asset),
      },
      data: {
        available: balance.available.minus(new Decimal(amount)),
      },
    });
  }

  async reserve(userId: string, asset: string, amount: number) {
    const balance = await this.getBalance(userId, asset);

    if (!balance) {
      throw new Error('Balance not found');
    }

    if (balance.available.lessThan(new Decimal(amount))) {
      throw new Error('Insufficient available balance');
    }

    return await prisma.balances.update({
      where: {
        userId_asset: userAssetKey(userId, asset),
      },
      data: {
        available: balance.available.minus(new Decimal(amount)),
        reserved: balance.reserved.plus(new Decimal(amount)),
      },
    });
  }

  async release(userId: string, asset: string, amount: number) {
    const balance = await this.getBalance(userId, asset);

    if (!balance) {
      throw new Error('Balance not found');
    }

    return await prisma.balances.update({
      where: {
        userId_asset: userAssetKey(userId, asset),
      },
      data: {
        available: balance.available.plus(new Decimal(amount)),
        reserved: balance.reserved.minus(new Decimal(amount)),
      },
    });
  }
}

export const balanceService = new BalanceService();
