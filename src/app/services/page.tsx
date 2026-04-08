import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "AI & Automation Services",
  description:
    "SignalHaus AI consulting: Strategy, Data Integration, Workflow Automation, Rapid Prototyping, AI Product Design, and Fractional CTO.",
  alternates: { canonical: "https://www.signalhaus.ai/services" },
  openGraph: {
    title: "AI & Automation Services | SignalHaus",
    description: "Enterprise AI consulting services from strategy to deployment.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const services = [
  {
    title: "AI Strategy",
    icon: "🎯",
    desc: "Stop guessing which AI projects will actually pay off. We audit your operations, score every opportunity by ROI, and deliver a 90-day implementation roadmap you can act on immediately — not an 80-page deck that collects dust.",
    deliverables: ["AI readiness assessment", "Opportunity scoring matrix", "90-day implementation roadmap", "Technology stack recommendations"],
  },
  {
    title: "Data Integration",
    icon: "🔗",
    desc: "Your data is scattered across 12 tools and none of them talk to each other. We connect your CRM, ERP, data warehouse, and third-party sources into a single intelligence layer — so every team works from the same truth and every automation has clean data to run on.",
    deliverables: ["Data architecture design", "API & ETL pipeline development", "Real-time sync configuration", "Data quality monitoring"],
  },
  {
    title: "Workflow Automation",
    icon: "⚡",
    desc: "Replace the manual work your team dreads. From outbound sales sequences to compliance reporting to monthly reconciliation, we build intelligent agents that run 24/7 with human-quality judgment — freeing your ops and revenue teams to focus on work that actually grows the business.",
    deliverables: ["Process mapping & optimization", "Custom AI agent development", "Voice & chat bot deployment", "Performance dashboards"],
  },
  {
    title: "Rapid Prototyping",
    icon: "🚀",
    desc: "Go from concept to working prototype in 2–4 weeks. We use battle-tested frameworks to validate ideas fast, so you invest in building the right thing.",
    deliverables: ["Discovery sprint (1 week)", "Functional prototype", "User testing & iteration", "Go/no-go recommendation"],
  },
  {
    title: "AI Product Design",
    icon: "🧠",
    desc: "Full-stack AI product development from architecture through deployment. We've shipped AI products used by the world's largest financial institutions — and we bring that rigor to every engagement.",
    deliverables: ["Product architecture", "ML model selection & training", "API development", "Production deployment & monitoring"],
  },
  {
    title: "Fractional CTO",
    icon: "👔",
    desc: "Get a seasoned technology executive without the full-time commitment. Ideal for startups and mid-market companies navigating AI transformation, fundraising, or technical due diligence.",
    deliverables: ["Technical leadership & team management", "Architecture review & optimization", "Vendor evaluation", "Board & investor presentations"],
  },
];

const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "SignalHaus AI Consulting Services",
  description: "Enterprise AI consulting services from strategy to deployment.",
  url: "https://www.signalhaus.ai/services",
  numberOfItems: services.length,
  itemListElement: services.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      "@id": `https://www.signalhaus.ai/services#${s.title.toLowerCase().replace(/\s+/g, "-")}`,
      name: s.title,
      description: s.desc,
      provider: {
        "@type": "Organization",
        "@id": "https://www.signalhaus.ai/#organization",
        name: "SignalHaus",
      },
      areaServed: "United States",
      serviceType: s.title,
      offers: {
        "@type": "Offer",
        url: "https://www.signalhaus.ai/contact",
        availability: "https://schema.org/InStock",
      },
    },
  })),
};

export default function ServicesPage() {
  return (
    <section className="pt-32 pb-24 px-6">
      <JsonLd data={servicesSchema} />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Our Services
        </h1>
        <p className="text-center text-gray-400 text-lg max-w-2xl mx-auto mb-16">
          Your team is buried in manual workflows, your data lives in 12 different tools, and you don't have an in-house ML team. We fix all three — with custom AI solutions tailored to your business, your data, and your revenue goals.
        </p>
        <div className="grid sm:grid-cols-2 gap-8">
          {services.map((s) => (
            <div key={s.title} className="p-8 bg-gray-900 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition">
              <span className="text-4xl">{s.icon}</span>
              <h2 className="text-2xl font-semibold mt-4 mb-3">{s.title}</h2>
              <p className="text-gray-400 mb-6">{s.desc}</p>
              <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-3">Deliverables</h3>
              <ul className="space-y-2">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-indigo-400 mt-0.5">✓</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-16 space-y-4">
          <Link
            href="/contact"
            className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition"
          >
            Discuss Your Project
          </Link>
          <p className="text-gray-400 text-sm">
            See how we helped a wealth manager cut analyst time by 75% and an asset manager triple pipeline velocity.{" "}
            <Link href="/case-studies" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
              Read our case studies →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
