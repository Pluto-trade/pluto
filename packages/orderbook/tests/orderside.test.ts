import { describe, it, expect } from "vitest";
import { BookSide } from "../src/orderside";
import { ILimitOrder, OrderSide, OrderStatus, OrderType } from "../src/types";

function lim(id:string, side: OrderSide, price:number, size: number): ILimitOrder {
    return {
        id, userId: "u1", marketId: "m1", side,
        type: OrderType.LIMIT,
        price,
        size,
        remainingSize: size,
        status: OrderStatus.OPEN,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
};

describe("BookSide - bids", ()=>{
    it("starts empty", ()=>{
        const bids = new BookSide(OrderSide.BUY);
        expect(bids.bestPrice()).toBeUndefined();
        expect(bids.totalVolume).toBe(0);
        expect(bids.isEmpty).toBe(true);
    });
    it("best bid is the highest price",()=>{
        const bids = new BookSide(OrderSide.BUY);
        bids.append(lim("a",OrderSide.BUY,100,1));
        bids.append(lim("b",OrderSide.BUY,102,1));
        bids.append(lim("c", OrderSide.BUY, 99 ,1));
        expect(bids.bestPrice()).toBe(102);
        expect(bids.priceList()).toEqual([102, 100, 99]);
    });
    it("aggregates orders at the same price",()=>{
        const bids = new BookSide(OrderSide.BUY);
        bids.append(lim("a", OrderSide.BUY, 100, 5));
        bids.append(lim("b", OrderSide.BUY, 100, 3));
        expect(bids.levelCount).toBe(1);
        expect(bids.bestQueue()?.size).toBe(2);
        expect(bids.bestQueue()?.volume).toBe(8);
    });
    it("removes empty levels after the last order is cancelled",()=>{
        const bids = new BookSide(OrderSide.BUY);
        bids.append(lim("a",OrderSide.BUY, 100, 1));
        bids.append(lim("b",OrderSide.BUY, 102, 1));
        bids.remove("b");
        expect(bids.priceList()).toEqual([100]);
        expect(bids.bestPrice()).toBe(100);
    });
    it("walks visits levels best to worst and supports early breaks",()=>{
        const bids = new BookSide(OrderSide.BUY);
        [99,102,100].forEach((p, i)=>{
            bids.append(lim(`o${i}`,OrderSide.BUY, p, 1));
        });
        const visited: number [] = [];
        bids.walk((q)=>{
            visited.push(q.price);
            return q.price === 100;
        });
        expect(visited).toEqual([102,100]);
    });
    it("update tracks totalVolume after a partial fill", () =>{
        const bids = new BookSide(OrderSide.BUY);
        bids.append(lim("a",OrderSide.BUY, 100, 5));
        const filled:ILimitOrder = { ...lim("a",OrderSide.BUY, 100, 5), remainingSize: 2 };
        bids.update(filled);
        expect(bids.totalVolume).toBe(2);
    });
    it("update with a mismatched price refuses",() =>{
        const bids = new BookSide(OrderSide.BUY);
        bids.append(lim("a",OrderSide.BUY, 100, 5));
        const filled:ILimitOrder = { ...lim("a",OrderSide.BUY, 101, 5), remainingSize: 5 };
        expect(bids.update(filled)).toBeUndefined();
        expect(bids.totalVolume).toBe(5);
    });
});

describe ("BookSide - asks", ()=>{
    it("best ask is the lowest price", () => {
        const asks = new BookSide(OrderSide.SELL);
        asks.append(lim("a",OrderSide.SELL, 102, 1));
        asks.append(lim("b",OrderSide.SELL, 100, 1));
        asks.append(lim("c", OrderSide.SELL, 101 ,1));
        expect(asks.bestPrice()).toBe(100);
        expect(asks.priceList()).toEqual([100, 101, 102]);
    });
    it("depth(n) caps to n levels",()=>{
        const asks = new BookSide(OrderSide.SELL);
        [100,101,102,103,104].forEach((p, i)=>
            asks.append(lim(`o${i}`,OrderSide.SELL, p, 1)),
        );
        const d = asks.depth(3);
        expect(d.map((l)=> l.price)).toEqual([100,101,102]);
    });
});