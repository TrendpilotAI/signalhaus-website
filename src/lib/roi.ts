/* ─── Types ──────────────────────────────────────────────────── */
export interface ROIInputs {
  teamSize: number;
  manualHours: number;
  avgDealSize: number;
  conversionRate: number;
  monthlyLeads: number;
}

export interface ROIResults {
  timeSavedHours: number;
  timeSavedPercent: number;
  annualCostSavings: number;
  additionalRevenue: number;
  totalAnnualImpact: number;
  paybackMonths: number;
  roi12Month: number;
}

/* ─── Constants ──────────────────────────────────────────────── */
export const AVG_HOURLY_RATE = 75;           // blended knowledge-worker rate
export const AUTOMATION_EFFICIENCY = 0.70;   // 70% of manual time eliminated
export const CONVERSION_LIFT = 0.30;         // 30% conversion rate improvement
export const SIGNALHAUS_MONTHLY_COST = 4800; // Growth Engine baseline

/* ─── Core Calculation ───────────────────────────────────────── */
export function calculate(inputs: ROIInputs): ROIResults {
  const { teamSize, manualHours, avgDealSize, conversionRate, monthlyLeads } = inputs;

  const weeklyHoursSaved = teamSize * manualHours * AUTOMATION_EFFICIENCY;
  const annualHoursSaved = weeklyHoursSaved * 52;
  const timeSavedPercent = AUTOMATION_EFFICIENCY * 100;

  const annualCostSavings = annualHoursSaved * AVG_HOURLY_RATE;

  const additionalDeals =
    monthlyLeads * (conversionRate / 100) * CONVERSION_LIFT * 12;
  const additionalRevenue = additionalDeals * avgDealSize;

  const totalAnnualImpact = annualCostSavings + additionalRevenue;
  const annualCost = SIGNALHAUS_MONTHLY_COST * 12;
  const paybackMonths = annualCost / (totalAnnualImpact / 12);
  const roi12Month = ((totalAnnualImpact - annualCost) / annualCost) * 100;

  return {
    timeSavedHours: Math.round(annualHoursSaved),
    timeSavedPercent,
    annualCostSavings: Math.round(annualCostSavings),
    additionalRevenue: Math.round(additionalRevenue),
    totalAnnualImpact: Math.round(totalAnnualImpact),
    paybackMonths: Math.max(0.5, Math.round(paybackMonths * 10) / 10),
    roi12Month: Math.round(roi12Month),
  };
}

/* ─── Formatting Helper ──────────────────────────────────────── */
export function fmt(n: number, currency = false): string {
  if (currency) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  }
  return n.toLocaleString();
}
