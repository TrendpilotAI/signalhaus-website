import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Case Studies | SignalHaus",
  description:
    "Real outcomes from real engagements. See how SignalHaus has helped enterprise clients cut manual workflows, accelerate revenue, and deploy AI at scale.",
};

const caseStudies = [
  {
    id: "wealth-management-reporting",
    client: "Global Wealth Manager",
    industry: "Financial Services",
    tag: "Workflow Automation",
    tagColor: "indigo",
    logo: "🏦",
    problem:
      "A top-10 US wealth management firm was spending 2,400+ analyst hours per quarter manually compiling client portfolio reports from five disconnected data sources. Errors were frequent, turnaround was 72 hours, and advisors were fielding client calls before reports arrived.",
    solution:
      "SignalHaus designed and deployed a multi-agent pipeline that ingested live feeds from Salesforce, Morningstar, the firm's internal data warehouse, and two custodian APIs. An orchestration layer reconciled discrepancies, applied business logic, and rendered reports in the firm's branded template — automatically triggered at quarter close.",
    results: [
      { metric: "75%", label: "Reduction in manual reporting time" },
      { metric: "6 hrs", label: "Average report turnaround (down from 72)" },
      { metric: "$1.2M", label: "Annual analyst time saved" },
      { metric: "0", label: "Manual reconciliation errors in first year" },
    ],
    quote:
      "We went from dreading quarter-end to not noticing it. The pipeline just runs.",
    quoteAuthor: "SVP of Operations",
    quoteCompany: "Fortune 500 Wealth Manager",
  },
  {
    id: "asset-manager-lead-intelligence",
    client: "Mid-Market Asset Manager",
    industry: "Investment Management",
    tag: "AI Strategy + Data Integration",
    tagColor: "violet",
    logo: "📊",
    problem:
      "A $40B AUM asset manager had a rich CRM but no way to surface which prospects were most likely to convert. Sales reps were manually scouring LinkedIn, 13F filings, and news feeds to prioritize outreach — burning hours per week with inconsistent results.",
    solution:
      "SignalHaus built a proprietary signal layer that aggregated 13F filing changes, executive LinkedIn activity, M&A news, and firmographic data into a scoring model. Scores were pushed directly into Salesforce with one-click context summaries, enabling reps to open calls already knowing the prospect's recent portfolio shifts.",
    results: [
      { metric: "3×", label: "Increase in qualified pipeline velocity" },
      { metric: "68%", label: "Reduction in manual research time per rep" },
      { metric: "22%", label: "Improvement in first-call conversion rate" },
      { metric: "14 days", label: "Time from kickoff to live in production" },
    ],
    quote:
      "Our reps went from guessing to knowing. The signal layer is now core to how we sell.",
    quoteAuthor: "Head of Distribution",
    quoteCompany: "Mid-Market Asset Manager",
  },
  {
    id: "enterprise-data-onboarding",
    client: "Enterprise SaaS Platform",
    industry: "B2B Software",
    tag: "Data Integration",
    tagColor: "cyan",
    logo: "🔗",
    problem:
      "A Series C SaaS company was losing deals because enterprise data onboarding took 6–8 weeks. Prospects with complex data environments churned during POCs. Customer success was spending 40% of their time on integration support tickets.",
    solution:
      "SignalHaus architected a self-service data connector framework with pre-built adapters for 30+ enterprise sources (Snowflake, Redshift, Databricks, major CRMs). A guided wizard handled schema mapping, transformation rules, and validation — reducing ops involvement from weeks to hours.",
    results: [
      { metric: "80%", label: "Faster enterprise data onboarding" },
      { metric: "6 wks → 3 days", label: "Onboarding time reduction" },
      { metric: "60%", label: "Drop in CS integration support tickets" },
      { metric: "2 deals closed", label: "Within 30 days of launch (previously lost)" },
    ],
    quote:
      "Prospects that ghosted us during POC are now live customers. It was a competitive moat.",
    quoteAuthor: "VP of Customer Success",
    quoteCompany: "Series C Enterprise SaaS",
  },
  {
    id: "insurance-compliance-automation",
    client: "Regional Insurance Group",
    industry: "Insurance",
    tag: "Intelligent Automation",
    tagColor: "emerald",
    logo: "🛡️",
    problem:
      "A regional insurance group was processing 800+ compliance documents per month — policy renewals, regulatory filings, and carrier audits — entirely manually. A team of 6 compliance specialists spent 70% of their time on extraction and formatting, leaving little time for actual analysis.",
    solution:
      "SignalHaus deployed a document intelligence pipeline using a fine-tuned extraction model for insurance-specific formats. Documents were ingested, classified, key fields extracted, and routed to the correct workflow — with human-in-the-loop review only for exceptions flagged by confidence scoring.",
    results: [
      { metric: "82%", label: "Reduction in manual document processing time" },
      { metric: "800+", label: "Documents processed per month, automatically" },
      { metric: "4 FTEs", label: "Redeployed to higher-value analysis work" },
      { metric: "99.1%", label: "Extraction accuracy on standard forms" },
    ],
    quote:
      "Our compliance team now actually does compliance work instead of data entry. That was the whole point.",
    quoteAuthor: "Chief Compliance Officer",
    quoteCompany: "Regional Insurance Group",
  },
];

