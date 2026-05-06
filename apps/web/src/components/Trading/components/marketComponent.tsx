'use client';

import { useMemo, useState } from 'react';
import { Search } from "lucide-react"

type MarketTab = 'ALL' | 'USD' | 'BTC' | 'ETH' | 'FAV';

interface MarketItem {
	symbol: string;
	quote: 'USD' | 'BTC' | 'ETH';
	price: number;
	change: number;
	icon: string;
}

const markets: MarketItem[] = [
	{ symbol: 'BTC/USD', quote: 'USD', price: 43336.0, change: -2.35, icon: 'BTC' },
	{ symbol: 'ETH/USD', quote: 'USD', price: 2352.45, change: 1.48, icon: 'ETH' },
	{ symbol: 'SOL/USD', quote: 'USD', price: 98.34, change: -0.97, icon: 'SOL' },
	{ symbol: 'MATIC/USD', quote: 'USD', price: 0.8123, change: 3.22, icon: 'MAT' },
	{ symbol: 'ADA/USD', quote: 'USD', price: 0.4821, change: -1.11, icon: 'ADA' },
];

const tabs: MarketTab[] = ['ALL', 'USD', 'BTC', 'ETH', 'FAV'];

function formatPrice(value: number) {
	if (value >= 1000) {
		return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	if (value >= 1) {
		return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
	}

	return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function MarketComponent() {
	const [activeTab, setActiveTab] = useState<MarketTab>('ALL');
	const [search, setSearch] = useState('');
	const [favorites, setFavorites] = useState<string[]>(['BTC/USD']);

	const filteredMarkets = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return markets.filter((market) => {
			const matchesTab =
				activeTab === 'ALL' ||
				(activeTab === 'FAV' ? favorites.includes(market.symbol) : market.quote === activeTab);
			const matchesSearch =
				normalizedSearch.length === 0 || market.symbol.toLowerCase().includes(normalizedSearch);

			return matchesTab && matchesSearch;
		});
	}, [activeTab, favorites, search]);

	const toggleFavorite = (symbol: string) => {
		setFavorites((prev) =>
			prev.includes(symbol) ? prev.filter((item) => item !== symbol) : [...prev, symbol]
		);
	};

	return (
		<div className="w-full max-w-[275px] rounded-xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-[0_0_0_1px_rgba(51,65,85,0.2),0_10px_30px_rgba(2,8,23,0.6)]">
			<h3 className="text-sm font-semibold text-slate-100">Markets</h3>

			<div className="relative flex items-center rounded-lg border border-[#2a2e39] bg-[#0b0e14] px-3 py-2 gap-2">
				<Search size={15}/>
				<input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder="Search pairs..."
					className="w-full bg-transparent text-[13px] text-slate-200 placeholder:text-slate-500 focus:outline-none"
				/>
			</div>

			<div className="mt-5 flex items-center gap-5 border-b border-[#2a2e39]">
				{tabs.map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`text-[10px] font-semibold tracking-wide transition ${
							activeTab === tab ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'
						}`}
					>
						{tab}
					</button>
				))}
			</div>

			<div className="mt-2 space-y-1">
				{filteredMarkets.map((market) => {
					const isPositive = market.change >= 0;
					const isFavorite = favorites.includes(market.symbol);

					return (
						<div
							key={market.symbol}
							className={`group flex items-center justify-between rounded-xl px-2.5 py-1 transition hover:bg-[#1e222d] ${
								market.symbol === 'BTC/USD' ? 'bg-[#1e222d]' : ''
							}`}
						>
							<div className="flex items-center gap-3">
								{/* <MarketIcon symbol={market.symbol} /> */}
								<span className="text-[11px] font-medium text-white">{market.symbol}</span>
							</div>

							<div className="flex items-center gap-4">
								<div className="text-right">
									<p className="text-[11px] text-white font-medium">{formatPrice(market.price)}</p>
									<p className={`text-[11px] font-medium ${isPositive ? 'text-[#00c076]' : 'text-[#ff3b30]'}`}>
										{isPositive ? '+' : ''}
										{market.change.toFixed(2)}%
									</p>
								</div>

								<button
									type="button"
									onClick={() => toggleFavorite(market.symbol)}
									className="transition"
									aria-label={`Toggle ${market.symbol} favorite`}
								>
									{isFavorite ? (
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
									) : (
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-[#f59e0b]"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
									)}
								</button>
							</div>
						</div>
					);
				})}

				{filteredMarkets.length === 0 ? (
					<p className="py-4 text-center text-[13px] text-slate-500">No markets found</p>
				) : null}
			</div>
		</div>
	);
}
