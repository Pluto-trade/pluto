import { useUserOrders, useOpenOrders, useMarkets } from "@/hooks/useApi";
import { useOrdersChannel } from "@/hooks/useOrdersChannel";

export const BottomSheet = () => {
	const { data: userOrders = [] } = useUserOrders();
	const { data: openOrdersData = [] } = useOpenOrders();
	const { data: markets = [] } = useMarkets();
	const { activeOrders } = useOrdersChannel();

	// Create a map for quick lookup: marketId -> symbol
	const marketMap = new Map(markets.map(m => [m.id, m.symbol]));

	const openOrders = openOrdersData.map(order => ({
		time: new Date(order.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
		pair: marketMap.get(order.symbol) || order.symbol, // Use symbol if found, else fallback to the ID/stored symbol
		side: order.side,
		type: order.type,
		price: order.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'MARKET',
		size: order.size.toFixed(4),
		filled: order.filled.toFixed(4),
		total: order.price ? (order.price * order.size).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD' : '-',
		action: 'Cancel',
		id: order.id
	}));

	const positions = activeOrders.map(order => ({
		orderId: order.orderId,
		pair: order.marketDisplay || order.marketSymbol || 'Unknown',
		side: order.side,
		size: order.size.toFixed(4),
		entry: order.entryPrice ? order.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : '-',
		pnl: order.pnl ? `${order.pnl >= 0 ? '+' : ''}${order.pnl.toFixed(2)}` : '-',
		markPrice: order.markPrice ? order.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : '-',
	}));

	const formattedOrderHistory = userOrders.map(order => ({
		time: new Date(order.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
		pair: marketMap.get(order.symbol) || order.symbol,
		side: order.side,
		type: order.type,
		price: order.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'MARKET',
		size: order.size.toFixed(4),
		status: order.status
	}));


	return (
		<div className="p-4 grid h-full w-full overflow-hidden">
			<div className="grid grid-cols-[1.3fr_0.85fr_1.15fr] gap-4 h-full">
				{/* Open Orders */}
				<div className=" p-4 bg-[#081126]/90 border border-[#1e222d] shadow-lg rounded-xl flex flex-col min-w-0 backdrop-blur-xl">
					<h4 className="text-[14px] font-semibold text-white mb-3">Open Orders ({openOrders.length})</h4>
					
					<div className="grid grid-cols-[1fr_1.2fr_0.8fr_1fr_1.2fr_1fr_1fr_1.5fr_0.8fr] items-center text-[11px] text-[#8e98a8] font-medium pb-2 border-b border-[#2a2e39]/50 mb-1">
						<span>Time</span>
						<span>Pair</span>
						<span>Side</span>
						<span>Type</span>
						<span>Price</span>
						<span>Size</span>
						<span>Filled</span>
						<span>Total</span>
						<span>Action</span>
					</div>
					
					<div className="flex-1 overflow-y-auto max-h-18.5 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
						{openOrders.length === 0 ? (
							<div className="flex items-center justify-center h-full py-4 text-[11px] text-slate-500">
								No open orders.
							</div>
						) : (
							openOrders.map((item, i) => (
								<div key={i} className="grid grid-cols-[1fr_1.2fr_0.8fr_1fr_1.2fr_1fr_1fr_1.5fr_0.8fr] items-center text-[11px] text-slate-300 py-2.5 border-b border-[#2a2e39]/30 last:border-0 hover:bg-[#1e222d]/50 transition">
									<span>{item.time}</span>
									<span className="text-white">{item.pair}</span>
									<span className={item.side === 'BUY' ? 'text-[#00c076]' : 'text-[#ff3b30]'}>{item.side}</span>
									<span>{item.type}</span>
									<span className="text-white">{item.price}</span>
									<span>{item.size}</span>
									<span>{item.filled}</span>
									<span className="text-white">{item.total}</span>
									<button className="hover:text-white transition text-left">{item.action}</button>
								</div>
							))
						)}
					</div>
				</div>

				{/* Positions */}
				<div className="flex-1 p-4 bg-[#081126]/90 border border-[#1e222d] shadow-lg rounded-xl flex flex-col min-w-0 backdrop-blur-xl">
					<h4 className="text-[14px] font-semibold text-white mb-3">Positions ({positions.length})</h4>
					
					<div className="grid grid-cols-[1fr_1.2fr_0.8fr_1fr_1.2fr_1fr_1fr] items-center text-[11px] text-[#8e98a8] font-medium pb-2 border-b border-[#2a2e39]/50 mb-1 shrink-0">
						<span>Market</span>
						<span>Side</span>
						<span>Size</span>
						<span>Entry</span>
						<span>PnL</span>
						<span>Mark Price</span>
					</div>
					
					<div className="flex-1 overflow-y-auto max-h-18.5 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
						{positions.length === 0 ? (
							<div className="flex items-center justify-center h-full py-4 text-[11px] text-slate-500">
								No open positions.
							</div>
						) : (
							positions.map((item, i) => (
								<div key={item.orderId || i} className="grid grid-cols-[1fr_1.2fr_0.8fr_1fr_1.2fr_1fr_1fr] items-center text-[11px] text-slate-300 py-2.5 border-b border-[#2a2e39]/30 last:border-0 hover:bg-[#1e222d]/50 transition">
									<span className="text-white">{item.pair}</span>
									<span className={item.side === 'BUY' ? 'text-[#00c076]' : item.side === 'SELL' ? 'text-[#ff3b30]' : 'text-slate-300'}>{item.side}</span>
									<span className="text-white">{item.size}</span>
									<span className="text-white">{item.entry}</span>
									<span className={item.pnl !== '-' && item.pnl.startsWith('+') ? 'text-[#00c076]' : item.pnl !== '-' ? 'text-[#ff3b30]' : 'text-slate-300'}>{item.pnl}</span>
									<span className="text-white">{item.markPrice}</span>
								</div>
							))
						)}
					</div>
				</div>

				{/* Order History */}
				<div className="flex-1 p-4 bg-[#081126]/90 border border-[#1e222d] shadow-lg rounded-xl flex flex-col min-w-0 backdrop-blur-xl">
					<h4 className="text-[14px] font-semibold text-white mb-3">Order History ({formattedOrderHistory.length})</h4>
					
					<div className="grid grid-cols-[1fr_1.2fr_0.8fr_1fr_1.2fr_1fr_1fr] items-center text-[11px] text-[#8e98a8] font-medium pb-2 border-b border-[#2a2e39]/50 mb-1 shrink-0">
						<span>Market</span>
						<span>Side</span>
						<span>Size</span>
						<span>Entry</span>
						<span>PnL</span>
						<span>Mark Price</span>
					</div>
					
					<div className="flex-1 overflow-y-auto max-h-18.5 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
						{formattedOrderHistory.length === 0 ? (
							<div className="flex items-center justify-center h-full py-4 text-[11px] text-slate-500">
								No order history found.
							</div>
						) : (
							formattedOrderHistory.map((item, i) => (
								<div key={i} className="grid grid-cols-[1fr_1.2fr_0.8fr_1fr_1.2fr_1fr_1fr] items-center text-[11px] text-slate-300 py-2.5 border-b border-[#2a2e39]/30 last:border-0 hover:bg-[#1e222d]/50 transition">
									<span>{item.time}</span>
									<span className="text-white">{item.pair}</span>
									<span className={item.side === 'BUY' ? 'text-[#00c076]' : 'text-[#ff3b30]'}>{item.side}</span>
									<span>{item.type}</span>
									<span className="text-white">{item.price}</span>
									<span>{item.size}</span>
									<span className={item.status === 'FILLED' ? 'text-[#00c076]' : 'text-slate-400'}>{item.status}</span>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
};