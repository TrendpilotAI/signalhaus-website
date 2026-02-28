"use client";

import { useState } from "react";

/* ─── Types ─────────────────────────────────────────────────── */
interface Inputs {
  teamSize: number;
  manualHours: number;
  avgDealSize: number;
  conversionRate: number;
  monthlyLeads: number;
}

interface Results {
  timeSavedHours: number;
  timeSavedPercent: number;
  annualCostSavings: number;
  additionalRevenue: number;
  totalAnnualImpact: number;
  paybackMonths: number;
  roi12Month: number;
}

/* ─── Constants ─────────────────────────────────────────────── */
const AVG_HOURLY_RATE = 75;          // blended knowledge-worker rate
const AUTOMATION_EFFICIENCY = 0.70;  // 70% of manual time eliminated
const CONVERSION_LIFT = 0.30;        // 30% conversion rate improvement
const SIGNALHAUS_MONTHLY_COST = 4800; // Growth Engine baseline

const STEPS = [
  {
    id: "teamSize",
    label: "How many people are on your team?",
    hint: "Include anyone who touches sales, ops, or reporting workflows.",
    min: 1, max: 500, step: 1, suffix: "people",
    defaultValue: 10,
  },
  {
    id: "manualHours",
    label: "How many hours per week does your team spend on manual processes?",
    hint: "Think: data entry, report building, lead research, CRM updates, email follow-ups.",
    min: 1, max: 80, step: 1, suffix: "hrs/week per person",
    defaultValue: 12,
  },
  {
    id: "avgDealSize",
    label: "What is your average deal size?",
    hint: "Annual contract value or one-time revenue per customer.",
    min: 1000, max: 5000000, step: 1000, suffix: "USD",
    defaultValue: 25000,
    isCurrency: true,
  },
  {
    id: "conversionRate",
    label: "What is your current lead-to-close conversion rate?",
    hint: "Percentage of leads that become paying customers.",
    min: 1, max: 50, step: 0.5, suffix: "%",
    defaultValue: 8,
  },
  {
    id: "monthlyLeads",
    label: "How many leads does your team work per month?",
    hint: "New opportunities entering your pipeline each month.",
    min: 1, max: 10000, step: 10, suffix: "leads/month",
    defaultValue: 150,
  },
] as const;

/* ─── Calculation ────────────────────────────────────────────── */
function calculate(inputs: Inputs): Results {
  const { teamSize, manualHours, avgDealSize, conversionRate, monthlyLeads } = inputs;

  const weeklyHoursSaved = teamSize * manualHours * AUTOMATION_EFFICIENCY;
  const annualHoursSaved = weeklyHoursSaved * 52;
  const timeSavedPercent = AUTOMATION_EFFICIENCY * 100;

  const annualCostSavings = annualHoursSaved * AVG_HOURLY_RATE;

  const additionalDeals = monthlyLeads * (conversionRate / 100) * CONVERSION_LIFT * 12;
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

/* ─── Helpers ────────────────────────────────────────────────── */
function fmt(n: number, currency = false): string {
  if (currency) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  }
  return n.toLocaleString();
}

