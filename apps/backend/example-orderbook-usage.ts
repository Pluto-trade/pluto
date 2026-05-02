/**
 * Example demonstrating how to use @repo/orderbook package with the backend
 * 
 * This shows:
 * 1. Creating an orderbook for a market
 * 2. Placing multiple limit orders
 * 3. Viewing the orderbook snapshot
 * 4. Canceling orders
 */

import { OrderBook, OrderSide } from '@repo/orderbook';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';

// Create an orderbook for a specific market
const marketId = 'BTC-USD';
const orderbook = new OrderBook(marketId);

console.log('📊 Orderbook Example for Market:', marketId);
console.log('================================================\n');

// Helper function to generate order IDs
function generateOrderId() {
  return uuidv4();
}

// Place Buy Orders (Bids)
console.log('📥 Placing Buy Orders (Bids):');
const buyOrder1 = orderbook.addLimit({
  id: generateOrderId(),
  userId: 'user1',
  marketId,
  side: OrderSide.BUY,
  price: 42800,
  size: 0.5,
});
console.log(`  Order 1: BUY 0.5 BTC @ $42,800`, buyOrder1.err ? `[ERROR: ${buyOrder1.err.message}]` : '[✓ Success]');

const buyOrder2 = orderbook.addLimit({
  id: generateOrderId(),
  userId: 'user1',
  marketId,
  side: OrderSide.BUY,
  price: 42700,
  size: 1.2,
});
console.log(`  Order 2: BUY 1.2 BTC @ $42,700`, buyOrder2.err ? `[ERROR: ${buyOrder2.err.message}]` : '[✓ Success]');

const buyOrder3 = orderbook.addLimit({
  id: generateOrderId(),
  userId: 'user2',
  marketId,
  side: OrderSide.BUY,
  price: 42600,
  size: 2.0,
});
console.log(`  Order 3: BUY 2.0 BTC @ $42,600`, buyOrder3.err ? `[ERROR: ${buyOrder3.err.message}]` : '[✓ Success]');

console.log('');

// Place Sell Orders (Asks)
console.log('📤 Placing Sell Orders (Asks):');
const sellOrder1 = orderbook.addLimit({
  id: generateOrderId(),
  userId: 'user3',
  marketId,
  side: OrderSide.SELL,
  price: 43000,
  size: 0.8,
});
console.log(`  Order 4: SELL 0.8 BTC @ $43,000`, sellOrder1.err ? `[ERROR: ${sellOrder1.err.message}]` : '[✓ Success]');

const sellOrder2 = orderbook.addLimit({
  id: generateOrderId(),
  userId: 'user3',
  marketId,
  side: OrderSide.SELL,
  price: 43100,
  size: 1.5,
});
console.log(`  Order 5: SELL 1.5 BTC @ $43,100`, sellOrder2.err ? `[ERROR: ${sellOrder2.err.message}]` : '[✓ Success]');

const sellOrder3 = orderbook.addLimit({
  id: generateOrderId(),
  userId: 'user4',
  marketId,
  side: OrderSide.SELL,
  price: 43200,
  size: 3.0,
});
console.log(`  Order 6: SELL 3.0 BTC @ $43,200`, sellOrder3.err ? `[ERROR: ${sellOrder3.err.message}]` : '[✓ Success]');

console.log('\n================================================');
console.log('📋 Orderbook Snapshot After Placing Orders:');
console.log('================================================\n');

// Get the snapshot
const snapshot = orderbook.snapshot();

console.log('🟢 BIDS (Buy Orders):');
snapshot.bids.forEach((level) => {
  const totalSize = level.orders.reduce((sum, order) => sum + order.size, 0);
  const orders = level.orders.map(o => `${o.size}@${o.id.substring(0, 8)}`).join(', ');
  console.log(`  Price: $${level.price.toFixed(2).padStart(10)} | Size: ${totalSize.toFixed(2).padStart(6)} BTC | Orders: [${orders}]`);
});

console.log('\n🔴 ASKS (Sell Orders):');
snapshot.asks.forEach((level) => {
  const totalSize = level.orders.reduce((sum, order) => sum + order.size, 0);
  const orders = level.orders.map(o => `${o.size}@${o.id.substring(0, 8)}`).join(', ');
  console.log(`  Price: $${level.price.toFixed(2).padStart(10)} | Size: ${totalSize.toFixed(2).padStart(6)} BTC | Orders: [${orders}]`);
});

console.log('\n📊 Market Statistics:');
console.log(`  Best Bid: $${orderbook.bestBid()}`);
console.log(`  Best Ask: $${orderbook.bestAsk()}`);
console.log(`  Spread: $${orderbook.spread()}`);
console.log(`  Mid Price: $${orderbook.midPrice()}`);
console.log(`  Total Orders: ${orderbook.totalOrders}`);
console.log(`  Snapshot Timestamp: ${snapshot.ts}`);

console.log('\n================================================');
console.log('✨ Example completed successfully!');
console.log('================================================\n');

// Print usage instructions for the backend API
console.log('🚀 To use this with the backend API:\n');
console.log('POST /orders');
console.log('Content-Type: application/json\n');
console.log('{');
console.log('  "userId": "user1",');
console.log('  "marketId": "BTC-USD",');
console.log('  "side": "BUY",');
console.log('  "size": 0.5,');
console.log('  "price": 42800,');
console.log('  "type": "LIMIT"');
console.log('}');
console.log('\nThe response will include the orderbookSnapshot showing all bids and asks after the order is placed.');
