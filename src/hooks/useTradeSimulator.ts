"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_STRATEGY_CONFIG,
  INITIAL_NIFTY_CHANGE,
  INITIAL_NIFTY_SPOT,
  calculateMTM,
  displayLegs,
  formatClock,
  generateRatioSpreadBasket,
  getStrikeOverlay,
  squareBasket,
  tickLegPremiums,
  tickSpot,
  type BasketPosition,
  type BasketStatus,
} from "@/lib/quantEngine";

export type LogTone = "info" | "buy" | "sell" | "target" | "stop" | "warn";

export interface ExecutionLog {
  id: string;
  time: string;
  message: string;
  tone: LogTone;
}

export interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const LIVE_BAR_SECONDS = 5;

function alignBarTime(seconds: number): number {
  return seconds - (seconds % LIVE_BAR_SECONDS);
}

function seedCandles(endSpot: number, count = 90): CandleBar[] {
  const end = alignBarTime(Math.floor(Date.now() / 1000));
  const start = end - count * LIVE_BAR_SECONDS;
  let price = endSpot - 55;
  const bars: CandleBar[] = [];

  for (let i = 0; i < count; i += 1) {
    const remaining = count - i;
    const drift = (endSpot - price) / remaining;
    const wave = Math.sin(i / 4.2) * 11;
    const noise = ((i * 13) % 7) - 3;
    const open = price;
    const close = open + drift + wave * 0.35 + noise * 0.8;
    bars.push({
      time: start + i * LIVE_BAR_SECONDS,
      open,
      high: Math.max(open, close) + 4 + (i % 3),
      low: Math.min(open, close) - 4 - (i % 2),
      close,
    });
    price = close;
  }

  const last = bars[bars.length - 1];
  if (last) {
    last.close = endSpot;
    last.high = Math.max(last.high, endSpot);
    last.low = Math.min(last.low, endSpot);
  }

  return bars;
}

