import { HermesClient } from "@pythnetwork/hermes-client";
import type { pythPrice } from "./types";
import { FEED_IDS } from "./feedIds";

const client = new HermesClient("https://hermes.pyth.network");

export async function fetchLatestPrice(symbol: string): Promise<pythPrice> {
    const feedId = FEED_IDS[symbol];
    if (!feedId) {
        throw new Error(`Feed ID not found for symbol: ${symbol}`);
    };
    const response = await client.getLatestPriceUpdates([feedId]);
    if (response.length === 0) {
        throw new Error(`No price updates found for symbol: ${symbol}`);
    };
    const item = response.parsed?.[0];
    if (!item) throw new Error(`No price data returned for ${symbol}`);
    const exp = item.price.expo;
    const rawPrice = Number(item.price.price);
    const rawConf = Number(item.price.conf);

    return {
        feedId,
        price: rawPrice * Math.pow(10, exp),
        confidence: rawConf * Math.pow(10, exp),
        publishTime: item.price.publish_time,
    };
}