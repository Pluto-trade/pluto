import { describe, it, expect } from "vitest";
import { OrderBook } from "../src/orderbook.js";
import { ERROR } from "../src/errors.js";
import { OrderSide, OrderStatus, LimitOrderOptions, MarketOrderOptions } from "../src/types.js";

function buy(id: string, size: number, price: number): LimitOrderOptions {
    return { id, userId: "ul", marketId: "m1", side: OrderSide.BUY, price, size };
};

function sell(id:string, size:number, price:number): LimitOrderOptions {
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
});

describe("OrderBook - rejections" , () =>{
    it("rejects market mismatch", () => {
        const book = new OrderBook("m1");
        const r = book.addLimit({ ...buy("o1", 100, 1), marketId: "OTHER" });
        expect(r.err?.code).toBe(ERROR.MARKET_MISMATCH);
        expect(book.totalOrders).toBe(0);
    });
    it("rejects duplicate order id", () => {
        const book = new OrderBook("m1");
        book.addLimit(buy("o1", 100, 1));
        const r = book.addLimit(buy("o1", 100, 1));
        expect(r.err?.code).toBe(ERROR.ORDER_DUPLICATE_ID);
        expect(book.totalOrders).toBe(1);
    });
    it("rejects invalid order size", () => {
        const book = new OrderBook("m1");
        book.addLimit(buy("o1",100,1));
        const r = book.addLimit(buy("o1",101,1));
        expect(r.err?.code).toBe(ERROR.INVALID_SIZE);
        expect(book.totalOrders).toBe(1);
    });
    it("rejects a crossing buy", ()=>{
        const book = new OrderBook("m1");
        book.addLimit(buy("b1",100,5));
        const r = book.addLimit(buy("o1",101,1));
        expect(r.err?.code).toBe(ERROR.LIMIT_WOULD_CROSS);
        expect(book.totalOrders).toBe(1);
    });
    it("rejects a crossing sell", ()=>{
        const book = new OrderBook("m1");
        book.addLimit(sell("s1",101,5));
        const r = book.addLimit(sell("o1",100,1));
        expect(r.err?.code).toBe(ERROR.LIMIT_WOULD_CROSS);
        expect(book.totalOrders).toBe(1);
    });
    it("touching the spread (price ==best opposite) is treated as crossing", ()=>{
        const book = new OrderBook("m1");
        book.addLimit(buy("b1",100,1)); 
        const r = book.addLimit(sell("s1",99,1));
        expect(r.err?.code).toBe(ERROR.LIMIT_WOULD_CROSS);
    });
    describe("Orderbook-cancels", ()=>{
        it("cancels an order and prunes the level if it was last", ()=>{
            const book = new OrderBook("m1");
            book.addLimit(buy("o1",100,1));
            const cancelled = book.cancel("o1");
            expect(cancelled?.status).toBe(OrderStatus.CANCELLED);
            expect(book.totalOrders).toBe(0);
            expect(book.bestBid()).toBeUndefined();
        });
        it ("a cancelled id can be reused", ()=>{
            const book = new OrderBook("m1");
            book.addLimit(buy("o1",100,1));
            book.cancel("o1");
            const r = book.addLimit(buy("o1",100,1));
            expect(r.err).toBeNull();
            expect(r.quantityLeft).toBe(1);
            expect(book.totalOrders).toBe(1);
            expect(book.bestBid()).toBe(100);
        });
    });
    describe("OrderBook - depth and snapshot", ()=>{
        it("depth aggregates by price on each side", ()=>{
            const book = new OrderBook("m1");
            book.addLimit(buy("b1",100,5));
            book.addLimit(buy("b2",100,3));
            book.addLimit(buy("b3",100,1));
            book.addLimit(buy("b4",100,2));
            const d = book.depth();
            expect(d.bids).toEqual([
                { price: 100, volume: 8, orders: 2 },
                { price: 99, volume: 1, orders: 1 },
            ]);
            expect(d.asks).toEqual([]);
        });
        it("snapshot includes every resting order with timestamp", ()=>{
            const book = new OrderBook("m1");
            book.addLimit(buy("b1",100,5));
            book.addLimit(buy("b2",100,3));
            const snapshot = book.snapshot();
            expect(snapshot.bids[0].price).toBe(100);
            expect(snapshot.bids[0].orders.map((o)=>o.id)).toEqual(["b1","b2"]);
            expect(typeof snapshot.ts).toBe("number");
        });
    });
});