const tagStyles: Record<string, string> = {
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function CaseStudiesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-indigo-400 mb-4">
            Client Outcomes
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Results That <span className="text-indigo-400">Speak for Themselves</span>
          </h1>
          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
            We don&apos;t do vanity metrics. Every engagement below shipped to production
            and delivered measurable ROI — typically within 30–90 days.
          </p>
        </div>
      </section>

      {/* Aggregate Stats */}
      <section className="py-12 border-y border-gray-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "60–80%", label: "Avg reduction in manual workflow time" },
              { number: "$50M+", label: "Enterprise value delivered" },
              { number: "30 days", label: "Median time to first production deploy" },
              { number: "100%", label: "Client retention rate" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-bold text-indigo-400">{stat.number}</p>
                <p className="mt-2 text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-24">
          {caseStudies.map((cs, i) => (
            <article
              key={cs.id}
              id={cs.id}
              className="scroll-mt-24"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                <div className="text-5xl">{cs.logo}</div>
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${tagStyles[cs.tagColor]}`}>
                      {cs.tag}
                    </span>
                    <span className="text-xs font-medium px-3 py-1 rounded-full border border-gray-700 text-gray-400">
                      {cs.industry}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">{cs.client}</h2>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Problem */}
                <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
                  <h3 className="text-xs uppercase tracking-widest text-red-400 mb-3 font-semibold">
                    The Problem
                  </h3>
                  <p className="text-gray-300 leading-relaxed">{cs.problem}</p>
                </div>

                {/* Solution */}
                <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
                  <h3 className="text-xs uppercase tracking-widest text-indigo-400 mb-3 font-semibold">
                    Our Solution
                  </h3>
                  <p className="text-gray-300 leading-relaxed">{cs.solution}</p>
                </div>
              </div>

              {/* Results */}
              <div className="p-6 bg-indigo-950/30 rounded-2xl border border-indigo-500/20 mb-6">
                <h3 className="text-xs uppercase tracking-widest text-emerald-400 mb-6 font-semibold">
                  The Results
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {cs.results.map((r) => (
                    <div key={r.label} className="text-center">
                      <p className="text-2xl md:text-3xl font-bold text-white">{r.metric}</p>
                      <p className="text-sm text-gray-400 mt-1">{r.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <blockquote className="pl-4 border-l-2 border-indigo-500">
                <p className="text-gray-300 italic text-lg">&ldquo;{cs.quote}&rdquo;</p>
                <footer className="mt-2 text-sm text-gray-500">
                  — {cs.quoteAuthor}, {cs.quoteCompany}
                </footer>
              </blockquote>

              {i < caseStudies.length - 1 && (
                <hr className="mt-16 border-gray-800" />
              )}
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Your Results Could Be Next
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Book a free 30-minute consultation. We&apos;ll assess your current stack,
            identify your highest-ROI AI opportunity, and outline a roadmap.
          </p>
          <Link
            href="/contact"
            className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition"
          >
            Book a Free Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
