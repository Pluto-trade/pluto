import { OrderSide } from "@repo/database";
import { getRedisClient } from ".";
import { keys } from "./keys";

const client = getRedisClient();

// get complete orderbook snapshot or just top bids
export async function getOrderbook(marketId: string, depth?: number) {
  try {
    const { bids, asks } = keys(marketId);

    if (!depth) {
      const allAsks = await client.zRange(asks, 0, -1);

      const allBids = await client.zRange(bids, 0, -1, {
        REV: true,
      });

      return {
        asks: allAsks,
        bids: allBids,
      };
    } else {
      //  [0, depth-1] - since asks are in ascending order itself => first ask to depth ask means in ascending order
      const topAsks = await client.zRange(asks, 0, depth - 1);

      // [-1 , -depth] - since bids are in descending order => last bid to the depth bid and reverse order means in descending order
      const topBids = await client.zRange(bids, -depth, -1, {
        REV: true,
      });

      return {
        asks: topAsks,
        bids: topBids,
      };
    }
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
    const { priceQueue } = keys(marketId, side, price);

    const orders = client.lRange(priceQueue, 0, -1);

    return orders;
  } catch (error) {
    throw new Error("Can't find the orders at a requested price level");
  }
}
