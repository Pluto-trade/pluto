import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi, type CandlestickData, type Time } from 'lightweight-charts';
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
	const { selectedMarketId, selectedTimeframe, recentTrades } = useTradingStore();

	// Initialize Chart
	useEffect(() => {
		if (!chartContainerRef.current) return;

		const chart = createChart(chartContainerRef.current, {
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

		const handleResize = () => {
			if (chartContainerRef.current && chartRef.current) {
				chartRef.current.applyOptions({ 
					width: chartContainerRef.current.clientWidth, 
					height: chartContainerRef.current.clientHeight 
				});
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			chart.remove();
		};
	}, [backgroundColor, textColor, upColor, downColor, wickUpColor, wickDownColor]);

	// Fetch historical data
	useEffect(() => {
		if (!selectedMarketId || !seriesRef.current) return;

		const fetchHistory = async () => {
			try {
				const response = await fetch(`${BASE_API}/orderbook/${selectedMarketId}/candles?interval=${selectedTimeframe}`);
				const history = await response.json();
				if (Array.isArray(history) && history.length > 0) {
					seriesRef.current?.setData(history);
					chartRef.current?.timeScale().fitContent();
				} else if (propData && propData.length > 0) {
					seriesRef.current?.setData(propData);
				}
			} catch (error) {
				console.error("Failed to fetch candle history:", error);
			}
		};

		fetchHistory();
	}, [selectedMarketId, selectedTimeframe, propData]);

	// Real-time updates
	useEffect(() => {
		if (!seriesRef.current || recentTrades.length === 0) return;

		const lastTrade = recentTrades[0];
		const timeframeMap: Record<string, number> = {
			"1m": 60,
			"5m": 300,
			"15m": 900,
			"1h": 3600,
			"4h": 14400,
			"1d": 86400,
		};
		const intervalSec = timeframeMap[selectedTimeframe] || 60;
		const tradeTimeSec = Math.floor(lastTrade.timestamp / 1000);
		const candleTimeSec = Math.floor(tradeTimeSec / intervalSec) * intervalSec;

		// Get the last data point to maintain OHLC
		// @ts-ignore - access internal data to avoid full re-render or complex state management
		const data = seriesRef.current.data();
		const lastCandle = data.length > 0 ? data[data.length - 1] : null;

		if (lastCandle && (candleTimeSec as any) < lastCandle.time) {
			// Trade is older than the last candle, skip it to avoid "Cannot update oldest data"
			return;
		}

		if (lastCandle && "open" in lastCandle && (candleTimeSec as any) === lastCandle.time) {
			const candle = lastCandle as CandlestickData<Time>;
			// Update existing candle
			seriesRef.current.update({
				time: candleTimeSec as any,
				open: candle.open,
				high: Math.max(candle.high, lastTrade.price),
				low: Math.min(candle.low, lastTrade.price),
				close: lastTrade.price,
			});
		} else {
			// Start new candle
			seriesRef.current.update({
				time: candleTimeSec as any,
				open: lastTrade.price,
				high: lastTrade.price,
				low: lastTrade.price,
				close: lastTrade.price,
			});
		}
	}, [recentTrades, selectedTimeframe]);

	return <div ref={chartContainerRef} className="w-full h-full min-h-[400px]" />;
};
