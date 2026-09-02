"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Pause, Play } from "lucide-react";
import { NIFTY_SPOT, STRIKE_LEVELS } from "@/lib/strategy";
import { cn, formatIndex } from "@/lib/utils";

function seedCandles(count = 180): CandlestickData<UTCTimestamp>[] {
  const now = Math.floor(Date.now() / 1000);
  const start = now - count * 60;
  let price = 23980;
  const candles: CandlestickData<UTCTimestamp>[] = [];

  for (let i = 0; i < count; i += 1) {
    const remaining = count - i;
    const drift = (NIFTY_SPOT - price) / remaining;
    const noise = (Math.sin(i / 7) + (i % 5) / 5 - 0.5) * 14;
    const open = price;
    const close = open + drift + noise;
    const high = Math.max(open, close) + 6 + (i % 3) * 2;
    const low = Math.min(open, close) - 6 - (i % 4);
    candles.push({
      time: (start + i * 60) as UTCTimestamp,
      open,
      high,
      low,
      close,
    });
    price = close;
  }

  return candles;
}

export default function NiftyChart() {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const candleRef = useRef<CandlestickData<UTCTimestamp> | null>(null);
  const [paused, setPaused] = useState(false);
  const [lastClose, setLastClose] = useState(NIFTY_SPOT);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const chart = createChart(host, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#090D16" },
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
      downColor: "#f43f5e",
      borderUpColor: "#34d399",
      borderDownColor: "#f43f5e",
      wickUpColor: "#6ee7b7",
      wickDownColor: "#fb7185",
    });

    const candles = seedCandles();
    series.setData(candles);
    candleRef.current = candles[candles.length - 1] ?? null;
    setLastClose(candleRef.current?.close ?? NIFTY_SPOT);

    for (const level of STRIKE_LEVELS) {
      series.createPriceLine({
        price: level.price,
        color: level.color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: level.title,
      });
    }

    chart.priceScale("right").setVisibleRange({ from: 23880, to: 25080 });
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (paused) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      const series = seriesRef.current;
      const last = candleRef.current;
      if (!series || !last) return;

      const tick = (Math.sin(Date.now() / 900) * 3.2 + (Date.now() % 7) - 3) * 0.35;
      const nextClose = Math.max(23890, Math.min(24480, last.close + tick));
      const nextHigh = Math.max(last.high, nextClose);
      const nextLow = Math.min(last.low, nextClose);
      const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
      const sameBar = now - Number(last.time) < 60;

      const next: CandlestickData<UTCTimestamp> = sameBar
        ? {
            ...last,
            high: nextHigh,
            low: nextLow,
            close: nextClose,
          }
        : {
            time: now,
            open: last.close,
            high: Math.max(last.close, nextClose),
            low: Math.min(last.close, nextClose),
            close: nextClose,
          };

      series.update(next);
      candleRef.current = next;
      setLastClose(next.close);
    }, 900);

    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section
      aria-label="Nifty 50 candlestick chart with 1:3:2 strike levels"
      className="relative flex h-full min-h-[420px] flex-col bg-[#090D16]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-slate-500">
            NIFTY 50 SPOT · 1m
          </p>
          <p className="mt-0.5 font-mono text-sm tabular-nums text-slate-100">
            {formatIndex(lastClose)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-800 px-3 text-xs text-slate-300 transition-colors duration-200 hover:border-slate-700 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
        >
          {paused ? (
            <Play aria-hidden="true" className="size-3.5" />
          ) : (
            <Pause aria-hidden="true" className="size-3.5" />
          )}
          {paused ? "Resume stream" : "Pause stream"}
        </button>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-800 px-4 py-2 text-[11px]">
        {STRIKE_LEVELS.map((level) => (
          <li key={level.price} className="flex items-center gap-2 text-slate-300">
            <span
              aria-hidden="true"
              className="h-px w-5 border-t border-dashed"
              style={{ borderColor: level.color }}
            />
            <span style={{ color: level.color }}>{level.title}</span>
          </li>
        ))}
      </ul>

      <div ref={hostRef} className="min-h-0 flex-1" />

      <p
        className={cn(
          "pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] tracking-wide text-slate-600",
        )}
      >
        Mock stream · not live market data
      </p>
    </section>
  );
}
