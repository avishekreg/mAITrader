export const NIFTY_SPOT = 24207.5;
export const NIFTY_CHANGE = 84.2;
export const NIFTY_CHANGE_PCT = 0.35;

export const CAPITAL_DEPLOYED = 500_000;
export const LIVE_MTM = 3250;
export const LIVE_MTM_PCT = 0.65;
export const TARGET_PNL = 5000;
export const STOP_LOSS_PNL = -5000;

export const STRATEGY_LEGS = [
  { strike: 24400, type: "CE", action: "BUY", lots: 1, status: "FILLED" },
  { strike: 24600, type: "CE", action: "SELL", lots: 3, status: "FILLED" },
  { strike: 24800, type: "CE", action: "BUY", lots: 2, status: "FILLED" },
] as const;

export const STRIKE_LEVELS = [
  { price: 24400, color: "#22d3ee", title: "24,400 CE · Buy 1 Lot" },
  { price: 24600, color: "#f43f5e", title: "24,600 CE · Sell 3 Lots" },
  { price: 24800, color: "#22d3ee", title: "24,800 CE · Buy 2 Lots" },
] as const;
