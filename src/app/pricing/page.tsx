import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing Plans",
  description:
    "Simple, scalable AI consulting plans from $1,250. QuickStart automations, Growth Engine suites, and enterprise AI orchestration. See what fits your business.",
  alternates: { canonical: "https://www.signalhaus.ai/pricing" },
  openGraph: {
    title: "Pricing Plans | SignalHaus AI Consultancy",
    description: "AI consulting plans from $1,250 to enterprise-scale.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const tiers = [
  {
    name: "QuickStart Automation",
    price: "$1,250",
    unit: "flat",
    desc: "Perfect for testing the waters. Get tangible AI wins fast.",
    features: [
      "Up to 3 custom automations",
      "1 voice or chat agent",
      "Intent data from AudienceLab",
      "2-week delivery",
      "30-day support included",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth Engine Suite",
    price: "$4,800",
    unit: "/month",
    desc: "For teams ready to scale. Ongoing optimization and support.",
    features: [
      "10 automations + 5 AI agents",
      "CRM & data integration",
      "Monthly optimization sprints",
      "Dedicated Slack channel",
      "Performance dashboards",
      "Priority support",
    ],
    cta: "Start Growing",
    popular: true,
  },
  {
    name: "Intelligent Enterprise OS",
    price: "$25K–$100K+",
    unit: "",
    desc: "Full-stack AI transformation for enterprises.",
    features: [
      "Multi-agent orchestration",
      "Predictive analytics & ML models",
      "SOC2-ready automation",
      "Custom data pipelines",
      "Fractional CTO included",
      "Quarterly business reviews",
      "White-glove onboarding",
    ],
    cta: "Talk to Us",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Pricing Plans
        </h1>
        <p className="text-center text-gray-400 text-lg max-w-2xl mx-auto mb-16">
          Transparent pricing. No hidden fees. Every plan includes a discovery call to ensure we&apos;re the right fit.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative p-8 rounded-2xl border transition ${
                t.popular
                  ? "bg-gray-900 border-indigo-500 shadow-lg shadow-indigo-500/10"
                  : "bg-gray-900 border-gray-800 hover:border-gray-700"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-xs font-semibold rounded-full">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-semibold mb-2">{t.name}</h2>
              <p className="text-gray-400 text-sm mb-6">{t.desc}</p>
              <p className="text-4xl font-bold mb-1">
                {t.price}
                {t.unit && <span className="text-base font-normal text-gray-400">{t.unit}</span>}
              </p>
              <ul className="mt-8 space-y-3 mb-10">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-indigo-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className={`block text-center py-3 rounded-xl font-semibold transition ${
                  t.popular
                    ? "bg-indigo-600 hover:bg-indigo-500"
                    : "border border-gray-700 hover:border-gray-500"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-12">
          All plans start with a free 30-minute discovery call. Custom engagements available.
        </p>
      </div>

      {/* Pricing Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "SignalHaus Pricing Plans",
            itemListElement: [
              {
                "@type": "Offer",
                name: "QuickStart Automation",
                price: "1250",
                priceCurrency: "USD",
                description: "Up to 3 custom automations, 1 voice or chat agent, intent data from AudienceLab",
              },
              {
                "@type": "Offer",
                name: "Growth Engine Suite",
                price: "4800",
                priceCurrency: "USD",
                description: "10 automations + 5 AI agents, CRM + data integration, monthly optimization",
              },
              {
                "@type": "Offer",
                name: "Intelligent Enterprise OS",
                price: "25000",
                priceCurrency: "USD",
                description: "Multi-agent orchestration, predictive analytics, SOC2-ready automation",
              },
            ],
          }),
        }}
      />
    </section>
  );
}
