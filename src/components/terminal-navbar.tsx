import { Activity, Radio } from "lucide-react";
import { formatIndex } from "@/lib/utils";
import { NIFTY_CHANGE, NIFTY_CHANGE_PCT, NIFTY_SPOT } from "@/lib/strategy";

export function TerminalNavbar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-[#070b13] px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1">
          <Activity
            aria-hidden="true"
            className="size-3.5 text-emerald-400"
          />
          <span className="truncate font-mono text-[11px] font-semibold tracking-[0.18em] text-slate-100">
            SYNCRA QUANT ENGINE
          </span>
        </span>
        <span className="hidden text-[11px] tracking-wide text-slate-500 sm:inline">
          Nifty 1:3:2 Execution Platform
        </span>
      </div>

      <div
        aria-live="polite"
        className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-1.5"
      >
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-pulse-live rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
        </span>
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-[10px] font-medium tracking-[0.16em] text-slate-400">
            NIFTY 50
          </span>
          <span className="text-sm font-semibold tabular-nums text-slate-50">
            {formatIndex(NIFTY_SPOT)}
          </span>
          <span className="text-xs font-medium tabular-nums text-emerald-400">
            +{formatIndex(NIFTY_CHANGE)} / +{formatIndex(NIFTY_CHANGE_PCT)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
        <Radio aria-hidden="true" className="size-3.5 text-emerald-400" />
        <span className="text-[11px] font-medium tracking-wide text-emerald-300">
          Angel One (Mock Connected)
        </span>
      </div>
    </header>
  );
}
