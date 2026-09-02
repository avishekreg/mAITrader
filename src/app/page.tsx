"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  Activity,
  CalendarDays,
  Radio,
  ShieldAlert,
  Square,
  Target,
  Zap,
} from "lucide-react";
import NiftyChart from "@/components/nifty-chart";
import { useTradeSimulator, type LogTone } from "@/hooks/useTradeSimulator";
import { cn, formatIndex, formatInr, formatSignedInr } from "@/lib/utils";

const LOG_TONE: Record<LogTone, string> = {
  info: "text-slate-400",
  buy: "text-cyan-400",
  sell: "text-crimson-500",
  target: "text-emerald-400",
  stop: "text-crimson-500",
  warn: "text-amber-300",
};

export default function Home() {
  const {
    spot,
    prevSpot,
    sessionChange,
    sessionChangePct,
    running,
    basket,
    logs,
    candles,
    clock,
    mtm,
    overlays,
    legs,
    capital,
    targetInr,
    stopLossInr,
    status,
    activateStrategy,
    squareOff,
  } = useTradeSimulator();

  const logRef = useRef<HTMLDivElement>(null);
  const spotUp = spot >= prevSpot;
  const pnlUp = mtm.netPnl >= 0;
  const targetProgress = Math.min(
    100,
    Math.max(0, (Math.max(mtm.netPnl, 0) / targetInr) * 100),
  );
  const stopProgress = Math.min(
    100,
    Math.max(0, (Math.max(-mtm.netPnl, 0) / stopLossInr) * 100),
  );

  useEffect(() => {
    const node = logRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [logs]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#080C14] text-slate-100">
      <a
        href="#execution-desk"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to execution desk
      </a>

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#070a12] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1">
            <Activity aria-hidden="true" className="size-3.5 text-emerald-400" />
            <span className="flex flex-col leading-tight">
              <span className="font-mono text-[11px] font-semibold tracking-[0.16em]">
                SYNCRA QUANT ENGINE
              </span>
              <span className="text-[10px] tracking-wide text-slate-500">
                Syncra Systems LLP
              </span>
            </span>
          </span>
        </div>

        <div
          aria-live="polite"
          className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-950/80 px-3 py-1.5"
        >
          <span className="relative flex size-2.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-pulse-live rounded-full opacity-75 motion-reduce:animate-none",
                spotUp ? "bg-emerald-400" : "bg-crimson-500",
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2.5 rounded-full",
                spotUp ? "bg-emerald-400" : "bg-crimson-500",
              )}
            />
          </span>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-[10px] tracking-[0.16em] text-slate-400">
              NIFTY 50
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatIndex(spot)}
            </span>
            <span
              className={cn(
                "text-xs tabular-nums",
                sessionChange >= 0 ? "text-emerald-400" : "text-crimson-500",
              )}
            >
              {sessionChange >= 0 ? "+" : ""}
              {formatIndex(sessionChange)} / {sessionChangePct >= 0 ? "+" : ""}
              {formatIndex(sessionChangePct)}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
            <Radio aria-hidden="true" className="size-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-300">
              Angel One API (Simulated Connected)
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-slate-800 px-3 py-1 text-[11px] text-slate-400">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {clock.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
            <span className="text-emerald-400">NSE Live Session (Simulated)</span>
          </span>
        </div>
      </header>

      <main
        id="execution-desk"
        className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12"
      >
        <section className="flex min-h-0 flex-col border-b border-slate-800 lg:col-span-8 lg:border-b-0 lg:border-r">
          <NiftyChart spot={spot} candles={candles} overlays={overlays} />

          <div className="border-t border-slate-800 bg-[#070a12]">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
              <p className="font-mono text-[10px] tracking-[0.18em] text-slate-500">
                EXECUTION LOG
              </p>
              <p className="font-mono text-[10px] text-slate-600">
                {status}
              </p>
            </div>
            <div
              ref={logRef}
              className="h-40 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-6"
              aria-live="polite"
            >
              {logs.length === 0 ? (
                <p className="text-slate-600">
                  Awaiting activation · buy-first 1:3:2 sequence armed idle
                </p>
              ) : (
                logs.map((entry) => (
                  <p key={entry.id} className={LOG_TONE[entry.tone]}>
                    [{entry.time}] {entry.message}
                  </p>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col bg-[#0b101b] lg:col-span-4">
          <div className="space-y-4 overflow-y-auto px-4 py-4">
            <div className="rounded-lg border border-slate-800 p-4">
              <p className="text-[10px] font-medium tracking-[0.2em] text-slate-500">
                STRATEGY CONTROL
              </p>
              <h1 className="mt-2 text-base font-semibold tracking-wide">
                HNI 1:3:2 Ratio Spread
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                ATM+200 / +400 / +600 CE · lot size 25
              </p>

              <button
                type="button"
                onClick={running ? squareOff : activateStrategy}
                className={cn(
                  "mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b101b]",
                  running
                    ? "bg-crimson-500 text-white hover:bg-red-500 focus-visible:ring-crimson-500"
                    : "bg-emerald-400 text-slate-950 hover:bg-emerald-300 focus-visible:ring-emerald-400",
                )}
              >
                {running ? (
                  <>
                    <Square aria-hidden="true" className="size-4" />
                    STOP / SQUARE OFF
                  </>
                ) : (
                  <>
                    <Zap aria-hidden="true" className="size-4" />
                    ACTIVATE STRATEGY
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-400">Capital Deployed</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatInr(capital)}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "rounded-lg border px-4 py-4",
                pnlUp
                  ? "border-emerald-400/30 bg-emerald-400/5"
                  : "border-crimson-500/30 bg-crimson-500/5",
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-medium tracking-[0.18em]",
                  pnlUp ? "text-emerald-300/80" : "text-crimson-500/80",
                )}
              >
                LIVE MTM
              </p>
              <p
                className={cn(
                  "mt-2 font-mono text-3xl font-semibold tracking-tight",
                  pnlUp
                    ? "text-emerald-400 [text-shadow:0_0_24px_rgba(52,211,153,0.45)]"
                    : "text-crimson-500 [text-shadow:0_0_24px_rgba(239,68,68,0.4)]",
                )}
              >
                {formatSignedInr(mtm.netPnl, 2)}
              </p>
              <p
                className={cn(
                  "mt-1 font-mono text-sm tabular-nums",
                  pnlUp ? "text-emerald-300" : "text-crimson-500",
                )}
              >
                {mtm.pnlPercent >= 0 ? "+" : ""}
                {formatIndex(mtm.pnlPercent)}%
              </p>

              <div className="mt-4 space-y-3">
                <ProgressRow
                  icon={<Target aria-hidden="true" className="size-3.5" />}
                  label="Target"
                  detail={`+1.0% / ${formatInr(targetInr)}`}
                  value={targetProgress}
                  tone="target"
                />
                <ProgressRow
                  icon={<ShieldAlert aria-hidden="true" className="size-3.5" />}
                  label="Stop Loss"
                  detail={`-1.0% / -${formatInr(stopLossInr)}`}
                  value={stopProgress}
                  tone="stop"
                />
              </div>
            </div>

            <div>
              <h2 className="mb-2 text-[10px] font-medium tracking-[0.18em] text-slate-500">
                3-LEG BASKET INSPECTOR
              </h2>
              <div className="overflow-x-auto rounded-md border border-slate-800">
                <table className="min-w-full text-left text-xs">
                  <caption className="sr-only">
                    1:3:2 ratio spread legs with buy-first execution
                  </caption>
                  <thead className="bg-slate-950/80 text-[10px] tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Strike</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Action</th>
                      <th className="px-3 py-2 font-medium">Lots</th>
                      <th className="px-3 py-2 font-medium">Entry</th>
                      <th className="px-3 py-2 font-medium">LTP</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono tabular-nums">
                    {legs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-6 text-center text-slate-500"
                        >
                          Activate to generate ATM+200/400/600 CE basket
                        </td>
                      </tr>
                    ) : (
                      legs.map((leg) => (
                        <tr key={leg.legNumber}>
                          <td className="px-3 py-2.5 text-slate-100">
                            {formatIndex(leg.strikePrice, 0)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-300">
                            {leg.type}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "rounded-sm px-1.5 py-0.5 text-[10px] font-semibold",
                                leg.action === "BUY"
                                  ? "bg-cyan-400/10 text-cyan-400"
                                  : "bg-crimson-500/10 text-crimson-500",
                              )}
                            >
                              {leg.action}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">{leg.lots}</td>
                          <td className="px-3 py-2.5 text-slate-300">
                            {formatIndex(leg.entryPrice)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-100">
                            {formatIndex(leg.currentLtp)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                              {leg.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-cyan-300">
                <Zap aria-hidden="true" className="size-3.5" />
                Buy-First Priority Applied (Margin Protected)
              </p>
              {basket && (
                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  ATM {formatIndex(basket.roundedAtm, 0)} · Seq 1 BUY hedge · Seq
                  2 SELL
                </p>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function ProgressRow({
  icon,
  label,
  detail,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  value: number;
  tone: "target" | "stop";
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 text-slate-300">
          {icon}
          {label}
        </span>
        <span className="font-mono tabular-nums text-slate-400">{detail}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className="h-1.5 overflow-hidden rounded-full bg-slate-800"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            tone === "target" ? "bg-emerald-400" : "bg-crimson-500",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
