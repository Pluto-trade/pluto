export enum Side {
	BUY = "buy",
	SELL = "sell",
}

export enum OrderType {
	LIMIT = "limit",
	MARKET = "market",
	OCO = "oco",
	STOP_MARKET = "stop_market",
	STOP_LIMIT = "stop_limit",
}

export enum TimeInForce {
	GTC = "GTC",
	IOC = "IOC",
	FOK = "FOK",
}

export interface IError {
	code: number;
	message: string;
}

export type OrderBookError = IError;

//order interface with necessary fields for the orderbook
export interface IOrder {
	id: string;
	side: Side;
	size: number;
	type: OrderType;
	price?: number;
	timeInForce?: TimeInForce;
	postOnly?: boolean;
	time?: number;
	origSize?: number;
	takerQty?: number;
	makerQty?: number;
	ocoStopPrice?: number;
	stopPrice?: number;
	isOCO?: boolean;
}

export interface ILimitOrder extends IOrder {
	type: OrderType.LIMIT;
	price: number;
}

export type StopOrder = IStopLimitOrder | IStopMarketOrder;

export interface IStopMarketOrder extends IOrder {
	type: OrderType.STOP_MARKET;
	stopPrice: number;
}

export interface IStopLimitOrder extends IOrder {
	type: OrderType.STOP_LIMIT;
	price: number;
	stopPrice: number;
}

export interface BaseOrderInput {
	side: Side;
	size: number;
}

export interface MarketOrderOptions extends BaseOrderInput {
	id?: string;
}

export interface LimitOrderOptions extends BaseOrderInput {
	id: string;
	price: number;
	timeInForce?: TimeInForce;
	ocoStopPrice?: number;
}

export interface StopMarketOrderOptions extends BaseOrderInput {
	stopPrice: number;
}

export interface StopLimitOrderOptions extends BaseOrderInput {
	id: string;
	price: number;
	stopPrice: number;
	timeInForce?: TimeInForce;
	isOCO?: boolean;
}

export interface OCOOrderOptions extends BaseOrderInput {
	id: string;
	price: number;
	stopPrice: number;
	stopLimitPrice: number;
	timeInForce?: TimeInForce;
	stopLimitTimeInForce?: TimeInForce;
}

export type CreateOrderOptions =
	| (MarketOrderOptions & { type: OrderType.MARKET })
	| (LimitOrderOptions & { type: OrderType.LIMIT })
	| (StopMarketOrderOptions & { type: OrderType.STOP_MARKET })
	| (StopLimitOrderOptions & { type: OrderType.STOP_LIMIT })
	| (OCOOrderOptions & { type: OrderType.OCO });

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
	activated: IOrder[];
	partial: IOrder | null;
	partialQuantityProcessed: number;
	quantityLeft: number;
	err: OrderBookError | null;
	log?: OpLog;
}

export interface ICancelOrder {
	order?: IOrder;
	stopOrder?: IOrder;
	log?: OpLog;
}

export type JournalLog =
	| { op: "m"; o: MarketOrderOptions; opId?: number; ts?: number }
	| { op: "l"; o: LimitOrderOptions; opId?: number; ts?: number }
	| { op: "sm"; o: StopMarketOrderOptions; opId?: number; ts?: number }
	| { op: "sl"; o: StopLimitOrderOptions; opId?: number; ts?: number }
	| { op: "oco"; o: OCOOrderOptions; opId?: number; ts?: number }
	| { op: "d"; o: { orderID: string }; opId?: number; ts?: number }
	| {
			op: "u";
			o: { orderID: string; orderUpdate: OrderUpdatePrice | OrderUpdateSize };
			opId?: number;
			ts?: number;
	  };

export interface OpLog {
	opId: number;
	ts: number;
	op: "m" | "l" | "sm" | "sl" | "oco" | "d" | "u";
	o: unknown;
}

export interface BookLevelSnapshot {
	price: number;
	orders: ILimitOrder[];
}

export interface StopBookSnapshot {
	bids: BookLevelSnapshot[];
	asks: BookLevelSnapshot[];
}

export interface Snapshot {
	bids: BookLevelSnapshot[];
	asks: BookLevelSnapshot[];
	stopBook?: StopBookSnapshot;
	ts: number;
	lastOp: number;
}

export interface OrderBookOptions {
	snapshot?: Snapshot;
	journal?: JournalLog[];
	enableJournaling?: boolean;
}
