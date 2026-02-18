import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI & Automation Services",
  description:
    "Explore SignalHaus AI consulting services: AI Strategy, Data Integration, Workflow Automation, Rapid Prototyping, AI Product Design, and Fractional CTO. Enterprise-grade solutions.",
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
    desc: "We audit your operations, identify the highest-ROI AI opportunities, and build a pragmatic implementation roadmap. No fluff, no 80-page decks — just a clear path from where you are to where you need to be.",
    deliverables: ["AI readiness assessment", "Opportunity scoring matrix", "90-day implementation roadmap", "Technology stack recommendations"],
  },
  {
    title: "Data Integration",
    icon: "🔗",
    desc: "Your AI is only as good as your data. We connect CRMs, ERPs, data warehouses, and third-party sources into a unified intelligence layer that feeds every downstream process.",
    deliverables: ["Data architecture design", "API & ETL pipeline development", "Real-time sync configuration", "Data quality monitoring"],
  },
  {
    title: "Workflow Automation",
    icon: "⚡",
    desc: "Replace manual processes with intelligent agents. From outbound sales sequences to compliance reporting, we build automations that run 24/7 with human-quality judgment.",
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

export default function ServicesPage() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Our Services
        </h1>
        <p className="text-center text-gray-400 text-lg max-w-2xl mx-auto mb-16">
          End-to-end AI consulting from strategy through deployment. Every engagement is tailored to your business, your data, and your goals.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
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
        <div className="text-center mt-16">
          <Link
            href="/contact"
            className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition"
          >
            Discuss Your Project
          </Link>
        </div>
      </div>
    </section>
  );
}
