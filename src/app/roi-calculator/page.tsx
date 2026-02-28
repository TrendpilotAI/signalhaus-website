import type { Metadata } from "next";
import ROICalculator from "@/components/ROICalculator";

export const metadata: Metadata = {
  title: "ROI Calculator — See Your AI Automation Returns",
  description:
    "Calculate your potential ROI from AI automation. Estimate time saved, cost reductions, and revenue impact in under 2 minutes. See exactly what SignalHaus can deliver for your team.",
  alternates: { canonical: "https://www.signalhaus.ai/roi-calculator" },
  openGraph: {
    title: "AI ROI Calculator | SignalHaus",
    description: "Discover your potential ROI from AI automation — time saved, cost reductions, and revenue impact.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function ROICalculatorPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-400 mb-6">
            <span>⚡</span>
            <span>Free ROI Analysis</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            What&apos;s Your AI ROI?
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Answer 5 quick questions about your team and see exactly how much time, money, and
            revenue AI automation could unlock for your business.
          </p>
        </div>

        <ROICalculator />
      </div>
    </div>
  );
}
