import { describe, it, expect } from "vitest";
import { OrderBook } from "../orderbook.js";
import { ERROR } from "../errors.js";
import { OrderSide, OrderStatus, LimitOrderOptions, MarketOrderOptions } from "../types.js";\

function buy(id: string, size: number, price: number): LimitOrderOptions {
    return { id, userId: "ul", marketId: "m1", side: OrderSide.BUY, price, size };
};

function sell(id:string, price:number, size:number): LimitOrderOptions {
    return { id,userId:"u1",marketId:"m1", side:OrderSide.SELL, price,size };
};

describe("OrderBook", () =>{
    it("rests a single bid",()=>{
        const book = new OrderBook("m1");
        const r = book.addLimit(buy("o1",100,5));
        expect(r.err).toBeNull();
        expect(r.quantityLeft).toBe(5);
        expect(book.bestBid()).toBe(100);
        expect(book.totalOrders).toBe(1);
    });
    it("computes spread and midPrice once both sides have liquidity",()=>{
        const book = new OrderBook("m1");
        book.addLimit(buy("b1",100,5));
        book.addLimit(sell("s1",102,3));
        expect(book.bestBid()).toBe(100);
        expect(book.bestAsk()).toBe(102);
        expect(book.spread()).toBe(2);
        expect(book.midPrice()).toBe(101);
        expect(book.totalOrders).toBe(2);
    });
    it("getOrder returns the resting order with status OPEN", () => {
        const book = new OrderBook("m1");
        book.addLimit(buy("o1", 100, 5));
        expect(book.getOrder("o1")?.status).toBe(OrderStatus.OPEN);
      });
})