function BarChart({ results }: { results: Results }) {
  const items = [
    { label: "Cost Savings", value: results.annualCostSavings, color: "bg-indigo-500" },
    { label: "Revenue Impact", value: results.additionalRevenue, color: "bg-emerald-500" },
  ];
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">{item.label}</span>
            <span className="font-semibold text-white">{fmt(item.value, true)}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${item.color} rounded-full transition-all duration-1000`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Email Gate Component ───────────────────────────────────── */
function EmailGate({
  results,
  inputs,
  onUnlock,
}: {
  results: Results;
  inputs: Inputs;
  onUnlock: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    // Fire-and-forget to Formspree / your own API
    try {
      await fetch("https://formspree.io/f/xdkgzzoa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          roi_total: results.totalAnnualImpact,
          roi_12mo_pct: results.roi12Month,
          hours_saved: results.timeSavedHours,
          inputs,
          source: "roi-calculator",
        }),
      });
    } catch {
      // non-blocking — still unlock
    }
    setSubmitting(false);
    onUnlock(email);
  }

  return (
    <div className="mt-8 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6 text-center">
      <div className="text-3xl mb-2">🔒</div>
      <h3 className="text-xl font-bold mb-1">Get Your Full ROI Report</h3>
      <p className="text-gray-400 text-sm mb-5">
        See a detailed breakdown of your savings, implementation roadmap, and recommended
        SignalHaus plan. Free, instant, no spam.
      </p>
      <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <input
          type="email"
          placeholder="Work email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          required
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          {submitting ? "Sending…" : "Unlock Full Report →"}
        </button>
      </form>
    </div>
  );
}

/* ─── Results Panel ──────────────────────────────────────────── */
function ResultsPanel({ results, inputs }: { results: Results; inputs: Inputs }) {
  const [unlocked, setUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const calLink = `https://cal.com/signalhaus/consultation?roi=${results.totalAnnualImpact}&team=${inputs.teamSize}&leads=${inputs.monthlyLeads}&email=${encodeURIComponent(userEmail)}`;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Time Saved / Year", value: `${fmt(results.timeSavedHours)}h`, sub: `${results.timeSavedPercent}% of manual work`, color: "text-indigo-400" },
          { label: "Cost Savings", value: fmt(results.annualCostSavings, true), sub: "annual labor recaptured", color: "text-indigo-400" },
          { label: "Revenue Impact", value: fmt(results.additionalRevenue, true), sub: "from conversion lift", color: "text-emerald-400" },
          { label: "12-Month ROI", value: `${results.roi12Month}%`, sub: `payback in ${results.paybackMonths}mo`, color: results.roi12Month > 0 ? "text-emerald-400" : "text-yellow-400" },
        ].map((card) => (
          <div key={card.label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-400 mt-1 leading-tight">{card.label}</div>
            <div className="text-xs text-gray-600 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Total callout */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <p className="text-sm text-gray-400 mb-1">Estimated Total Annual Impact</p>
        <p className="text-5xl font-bold text-emerald-400">{fmt(results.totalAnnualImpact, true)}</p>
        <p className="text-sm text-gray-500 mt-2">
          Based on your inputs — conservative estimates using industry benchmarks
        </p>
      </div>

      {/* Bar chart */}
      <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Impact Breakdown</h3>
        <BarChart results={results} />
      </div>

      {/* Gated full report */}
      {!unlocked ? (
        <EmailGate
          results={results}
          inputs={inputs}
          onUnlock={(e) => { setUserEmail(e); setUnlocked(true); }}
        />
      ) : (
        <div className="space-y-4">
          {/* Detailed report unlocked */}
          <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-6">
            <h3 className="text-lg font-bold mb-4">📋 Your Full ROI Report</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Team size</span>
                <span>{inputs.teamSize} people</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Manual hours eliminated / week</span>
                <span>{Math.round(inputs.teamSize * inputs.manualHours * 0.7)} hrs</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Annual labor cost recaptured</span>
                <span className="text-indigo-400">{fmt(results.annualCostSavings, true)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Projected new deals / year</span>
                <span>{Math.round(inputs.monthlyLeads * (inputs.conversionRate / 100) * 0.3 * 12)} deals</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Additional revenue / year</span>
                <span className="text-emerald-400">{fmt(results.additionalRevenue, true)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total annual impact</span>
                <span className="text-emerald-400">{fmt(results.totalAnnualImpact, true)}</span>
              </div>
            </div>
          </div>

          {/* Recommended plan */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3">Recommended Plan</h3>
            {results.totalAnnualImpact < 100_000 ? (
              <div>
                <p className="font-bold text-lg mb-1">QuickStart Automation — $1,250 flat</p>
                <p className="text-gray-400 text-sm">Perfect starting point: 3 automations + 1 AI agent deployed in 2 weeks. Builds the ROI foundation for a Growth Engine scale-up.</p>
              </div>
            ) : results.totalAnnualImpact < 500_000 ? (
              <div>
                <p className="font-bold text-lg mb-1">Growth Engine — $4,800/mo</p>
                <p className="text-gray-400 text-sm">10 automations + 5 AI agents across sales, ops, and data. Your numbers clearly justify this investment with {results.roi12Month}% projected ROI.</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-lg mb-1">Enterprise AI OS — Custom</p>
                <p className="text-gray-400 text-sm">Your scale demands full multi-agent orchestration. Custom pricing based on complexity — let&apos;s design your architecture together.</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <a
            href={calLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
          >
            Book a Free Strategy Call — Unlock {fmt(results.totalAnnualImpact, true)} →
          </a>
          <p className="text-center text-xs text-gray-600">
            30-min call · No hard sell · Your ROI numbers pre-filled for the advisor
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Calculator ────────────────────────────────────────── */
export default function ROICalculator() {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<Inputs>({
    teamSize: 10,
    manualHours: 12,
    avgDealSize: 25000,
    conversionRate: 8,
    monthlyLeads: 150,
  });
  const [showResults, setShowResults] = useState(false);

  const currentStep = STEPS[step];
  const key = currentStep?.id as keyof Inputs;
  const progress = ((step) / STEPS.length) * 100;

  function handleSlider(val: number) {
    setInputs((prev) => ({ ...prev, [key]: val }));
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setShowResults(true);
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  const results = calculate(inputs);

  if (showResults) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setShowResults(false)}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            ← Adjust inputs
          </button>
          <span className="text-xs text-gray-500">Based on your answers</span>
        </div>
        <ResultsPanel results={results} inputs={inputs} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Question {step + 1} of {STEPS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-gray-800/40 border border-gray-700 rounded-3xl p-8 mb-6">
        <h2 className="text-2xl font-bold mb-2">{currentStep.label}</h2>
        <p className="text-gray-400 text-sm mb-8">{currentStep.hint}</p>

        {/* Slider */}
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-4xl font-bold text-indigo-400">
              {"isCurrency" in currentStep && currentStep.isCurrency ? fmt(inputs[key], true) : `${inputs[key].toLocaleString()}`}
            </span>
            <span className="text-gray-400 text-sm ml-2">{currentStep.suffix}</span>
          </div>

          <input
            type="range"
            min={currentStep.min}
            max={currentStep.max}
            step={currentStep.step}
            value={inputs[key]}
            onChange={(e) => handleSlider(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer accent-indigo-500"
          />

          <div className="flex justify-between text-xs text-gray-600">
            <span>
              {"isCurrency" in currentStep && currentStep.isCurrency
                ? fmt(currentStep.min, true)
                : `${currentStep.min.toLocaleString()} ${currentStep.suffix}`}
            </span>
            <span>
              {"isCurrency" in currentStep && currentStep.isCurrency
                ? fmt(currentStep.max, true)
                : `${currentStep.max.toLocaleString()} ${currentStep.suffix}`}
            </span>
          </div>
        </div>

        {/* Quick-select chips */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {getChips(currentStep.id).map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleSlider(chip.value)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                inputs[key] === chip.value
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={back}
            className="flex-1 py-3 rounded-2xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors font-medium"
          >
            ← Back
          </button>
        )}
        <button
          onClick={next}
          className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          {step === STEPS.length - 1 ? "Calculate My ROI →" : "Next →"}
        </button>
      </div>

      {/* Live preview */}
      {step > 0 && (
        <div className="mt-6 bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Projected impact so far</p>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-indigo-400 font-bold">{fmt(results.timeSavedHours)}h</span>
              <span className="text-gray-500 ml-1">saved/yr</span>
            </div>
            <div>
              <span className="text-emerald-400 font-bold">{fmt(results.totalAnnualImpact, true)}</span>
              <span className="text-gray-500 ml-1">impact</span>
            </div>
            <div>
              <span className="text-yellow-400 font-bold">{results.roi12Month}%</span>
              <span className="text-gray-500 ml-1">ROI</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getChips(id: string): { label: string; value: number }[] {
  switch (id) {
    case "teamSize":
      return [
        { label: "Just me", value: 1 },
        { label: "5 people", value: 5 },
        { label: "10–15", value: 12 },
        { label: "25–50", value: 35 },
        { label: "50+", value: 75 },
      ];
    case "manualHours":
      return [
        { label: "2 hrs", value: 2 },
        { label: "5 hrs", value: 5 },
        { label: "10 hrs", value: 10 },
        { label: "20 hrs", value: 20 },
        { label: "30+ hrs", value: 35 },
      ];
    case "avgDealSize":
      return [
        { label: "$5K", value: 5000 },
        { label: "$25K", value: 25000 },
        { label: "$75K", value: 75000 },
        { label: "$250K", value: 250000 },
        { label: "$1M+", value: 1000000 },
      ];
    case "conversionRate":
      return [
        { label: "2%", value: 2 },
        { label: "5%", value: 5 },
        { label: "10%", value: 10 },
        { label: "20%", value: 20 },
        { label: "30%+", value: 30 },
      ];
    case "monthlyLeads":
      return [
        { label: "10", value: 10 },
        { label: "50", value: 50 },
        { label: "150", value: 150 },
        { label: "500", value: 500 },
        { label: "1,000+", value: 1000 },
      ];
    default:
      return [];
  }
}