function logId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useTradeSimulator() {
  const [spot, setSpot] = useState(INITIAL_NIFTY_SPOT);
  const [prevSpot, setPrevSpot] = useState(INITIAL_NIFTY_SPOT);
  const [running, setRunning] = useState(false);
  const [basket, setBasket] = useState<BasketPosition | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [candles, setCandles] = useState<CandleBar[]>(() =>
    seedCandles(INITIAL_NIFTY_SPOT),
  );
  const [clock, setClock] = useState(() => new Date());

  const runningRef = useRef(false);
  const spotRef = useRef(spot);
  const basketRef = useRef(basket);
  spotRef.current = spot;
  basketRef.current = basket;

  const pushLog = useCallback((message: string, tone: LogTone = "info") => {
    setLogs((current) => [
      ...current.slice(-99),
      { id: logId(), time: formatClock(), message, tone },
    ]);
  }, []);

  const mtm = useMemo(() => {
    if (!basket) {
      return {
        netPnl: 0,
        pnlPercent: 0,
        isTarget: false,
        isSL: false,
      };
    }
    return calculateMTM(basket.legs, basket.capitalDeployed, {
      targetInr: basket.targetInr,
      stopLossInr: basket.stopLossInr,
    });
  }, [basket]);

  const closePosition = useCallback(
    (status: Extract<BasketStatus, "TARGET_HIT" | "STOPLOSS_HIT" | "SQUARED_OFF">) => {
      const current = basketRef.current;
      if (!current) return current;

      const snapshot = calculateMTM(current.legs, current.capitalDeployed, {
        targetInr: current.targetInr,
        stopLossInr: current.stopLossInr,
      });
      const next = squareBasket(current, status);
      basketRef.current = next;
      setBasket(next);
      runningRef.current = false;
      setRunning(false);

      const pct = snapshot.pnlPercent.toFixed(2);
      if (status === "TARGET_HIT") {
        pushLog(
          `Target reached (+${pct}%) - Position Auto Squared Off`,
          "target",
        );
      } else if (status === "STOPLOSS_HIT") {
        pushLog(
          `Stop loss hit (${pct}%) - Position Auto Squared Off`,
          "stop",
        );
      } else {
        pushLog(
          `Manual square-off · net MTM ${snapshot.netPnl >= 0 ? "+" : ""}₹${snapshot.netPnl.toFixed(2)}`,
          "warn",
        );
      }
      return next;
    },
    [pushLog],
  );

  const activateStrategy = useCallback(() => {
    const generated = generateRatioSpreadBasket(spotRef.current);
    basketRef.current = generated;
    setBasket(generated);
    runningRef.current = true;
    setRunning(true);

    pushLog(
      `Basket generated · ATM ${generated.roundedAtm.toLocaleString("en-IN")} from spot ${spotRef.current.toLocaleString("en-IN")}`,
      "info",
    );
    pushLog("Leg 1 & 3 BUY executed", "buy");
    pushLog("Leg 2 SELL x3 executed", "sell");
    pushLog("Buy-first priority applied (margin protected)", "info");
  }, [pushLog]);

  const squareOff = useCallback(() => {
    closePosition("SQUARED_OFF");
  }, [closePosition]);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const intervalMs = prefersReduced ? 1400 : 400;

    const timer = window.setInterval(() => {
      const lastSpot = spotRef.current;
      const nextSpot = tickSpot(lastSpot);
      const spotDelta = nextSpot - lastSpot;
      spotRef.current = nextSpot;
      setPrevSpot(lastSpot);
      setSpot(nextSpot);

      setCandles((bars) => {
        const last = bars[bars.length - 1];
        if (!last) return bars;
        const bucket = alignBarTime(Math.floor(Date.now() / 1000));
        if (bucket <= last.time) {
          return [
            ...bars.slice(0, -1),
            {
              ...last,
              high: Math.max(last.high, nextSpot),
              low: Math.min(last.low, nextSpot),
              close: nextSpot,
            },
          ];
        }
        return [
          ...bars.slice(-120),
          {
            time: bucket,
            open: last.close,
            high: Math.max(last.close, nextSpot),
            low: Math.min(last.close, nextSpot),
            close: nextSpot,
          },
        ];
      });

      const liveBasket = basketRef.current;
      if (!runningRef.current || !liveBasket || liveBasket.status !== "ACTIVE") {
        return;
      }

      const nextLegs = tickLegPremiums(liveBasket.legs, spotDelta);
      const nextBasket: BasketPosition = {
        ...liveBasket,
        rawSpot: nextSpot,
        legs: nextLegs,
      };
      const snapshot = calculateMTM(nextLegs, nextBasket.capitalDeployed, {
        targetInr: nextBasket.targetInr,
        stopLossInr: nextBasket.stopLossInr,
      });

      if (snapshot.isTarget) {
        basketRef.current = { ...nextBasket, legs: nextLegs };
        closePosition("TARGET_HIT");
        return;
      }
      if (snapshot.isSL) {
        basketRef.current = { ...nextBasket, legs: nextLegs };
        closePosition("STOPLOSS_HIT");
        return;
      }

      basketRef.current = nextBasket;
      setBasket(nextBasket);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [closePosition]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const sessionChange = spot - (INITIAL_NIFTY_SPOT - INITIAL_NIFTY_CHANGE);
  const sessionChangePct =
    (sessionChange / (INITIAL_NIFTY_SPOT - INITIAL_NIFTY_CHANGE)) * 100;
  const overlays = basket ? getStrikeOverlay(basket.legs) : [];
  const legs = basket ? displayLegs(basket.legs) : [];

  return {
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
    capital: DEFAULT_STRATEGY_CONFIG.capital,
    targetInr: basket?.targetInr ?? DEFAULT_STRATEGY_CONFIG.capital * 0.01,
    stopLossInr: basket?.stopLossInr ?? DEFAULT_STRATEGY_CONFIG.capital * 0.01,
    status: basket?.status ?? ("IDLE" as BasketStatus),
    activateStrategy,
    squareOff,
  };
}
