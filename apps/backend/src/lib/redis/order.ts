import { OrderSide, OrderType } from "@repo/database";
import { getRedisClient } from ".";
import { keys } from "./keys";

export async function setOrder(
  orderId: string,
  marketId: string,
  side: OrderSide,
  size: string,
  price: string,
  timestamp: string
) {
  try {
    const client = getRedisClient();
    const orderKey = `order:${orderId}`;
    const { bids, asks, priceQueue, orderMeta } = keys(marketId, side, price);

    await client.hSet(orderKey, {
      orderId,
      marketId,
      side,
      size,
      price,
      timestamp
    });

    const bookKey = side == "BUY" ? bids : asks;

    // store only price level in the orderbook
    await client.zAdd(bookKey, [
      {
        value: price,
        score: Number(price),
      },
      {
        value: size,
        score: Number(size),
      },
    ]);

    // FIFO the order queue at this price level
    await client.rPush(priceQueue, orderId);

    const existingMeta = await client.hGetAll(orderMeta);
    const existingSize = Number(existingMeta.totalSize ?? "0");
    const existingCount = Number(existingMeta.orderCount ?? "0");

    await client.hSet(orderMeta, {
      marketId,
      size,
      price,
      totalSize: (existingSize + Number(size)).toString(),
    });
  } catch (error) {
    throw new Error("Can't set order in the orderbook");
  }
}

// get one order
export async function getOrder(orderId: string) {
  try {
    const client = getRedisClient();
    await client.hGetAll(`order:${orderId}`);
  } catch (error) {
    throw new Error("Can't get the requested order");
  }
}

// get metadata for one price level
export async function getPriceLevelMeta(
  marketId: string,
  side: OrderSide,
  price: string,
) {
  try {
    const client = getRedisClient();
    const { orderMeta } = keys(marketId, side, price);

    return await client.hGetAll(orderMeta);
  } catch (error) {
    throw new Error("Can't get metadata for the requested price level");
  }
}

// get FIFO order ids at a price level
export async function getOrdersAtPriceLevel(
  marketId: string,
  side: OrderSide,
  price: string,
) {
  try {
    const client = getRedisClient();
    const { priceQueue } = keys(marketId, side, price);
    return await client.lRange(priceQueue, 0, -1);
  } catch (error) {
    throw new Error("Can't get orders at the requested price level");
  }
}