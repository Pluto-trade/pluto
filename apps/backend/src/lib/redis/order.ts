import { OrderSide, OrderType } from "@repo/database";
import { getRedisClient } from ".";
import { keys } from "./keys";

export async function setOrder(
  orderId: string,
  userId: string,
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
      userId,
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
      orderCount: (existingCount + 1).toString(),
    });
  } catch (error) {
    throw new Error("Can't set order in the orderbook");
  }
}

// get one order
export async function getOrder(orderId: string) {
  try {
    const client = getRedisClient();
    return await client.hGetAll(`order:${orderId}`);
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

export async function updateOrderSize(orderId: string, newRemaining: string) {
  try {
    const client = getRedisClient();
    const orderKey = `order:${orderId}`;
    const orderData = await client.hGetAll(orderKey);
    if (!orderData.marketId || !orderData.side || !orderData.price) {
      throw new Error("Order metadata missing");
    }

    const marketId = orderData.marketId;
    const side = orderData.side as OrderSide;
    const price = orderData.price;
    const previousSize = Number(orderData.size ?? "0");
    const nextSize = Number(newRemaining);
    const deltaSize = nextSize - previousSize;

    await client.hSet(orderKey, {
      size: newRemaining,
    });

    const { orderMeta, priceQueue } = keys(marketId, side, price);
    const existingMeta = await client.hGetAll(orderMeta);
    const existingTotal = Number(existingMeta.totalSize ?? "0");
    const updatedTotal = existingTotal + deltaSize;

    await client.hSet(orderMeta, {
      totalSize: updatedTotal.toString(),
    });

    if (nextSize <= 0) {
      await client.lRem(priceQueue, 1, orderId);
      await client.del(orderKey);
      const remaining = await client.lLen(priceQueue);
      if (remaining === 0) {
        await removeEmptyLevel(marketId, side, price);
      }
    }
  } catch (error) {
    throw new Error("Can't update order size");
  }
}

export async function deleteOrder(orderId: string) {
  try {
    const client = getRedisClient();
    const orderKey = `order:${orderId}`;
    const orderData = await client.hGetAll(orderKey);
    if (!orderData.marketId || !orderData.side || !orderData.price) {
      throw new Error("Order metadata missing");
    }

    const marketId = orderData.marketId;
    const side = orderData.side as OrderSide;
    const price = orderData.price;
    const orderSize = Number(orderData.size ?? "0");
    const { orderMeta, priceQueue } = keys(marketId, side, price);
    await client.del(orderKey);

    await client.lRem(priceQueue, 1, orderId);

    const existingMeta = await client.hGetAll(orderMeta);
    const existingTotal = Number(existingMeta.totalSize ?? "0");
    const existingCount = Number(existingMeta.orderCount ?? "0");
    const updatedTotal = existingTotal - orderSize;

    await client.hSet(orderMeta, {
      totalSize: updatedTotal.toString(),
      orderCount: Math.max(existingCount - 1, 0).toString(),
    });

    const remaining = await client.lLen(priceQueue);
    if (remaining === 0) {
      await removeEmptyLevel(marketId, side, price);
    }
  } catch (error) {
    throw new Error("Can't delete order from the orderbook");
  }
}

export async function updatePriceLevelTotal(marketId: string, side: OrderSide, price: string, deltaSize: string) {
  try {
    const client = getRedisClient();
    const { orderMeta } = keys(marketId, side, price);

    const existingMeta = await client.hGetAll(orderMeta);
    const existingSize = Number(existingMeta.totalSize ?? "0");
    const newSize = existingSize + Number(deltaSize);

    await client.hSet(orderMeta, {
      totalSize: newSize.toString(),
    });
  } catch (error) {
    throw new Error("Can't update price level total size");
  }
}

export async function removeEmptyLevel(marketId:string, side: OrderSide, price: string) {
  try {
    const client = getRedisClient();
    const { bids, asks, priceQueue, orderMeta } = keys(marketId, side, price);

    // Remove price level from sorted set
    const bookKey = side == "BUY" ? bids : asks;
    await client.zRem(bookKey, price);

    // Remove price level metadata
    await client.del(orderMeta);

    // Remove price level queue
    await client.del(priceQueue);
  } catch (error) {
    throw new Error("Can't remove empty price level");
  }
}