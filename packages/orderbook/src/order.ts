import { randomUUID } from "node:crypto";
import { ERROR, orderBookError } from "./errors.js";
import {
	OrderStatus,
	OrderType,
	type CreateOrderOptions,
	type ILimitOrder,
	type IMarketOrder,
	type IOrder,
	type LimitOrderOptions,
	type MarketOrderOptions,
} from "./types.js";

function isPositiveNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function createOrder(
	options: CreateOrderOptions,
	now = Date.now(),
): ILimitOrder | IMarketOrder {
	return options.type === OrderType.LIMIT
		? createLimitOrder(options, now)
		: createMarketOrder(options, now);
}

export function createLimitOrder(
	options: LimitOrderOptions,
	now = Date.now(),
): ILimitOrder {
	if (!options.id) {
		throw orderBookError(ERROR.INVALID_ID, "Order ID is required");
	}
	if (!options.userId) {
		throw orderBookError(ERROR.INVALID_USER_ID, "User ID is required");
	}
	if (!options.marketId) {
		throw orderBookError(ERROR.INVALID_MARKET_ID, "Market ID is required");
	}
	if (!options.side) {
		throw orderBookError(ERROR.INVALID_SIDE, "Side is required");
	}
	if (!isPositiveNumber(options.price)) {
		throw orderBookError(ERROR.INVALID_PRICE, "Price must be a positive number");
	}
	if (!isPositiveNumber(options.size)) {
		throw orderBookError(ERROR.INVALID_SIZE, "Size must be a positive number");
	}
	return {
		id: options.id,
		userId: options.userId,
		marketId: options.marketId,
		side: options.side,
		type: OrderType.LIMIT,
		price: options.price,
		size: options.size,
		remainingSize: options.size,
		status: OrderStatus.ACCEPTED,
		createdAt: now,
		updatedAt: now,
	};
}

export function createMarketOrder(
	options: MarketOrderOptions,
	now = Date.now(),
): IMarketOrder {
	if (!options.userId) {
		throw orderBookError(ERROR.INVALID_USER_ID, "User ID is required");
	}
	if (!options.marketId) {
		throw orderBookError(ERROR.INVALID_MARKET_ID, "Market ID is required");
	}
	if (!options.side) {
		throw orderBookError(ERROR.INVALID_SIDE, "Side is required");
	}
	if (!isPositiveNumber(options.size)) {
		throw orderBookError(ERROR.INVALID_SIZE, "Size must be a positive number");
	}
	return {
		id: options.id ?? randomUUID(),
		userId: options.userId,
		marketId: options.marketId,
		side: options.side,
		type: OrderType.MARKET,
		price: null,
		size: options.size,
		remainingSize: options.size,
		status: OrderStatus.ACCEPTED,
		createdAt: now,
		updatedAt: now,
	};
}

export function applyFill(
	order: IOrder,
	fillSize: number,
	now = Date.now(),
): IOrder {
	if (!Number.isFinite(fillSize) || fillSize <= 0) {
		throw new RangeError("fillSize must be a positive finite number");
	}
	if (fillSize > order.remainingSize) {
		throw new RangeError("fillSize cannot exceed remainingSize");
	}
	const remainingSize = order.remainingSize - fillSize;
	const status =
		remainingSize === 0 ? OrderStatus.FILLED : OrderStatus.PARTIALLY_FILLED;
	return { ...order, remainingSize, status, updatedAt: now };
}

export function cancelOrder(order: IOrder, now = Date.now()): IOrder {
	return { ...order, status: OrderStatus.CANCELLED, updatedAt: now };
}
