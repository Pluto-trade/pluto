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

const MarketIcon = ({ symbol }: { symbol: string }) => {
	if (symbol.includes('BTC')) {
		return (
			<div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#f7931a]">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
					<path d="M23.638 14.904c-1.602 4.883-8.113 7.275-8.113 7.275s-1.177.383-2.761-.137l-1.758 5.437-3.325-1.08 1.716-5.328c-1.956-.554-3.593-1.258-3.593-1.258l-1.759 5.438-3.326-1.079 1.76-5.441c-2.451-1.056-5.183-2.529-5.183-2.529l1.411-2.92s2.614 1.341 4.708 2.274l1.89-5.845c-2.31-.76-4.22-1.428-4.22-1.428l1.32-2.977s1.867.669 3.992 1.385l1.81-5.598 3.325 1.079-1.762 5.444c1.64.484 3.12.879 3.12.879l1.815-5.606 3.324 1.077-1.802 5.578c1.554.498 2.875 1.01 4.021 1.562 2.76 1.332 4.417 3.351 4.148 5.733-.186 1.637-1.335 2.873-3.111 3.619 1.879.88 3.013 2.502 2.38 4.444zM16.145 8.789c-.615-2.072-3.14-2.883-5.321-3.591l-1.455 4.5c2.181.706 7.39 1.164 6.776-.909zm1.096 7.643c-.702-2.355-4.103-3.08-6.398-3.824l-1.637 5.06c2.296.744 8.736 1.118 8.035-1.236z" />
				</svg>
			</div>
		);
	}
	if (symbol.includes('ETH')) {
		return (
			<div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#627eea]">
				<svg width="12" height="12" viewBox="0 0 320 512" fill="white">
					<path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z" />
				</svg>
			</div>
		);
	}
	if (symbol.includes('SOL')) {
		return (
			<div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-black border border-slate-700">
				<span className="text-[10px] font-bold text-[#14F195]">S</span>
			</div>
		);
	}
	if (symbol.includes('MATIC')) {
		return (
			<div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#8247e5]">
				<span className="text-[12px] font-bold text-white">M</span>
			</div>
		);
	}
	if (symbol.includes('ADA')) {
		return (
			<div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#ff6b22]">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
					<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
				</svg>
			</div>
		);
	}
	return (
		<div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-slate-800">
			<span className="text-[10px] font-bold text-slate-200">{symbol.charAt(0)}</span>
		</div>
	);
};

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
		<div className="w-full rounded-lg shadow-lg backdrop-blur-xl border border-[#1e222d] bg-[#081126]/90 p-5 ">
			<h3 className="text-[15px] font-semibold text-white mb-4">Markets</h3>

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
						className={`pb-[10px] text-[11px] font-semibold tracking-wide transition relative ${
							activeTab === tab ? 'text-white' : 'text-[#8e98a8] hover:text-slate-300'
						}`}
					>
						{tab}
						{activeTab === tab && (
							<span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-indigo-500 rounded-t-full" />
						)}
					</button>
				))}
			</div>

			<div className="mt-3 flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
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
