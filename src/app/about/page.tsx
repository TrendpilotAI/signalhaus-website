import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "SignalHaus was founded by Nathan Stevenson, former CEO of ForwardLane. Harvard alum, World Economic Forum Technology Pioneer, Techstars graduate. 15+ years building enterprise AI.",
  alternates: { canonical: "https://www.signalhaus.ai/about" },
  openGraph: {
    title: "About SignalHaus",
    description: "Meet the team behind SignalHaus — enterprise AI veterans.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const milestones = [
  { year: "2014", text: "Nathan founds ForwardLane, one of the first AI platforms for wealth management" },
  { year: "2016", text: "Selected for Techstars Barclays Accelerator in London" },
  { year: "2017", text: "Named World Economic Forum Technology Pioneer" },
  { year: "2018", text: "Enterprise deployments at BNY Pershing, Invesco, LPL Financial, Columbia Threadneedle" },
  { year: "2020", text: "Recognized in AI Hot 100, KPMG Top 50 Fintechs, WealthTech 100" },
  { year: "2024", text: "SignalHaus launches — bringing enterprise AI expertise to growth-stage companies" },
];

export default function AboutPage() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          About SignalHaus
        </h1>
        <p className="text-center text-gray-400 text-lg max-w-2xl mx-auto mb-20">
          We&apos;re not another AI agency with a pitch deck and a prayer. We&apos;ve built and shipped enterprise AI at scale — and now we bring that experience to you.
        </p>

        {/* Founder */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 md:p-12 mb-16">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-4xl shrink-0" role="img" aria-label="Nathan Stevenson, founder of SignalHaus">
              NS
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Nathan Stevenson</h2>
              <p className="text-indigo-400 font-medium mb-4">Founder &amp; CEO</p>
              <p className="text-gray-300 leading-relaxed mb-4">
                I&apos;ve spent 15+ years building AI and data products for the world&apos;s leading financial institutions. As founder and former CEO of ForwardLane, I led enterprise AI implementations for BNY Pershing, Invesco, LPL Financial, Columbia Threadneedle, and dozens more.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                A Harvard alum, Techstars graduate, and World Economic Forum Technology Pioneer — I started SignalHaus to help companies cut through the AI noise and ship solutions that actually drive revenue.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We understand sales and GTM with CRO-level expertise gleaned from OpenTable, Booker, and VTS, as well as Greyscale and the Ned private members club.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <h2 className="text-2xl font-bold mb-8 text-center">Our Journey</h2>
        <div className="space-y-6 mb-16">
          {milestones.map((m) => (
            <div key={m.year} className="flex gap-6 items-start">
              <span className="text-indigo-400 font-mono font-bold text-lg shrink-0 w-16">{m.year}</span>
              <p className="text-gray-300 border-l border-gray-800 pl-6">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { title: "Pragmatic", desc: "We build what works, not what sounds impressive in a pitch. Every recommendation is grounded in real-world outcomes." },
            { title: "Transparent", desc: "No black boxes, no vendor lock-in. You own your code, your data, and your infrastructure." },
            { title: "Operator-Led", desc: "Every project is led by people who've built and scaled AI products — not junior consultants reading a playbook." },
          ].map((v) => (
            <div key={v.title} className="p-6 bg-gray-900 rounded-xl border border-gray-800">
              <h3 className="font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-gray-400">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/contact"
            className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition"
          >
            Work With Us
          </Link>
        </div>
      </div>
    </section>
  );
}
