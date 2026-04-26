import type { OrderBookError } from "./types.js";

export const ERROR = {
	UNKNOWN: 0,
	INVALID_ID: 1,
	INVALID_MARKET: 2,
	INVALID_SIDE: 3,
	INVALID_SIZE: 4,
	INVALID_PRICE: 5,
	INVALID_USER_ID: 6,
	INVALID_MARKET_ID: 7,
	INVALID_ORDER_ID: 8,
	INVALID_ORDER_TYPE: 9,
	INVALID_ORDER_STATUS: 10,
	INVALID_ORDER_CREATED_AT: 11,
	INVALID_ORDER_UPDATED_AT: 12,
	INVALID_ORDER_REMAINING_SIZE: 13,
	INVALID_ORDER_FILL_SIZE: 14,
} as const;

export type ErrorCode = (typeof ERROR)[keyof typeof ERROR];

export function orderBookError(code: ErrorCode, message: string): OrderBookError {
	return { code, message };
}
