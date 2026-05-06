export const MarketStats = () => {
	return (
		<div className="w-full rounded-2xl shadow-2xl backdrop-blur-xl border border-[#1e222d] bg-[#081126]/90 p-5 mb-2">
			<h3 className="text-[14px] font-semibold text-white mb-6">Market Stats</h3>
			<div className="flex flex-col gap-5">
				<div className="flex justify-between w-full items-center">
					<p className="text-[11px] text-[#8e98a8] font-medium">24h Volume</p>
					<p className="text-[11px] text-white font-medium">$128.45M</p>
				</div>
				<div className="flex justify-between w-full items-center">
					<p className="text-[11px] text-[#8e98a8] font-medium">24h High</p>
					<p className="text-[11px] text-white font-medium">$44,210.50</p>
				</div>
				<div className="flex justify-between w-full items-center">
					<p className="text-[11px] text-[#8e98a8] font-medium">24h Low</p>
					<p className="text-[11px] text-white font-medium">$42,150.30</p>
				</div>
				<div className="flex justify-between w-full items-center">
					<p className="text-[11px] text-[#8e98a8] font-medium">24h Trades</p>
					<p className="text-[11px] text-white font-medium">12,457</p>
				</div>
			</div>
		</div>
	);
};