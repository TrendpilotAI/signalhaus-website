import Link from "next/link";
import TestimonialCarousel from "@/components/TestimonialCarousel";

const badges = [
  { name: "Harvard Alumni", alt: "Harvard Alumni badge" },
  { name: "World Economic Forum", alt: "World Economic Forum Technology Pioneer badge" },
  { name: "AWS Partner", alt: "AWS partner badge" },
  { name: "AI Hot 100", alt: "AI Hot 100 award badge" },
  { name: "AudienceLab", alt: "AudienceLab partner badge" },
];

const services = [
  {
    title: "AI Strategy",
    desc: "Cut through the hype. We assess your operations, identify high-ROI AI opportunities, and build a pragmatic roadmap that ships in weeks, not quarters.",
    icon: "🎯",
  },
  {
    title: "Data Integration",
    desc: "Connect your CRM, data warehouse, and third-party sources into a unified intelligence layer. Clean data in, actionable insights out.",
    icon: "🔗",
  },
  {
    title: "Workflow Automation",
    desc: "Replace manual processes with intelligent agents that handle outreach, qualification, reporting, and more — 24/7, without burnout.",
    icon: "⚡",
  },
];

const pricingPreview = [
  { tier: "QuickStart", price: "$1,250", unit: "flat", desc: "Up to 3 custom automations" },
  { tier: "Growth Engine", price: "$4,800", unit: "/mo", desc: "10 automations + 5 AI agents" },
  { tier: "Enterprise OS", price: "$25K–$100K+", unit: "", desc: "Multi-agent orchestration" },
];

const results = [
  { number: "60–80%", label: "Avg reduction in manual workflow time", icon: "⚡" },
  { number: "$50M+", label: "Enterprise value delivered to clients", icon: "💰" },
  { number: "30 days", label: "Median time to first production deploy", icon: "🚀" },
  { number: "100%", label: "Client retention rate", icon: "🤝" },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            Pragmatic AI.<br />
            <span className="text-indigo-400">Real Impact.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
            We help enterprises accelerate growth with custom AI strategy, data integrations, and intelligent automation — built by operators who&apos;ve shipped AI at scale for BNY Pershing, Invesco, and LPL Financial.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition"
            >
              Book a Free Consultation
            </Link>
            <Link
              href="/case-studies"
              className="px-8 py-4 border border-gray-700 hover:border-indigo-500 rounded-xl text-lg font-semibold transition"
            >
              See Client Results →
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Badges */}
      <section className="py-16 border-y border-gray-800">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-sm uppercase tracking-widest text-gray-500 mb-8">
            Recognized by
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {badges.map((b) => (
              <div
                key={b.name}
                className="px-4 py-2 bg-gray-900 rounded-lg border border-gray-800 text-sm text-gray-300 font-medium"
                role="img"
                aria-label={b.alt}
              >
                {b.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Counter */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm uppercase tracking-widest text-indigo-400 mb-12">
            Proven Results
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {results.map((r) => (
              <div
                key={r.label}
                className="p-6 bg-gray-900 rounded-2xl border border-gray-800 text-center hover:border-indigo-500/40 transition"
              >
                <div className="text-2xl mb-3">{r.icon}</div>
                <p className="text-2xl md:text-3xl font-bold text-indigo-400">{r.number}</p>
                <p className="mt-2 text-xs text-gray-400 leading-snug">{r.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/case-studies" className="text-indigo-400 hover:text-indigo-300 font-medium transition text-sm">
              Read the full case studies →
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 px-6 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            What We Do
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((s) => (
              <div key={s.title} className="p-8 bg-gray-900 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition">
                <span className="text-4xl">{s.icon}</span>
                <h3 className="text-xl font-semibold mt-4 mb-3">{s.title}</h3>
                <p className="text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/services" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial Carousel */}
      <TestimonialCarousel />

      {/* Pricing Preview */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Simple, Scalable Pricing
          </h2>
          <p className="text-center text-gray-400 mb-16 max-w-xl mx-auto">
            From one-off automations to full enterprise AI orchestration.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPreview.map((p) => (
              <div key={p.tier} className="p-8 bg-gray-950 rounded-2xl border border-gray-800 text-center">
                <h3 className="text-lg font-semibold mb-4">{p.tier}</h3>
                <p className="text-3xl font-bold">
                  {p.price}
                  <span className="text-base font-normal text-gray-400">{p.unit}</span>
                </p>
                <p className="mt-3 text-gray-400 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/pricing" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
              See full pricing details →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Ship AI That Actually Works?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Book a free 30-minute consultation. We&apos;ll assess your current stack, identify quick wins, and outline a roadmap — no strings attached.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition"
            >
              Let&apos;s Talk
            </Link>
            <Link
              href="/case-studies"
              className="inline-flex px-8 py-4 border border-gray-700 hover:border-gray-500 rounded-xl text-lg font-semibold transition"
            >
              Read Case Studies
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
