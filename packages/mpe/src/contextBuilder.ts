import type { Order, Market, MpeContext } from "./types.js";

export function buildContext(order: Order, market: Market): MpeContext {
  const { bestBid, bestAsk, oraclePrice, lastTradePrice, currentTime } = market;

  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;
  const deviation = Math.abs(order.price - oraclePrice) / oraclePrice;
  const distanceFromMid = midPrice !== 0
    ? Math.abs(order.price - midPrice) / midPrice
    : 0;
  const delay = currentTime - order.timestamp;
  const volatility = Math.abs(lastTradePrice - oraclePrice) / oraclePrice;

  return {
    order,
    market,
    spread,
    midPrice,
    deviation,
    distanceFromMid,
    delay,
    volatility,
  };
}
// Computes all derived values needed by the rule engine.
 
