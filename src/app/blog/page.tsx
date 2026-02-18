import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on AI strategy, enterprise automation, and data integration from the SignalHaus team.",
  alternates: { canonical: "https://www.signalhaus.ai/blog" },
  openGraph: {
    title: "Blog | SignalHaus",
    description: "AI strategy and automation insights from enterprise practitioners.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const posts = [
  {
    slug: "agentic-automation-future-of-gtm",
    title: "Agentic Automation: Why AI Agents Are the Future of Go-to-Market",
    excerpt:
      "The next wave of enterprise automation isn't about replacing tasks — it's about deploying autonomous agents that handle entire workflows. Here's what we've learned shipping agentic systems for Fortune 500 clients.",
    date: "February 15, 2026",
    readTime: "6 min read",
    category: "AI Strategy",
  },
];

export default function BlogPage() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Blog</h1>
        <p className="text-center text-gray-400 text-lg mb-16">
          Practical insights on AI strategy, automation, and data from operators who&apos;ve shipped at scale.
        </p>
        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block p-8 bg-gray-900 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition group"
            >
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
                <span>·</span>
                <span className="text-indigo-400">{post.category}</span>
              </div>
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-indigo-400 transition">
                {post.title}
              </h2>
              <p className="text-gray-400">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
