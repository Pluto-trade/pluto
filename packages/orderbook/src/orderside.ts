import { OrderQueue } from "./orderqueue.js";
import { OrderSide, type ILimitOrder } from "./types.js";

export interface DepthLevel {
	price: number;
	volume: number;
	orders: number;
}

/**
 * Normalize prices to 8 decimal places to avoid floating-point precision issues
 * when using prices as Map keys. Example: 10.1 + 0.2 + 0.2 !== 10.5 in IEEE 754,
 * but normalizationPrice(10.5) will always return the same value.
 */
function normalizePrice(price: number): number {
	return Math.round(price * 100000000) / 100000000;
}

export class BookSide {
	private readonly queues: Map<number, OrderQueue> = new Map();
	private readonly orderToPrice: Map<string, number> = new Map();
	private readonly prices: number[] = [];
	private _totalVolume = 0;

	constructor(private readonly _side: OrderSide) {}

	get side(): OrderSide {
		return this._side;
	}

	get totalVolume(): number {
		return this._totalVolume;
	}

	get totalOrders(): number {
		return this.orderToPrice.size;
	}

	get levelCount(): number {
		return this.prices.length;
	}

	get isEmpty(): boolean {
		return this.prices.length === 0;
	}

	/** Best price on this side (highest bid / lowest ask), or `undefined` if empty. */
	bestPrice(): number | undefined {
		return this.prices[0];
	}

	/** Best price level (next to fill), or `undefined` if empty. */
	bestQueue(): OrderQueue | undefined {
		const p = this.prices[0];
		return p === undefined ? undefined : this.queues.get(p);
	}

	/** Look up a price level directly. */
	getQueue(price: number): OrderQueue | undefined {
		return this.queues.get(normalizePrice(price));
	}

	/**
	 * Append a limit order to its price level (creates the level if missing).
	 * Caller is responsible for duplicate-id checks (lives in OrderBook).
	 */
	append(order: ILimitOrder): ILimitOrder {
		const normalizedPrice = normalizePrice(order.price);
		let queue = this.queues.get(normalizedPrice);
		if (queue === undefined) {
			queue = new OrderQueue(normalizedPrice);
			this.queues.set(normalizedPrice, queue);
			const idx = this.findInsertIndex(normalizedPrice);
			this.prices.splice(idx, 0, normalizedPrice);
		}
		queue.append(order);
		this.orderToPrice.set(order.id, normalizedPrice);
		this._totalVolume += order.remainingSize;
		return order;
	}

	/**
	 * Remove an order by id. Prunes the price level if it becomes empty.
	 * Returns the removed order or `undefined`.
	 */
	remove(orderId: string): ILimitOrder | undefined {
		const price = this.orderToPrice.get(orderId);
		if (price === undefined) return undefined;
		const normalizedPrice = normalizePrice(price);
		const queue = this.queues.get(normalizedPrice);
		if (queue === undefined) return undefined;
		const removed = queue.remove(orderId);
		if (removed === undefined) return undefined;
		this.orderToPrice.delete(orderId);
		this._totalVolume -= removed.remainingSize;
		if (queue.isEmpty) this.removePriceLevel(normalizedPrice);
		return removed;
	}

	/**
	 * Replace an order in place after a partial fill (FIFO position kept).
	 * The updated order's `price` must match its current price level.
	 */
	update(updated: ILimitOrder): ILimitOrder | undefined {
		const price = this.orderToPrice.get(updated.id);
		if (price === undefined) return undefined;
		const normalizedPrice = normalizePrice(price);
		const normalizedUpdatedPrice = normalizePrice(updated.price);
		if (normalizedPrice !== normalizedUpdatedPrice) return undefined;
		const queue = this.queues.get(normalizedPrice);
		if (queue === undefined) return undefined;
		const before = queue.volume;
		const result = queue.update(updated);
		if (result === undefined) return undefined;
		this._totalVolume += queue.volume - before;
		return result;
	}

	/**
	 * Walk price levels from best to worst.
	 * Return `true` from the visitor to break early.
	 */
	walk(visit: (queue: OrderQueue) => boolean | void): void {
		for (let i = 0; i < this.prices.length; i++) {
			const price = this.prices[i] as number;
			const queue = this.queues.get(price);
			if (queue === undefined) continue;
			if (visit(queue) === true) return;
		}
	}

	/**
	 * Top-of-book depth: up to `maxLevels` aggregated levels (best → worst).
	 */
	depth(maxLevels = Number.POSITIVE_INFINITY): DepthLevel[] {
		const out: DepthLevel[] = [];
		const limit = Math.min(this.prices.length, maxLevels);
		for (let i = 0; i < limit; i++) {
			const price = this.prices[i] as number;
			const queue = this.queues.get(price);
			if (queue === undefined) continue;
			out.push({ price, volume: queue.volume, orders: queue.size });
		}
		return out;
	}

	/** Sorted prices, best → worst. Snapshot — safe to mutate. */
	priceList(): number[] {
		return this.prices.slice();
	}

	private removePriceLevel(price: number): void {
		this.queues.delete(price);
		const idx = this.findExactIndex(price);
		if (idx >= 0) this.prices.splice(idx, 1);
	}

	/**
	 * `compare(a, b) < 0`  → `a` is **better** than `b` on this side.
	 * - BUY: higher is better → `b - a`
	 * - SELL: lower is better → `a - b`
	 */
	private compare(a: number, b: number): number {
		return this._side === OrderSide.BUY ? b - a : a - b;
	}

	/** Binary search: index where `price` should be inserted to keep `prices` sorted best toworst. */
	private findInsertIndex(price: number): number {
		const normalizedPrice = normalizePrice(price);
		let lo = 0;
		let hi = this.prices.length;
		while (lo < hi) {
			const mid = (lo + hi) >>> 1;
			const at = this.prices[mid] as number;
			if (this.compare(at, normalizedPrice) < 0) lo = mid + 1;
			else hi = mid;
		}
		return lo;
	}

	private findExactIndex(price: number): number {
		const normalizedPrice = normalizePrice(price);
		let lo = 0;
		let hi = this.prices.length - 1;
		while (lo <= hi) {
			const mid = (lo + hi) >>> 1;
			const at = this.prices[mid] as number;
			if (at === normalizedPrice) return mid;
			if (this.compare(at, normalizedPrice) < 0) lo = mid + 1;
			else hi = mid - 1;
		}
		return -1;
	}
}
