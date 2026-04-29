import { OrderBook, OrderType, Side } from "nodejs-order-book";

const ob = new OrderBook();

const order = ob.createOrder({
	type: OrderType.LIMIT,
	side: Side.BUY,
	size: 60,
	price: 120,
	id: "1234"
})

// ask order
ob.limit({ side: Side.SELL, id: "1235", size: 55, price: 121 })

// console.log(order);
console.log(ob.snapshot());