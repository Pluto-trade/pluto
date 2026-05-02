import { OrderSide } from "@repo/database";

export function keys(marketId: string, side? : OrderSide, price? : string) {
    return {
        bids: `orderbook:${marketId}:bids`,
        asks: `orderbook:${marketId}:asks`,
        priceQueue: side && price ? `orderbook:${marketId}:${side}:${price}` : "",
        orderMeta: side && price ? `orderbook:${marketId}:${side}:${price}:meta` : ""
    }
}
