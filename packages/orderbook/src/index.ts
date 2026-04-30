/**
 * Public API for `@repo/orderbook`.
 *
 * The Helpers and Internals groups are exposed for the matching engine, the OMS layer,
 * and tests — not for general application code.
 */

export { OrderBook } from "./orderbook.js";

export {
	OrderSide,
	OrderType,
	OrderStatus,
} from "./types.js";

export type {
	IOrder,
	ILimitOrder,
	IMarketOrder,
	LimitOrderOptions,
	MarketOrderOptions,
	CreateOrderOptions,
	IProcessOrder,
	BookLevelSnapshot,
	Snapshot,
} from "./types.js";

export type { DepthLevel } from "./orderside.js";

export { ERROR, orderBookError } from "./errors.js";
export type { ErrorCode } from "./errors.js";
export type { OrderBookError } from "./types.js";

// helpers 
// Pure factory + state-transition functions. Useful when building orders
// outside the book (matching engine, tests, OMS persistence layer).

export {
	createOrder,
	createLimitOrder,
	createMarketOrder,
	applyFill,
	cancelOrder,
} from "./order.js";

// Internals
// Lower-level building blocks. Exported for tests and the matching engine
// (which needs `walk` / `bestQueue` to drain liquidity). Application code

export { BookSide } from "./orderside.js";
export { OrderQueue } from "./orderqueue.js";
