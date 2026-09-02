export interface StrategyLeg {
  legNumber: 1 | 2 | 3;
  type: "CE";
  action: "BUY" | "SELL";
  lots: number;
  lotSize: number;
  strikeOffset: number;
  strikePrice: number;
  executionSequence: 1 | 2;
  entryPrice: number;
  currentLtp: number;
  status: "PENDING" | "FILLED" | "SQUARED";
}

export interface StrategyConfig {
  capital: number;
  targetPercent: number;
  stopLossPercent: number;
}

export type BasketStatus =
  | "IDLE"
  | "ACTIVE"
  | "TARGET_HIT"
  | "STOPLOSS_HIT"
  | "SQUARED_OFF";

export interface BasketPosition {
  rawSpot: number;
  roundedAtm: number;
  legs: StrategyLeg[];
  capitalDeployed: number;
  targetInr: number;
  stopLossInr: number;
  status: BasketStatus;
  timestamp: string;
}

export interface MtmResult {
  netPnl: number;
  pnlPercent: number;
  isTarget: boolean;
  isSL: boolean;
}

export interface StrikeOverlay {
  price: number;
  color: string;
  title: string;
}

export const INITIAL_NIFTY_SPOT = 24207.5;
export const INITIAL_NIFTY_CHANGE = 84.2;
export const NIFTY_LOT_SIZE = 25;

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  capital: 500_000,
  targetPercent: 1.0,
  stopLossPercent: 1.0,
};

const PREMIUM_DELTA: Record<number, number> = {
  200: 0.28,
  400: 0.16,
  600: 0.08,
};

/**
 * Rounds Nifty spot to the nearest 100-point interval and ignores 50-value strikes.
 * 24,207 -> 24,200 | 24,260 -> 24,300
 */
export function roundToNearest100(spotPrice: number): number {
  return Math.round(spotPrice / 100) * 100;
}

function seedPremium(offset: number): number {
  if (offset === 200) return 180 + Math.random() * 5;
  if (offset === 400) return 105 + Math.random() * 4;
  return 55 + Math.random() * 3;
}

function roundPaisa(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Builds the 1:3:2 hedged ratio call spread.
 * Sequence 1: BUY Leg 1 (+200, 1 lot) and Leg 3 (+600, 2 lots)
 * Sequence 2: SELL Leg 2 (+400, 3 lots) for exchange margin benefit
 */
export function generateRatioSpreadBasket(
  currentSpot: number,
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG,
): BasketPosition {
  const atm = roundToNearest100(currentSpot);
  const strike1 = atm + 200;
  const strike2 = atm + 400;
  const strike3 = atm + 600;

  const entry1 = roundPaisa(seedPremium(200));
  const entry2 = roundPaisa(seedPremium(400));
  const entry3 = roundPaisa(seedPremium(600));

  const legs: StrategyLeg[] = [
    {
      legNumber: 1,
      type: "CE",
      action: "BUY",
      lots: 1,
      lotSize: NIFTY_LOT_SIZE,
      strikeOffset: 200,
      strikePrice: strike1,
      executionSequence: 1,
      entryPrice: entry1,
      currentLtp: entry1,
      status: "FILLED",
    },
    {
      legNumber: 3,
      type: "CE",
      action: "BUY",
      lots: 2,
      lotSize: NIFTY_LOT_SIZE,
      strikeOffset: 600,
      strikePrice: strike3,
      executionSequence: 1,
      entryPrice: entry3,
      currentLtp: entry3,
      status: "FILLED",
    },
    {
      legNumber: 2,
      type: "CE",
      action: "SELL",
      lots: 3,
      lotSize: NIFTY_LOT_SIZE,
      strikeOffset: 400,
      strikePrice: strike2,
      executionSequence: 2,
      entryPrice: entry2,
      currentLtp: entry2,
      status: "FILLED",
    },
  ];

  return {
    rawSpot: currentSpot,
    roundedAtm: atm,
    legs,
    capitalDeployed: config.capital,
    targetInr: (config.capital * config.targetPercent) / 100,
    stopLossInr: (config.capital * config.stopLossPercent) / 100,
    status: "ACTIVE",
    timestamp: new Date().toISOString(),
  };
}

export function calculateMTM(
  legs: StrategyLeg[],
  capital = DEFAULT_STRATEGY_CONFIG.capital,
  limits?: { targetInr: number; stopLossInr: number },
): MtmResult {
  let netPnl = 0;

  for (const leg of legs) {
    const units = leg.lots * leg.lotSize;
    const move =
      leg.action === "BUY"
        ? leg.currentLtp - leg.entryPrice
        : leg.entryPrice - leg.currentLtp;
    netPnl += move * units;
  }

  const rounded = roundPaisa(netPnl);
  const target = limits?.targetInr ?? (capital * 1) / 100;
  const stop = limits?.stopLossInr ?? (capital * 1) / 100;

  return {
    netPnl: rounded,
    pnlPercent: (rounded / capital) * 100,
    isTarget: rounded >= target,
    isSL: rounded <= -stop,
  };
}

export function tickSpot(currentSpot: number): number {
  const drift = (INITIAL_NIFTY_SPOT - currentSpot) * 0.06;
  const shock = (Math.random() - 0.46) * 16;
  return roundPaisa(Math.max(23940, Math.min(24520, currentSpot + drift + shock)));
}

/** Spot delta reprices CE LTPs; sold premium decays faster (theta carry). */
export function tickLegPremiums(
  legs: StrategyLeg[],
  spotDelta: number,
): StrategyLeg[] {
  return legs.map((leg) => {
    const delta = PREMIUM_DELTA[leg.strikeOffset] ?? 0.12;
    const theta = leg.action === "SELL" ? -1.05 : -0.22;
    const noise = (Math.random() - 0.5) * 0.45;
    const next = Math.max(
      0.5,
      leg.currentLtp + spotDelta * delta + theta + noise,
    );
    return { ...leg, currentLtp: roundPaisa(next) };
  });
}

export function squareBasket(
  basket: BasketPosition,
  status: Extract<BasketStatus, "TARGET_HIT" | "STOPLOSS_HIT" | "SQUARED_OFF">,
): BasketPosition {
  return {
    ...basket,
    status,
    legs: basket.legs.map((leg) => ({ ...leg, status: "SQUARED" })),
  };
}

export function getStrikeOverlay(legs: StrategyLeg[]): StrikeOverlay[] {
  const labels: Record<number, string> = {
    1: "Leg 1 (+200 OTM CE BUY 1 Lot)",
    2: "Leg 2 (+400 OTM CE SELL 3 Lots)",
    3: "Leg 3 (+600 OTM CE BUY 2 Lots)",
  };

  return [...legs]
    .sort((a, b) => a.strikePrice - b.strikePrice)
    .map((leg) => ({
      price: leg.strikePrice,
      color: leg.action === "BUY" ? "#22d3ee" : "#ef4444",
      title: labels[leg.legNumber] ?? `${leg.strikePrice} CE`,
    }));
}

export function displayLegs(legs: StrategyLeg[]): StrategyLeg[] {
  return [...legs].sort((a, b) => a.strikePrice - b.strikePrice);
}

export function formatClock(date = new Date()): string {
  return date.toLocaleTimeString("en-IN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
