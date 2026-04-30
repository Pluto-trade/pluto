import type { ILimitOrder } from "./types.js";

export class OrderQueue implements Iterable<ILimitOrder> {
	private readonly orders: Map<string, ILimitOrder> = new Map();
	private _volume = 0;

	constructor(private readonly _price: number) {}

	get price(): number {
		return this._price;
	}

	get size(): number {
		return this.orders.size;
	}

	get volume(): number {
		return this._volume;
	}

	get isEmpty(): boolean {
		return this.orders.size === 0;
	}

	append(order: ILimitOrder): ILimitOrder {
		this.orders.set(order.id, order);
		this._volume += order.remainingSize;
		return order;
	}

	remove(orderId: string): ILimitOrder | undefined {
		const order = this.orders.get(orderId);
		if (order === undefined) return undefined;
		this.orders.delete(orderId);
		this._volume -= order.remainingSize;
		return order;
	}
	head(): ILimitOrder | undefined {
		const first = this.orders.values().next();
		return first.done === true ? undefined : first.value;
	}

	removeFromHead(): ILimitOrder | undefined {
		const head = this.head();
		return head === undefined ? undefined : this.remove(head.id);
	}

	update(updated: ILimitOrder): ILimitOrder | undefined {
		const existing = this.orders.get(updated.id);
		if (existing === undefined) return undefined;
		this._volume += updated.remainingSize - existing.remainingSize;
		this.orders.set(updated.id, updated);
		return updated;
	}

	toArray(): ILimitOrder[] {
		return Array.from(this.orders.values());
	}

	[Symbol.iterator](): IterableIterator<ILimitOrder> { // iterator here is for ..of loop syntax which loops though each order in the array created
		return this.orders.values();
	}
}
