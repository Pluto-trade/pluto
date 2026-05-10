import { prisma } from '@repo/database';
// @ts-ignore - uuid types not found, but module works fine
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { PlaceOrderRequest } from '../types';

export class OrderService {
  async createOrder(
    userId: string,
    marketId: string,
    side: string,
    type: string,
    size: number,
    price?: number,
    externalOrderId?: string,
    walletAddress?: string | null,
  ) {
    const orderId = externalOrderId || uuidv4();

    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId,
        marketId,
        side: side.toUpperCase() as 'BUY' | 'SELL',
        type: type.toUpperCase() as 'LIMIT' | 'MARKET',
        size: new Decimal(size),
        price: price ? new Decimal(price) : null,
        remainingSize: new Decimal(size),
        status: 'ACCEPTED',
      },
    });

    if (walletAddress) {
      await prisma.$executeRaw`
        UPDATE "Order"
        SET "walletAddress" = ${walletAddress}
        WHERE "id" = ${order.id}
      `;
      return { ...order, walletAddress };
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });
  }

  async updateOrderRemainingSize(orderId: string, remainingSize: number) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { remainingSize: new Decimal(remainingSize) },
    });
  }

  async updateOrderExecution(
    orderId: string,
    status: string,
    remainingSize: number,
  ) {
    return await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        remainingSize: new Decimal(remainingSize),
      },
    });
  }

  async getOrder(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
    });
  }

  async getOrderWalletAddress(orderId: string) {
    const rows = await prisma.$queryRaw<Array<{ walletAddress: string | null }>>`
      SELECT "walletAddress"
      FROM "Order"
      WHERE "id" = ${orderId}
      LIMIT 1
    `;

    return rows[0]?.walletAddress ?? null;
  }

  async getUserOrders(userId: string) {
    return await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserOpenOrders(userId: string) {
    return await prisma.order.findMany({
      where: {
        userId,
        status: {
          in: ['ACCEPTED', 'OPEN', 'PARTIALLY_FILLED'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelOrder(orderId: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
  }

  async recordTrade(
    makerOrderId: string,
    takerOrderId: string,
    marketId: string,
    price: number,
    size: number
  ) {
    return await prisma.trade.create({
      data: {
        makerOrderId,
        takerOrderId,
        marketId,
        price: new Decimal(price),
        size: new Decimal(size),
      },
    });
  }

  async getMarketTrades(marketId: string, limit: number = 100) {
    return await prisma.trade.findMany({
      where: { marketId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const orderService = new OrderService();
