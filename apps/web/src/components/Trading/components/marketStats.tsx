import { useTradingStore } from "@/store/tradingStore";

export const MarketStats = () => {
	const { currentMarket } = useTradingStore();

	const formatPrice = (price: number | null | undefined) => {
		if (price === null || price === undefined) return "---";
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
	};

	const formatVolume = (vol: number | null | undefined) => {
		if (vol === null || vol === undefined) return "---";
		if (vol >= 1000000) return `$${(vol / 1000000).toFixed(2)}M`;
		if (vol >= 1000) return `$${(vol / 1000).toFixed(2)}K`;
		return `$${vol.toFixed(2)}`;
	};

	return (
		<div className="w-full rounded-xl shadow-xl backdrop-blur-xl border border-[#1e222d] bg-[#081126]/90 p-5 mb-2">
			<h3 className="text-[14px] font-semibold text-white mb-6">Market Stats</h3>
			<div className="flex flex-col gap-5">
				<div className="flex justify-between w-full items-center">
					<p className="text-[11px] text-[#8e98a8] font-medium">24h Volume</p>
					<p className="text-[11px] text-white font-medium">{formatVolume(currentMarket?.volume24h)}</p>
				</div>
				<div className="flex justify-between w-full items-center">
					<p className="text-[11px] text-[#8e98a8] font-medium">24h High</p>
					<p className="text-[11px] text-white font-medium">{formatPrice(currentMarket?.high24h)}</p>
				</div>
				<div className="flex justify-between w-full items-center">
					<p className="text-[11px] text-[#8e98a8] font-medium">24h Low</p>
					<p className="text-[11px] text-white font-medium">{formatPrice(currentMarket?.low24h)}</p>
				</div>
				<div className="flex justify-between w-full items-center">
					<p className="text-[11px] text-[#8e98a8] font-medium">Market Symbol</p>
					<p className="text-[11px] text-white font-medium">{currentMarket?.symbol || "---"}</p>
				</div>
			</div>
		</div>
	);
};