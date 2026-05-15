import React, { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { useTradingStore } from '@/store/tradingStore';

const BASE_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ChartProps {
	data?: any[];
	colors?: {
		backgroundColor?: string;
		textColor?: string;
		upColor?: string;
		downColor?: string;
		wickUpColor?: string;
		wickDownColor?: string;
	};
}

export const TradingChart: React.FC<ChartProps> = ({
	data: propData,
	colors: {
		backgroundColor = '#0b0e14', // Matches the app's deep dark background
		textColor = '#8e98a8',
		upColor = '#00c076',
		downColor = '#ff3b30',
		wickUpColor = '#00c076',
		wickDownColor = '#ff3b30',
	} = {},
}) => {
	const chartContainerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
	const candleDataRef = useRef<CandlestickData<Time>[]>([]);
	const [chartReady, setChartReady] = useState(false);
	const selectedMarketId = useTradingStore((state) => state.selectedMarketId);
	const selectedTimeframe = useTradingStore((state) => state.selectedTimeframe);
	const latestTrade = useTradingStore((state) => state.recentTrades[0]);

	// Initialize Chart
	useEffect(() => {
		if (!chartContainerRef.current) return;

		let disposed = false;
		let chart: IChartApi | null = null;
		setChartReady(false);

		const handleResize = () => {
			if (chartContainerRef.current && chartRef.current) {
				chartRef.current.applyOptions({ 
					width: chartContainerRef.current.clientWidth, 
					height: chartContainerRef.current.clientHeight 
				});
			}
		};

		const initChart = async () => {
			const { createChart, ColorType, CandlestickSeries } = await import('lightweight-charts');
			if (disposed || !chartContainerRef.current) return;

			chart = createChart(chartContainerRef.current, {
				layout: {
					background: { type: ColorType.Solid, color: backgroundColor },
					textColor,
				},
				grid: {
					vertLines: { color: '#1e222d' },
					horzLines: { color: '#1e222d' },
				},
				width: chartContainerRef.current.clientWidth,
				height: chartContainerRef.current.clientHeight,
				timeScale: {
					timeVisible: true,
					secondsVisible: false,
				},
			});

			const newSeries = chart.addSeries(CandlestickSeries, {
				upColor,
				downColor,
				borderVisible: false,
				wickUpColor,
				wickDownColor,
			});

			chartRef.current = chart;
			seriesRef.current = newSeries;
			window.addEventListener('resize', handleResize);
			setChartReady(true);
		};

		void initChart().catch((error) => {
			console.error("Failed to initialize trading chart:", error);
		});

		return () => {
			disposed = true;
			window.removeEventListener('resize', handleResize);
			chartRef.current = null;
			seriesRef.current = null;
			chart?.remove();
		};
	}, [backgroundColor, textColor, upColor, downColor, wickUpColor, wickDownColor]);

	// Fetch historical data
	useEffect(() => {
		if (!selectedMarketId || !chartReady || !seriesRef.current) return;

		const fetchHistory = async () => {
			try {
				const response = await fetch(`${BASE_API}/orderbook/${selectedMarketId}/candles?interval=${selectedTimeframe}`);
				const history = await response.json();
				if (Array.isArray(history) && history.length > 0) {
					candleDataRef.current = history;
					seriesRef.current?.setData(history);
					chartRef.current?.timeScale().fitContent();
				} else if (propData && propData.length > 0) {
					candleDataRef.current = propData;
					seriesRef.current?.setData(propData);
				}
			} catch (error) {
				console.error("Failed to fetch candle history:", error);
			}
		};

		fetchHistory();
	}, [selectedMarketId, selectedTimeframe, propData, chartReady]);

	// Real-time updates
	useEffect(() => {
		if (!seriesRef.current || !latestTrade) return;

		const timeframeMap: Record<string, number> = {
			"1m": 60,
			"5m": 300,
			"15m": 900,
			"1h": 3600,
			"4h": 14400,
			"1d": 86400,
		};
		const intervalSec = timeframeMap[selectedTimeframe] || 60;
		const tradeTimeSec = Math.floor(latestTrade.timestamp / 1000);
		const candleTimeSec = Math.floor(tradeTimeSec / intervalSec) * intervalSec;

		// Maintain our own candle cache because the chart series does not expose
		// a stable public data() API across lightweight-charts versions.
		const data = candleDataRef.current;
		const lastCandle = data.length > 0 ? data[data.length - 1] : null;

		if (lastCandle && (candleTimeSec as any) < lastCandle.time) {
			// Trade is older than the last candle, skip it to avoid "Cannot update oldest data"
			return;
		}

		if (lastCandle && "open" in lastCandle && (candleTimeSec as any) === lastCandle.time) {
			const candle = lastCandle as CandlestickData<Time>;
			// Update existing candle
			const nextCandle = {
				time: candleTimeSec as any,
				open: candle.open,
				high: Math.max(candle.high, latestTrade.price),
				low: Math.min(candle.low, latestTrade.price),
				close: latestTrade.price,
			};
			candleDataRef.current[candleDataRef.current.length - 1] = nextCandle;
			seriesRef.current.update(nextCandle);
		} else {
			// Start new candle
			const nextCandle = {
				time: candleTimeSec as any,
				open: latestTrade.price,
				high: latestTrade.price,
				low: latestTrade.price,
				close: latestTrade.price,
			};
			candleDataRef.current = [...candleDataRef.current, nextCandle];
			seriesRef.current.update(nextCandle);
		}
	}, [latestTrade, selectedTimeframe]);

	return <div ref={chartContainerRef} className="w-full h-full min-h-[400px]" />;
};
