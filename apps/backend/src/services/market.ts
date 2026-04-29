import { prisma } from "@repo/database";
// @ts-ignore - uuid types not found, but module works fine
import { v4 as uuidv4 } from "uuid";
import Decimal from "decimal.js";
import { CreateMarketRequest, MarketStatus } from "../types";

export class MarketService {
  async createMarket(request: CreateMarketRequest) {
    try {
      const market = await prisma.market.create({
        data: {
          id: uuidv4(),
          symbol: request.symbol,
          baseAsset: request.baseAsset,
          quoteAsset: request.quoteAsset,
          status: "ACTIVE" as const,
          tickSize: new Decimal(request.tickSize),
          lotSize: new Decimal(request.lotSize),
          minOrderSize: new Decimal(request.minOrderSize),
          pricePrecision: request.pricePrecision,
          sizePrecision: request.sizePrecision,
          makerFeeRate: new Decimal(request.makerFeeRate),
          takerFeeRate: new Decimal(request.takerFeeRate),
        },
      });

      return market;
    } catch (error) {
      console.log(error);
    }
  }

  async getMarket(marketId: string) {
    return await prisma.market.findUnique({
      where: { id: marketId },
    });
  }

  async getMarketBySymbol(symbol: string) {
    return await prisma.market.findUnique({
      where: { symbol },
    });
  }

  async listMarkets() {
    return await prisma.market.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async updateMarketStatus(marketId: string, status: MarketStatus) {
    return await prisma.market.update({
      where: { id: marketId },
      data: { status: status as any },
    });
  }

  async pauseMarket(marketId: string) {
    return this.updateMarketStatus(marketId, MarketStatus.PAUSED);
  }

  async activateMarket(marketId: string) {
    return this.updateMarketStatus(marketId, MarketStatus.ACTIVE);
  }

  async disableMarket(marketId: string) {
    return this.updateMarketStatus(marketId, MarketStatus.DISABLED);
  }
}

export const marketService = new MarketService();
