import { TradePageClient } from "@/components/Trading/tradePageClient";

// Next.js 15+ passes params as a Promise in server components
type Props = { params: Promise<{ symbol: string }> };

export default async function TradePage({ params }: Props) {
  const { symbol } = await params;
  return <TradePageClient symbol={symbol} />;
}
