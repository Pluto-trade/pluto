import { ERROR, orderBookError } from "./errors.js";
import { createLimitOrder } from "./order.js";
import { BookSide, type DepthLevel } from "./orderside.js";
import {
	OrderSide,
	OrderStatus,
	type BookLevelSnapshot,
	type ILimitOrder,
	type IProcessOrder,
	type LimitOrderOptions,
	type OrderBookError,
	type Snapshot,
} from "./types.js";

interface IndexEntry {
	order: ILimitOrder;
	side: OrderSide;
}

/**
 * Per-market order book. Owns one `BookSide` for bids and one for asks,
 * plus an `orderId → side` index so cancels are O(1).
 *
 * v1: stores resting limit orders only. `addLimit` rejects orders that
 * would cross the spread (those are the matching engine's job, which
 * lives in `services/matching` and is not implemented here yet).
 */
export class OrderBook {
	private readonly bids = new BookSide(OrderSide.BUY);
	private readonly asks = new BookSide(OrderSide.SELL);
	private readonly orderIndex: Map<string, IndexEntry> = new Map();

	constructor(public readonly marketId: string) {}

	get totalOrders(): number {
		return this.orderIndex.size;
	}

	get isEmpty(): boolean {
		return this.orderIndex.size === 0;
	}

	bestBid(): number | undefined {
		return this.bids.bestPrice();
	}

	bestAsk(): number | undefined {
		return this.asks.bestPrice();
	}

	/** `bestAsk - bestBid`, or `undefined` if either side is empty. */
	spread(): number | undefined {
		const bid = this.bestBid();
		const ask = this.bestAsk();
		if (bid === undefined || ask === undefined) return undefined;
		return ask - bid;
	}

	/** `(bestAsk + bestBid) / 2`, or `undefined` if either side is empty. */
	midPrice(): number | undefined {
		const bid = this.bestBid();
		const ask = this.bestAsk();
		if (bid === undefined || ask === undefined) return undefined;
		return (ask + bid) / 2;
	}

	has(orderId: string): boolean {
		return this.orderIndex.has(orderId);
	}

	getOrder(orderId: string): ILimitOrder | undefined {
		return this.orderIndex.get(orderId)?.order;
	}

	/**
	 * Rest a new limit order on the book.
	 *
	 * Rejects when:
	 * - `marketId` does not match this book
	 * - an order with the same id already exists
	 * - the order is invalid (validation in `createLimitOrder`)
	 * - the order would cross the spread (matching is not implemented yet)
	 *
	 * On success the order rests with status `OPEN` and `quantityLeft = size`.
	 */
	addLimit(options: LimitOrderOptions, now = Date.now()): IProcessOrder {
		if (options.marketId !== this.marketId) {
			return errorResult(
				orderBookError(
					ERROR.MARKET_MISMATCH,
					`Order marketId "${options.marketId}" does not match book "${this.marketId}"`,
				),
			);
		}
		if (options.id && this.orderIndex.has(options.id)) {
			return errorResult(
				orderBookError(
					ERROR.ORDER_DUPLICATE_ID,
					`Order with id "${options.id}" already exists`,
				),
			);
		}

		let built: ILimitOrder;
		try {
			built = createLimitOrder(options, now);
		} catch (e) {
			return errorResult(toOrderBookError(e));
		}

		if (this.wouldCross(built)) {
			return errorResult(
				orderBookError(
					ERROR.LIMIT_WOULD_CROSS,
					`Crossing limit order is not supported (matching engine not implemented)`,
				),
			);
		}

		const resting: ILimitOrder = { ...built, status: OrderStatus.OPEN };
		const side = resting.side === OrderSide.BUY ? this.bids : this.asks;
		side.append(resting);
		this.orderIndex.set(resting.id, { order: resting, side: resting.side });

		return {
			done: [],
			partial: null,
			partialQuantityProcessed: 0,
			quantityLeft: resting.remainingSize,
			err: null,
		};
	}

	/**
	 * Cancel an order by id. Returns the cancelled order (status set to
	 * `CANCELLED`, `updatedAt` refreshed) or `undefined` if not found.
	 */
	cancel(orderId: string, now = Date.now()): ILimitOrder | undefined {
		const entry = this.orderIndex.get(orderId);
		if (entry === undefined) return undefined;
		const sideRef = entry.side === OrderSide.BUY ? this.bids : this.asks;
		const removed = sideRef.remove(orderId);
		if (removed === undefined) return undefined;
		this.orderIndex.delete(orderId);
		return { ...removed, status: OrderStatus.CANCELLED, updatedAt: now };
	}

	/** Aggregated price-level view, top → bottom on each side. */
	depth(maxLevels?: number): { bids: DepthLevel[]; asks: DepthLevel[] } {
		return {
			bids: this.bids.depth(maxLevels),
			asks: this.asks.depth(maxLevels),
		};
	}

	/** Full snapshot — every resting order at every level, plus a timestamp. */
	snapshot(now = Date.now()): Snapshot {
		return {
			bids: collectLevels(this.bids),
			asks: collectLevels(this.asks),
			ts: now,
		};
	}

	/**
	 * Would this incoming limit order cross the opposite best price?
	 * - BUY crosses when `price >= bestAsk`
	 * - SELL crosses when `price <= bestBid`
	 */
	private wouldCross(order: ILimitOrder): boolean {
		if (order.side === OrderSide.BUY) {
			const bestAsk = this.asks.bestPrice();
			return bestAsk !== undefined && order.price >= bestAsk;
		}
		const bestBid = this.bids.bestPrice();
		return bestBid !== undefined && order.price <= bestBid;
	}
}

function errorResult(err: OrderBookError): IProcessOrder {
	return {
		done: [],
		partial: null,
		partialQuantityProcessed: 0,
		quantityLeft: 0,
		err,
	};
}

function collectLevels(side: BookSide): BookLevelSnapshot[] {
	const out: BookLevelSnapshot[] = [];
	side.walk((queue) => {
		out.push({ price: queue.price, orders: queue.toArray() });
	});
	return out;
}

/** Coerce anything thrown by the validating factories into our error shape. */
function toOrderBookError(e: unknown): OrderBookError {
	if (
		e !== null &&
		typeof e === "object" &&
		"code" in e &&
		"message" in e &&
		typeof (e as { code: unknown }).code === "number" &&
		typeof (e as { message: unknown }).message === "string"
	) {
		return e as OrderBookError;
	}
	return orderBookError(
		ERROR.UNKNOWN,
		e instanceof Error ? e.message : String(e),
	);
}
