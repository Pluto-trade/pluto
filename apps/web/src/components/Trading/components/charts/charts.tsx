import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

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
	data,
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

	useEffect(() => {
		if (!chartContainerRef.current) return;

		const handleResize = () => {
			if (chartContainerRef.current) {
				chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
			}
		};

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
		});

		chart.timeScale().fitContent();

		const newSeries = chart.addSeries(CandlestickSeries, {
			upColor,
			downColor,
			borderVisible: false,
			wickUpColor,
			wickDownColor,
		});

		if (data && data.length > 0) {
			newSeries.setData(data);
		} else {
			// Dummy Data for the candle chart if none is provided
			const dummyData = [
				{ time: '2023-10-01', open: 42000.16, high: 42500.84, low: 41800.16, close: 42400.72 },
				{ time: '2023-10-02', open: 42400.12, high: 43000.90, low: 42300.12, close: 42800.09 },
				{ time: '2023-10-03', open: 42800.71, high: 43500.71, low: 42500.39, close: 43200.29 },
				{ time: '2023-10-04', open: 43200.26, high: 43800.26, low: 42900.04, close: 43500.50 },
				{ time: '2023-10-05', open: 43500.71, high: 44200.85, low: 43100.67, close: 44000.04 },
				{ time: '2023-10-06', open: 44000.04, high: 44500.40, low: 43600.70, close: 44300.40 },
				{ time: '2023-10-07', open: 44300.51, high: 45000.83, low: 43800.34, close: 44800.25 },
				{ time: '2023-10-08', open: 44800.33, high: 45500.17, low: 44200.68, close: 45200.43 },
				{ time: '2023-10-09', open: 45200.33, high: 46000.20, low: 44800.39, close: 45800.10 },
				{ time: '2023-10-10', open: 45800.87, high: 46500.69, low: 45500.66, close: 46200.26 },
			];
			newSeries.setData(dummyData);
		}

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			chart.remove();
		};
	}, [data, backgroundColor, textColor, upColor, downColor, wickUpColor, wickDownColor]);

	return <div ref={chartContainerRef} className="w-full h-full min-h-[400px]" />;
};