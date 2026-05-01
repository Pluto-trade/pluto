import { getRedisClient } from ".";
import { keys } from "./keys";

const client = getRedisClient();

export async function setPriceLevel(
  marketId: string,
  currentPrice: string,
  deviationFromLast: string,
) {
  try {
    const key = keys(marketId).priceLevel;

    await client.hSet(key, {
      marketId,
      currentPrice,
      deviationFromLast,
    });
  } catch (error) {
    throw new Error("Can't set price level in redis");
  }
}

// get all price data level
export async function getPriceLevel(marketId: string) {
  try {
    return await client.hGetAll(keys(marketId).priceLevel);
  } catch (error) {
    throw new Error("Can't get price level in redis.");
  }
}
