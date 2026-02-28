import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostsMeta, getAllTags, formatDate } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "Blog | SignalHaus",
  description:
    "Insights on AI strategy, enterprise automation, and data integration from the SignalHaus team.",
  alternates: { canonical: "https://www.signalhaus.ai/blog" },
  openGraph: {
    title: "Blog | SignalHaus",
    description: "AI strategy and automation insights from enterprise practitioners.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

interface PageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTag = params.tag ?? null;
  const allPosts = getAllPostsMeta();
  const tags = getAllTags();

  const posts = activeTag
    ? allPosts.filter((p) => p.tags.includes(activeTag))
    : allPosts;

  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Blog</h1>
        <p className="text-center text-gray-400 text-lg mb-10">
          Practical insights on AI strategy, automation, and data from operators who&apos;ve shipped at scale.
        </p>

        {/* Tag filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          <Link
            href="/blog"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              !activeTag
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            All
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeTag === tag
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* RSS link */}
        <div className="text-right mb-6">
          <a
            href="/feed.xml"
            className="text-xs text-gray-500 hover:text-indigo-400 transition inline-flex items-center gap-1"
            title="RSS Feed"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.75 3a.75.75 0 00-.75.75v.5c0 .414.336.75.75.75H4c6.075 0 11 4.925 11 11v.25c0 .414.336.75.75.75h.5a.75.75 0 00.75-.75V16C17 8.82 11.18 3 4 3h-.25z" />
              <path d="M3 8.75A.75.75 0 013.75 8H4a8 8 0 018 8v.25a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V16a6 6 0 00-6-6h-.25A.75.75 0 013 9.25v-.5zM7 15a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            RSS Feed
          </a>
        </div>

        {/* Posts */}
        <div className="space-y-8">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500 py-16">No posts found for this tag.</p>
          ) : (
            posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block p-8 bg-gray-900 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition group"
              >
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                  <span>{formatDate(post.date)}</span>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                  <span>·</span>
                  <span className="text-indigo-400">{post.tags[0]}</span>
                </div>
                <h2 className="text-2xl font-semibold mb-3 group-hover:text-indigo-400 transition">
                  {post.title}
                </h2>
                <p className="text-gray-400">{post.excerpt}</p>
                {post.tags.length > 1 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.slice(1).map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
