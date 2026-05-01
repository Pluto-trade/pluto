import { describe, it, expect, beforeEach } from "vitest";
import { OrderQueue } from "../src/orderqueue.js";
import { ILimitOrder, OrderSide, OrderStatus,OrderType } from "../src/types.js";

function lim(id: string, price: number, size: number): ILimitOrder {
    return {
        id,
        userId: "ul",
        marketId: "m1",
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        price,
        size,
        remainingSize: size,
        status: OrderStatus.OPEN,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

describe("OrderQueue", ()=>{
    let q: OrderQueue;
    beforeEach(()=>{
        q= new OrderQueue(100);
    });
    it("starts empty", ()=>{
        expect(q.size).toBe(0);
        expect(q.volume).toBe(0);
        expect(q.isEmpty).toBe(true);
        expect(q.head()).toBeUndefined();
        expect(q.removeFromHead()).toBeUndefined();
    });
    it("appends and tracks volume", ()=>{
        q.append(lim("a",100,5));
        q.append(lim("b",100,3));
        expect(q.size).toBe(2);
        expect(q.volume).toBe(8);
    });

    it("removes by id and adjusts volume",() =>{
    q.append(lim("a", 100, 1));
    q.append(lim("b", 100, 1));
    q.append(lim("c", 100, 1));
    expect(q.removeFromHead()?.id).toBe("a");
    expect(q.removeFromHead()?.id).toBe("b");
    expect(q.removeFromHead()?.id).toBe("c");        
    });

    it("removes by id and adjusts volume", ()=>{
        q.append(lim("a", 100, 1));
        q.append(lim("b",100,3));
        expect(q.remove("a")?.id).toBe("a");
        expect(q.volume).toBe(3);
        expect(q.remove("nope")).toBeUndefined();
    });
    it("update preserves FIFO position and adjusts volume", () => {
        q.append(lim("a", 100, 5));
        q.append(lim("b", 100, 3));
        const partiallyFilled: ILimitOrder = { ...lim("a", 100, 5), remainingSize: 2 };
        q.update(partiallyFilled);
        expect(q.volume).toBe(5);             // 2 + 3
        expect(q.head()?.id).toBe("a");       // still at the front
    });
    it("is iterable in FIFO order", () => {
        ["a", "b", "c"].forEach((id) => q.append(lim(id, 100, 1)));
        expect([...q].map((o) => o.id)).toEqual(["a", "b", "c"]);
      });
      it("toArray returns a snapshot, not a live view", () => {
        q.append(lim("a", 100, 1));
        const snap = q.toArray();
        snap.pop();
        expect(q.size).toBe(1); // mutation didn't affect queue
    });
})