import { OrderSide } from "@repo/database";
import { getRedisClient } from ".";
import { keys } from "./keys";

type Order = {
  id: string;
  size: string;
  timestamp: string;
};

type OrderbookLevel = {
  price: string;
  size: string;
  orders: Order[];
};

async function buildLevels(
  marketId: string,
  side: OrderSide,
  prices: string[]
) {
  try {
    const client = getRedisClient();
    const levels = Promise.all(
      prices.map(async (price) => {
        const { priceQueue } = keys(marketId, side, price);
        
        // Get all order IDs at this price level
        const orderIds = await client.lRange(priceQueue, 0, -1);
        
        // Fetch individual order data for each order ID
        const orders = await Promise.all(
          orderIds.map(async (orderId) => {
            const orderData = await client.hGetAll(`order:${orderId}`);
            return {
              id: orderId,
              size: orderData.size ?? "0",
              timestamp: orderData.timestamp ?? "0",
            };
          })
        );
        
        const totalSize = orders.reduce((sum, order) => sum + Number(order.size), 0);

        return {
          price,
          size: totalSize.toString(),
          orders,
        };
      }),
    );
    return levels;
  } catch (error) {
    throw new Error("Can't build order levels with meta data");
  }
}

// get complete orderbook snapshot or just top bids
export async function getOrderbook(marketId: string, depth?: number) {
  try {
    const client = getRedisClient();
    const { bids, asks } = keys(marketId);

    let asksPrices: string[];
    let bidsPrices: string[];

    if (!depth) {
      asksPrices = await client.zRange(asks, 0, -1);

      bidsPrices = await client.zRange(bids, 0, -1, {
        REV: true,
      });
    } else {
      //  [0, depth-1] - since asks are in ascending order itself => first ask to depth ask means in ascending order
      asksPrices = await client.zRange(asks, 0, depth - 1);

      // [-1 , -depth] - since bids are in descending order => last bid to the depth bid and reverse order means in descending order
      bidsPrices = await client.zRange(bids, -depth, -1, {
        REV: true,
      });
    }
    const asksLevels = await buildLevels(marketId, "SELL", asksPrices);
    const bidsLevels = await buildLevels(marketId, "BUY", bidsPrices);

    return {
      asks: asksLevels,
      bids: bidsLevels,
      timestamp: Date.now()
    };
  } catch (error) {
    throw new Error("Can't query the top bids and asks from orderbook");
  }
}

// query orders at a certain price level
export async function getOrdersAtPriceLevel(
  marketId: string,
  side: OrderSide,
  price: string,
) {
  try {
    const client = getRedisClient();
    const { priceQueue } = keys(marketId, side, price);

    const orders = client.lRange(priceQueue, 0, -1);

    return orders;
  } catch (error) {
    throw new Error("Can't find the orders at a requested price level");
  }
}
