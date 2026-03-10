import { describe, it, expect } from "vitest";
import {
  calculate,
  fmt,
  AVG_HOURLY_RATE,
  AUTOMATION_EFFICIENCY,
  CONVERSION_LIFT,
  SIGNALHAUS_MONTHLY_COST,
  type ROIInputs,
} from "../roi";

/* ─── Default test inputs ────────────────────────────────────── */
const defaultInputs: ROIInputs = {
  teamSize: 10,
  manualHours: 12,
  avgDealSize: 25_000,
  conversionRate: 8,
  monthlyLeads: 150,
};

/* ─── Constants ──────────────────────────────────────────────── */
describe("ROI constants", () => {
  it("has sensible hourly rate", () => {
    expect(AVG_HOURLY_RATE).toBe(75);
  });

  it("automation efficiency is 70%", () => {
    expect(AUTOMATION_EFFICIENCY).toBe(0.7);
  });

  it("conversion lift is 30%", () => {
    expect(CONVERSION_LIFT).toBe(0.3);
  });

  it("monthly cost is $4800", () => {
    expect(SIGNALHAUS_MONTHLY_COST).toBe(4800);
  });
});

/* ─── calculate() ────────────────────────────────────────────── */
describe("calculate()", () => {
  it("returns all expected keys", () => {
    const results = calculate(defaultInputs);
    expect(results).toHaveProperty("timeSavedHours");
    expect(results).toHaveProperty("timeSavedPercent");
    expect(results).toHaveProperty("annualCostSavings");
    expect(results).toHaveProperty("additionalRevenue");
    expect(results).toHaveProperty("totalAnnualImpact");
    expect(results).toHaveProperty("paybackMonths");
    expect(results).toHaveProperty("roi12Month");
  });

  it("timeSavedPercent is always 70", () => {
    const results = calculate(defaultInputs);
    expect(results.timeSavedPercent).toBe(70);
  });

  it("timeSavedHours is correct for defaults", () => {
    // 10 people × 12 hrs/wk × 0.7 × 52 weeks
    const expected = Math.round(10 * 12 * 0.7 * 52);
    expect(calculate(defaultInputs).timeSavedHours).toBe(expected);
  });

  it("annualCostSavings is correct", () => {
    const hoursSaved = 10 * 12 * 0.7 * 52;
    const expected = Math.round(hoursSaved * 75);
    expect(calculate(defaultInputs).annualCostSavings).toBe(expected);
  });

  it("additionalRevenue is correct", () => {
    // 150 leads × (8/100) × 0.30 × 12 months × $25k
    const expected = Math.round(150 * (8 / 100) * 0.3 * 12 * 25_000);
    expect(calculate(defaultInputs).additionalRevenue).toBe(expected);
  });

  it("totalAnnualImpact = costSavings + additionalRevenue", () => {
    const r = calculate(defaultInputs);
    expect(r.totalAnnualImpact).toBe(r.annualCostSavings + r.additionalRevenue);
  });

  it("paybackMonths is at least 0.5", () => {
    // Even with massive impact, floor should apply
    const hugeInput: ROIInputs = {
      teamSize: 500,
      manualHours: 80,
      avgDealSize: 5_000_000,
      conversionRate: 50,
      monthlyLeads: 10_000,
    };
    expect(calculate(hugeInput).paybackMonths).toBeGreaterThanOrEqual(0.5);
  });

  it("roi12Month is positive when impact exceeds annual cost", () => {
    // With default inputs the ROI should be positive
    const r = calculate(defaultInputs);
    expect(r.roi12Month).toBeGreaterThan(0);
  });

  it("roi12Month formula matches manual calculation", () => {
    const r = calculate(defaultInputs);
    const annualCost = SIGNALHAUS_MONTHLY_COST * 12;
    const expected = Math.round(
      ((r.totalAnnualImpact - annualCost) / annualCost) * 100
    );
    expect(r.roi12Month).toBe(expected);
  });

  it("single-person minimal team produces valid results", () => {
    const minimal: ROIInputs = {
      teamSize: 1,
      manualHours: 1,
      avgDealSize: 1000,
      conversionRate: 1,
      monthlyLeads: 1,
    };
    const r = calculate(minimal);
    expect(r.timeSavedHours).toBeGreaterThan(0);
    expect(r.annualCostSavings).toBeGreaterThan(0);
    expect(typeof r.roi12Month).toBe("number");
  });
});

/* ─── fmt() ──────────────────────────────────────────────────── */
describe("fmt()", () => {
  it("formats plain integers", () => {
    expect(fmt(1234)).toBe("1,234");
  });

  it("formats $K amounts", () => {
    expect(fmt(25_000, true)).toBe("$25K");
    expect(fmt(1_000, true)).toBe("$1K");
  });

  it("formats $M amounts", () => {
    expect(fmt(1_500_000, true)).toBe("$1.5M");
    expect(fmt(2_000_000, true)).toBe("$2.0M");
  });

  it("formats sub-$1K currency", () => {
    expect(fmt(500, true)).toBe("$500");
  });

  it("formats zero correctly", () => {
    expect(fmt(0)).toBe("0");
    expect(fmt(0, true)).toBe("$0");
  });
});
