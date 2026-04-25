import { HermesClient } from "@pythnetwork/hermes-client";
import type { pythPrice } from "./types.js";
import { FEED_IDS } from "./feedIds";

const priceCache =  new Map<string, pythPrice>();

export function getCachedPrice(symbol:string): pythPrice | undefined {
    return priceCache.get(symbol);
}

export async function startPriceStream(symbols:string[]):Promise<void> {
    const client = new HermesClient("https://hermes.pyth.network");
    const feedIds = symbols.map(s=>{
        if (!FEED_IDS[s]) throw new Error(`Feed ID not found for symbol: ${s}`);
        return FEED_IDS[s];
    });
    const eventSource = await client.getPriceUpdatesStream(feedIds,{ parsed:true });
    eventSource.onopen = () => {
        console.log("[oracle] SSE connected to Pyth");
    };
    eventSource.onerror = (err)=>{
        console.error("[oracle] SSE error:", err);
    }
    eventSource.onmessage = (event)=>{
        const data = JSON.parse(event.data);
        for (const item of data.parsed ?? []) {
            const exp = item.price.expo;
            const symbol = Object.keys(FEED_IDS).find(k =>
                FEED_IDS[k].replace(/^0x/i, "") === item.id.replace(/^0x/i, "")
            );
            if (symbol) {
                priceCache.set(symbol,{
                    feedId: item.id,
                    price: Number(item.price.price) * Math.pow(10, exp),
                    confidence: Number(item.price.conf) * Math.pow(10, exp),
                    publishTime: item.price.publish_time,
                });
            } 
        }
    };
    eventSource.onopen = () => {
        console.log("[oracle] SSE connected to Pyth");
    };
    eventSource.onerror = (err)=>{
        console.error("[oracle] SSE error:", err);
    }
}


