"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Target } from "lucide-react";
import {
  CAPITAL_DEPLOYED,
  LIVE_MTM,
  LIVE_MTM_PCT,
  STOP_LOSS_PNL,
  STRATEGY_LEGS,
  TARGET_PNL,
} from "@/lib/strategy";
import { cn, formatInr, formatIndex } from "@/lib/utils";

export function StrategyCockpit() {
  const [armed, setArmed] = useState(true);
  const targetProgress = Math.min(100, Math.max(0, (LIVE_MTM / TARGET_PNL) * 100));
  const stopProgress = Math.min(
    100,
    Math.max(0, (Math.min(LIVE_MTM, 0) / STOP_LOSS_PNL) * 100),
  );

  return (
    <section
      aria-labelledby="strategy-cockpit-heading"
      className="flex h-full min-h-0 flex-col bg-[#0b101b]"
    >
      <div className="border-b border-slate-800 px-4 py-3">
        <p className="text-[10px] font-medium tracking-[0.2em] text-slate-500">
          STRATEGY COCKPIT
        </p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h2
              id="strategy-cockpit-heading"
              className="text-sm font-semibold tracking-wide text-slate-100"
            >
              HNI 1:3:2 Ratio Spread
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Nifty weekly CE · 1 buy / 3 sell / 2 buy
            </p>
          </div>
          <button
            type="button"
            aria-pressed={armed}
            onClick={() => setArmed((value) => !value)}
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b101b]",
              armed
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                : "border-slate-700 bg-slate-900 text-slate-400",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                armed ? "bg-emerald-400" : "bg-slate-500",
              )}
            />
            {armed ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-wide text-slate-400">
            Capital Deployed
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-slate-100">
            {formatInr(CAPITAL_DEPLOYED)}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-lg border border-emerald-400/25 bg-emerald-400/5 px-4 py-4"
        >
          <p className="text-[10px] font-medium tracking-[0.18em] text-emerald-300/80">
            LIVE MTM
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-emerald-400 [text-shadow:0_0_24px_rgba(52,211,153,0.45)]">
            +{formatInr(LIVE_MTM)}
          </p>
          <p className="mt-1 font-mono text-sm tabular-nums text-emerald-300">
            +{formatIndex(LIVE_MTM_PCT)}%
          </p>
        </motion.div>

        <div className="space-y-3">
          <ProgressRow
            icon={<Target aria-hidden="true" className="size-3.5" />}
            label="Target"
            detail={`+1% / ${formatInr(TARGET_PNL)}`}
            value={targetProgress}
            tone="target"
          />
          <ProgressRow
            icon={<ShieldAlert aria-hidden="true" className="size-3.5" />}
            label="Stop Loss"
            detail={`-1% / ${formatInr(STOP_LOSS_PNL)}`}
            value={stopProgress}
            tone="stop"
          />
        </div>

        <div>
          <h3 className="mb-2 text-[10px] font-medium tracking-[0.18em] text-slate-500">
            LEG DETAILS
          </h3>
          <div className="overflow-x-auto rounded-md border border-slate-800">
            <table className="min-w-full text-left text-xs">
              <caption className="sr-only">
                1:3:2 ratio spread legs, all call options, all filled
              </caption>
              <thead className="bg-slate-950/80 text-[10px] tracking-[0.14em] text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Strike
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Action
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Lots
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono tabular-nums">
                {STRATEGY_LEGS.map((leg) => (
                  <tr key={leg.strike} className="bg-[#0b101b]">
                    <td className="px-3 py-2.5 text-slate-100">
                      {formatIndex(leg.strike, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">{leg.type}</td>
                    <td
                      className={cn(
                        "px-3 py-2.5 font-semibold",
                        leg.action === "BUY"
                          ? "text-cyan-400"
                          : "text-crimson-400",
                      )}
                    >
                      {leg.action}
                    </td>
                    <td className="px-3 py-2.5 text-slate-100">{leg.lots}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-emerald-300">
                        {leg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
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
            tone === "target" ? "bg-emerald-400" : "bg-crimson-400",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
