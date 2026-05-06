'use client';

import { useMemo, useState } from 'react';

type MarketTab = 'ALL' | 'USD' | 'BTC' | 'ETH' | 'FAV';

interface MarketItem {
	symbol: string;
	quote: 'USD' | 'BTC' | 'ETH';
	price: number;
	change: number;
	icon: string;
}

const markets: MarketItem[] = [
	{ symbol: 'BTC/USD', quote: 'USD', price: 43336.0, change: -2.95, icon: 'BTC' },
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
		return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
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

			<div className="mt-3">
				<div className="relative rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2">
					<input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search pairs..."
						className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
					/>
				</div>
			</div>

			<div className="mt-3 flex items-center gap-3 border-b border-slate-700/80 pb-2">
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
							className="group flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-slate-800/60"
						>
							<div className="flex items-center gap-2">
								<div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-slate-200">
									{market.icon}
								</div>

								<span className="text-[11px] font-medium text-slate-200">{market.symbol}</span>
							</div>

							<div className="flex items-center gap-3">
								<div className="text-right">
									<p className="text-[11px] text-slate-100">{formatPrice(market.price)}</p>
									<p className={`text-[10px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
										{isPositive ? '+' : ''}
										{market.change.toFixed(2)}%
									</p>
								</div>

								<button
									type="button"
									onClick={() => toggleFavorite(market.symbol)}
									className="text-xs text-slate-500 transition hover:text-amber-300"
									aria-label={`Toggle ${market.symbol} favorite`}
								>
									<span className={isFavorite ? 'text-amber-300' : 'text-slate-600'}>
										{isFavorite ? '★' : '☆'}
									</span>
								</button>
							</div>
						</div>
					);
				})}

				{filteredMarkets.length === 0 ? (
					<p className="py-3 text-center text-xs text-slate-500">No markets found</p>
				) : null}
			</div>
		</div>
	);
}
