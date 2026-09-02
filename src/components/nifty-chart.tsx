"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { CandleBar } from "@/hooks/useTradeSimulator";
import type { StrikeOverlay } from "@/lib/quantEngine";
import { roundToNearest100 } from "@/lib/quantEngine";
import { formatIndex } from "@/lib/utils";

interface NiftyChartProps {
  spot: number;
  candles: CandleBar[];
  overlays: StrikeOverlay[];
}

export default function NiftyChart({ spot, candles, overlays }: NiftyChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const overlayKey = overlays.map((item) => item.price).join(",");
  const atm = roundToNearest100(spot);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const chart = createChart(host, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#080C14" },
        textColor: "#94a3b8",
        fontFamily:
          "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#334155", labelBackgroundColor: "#1e293b" },
        horzLine: { color: "#334155", labelBackgroundColor: "#1e293b" },
      },
      rightPriceScale: {
        borderColor: "#1e293b",
        autoScale: false,
      },
      timeScale: {
        borderColor: "#1e293b",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#ef4444",
      borderUpColor: "#34d399",
      borderDownColor: "#ef4444",
      wickUpColor: "#6ee7b7",
      wickDownColor: "#f87171",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || candles.length === 0) return;

    series.setData(
      candles.map((bar) => ({
        time: bar.time as UTCTimestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    );

    const last = candles[candles.length - 1];
    if (last) {
      series.update({
        time: last.time as UTCTimestamp,
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
      });
    }

    chart.priceScale("right").setVisibleRange({
      from: atm - 380,
      to: Math.max(atm + 860, ...overlays.map((item) => item.price + 80)),
    });
  }, [atm, candles, overlays]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    for (const line of series.priceLines()) {
      series.removePriceLine(line);
    }

    for (const level of overlays) {
      series.createPriceLine({
        price: level.price,
        color: level.color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: level.title,
      });
    }
  }, [overlayKey, overlays]);

  return (
    <section
      aria-label="Nifty 50 candlestick chart with 1:3:2 strike levels"
      className="relative flex min-h-[360px] flex-1 flex-col bg-[#080C14]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-slate-500">
            NIFTY 50 SPOT · 1m STREAM
          </p>
          <p className="mt-0.5 font-mono text-sm tabular-nums text-slate-100">
            {formatIndex(spot)}
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-wide text-slate-500">
          Simulated ticks
        </p>
      </div>

      {overlays.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-800 px-4 py-2 text-[11px]">
          {overlays.map((level) => (
            <li key={level.price} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-px w-5 border-t border-dashed"
                style={{ borderColor: level.color }}
              />
              <span style={{ color: level.color }}>{level.title}</span>
            </li>
          ))}
        </ul>
      )}

      <div ref={hostRef} className="min-h-[280px] flex-1" />
    </section>
  );
}
