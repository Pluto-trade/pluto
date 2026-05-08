'use client';

import { useEffect, useState } from 'react';
import { Search, TrendingUp, TrendingDown, Star } from 'lucide-react';
import Link from 'next/link';

type MarketTab = 'ALL' | 'GAINERS' | 'LOSERS' | 'FAV';

interface Market {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

const MARKETS: Market[] = [
  {
    id: '1',
    symbol: 'JUP-USDC',
    baseAsset: 'JUP',
    quoteAsset: 'USDC',
    price: 0.85,
    change24h: 3.42,
    volume24h: 850000,
    high24h: 0.88,
    low24h: 0.82,
  },
  {
    id: '2',
    symbol: 'WIF-USDC',
    baseAsset: 'WIF',
    quoteAsset: 'USDC',
    price: 2.45,
    change24h: -1.20,
    volume24h: 650000,
    high24h: 2.55,
    low24h: 2.38,
  },
  {
    id: '3',
    symbol: 'SOL-USDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 150.38,
    change24h: 2.32,
    volume24h: 980000,
    high24h: 152.75,
    low24h: 148.15,
  },
  {
    id: '4',
    symbol: 'SOL-USDC',
    baseAsset: 'SOL',
    quoteAsset: 'USDC',
    price: 150.42,
    change24h: 2.35,
    volume24h: 1250000,
    high24h: 152.80,
    low24h: 148.20,
  },
];

const getAssetColor = (asset: string) => {
  const colors: Record<string, string> = {
    BTC: 'bg-orange-500',
    ETH: 'bg-purple-500',
    SOL: 'bg-green-400',
    USDC: 'bg-blue-500',
    USDT: 'bg-cyan-500',
    STX: 'bg-indigo-500',
    BONK: 'bg-pink-500',
  };
  return colors[asset] || 'bg-slate-600';
};

const AssetIcon = ({ asset }: { asset: string }) => (
  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getAssetColor(asset)}`}>
    <span className="text-xs font-bold text-white">{asset.charAt(0)}</span>
  </div>
);

export function Markets() {
  const [activeTab, setActiveTab] = useState<MarketTab>('ALL');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>(MARKETS);

  useEffect(() => {
    let result = MARKETS;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter((m) => m.symbol.toLowerCase().includes(query));
    }

    switch (activeTab) {
      case 'FAV':
        result = result.filter((m) => favorites.includes(m.id));
        break;
      case 'GAINERS':
        result = [...result].sort((a, b) => b.change24h - a.change24h).slice(0, 10);
        break;
      case 'LOSERS':
        result = [...result].sort((a, b) => a.change24h - b.change24h).slice(0, 10);
        break;
    }

    setFilteredMarkets(result);
  }, [search, activeTab, favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010116] via-[#0a0520] to-[#010116]">
      {/* Header */}
      <div className="border-b border-[#1e222d] bg-[#081126]/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white">Markets</h1>
            <p className="mt-2 text-slate-400">Explore all available trading pairs</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search markets (e.g., SOL-USDC)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#0f1419] pl-10 pr-4 py-2.5 text-white placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {(['ALL', 'GAINERS', 'LOSERS', 'FAV'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Markets Table */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {filteredMarkets.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 py-12 text-center">
            <p className="text-slate-400">No markets found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-700 bg-[#0f1419]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-[#081126]">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-400">Pair</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-400">Price</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-400">24h Change</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-400">24h High</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-400">24h Low</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-400">24h Volume</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkets.map((market, idx) => (
                  <tr
                    key={market.id}
                    className={`border-b border-slate-700 transition hover:bg-slate-800/50 ${
                      idx % 2 === 0 ? 'bg-slate-900/20' : ''
                    }`}
                  >
                    {/* Pair */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <AssetIcon asset={market.baseAsset} />
                        <div>
                          <p className="font-semibold text-white">{market.symbol}</p>
                          <p className="text-xs text-slate-400">{market.baseAsset}/{market.quoteAsset}</p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-white">
                        ${market.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: market.price < 1 ? 8 : 2,
                        })}
                      </p>
                    </td>

                    {/* 24h Change */}
                    <td className="px-6 py-4 text-right">
                      <div
                        className={`inline-flex items-center gap-1 rounded-md px-3 py-1 ${
                          market.change24h >= 0
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {market.change24h >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{Math.abs(market.change24h).toFixed(2)}%</span>
                      </div>
                    </td>

                    {/* 24h High */}
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-slate-300">
                        ${market.high24h.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </td>

                    {/* 24h Low */}
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-slate-300">
                        ${market.low24h.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </td>

                    {/* 24h Volume */}
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-slate-300">
                        ${(market.volume24h / 1000000).toFixed(1)}M
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => toggleFavorite(market.id, e)}
                          className="rounded p-2 text-slate-400 transition hover:bg-slate-700 hover:text-yellow-400"
                        >
                          <Star
                            className="h-5 w-5"
                            fill={favorites.includes(market.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                        <Link href={`/trade/${market.symbol.toLowerCase()}`}>
                          <button className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-1 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-blue-500">
                            Trade
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}