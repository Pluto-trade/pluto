/**
 * In-memory / API shapes aligned with `packages/database/prisma/schema.prisma` (`Order`, enums).
 * Use `string` or `number` for sizes and prices in the book; map `Decimal` at the OMS/DB layer.
 */
export enum OrderSide {
	BUY = "BUY",
	SELL = "SELL",
}

export enum OrderType {
	LIMIT = "LIMIT",
	MARKET = "MARKET",
}

export enum OrderStatus {
	ACCEPTED = "ACCEPTED",
	OPEN = "OPEN",
	PARTIALLY_FILLED = "PARTIALLY_FILLED",
	FILLED = "FILLED",
	CANCELLED = "CANCELLED",
}

export interface IError {
	code: number;
	message: string;
}

export type OrderBookError = IError;

export interface IOrder {
	id: string;
	userId: string;
	marketId: string;
	side: OrderSide;
	type: OrderType;
	price: number | null;
	size: number;
	remainingSize: number;
	status: OrderStatus;
	createdAt?: number;
	updatedAt?: number;
}

export interface ILimitOrder extends IOrder {
	type: OrderType.LIMIT;
	price: number;
}

export interface IMarketOrder extends IOrder {
	type: OrderType.MARKET;
	price: null;
}

export interface BaseOrderInput {
	side: OrderSide;
	size: number;
}

export interface MarketOrderOptions extends BaseOrderInput {
	id?: string;
	userId: string;
	marketId: string;
}

export interface LimitOrderOptions extends BaseOrderInput {
	id: string;
	userId: string;
	marketId: string;
	price: number;
}

export type CreateOrderOptions =
	| (MarketOrderOptions & { type: OrderType.MARKET })
	| (LimitOrderOptions & { type: OrderType.LIMIT });

export interface OrderUpdatePrice {
	price: number;
	size?: number;
}

export interface OrderUpdateSize {
	price?: number;
	size: number;
}

export interface IProcessOrder {
	done: IOrder[];
	partial: IOrder | null;
	partialQuantityProcessed: number;
	quantityLeft: number;
	err: OrderBookError | null;
}

export interface ICancelOrder {
	order?: IOrder;
}

export interface BookLevelSnapshot {
	price: number;
	orders: ILimitOrder[];
}

export interface Snapshot {
	bids: BookLevelSnapshot[];
	asks: BookLevelSnapshot[];
	ts: number;
}
