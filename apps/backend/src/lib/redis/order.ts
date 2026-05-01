import { OrderSide, OrderType } from "@repo/database";
import { getRedisClient } from ".";
import { keys } from "./keys";

const client = getRedisClient();

export async function setOrder(orderId: string, marketId:string, side: OrderSide, size: string, price: string, type: OrderType) {
    try {
        const orderKey = `order:${orderId}`
        const {bids, asks, priceQueue} = keys(marketId,  side, price)

        await client.hSet(orderKey, {
            orderId,
            marketId,
            side,
            size,
            price,
            type
        })

        const bookKey = side == "BUY" ? bids : asks

        // add the current price level in the orderbook
        await client.zAdd(bookKey, {
            value: price,
            score: Number(price)
        })

        // FIFO the order queue at this price level
        await client.rPush(priceQueue, orderId)
    } catch (error) {
        throw new Error("Can't set order in the orderbook")
    }
}

// get one order
export async function getOrder(orderId:string) {
    try {
        await client.hGetAll(`order:${orderId}`)
    } catch (error) {
        throw new Error("Can't get the requested order")
    }
}

